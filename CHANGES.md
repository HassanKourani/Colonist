# Changelog — Styling & UI

## Play Now Button — Enhanced Click Experience
- **Fanfare sound**: Replaced single-beep click sound with a 3-note ascending arpeggio (C4 → E4 → G4) using Web AudioContext; shared context instance reused across clicks with suspended-state handling
- **Ripple animation**: White semi-transparent circle expands from the button center on click, fades out, and self-removes from the DOM
- **Subtitle text swap**: Subtitle fades out, changes to "Setting up board...", and fades back in at t=150ms
- **Hex tile wipe transition**: Fullscreen overlay of orange hexagon tiles animates in left-to-right in a proper honeycomb (Catan-map) pattern before navigating — every other row is staggered by half a tile width, rows overlap by 25% vertically for tight hex packing
- **Click guard**: `isSequencePlaying` flag prevents the sequence from firing twice on rapid double-clicks
- **Timing**: total sequence is ~1 second (ripple + sound at t=0, hex wipe at t=150ms, navigation at t=1000ms)

## Button Gradient Updates
- **Green button**: Changed from flat solid color (`#4CD137`) to a gradient (`#49bd03` → `#5cdf13`, bottom to top)
- **Orange button**: Already had gradient, no change

## Borders
- Added `1px solid` border to the orange button (`#FDD8BD`)
- Added `1px solid` border to the green button (`#93D86B`)

## Typography
- Reduced title `letter-spacing` from `4px` to `1.5px` for tighter, more accurate lettering
- Removed `text-shadow` from both `.button-title` and `.button-subtitle`
- Changed subtitle color from `rgba(#fff, 0.9)` to solid `#fff`
- Increased subtitle max font size from `14px` to `16px`

## Spacing & Padding
- Reduced gap between title and subtitle from `8px` to `2px`
- Added responsive vertical padding to buttons (`clamp(8px, 1.5vw, 16px)`) to prevent text crowding edges on smaller screens

## Responsive
- Expanded small-screen media query breakpoint from `400px` to `450px`
