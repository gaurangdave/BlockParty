import { useState, useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useFirebaseMessages } from "../hooks/useFirebaseMessages";

export interface ComicBubbleProps {
  userId: string;
  messageText: string;
  onClose: () => void;
}

// Custom hook for typewriter effect
function useTypewriter(text: string, speed = 40) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
}

export function ComicBubble({
  userId,
  messageText,
  onClose,
}: ComicBubbleProps) {
  const isInteractive = useSettingsStore((state) => state.isInteractive);
  const { sendReply } = useFirebaseMessages();
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const typedText = useTypewriter(messageText, 40);

  // Auto-scroll when new text is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typedText]);

  // Auto-focus input when opening
  useEffect(() => {
    if (isInteractive) {
      setTimeout(() => inputRef.current?.focus(), 300); // slight delay for animation
    }
  }, [isInteractive]);

  // If Ghost Mode, we don't want the UI to be blocking interactions,
  // though if it's open it might be because they switched to ghost mode.
  // We'll set pointer-events: none on the Html container if not interactive.

  const handleSend = () => {
    if (replyText.trim()) {
      sendReply(userId, replyText.trim());
      setReplyText("");
      onClose(); // auto-close on send
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    } else if (e.key === "Escape") {
      onClose();
    }
    e.stopPropagation(); // prevent Spacebar from triggering jump/etc
  };

  return (
    <Html
      position={[0, 2.4, 0]} // closer to the character's head
      center
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: isInteractive ? "auto" : "none",
        width: "300px", // Use fixed width for the HTML wrapper to give it a solid boundary
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 10 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col"
        style={{
          fontFamily: "'Inter', sans-serif",
          backgroundColor: "#fff",
          width: "300px", // Give the container a strict width
          maxHeight: "350px", // Cap the height
        }}
        onPointerDown={(e) => {
          // stop R3F drag events from firing when interacting with bubble UI
          e.stopPropagation();
        }}
        onPointerOver={(e) => e.stopPropagation()}
        onPointerOut={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black font-bold"
        >
          ✕
        </button>
        <div
          ref={scrollRef}
          className="mb-3 pr-4 font-medium text-sm overflow-y-auto overflow-x-hidden wrap-break-word"
          style={{
            maxHeight: "200px", // give the text area a scrollable limit
          }}
        >
          {typedText}
          {typedText.length < messageText.length && (
            <span className="w-2 h-4 bg-black inline-block ml-1 animate-pulse" />
          )}
        </div>

        <div className="flex bg-gray-100 rounded-full p-1 border-2 border-transparent focus-within:border-black transition-colors shrink-0">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent px-3 py-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="Type reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            title="Send Reply"
            onClick={handleSend}
            className="p-1.5 bg-black text-white rounded-full hover:scale-110 transition-transform disabled:opacity-50"
            disabled={!replyText.trim()}
          >
            <Send size={14} />
          </button>
        </div>

        {/* Comic Tail */}
        <div
          className="absolute left-1/2 -bottom-4 w-4 h-4 border-l-4 border-b-4 border-black"
          style={{
            transform: "translateX(-50%) rotate(-45deg)",
            backgroundColor: "#fff",
          }}
        />
      </motion.div>
    </Html>
  );
}
