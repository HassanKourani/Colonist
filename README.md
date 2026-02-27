# Colonist A/B Test: Checkered CTA Buttons

A front-end A/B test variant for [colonist.io](https://colonist.io) that replaces the existing stacked CTA buttons with a **checkered diagonal layout** — two buttons placed on opposite corners of a 2x2 grid.

**Time spent:** ~2 hour
**AI used:** Claude (Anthropic) — assisted with brainstorming, code generation, and responsive layout decisions.

---

## Preview

The component slots into the hero section of the Colonist landing page, replacing the current vertically stacked "Quick Play" / "Play Online" buttons with a diagonal arrangement:

| Position     | Button                         | Action                                              |
| ------------ | ------------------------------ | --------------------------------------------------- |
| Top-left     | **PLAY NOW** (orange gradient) | Routes to `/#newRoom` to start a game               |
| Bottom-right | **SPECTATE** (green solid)     | Fetches live games from API, spectates a random one |

---

## Decisions & Trade-offs

### 1. Semantic `<button>` over `<div>`

The reference design uses styled `<div>` elements as buttons. I swapped them for native `<button>` elements because they provide keyboard navigation, focus management, and screen-reader support out of the box — no extra ARIA roles or `tabindex` hacks required.

### 2. CSS Grid for the diagonal stagger

Instead of using absolute positioning or negative margins to create the checkered offset, I used a **2x2 CSS Grid** and placed the buttons on the diagonal cells (col 1 / row 1 and col 2 / row 2). The off-diagonal cells stay empty naturally. This keeps the layout fully responsive with no magic pixel values and no repositioning logic at different breakpoints.

### 3. CORS proxy via n8n webhook

The Colonist game-list API (`colonist.io/api/game-list.json`) doesn't allow cross-origin requests from external domains. Rather than suggesting a backend change, I set up a lightweight **n8n workflow** (`hook.json`) that acts as a proxy:

```
Browser  →  n8n webhook  →  colonist.io/api/game-list.json  →  response back
```

This keeps the front-end code clean (a single `fetch` call) and avoids CORS entirely. The n8n workflow is importable — just drop `hook.json` into any n8n instance.

### 4. "Spectate" button fetches on click, not on page load

I considered pre-fetching the game list on `DOMContentLoaded` so the spectate button could navigate instantly. I chose **fetch-on-click** instead because:

- The game list goes stale quickly — games end in minutes, so data fetched on load may be outdated by the time the user clicks.
- It avoids an unnecessary API call for users who only click "Play Now" (likely the majority).
- The loading spinner provides clear feedback that something is happening.

### 5. Random game selection with lobby fallback

When games are available, a random one is picked — this distributes spectator load across games rather than funneling everyone to the same match. If the API returns an empty list or fails entirely, the user is redirected to the lobby (`/#lobby=1`) so they're never stuck on a dead end.

### 6. Analytics via CustomEvent dispatch

Instead of hardcoding a specific analytics SDK (GA, Mixpanel, etc.), each button click dispatches a **bubbling `cta:click` CustomEvent** with experiment metadata. Any analytics listener higher in the DOM can capture it. This keeps the component decoupled and testable.

### 7. Responsive sizing with `clamp()`

All sizing (font sizes, border radius, padding, grid gap) uses `clamp()` for fluid scaling between mobile and desktop. On very small screens (<400px), subtitles are hidden and titles shrink to keep the buttons usable without a layout breakpoint jump.

---

## File Structure

```
├── index.html      # Markup — semantic buttons in a grid container
├── styles.scss     # Styles — SCSS with variables, mixins, clamp() responsive sizing
├── script.js       # Behavior — routing, API fetch, loading states, event tracking
├── hook.json       # n8n workflow — CORS proxy for the game-list API
├── ref-buttons.png # Reference — existing button design
├── ref-slot.png    # Reference — where the component sits on the landing page
└── ref-responsive.png # Reference — mobile layout context
```

---

## How It Works

1. **Page loads** — both buttons are rendered and ready. No API calls on load.
2. **User clicks "Play Now"** — a tracking event fires, then the browser navigates to `colonist.io/#newRoom`.
3. **User clicks "Spectate"** — a tracking event fires, the button shows a spinner, the game-list API is called through the n8n proxy, and the user is sent to a random live game (or the lobby if none are available).

---

## Running Locally

1. Compile SCSS to CSS (e.g., `sass styles.scss styles.css`) and link the output in a wrapping HTML file, or use a live-reload tool that handles SCSS.
2. For the Spectate button to work, deploy `hook.json` as an n8n workflow and update the `GAMES_API` constant in `script.js` with your webhook URL.
