# ArcadeVerse - Retro Gaming Hub

ArcadeVerse is an interactive, zero-dependency, frontend-only retro arcade terminal housing 6 customized web games built on a lightweight 2D Entity-Component-System (ECS) engine. The audio synthesizer maps directly to the browser Web Audio API to create procedurally synthesized sounds and looping chiptune soundtracks. All game settings, statistics, high scores, and achievement check marks are saved locally in the browser's `localStorage` (no backend required).

---

## Technical Specifications & Architecture

1. **ECS Game Engine** (`assets/js/core/engine.js`): Math utilities (`Vector2`), Camera matrix logic with boundaries tracking and screen shakes, Particle System engines, and Entity-Component-System models.
2. **Web Audio Synthesizer** (`assets/js/core/sound.js`): Envelopes, white noise filter decays, chiptune note frequencies sequencer patterns, and global mute controllers.
3. **Storage Logic** (`assets/js/core/storage.js`): XP level boundaries, stats keepers, global board mockups, and AI simulated player score updates.
4. **Games Suite** (`assets/js/games/`): 
   *   🛡️ **Retro Knight** - 2D sidescrolling platformer with brick maps and slimes.
   *   📡 **Neo-Defender** - Base grid strategy tower defense with firing turrets.
   *   🚀 **Cosmic Void** - Scrolling space shooter with bullet-hell modules and bosses.
   *   🗺️ **Dungeon Quest** - Top-down RPG with quest branches and sword shops.
   *   🏎️ **Synth Racer** - Pseudo-3D road racer with scaling sprites curves.
   *   🧱 **Block Cascade** - Blocks matching falling rows puzzle with combo multipliers.

---

## Installation

Ensure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

Clone or copy the files, and run the following command to download developer dependencies:

```bash
npm install
# OR using make
make install
```

## Running the Project

### Local Dev Server (Vite)
To run the server locally on port 5173:

```bash
npm run start
# OR using make
make run
```
Once started, open `http://localhost:5173` in your web browser.

### Docker Environment
To build and run inside a Docker container:

```bash
# Build image
make docker-build

# Run container mapped on port 5173
make docker-run
```

---

## Running Test Suites

We employ Jest to execute unit tests on local storage XP systems, mathematical vectors, and physics collisions.

To execute tests and verify coverage reports:

```bash
# Run tests
npm run test

# Run tests with coverage details
npm run coverage
```

The reports are generated inside the local `coverage/` directory.

---

## Dependencies

*   **Production**: `vite` (static bundler and server).
*   **Development**: `jest` (testing runner), `jest-environment-jsdom` (mock browser document structures).
