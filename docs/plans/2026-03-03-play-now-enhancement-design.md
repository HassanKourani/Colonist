# Play Now Button Enhancement Design
**Date:** 2026-03-03
**Status:** Approved

## Problem
The orange "Play Now" button navigates immediately on click with no visual or auditory feedback. The experience is abrupt ("vanilla") — the user gets teleported to the room with no sense of excitement or transition.

## Goal
Make clicking "Play Now" feel like a game-start moment: a brief, satisfying sequence of animations and sound that build anticipation before the page navigates.

## Approach
**B — Explicit JS timeline.** A single coordinator runs a timed sequence so all enhancements fire in sync.

## Timing Sequence
```
t=0ms    → click: fanfare sound + button ripple + subtitle text change
t=150ms  → hex tile overlay appears, tiles animate in (wave left→right)
t=700ms  → last tile fills screen → navigate()
```

## Components

### 1. Fanfare Sound
Replace the single sine-wave beep with a 3-note ascending arpeggio (C4 → E4 → G4) using the Web AudioContext API. Each note is ~80ms apart, short attack/decay. Feels like a game-start cue.

### 2. Button Ripple
On click, inject a `<span class="ripple">` with `position:absolute` into the button. It scales from 0 to 2× the button's diagonal, semi-transparent white, then fades out. Cleaned up from the DOM on `animationend`. Requires `overflow: hidden` on the button (already set).

### 3. Subtitle Text Change
Immediately on click: subtitle text changes from "Create a room!" → "Setting up board..." with a short CSS opacity fade transition.

### 4. Hex Tile Wipe Overlay
A fixed fullscreen `<div id="hex-overlay">` (hidden by default) is pre-populated with ~60 hex-shaped child divs using `clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`. On click (at t=150ms), the overlay becomes visible and each tile animates from `scale(0)` to `scale(1)` with a staggered delay proportional to its column index (left→right wave). Tiles are orange matching the button. Navigation fires on the last tile's `animationend`.

## Files Changed
- `script.js` — replace `playClickSound`, add ripple logic, add hex overlay builder, add timeline coordinator, update `btnPlayNow` click handler
- `styles.scss` → `styles.css` — add `.ripple`, `#hex-overlay`, `.hex-tile`, and `@keyframes` for ripple + hex-in animations

## Out of Scope
- No changes to the Spectate button
- No new dependencies
- No changes to analytics/tracking logic
