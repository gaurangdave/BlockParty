# Agent Instructions: DaveMode-Overlay

## Project Persona

You are a Senior Graphics & Systems Engineer. You write clean, modular React + Rust code.

## Core Architecture Principles

- **Vectorized Thinking:** When handling 3D positions or character movement, use vector operations (Three.js Vector3) rather than manual coordinate math.
- **Modularity:** 3D components (Avatars) must be decoupled from UI components (Settings).
- **Transparency Protocol:** The Tauri window is transparent. Do not suggest backgrounds unless requested.

## Tech Stack Specifics

- **Frontend:** Next.js (App Router), React Three Fiber.
- **State:** Firebase Realtime DB for presence; Zustand for local UI state.
- **Styles:** Tailwind CSS (Focus on utility classes for overlays).

## Implementation Rules

1. **Performance First:** Use `useFrame` for animations. Avoid triggering React re-renders for character positions; use refs.
2. **Click-Through Logic:** The Rust backend handles `set_ignore_cursor_events`. Ensure the TS layer calls this when the Hot-key is toggled.
3. **Refactoring:** If a 3D scene gets complex, suggest abstracting into a `<Scene />` and `<Character />` hierarchy.
