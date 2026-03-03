# Changelog — Styling & UI

---

## For Non-Technical Readers

Here's what visually and interactively changed on the page:

- **Clicking "Play Now" now feels like a game event.** Instead of jumping straight to the game, a short musical jingle plays, a ripple effect bursts from the button, the text briefly changes to "Setting up board...", and orange hexagon tiles (like a Catan board) sweep across the screen before you land in the game.

- **Clicking "Spectate" also gets the hex treatment.** After the app finds a live game for you to watch, green hexagon tiles (matching the green button) sweep across the screen before navigating you there.

- **Both buttons lock while anything is animating.** Once you click either button, both dim and become unclickable until the animation finishes and the page navigates. No accidental double-clicks.

- **The buttons look more polished.** The green button was upgraded from a flat color to a gradient. Both buttons now have a subtle border. Text spacing and sizing were refined to more closely match the reference design.

---

## Technical Changelog

### Play Now Button — Enhanced Click Experience
- **Fanfare sound**: Replaced single-beep click sound with a 3-note ascending arpeggio (C4 → E4 → G4) using Web AudioContext; shared context instance reused across clicks with suspended-state handling
- **Ripple animation**: White semi-transparent circle expands from the button center on click, fades out, and self-removes from the DOM
- **Subtitle text swap**: Subtitle fades out, changes to "Setting up board...", and fades back in at t=150ms
- **Hex tile wipe transition**: Fullscreen overlay of orange hexagon tiles animates in left-to-right in a proper honeycomb (Catan-map) pattern before navigating — every other row is staggered by half a tile width, rows overlap by 25% vertically for tight hex packing
- **Click guard**: `isSequencePlaying` flag prevents the sequence from firing twice on rapid double-clicks
- **Timing**: total sequence is ~1 second (ripple + sound at t=0, hex wipe at t=150ms, navigation at t=1000ms)

### Spectate Button — Hex Wipe Transition
- **Green hex wipe**: After the live-game fetch resolves, a green hexagon tile wipe (using `.hex-tile--green` modifier) fills the screen before navigating — same honeycomb layout as Play Now, colour matches the green button gradient
- **Spinner → wipe handoff**: Loading spinner is dismissed just before the wipe begins, so the two states don't overlap

### Both Buttons — Disabled During Animation
- **`disableBothButtons()` helper**: Sets `disabled` attribute on both buttons at the start of any sequence (Play Now or Spectate), preventing interaction with either button while an animation or fetch is ongoing
- **CSS `:disabled` state**: `opacity: 0.5`, `cursor: not-allowed`, `pointer-events: none` applied via the shared `cta-button-base` mixin

### Button Gradient Updates
- **Green button**: Changed from flat solid color (`#4CD137`) to a gradient (`#49bd03` → `#5cdf13`, bottom to top)
- **Orange button**: Already had gradient, no change

### Borders
- Added `1px solid` border to the orange button (`#FDD8BD`)
- Added `1px solid` border to the green button (`#93D86B`)

### Typography
- Reduced title `letter-spacing` from `4px` to `1.5px` for tighter, more accurate lettering
- Removed `text-shadow` from both `.button-title` and `.button-subtitle`
- Changed subtitle color from `rgba(#fff, 0.9)` to solid `#fff`
- Increased subtitle max font size from `14px` to `16px`

### Spacing & Padding
- Reduced gap between title and subtitle from `8px` to `2px`
- Added responsive vertical padding to buttons (`clamp(8px, 1.5vw, 16px)`) to prevent text crowding edges on smaller screens

### Responsive
- Expanded small-screen media query breakpoint from `400px` to `450px`
