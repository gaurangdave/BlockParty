/**
 * Firebase Cloud Functions for BlockParty
 *
 * customizeAvatar — accepts a base64 image, sends it to Gemini Vision,
 * and returns a validated JSON color palette for the VoxelAvatar.
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/https";
import { GoogleGenAI } from "@google/genai";

setGlobalOptions({ maxInstances: 10 });

/** The 5 hex color fields Gemini must return */
interface AvatarPalette {
  hair: string;
  skin: string;
  top: string;
  bottom: string;
  accent: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function isValidPalette(obj: unknown): obj is AvatarPalette {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.hair === "string" &&
    HEX_RE.test(o.hair) &&
    typeof o.skin === "string" &&
    HEX_RE.test(o.skin) &&
    typeof o.top === "string" &&
    HEX_RE.test(o.top) &&
    typeof o.bottom === "string" &&
    HEX_RE.test(o.bottom) &&
    typeof o.accent === "string" &&
    HEX_RE.test(o.accent)
  );
}

/** Mock palette for local/emulator testing without burning Gemini API calls */
const MOCK_PALETTE: AvatarPalette = {
  hair: "#3B2F2F",
  skin: "#F5CBA7",
  top: "#2E86C1",
  bottom: "#1B4F72",
  accent: "#E74C3C",
};

const SYSTEM_PROMPT = `You are a color extraction AI for a voxel video game avatar.

Analyze the provided photo of a person and extract the dominant colors for the following body parts / clothing. Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

The JSON must have exactly these 5 keys, each with a CSS hex color value (e.g. "#RRGGBB"):

{
  "hair": "<hex color of the person's hair>",
  "skin": "<hex color of the person's skin tone>",
  "top": "<hex color of the person's shirt / top garment>",
  "bottom": "<hex color of the person's pants / bottom garment>",
  "accent": "<hex color of the person's shoes or a distinctive accessory>"
}

Rules:
- If a body part is not visible, infer a reasonable default color.
- Output ONLY the JSON object. Nothing else.`;

export const customizeAvatar = onCall({ cors: true }, async (request) => {
  const { imageBase64 } = request.data as { imageBase64?: string };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "imageBase64 is required and must be a base64-encoded image string.",
    );
  }

  // ── Mock mode for emulator / local testing ──
  const useMock = process.env.MOCK_GEMINI === "true";
  if (useMock) {
    console.log("🧪 MOCK_GEMINI=true — returning mock palette");
    return { palette: MOCK_PALETTE };
  }

  // ── Real Gemini Vision call ──
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "GEMINI_API_KEY environment variable is not set.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Strip data-URL prefix if present (e.g. "data:image/png;base64,...")
    const rawBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // Detect MIME type from data URL prefix or default to jpeg
    let mimeType = "image/jpeg";
    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:(image\/\w+);/);
      if (match) mimeType = match[1];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType,
                data: rawBase64,
              },
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";
    console.log("🤖 Gemini raw response:", text);

    // Strip markdown code fences if Gemini wraps them anyway
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new HttpsError(
        "internal",
        `Failed to parse Gemini response as JSON: ${cleaned}`,
      );
    }

    if (!isValidPalette(parsed)) {
      throw new HttpsError(
        "internal",
        `Gemini returned invalid palette structure: ${JSON.stringify(parsed)}`,
      );
    }

    return { palette: parsed };
  } catch (err) {
    // Re-throw HttpsError as-is, wrap anything else
    if (err instanceof HttpsError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Gemini call failed:", msg);
    throw new HttpsError("internal", `Gemini Vision error: ${msg}`);
  }
});
