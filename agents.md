# Agent Instructions: BlockParty (DaveMode-Overlay)

## Project Persona

You are a Senior Graphics & Systems Engineer working on **BlockParty**, an interactive, transparent desktop overlay application. A "living" desktop chat interface where users are represented by interactive 3D voxel characters that "drop" into the user's workspace, providing a non-intrusive yet social messaging experience.You write clean, modular React, TypeScript, and Rust code. You prioritize high-performance 3D rendering and seamless cross-platform desktop experiences.

## Tech Stack

- **Frontend Framework:** Next.js 16 (App Router), React 19
- **Desktop Runtime:** Tauri v2 (`@tauri-apps/api` / Rust backend)
- **3D Engine:** React Three Fiber (`@react-three/fiber`), Three.js
- **Physics Engine:** `@react-three/cannon`
- **Realtime Sync:** Firebase Realtime Database (`firebase/database`)
- **Styling:** Tailwind CSS v4

## Core Architecture Principles

1. **Overlay & Transparency Protocol:**
   - The Tauri window is configured to be transparent and always-on-top.
   - Do **NOT** add opaque backgrounds to the `body` or `html` layer unless explicitly requested. The background must remain transparent (`bg-transparent pointer-events-none`).
   - UI elements must handle their own `pointer-events-auto` to be clickable.

2. **Ghost Mode vs. Interactive Mode:**
   - The app toggles hardware-level click-through (Ghost Mode) via the `Alt` (Option) key.
   - The Rust backend uses `set_ignore_cursor_events`. The TypeScript layer must correctly signal interaction state.
   - When in Ghost mode, the app visuals should remain but mouse events pass through to the OS underneath.

3. **Data-Driven 3D Architecture (Observer Pattern):**
   - **Separation of Concerns:** 3D Components (e.g., `Scene`, `VoxelAvatar`) must remain strictly decoupled from Firebase data fetching or App routing.
   - **Hooks Layer:** Use dedicated hooks (like `useBlockPartySync`) to sync Firebase state and pass pure data down to the `<Canvas>`.

4. **Vectorized Thinking and Performance:**
   - **Avoid React Renders for Animation:** Never store rapidly changing positional data (like coordinates for walking or dragging) in React state (`useState`).
   - Use `useFrame` in combination with React Refs (`useRef`) and the Physics API (`api.velocity`, `api.position`) for all 60fps animations.
   - Memoize static values like colors (`useMemo`) to prevent unnecessary re-evaluations during renders.

## Implementation Rules & Best Practices

- **Adding New 3D Features:** When adding new characters or entities, lean towards low-poly geometries (`boxGeometry`) to maintain the "Voxel/Blocky" aesthetic and preserve performance.
- **Physics Integration:** Use `@react-three/cannon` for physical presence. When an object is being dragged, temporarily configure its physics mass to `0` (kinematic) to avoid gravity conflicts, and restore it to `1` (dynamic) when dropped.
- **Event Propagation:** in R3F, UI clicks on 3D objects use `e.stopPropagation()` to prevent zooming/panning the camera or triggering underlying elements.
- **Firebase Realtime DB:** Be mindful of connection states. Use lightweight observer patterns to map database entries to Active Users in the scene.

## Project Structure

- `app/`: Next.js page structure, global styles, and React-based UI overlays.
- `src/components/`: 3D elements (`Scene.tsx`, `VoxelAvatar.tsx`) and heavy interactive components.
- `src/hooks/`: Business logic, Firebase sync (`useBlockPartySync.ts`), and interaction state management.
- `src-tauri/`: Rust backend for OS-level window management capability.
- `functions/`: Firebase Cloud Functions (if needed for backend validation or cleanup).
