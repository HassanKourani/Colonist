# Play Now Button Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the instant Play Now navigation with a coordinated sequence: fanfare sound + button ripple + subtitle text change at t=0, hex tile wipe overlay at t=150ms, navigation at t=900ms.

**Architecture:** Single JS timeline coordinator (`startPlayNowSequence`) fires all effects in sync using `setTimeout`. CSS handles all animations via keyframes. Hex tiles are built dynamically in JS based on viewport size and inserted into a pre-existing overlay div.

**Tech Stack:** Vanilla JS (Web AudioContext), SCSS compiled via `npx sass styles.scss styles.css`

---

### Task 1: Add animations to styles.scss

**Files:**
- Modify: `styles.scss`

**Step 1: Add ripple styles after the spinner section**

In `styles.scss`, after the `@keyframes spin` block, add:

```scss
// ----- Ripple (Play Now click effect) -----

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border-radius: 50%;
  background: rgba(#fff, 0.4);
  transform: scale(0);
  animation: ripple-out 0.5s ease-out forwards;
  pointer-events: none;
}

@keyframes ripple-out {
  to {
    transform: scale(80);
    opacity: 0;
  }
}

// ----- Hex tile wipe overlay -----

#hex-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, 80px);
  pointer-events: none;
  z-index: 999;
  visibility: hidden;

  &.active {
    visibility: visible;
  }
}

.hex-tile {
  width: 80px;
  height: 72px;
  background: linear-gradient(to top, $orange-end 0%, $orange-start 100%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transform: scale(0);
  animation: hex-in 0.35s ease-out forwards;
}

@keyframes hex-in {
  to { transform: scale(1.15); }
}

// ----- Subtitle fade transition -----

.button-subtitle {
  transition: opacity 0.15s ease;

  &.changing {
    opacity: 0;
  }
}
```

**Step 2: Compile SCSS to CSS**

```bash
npx sass styles.scss styles.css
```

Expected: `styles.css` regenerated with no errors.

**Step 3: Open index.html in browser, confirm no visual regressions on the buttons.**

**Step 4: Commit**

```bash
git add styles.scss styles.css
git commit -m "feat: add ripple, hex-wipe, and subtitle transition styles"
```

---

### Task 2: Add hex overlay div to index.html

**Files:**
- Modify: `index.html`

**Step 1: Add the overlay div**

Inside `<main class="main-container">`, add the overlay div as the first child (before `.button-container`):

```html
<main class="main-container">
  <div id="hex-overlay"></div>
  <div class="button-container" ...>
```

**Step 2: Verify in browser**

Open `index.html`. The overlay should be invisible (no visual change). Inspect in DevTools — confirm `#hex-overlay` exists in the DOM with `visibility: hidden`.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add hex overlay div to HTML"
```

---

### Task 3: Replace sound and add ripple + hex builder functions in script.js

**Files:**
- Modify: `script.js`

**Step 1: Replace `playClickSound` with `playFanfare`**

Remove the entire `playClickSound` function and replace it with:

```js
// ----- Sound -----

const playFanfare = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [261.63, 329.63, 392.00]; // C4, E4, G4

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  });
};
```

Also update the Spectate button's `playClickSound()` call (line ~133) to `playFanfare()` — or keep spectate using the old sound. Since the old function is gone, update the spectate call to `playFanfare()` too, since it's the same file-level function.

> **Note:** The old `playClickSound` is called on both buttons. Replacing it means both buttons now play the fanfare. That's fine — both are positive actions.

**Step 2: Add ripple creator function**

After the `playFanfare` function, add:

```js
// ----- Ripple -----

const createRipple = (button) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
};
```

**Step 3: Add hex overlay builder function**

After `createRipple`, add:

```js
// ----- Hex overlay -----

const buildHexOverlay = () => {
  const overlay = document.getElementById('hex-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  const TILE_W = 80;
  const TILE_H = 72;
  const WAVE_MS = 450; // ms for wave to cross screen

  const cols = Math.ceil(window.innerWidth / TILE_W) + 2;
  const rows = Math.ceil(window.innerHeight / TILE_H) + 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('div');
      tile.className = 'hex-tile';
      tile.style.animationDelay = `${(c / cols) * WAVE_MS}ms`;
      overlay.appendChild(tile);
    }
  }

  overlay.classList.add('active');
};
```

**Step 4: Manually test in browser console**

Open `index.html` in browser. In DevTools console run:

```js
buildHexOverlay()
```

Expected: screen fills with orange hexagon tiles in a left-to-right wave. The overlay stays visible (no navigation, since we haven't wired up the coordinator yet).

Then run `document.getElementById('hex-overlay').classList.remove('active')` to reset.

**Step 5: Commit**

```bash
git add script.js
git commit -m "feat: add fanfare sound, ripple creator, and hex overlay builder"
```

---

### Task 4: Add timeline coordinator and update Play Now handler

**Files:**
- Modify: `script.js`

**Step 1: Add the sequence coordinator function**

After `buildHexOverlay`, add:

```js
// ----- Play Now sequence -----

const startPlayNowSequence = (button) => {
  const subtitle = button.querySelector('.button-subtitle');

  // t=0: sound + ripple + subtitle fade
  playFanfare();
  createRipple(button);

  if (subtitle) {
    subtitle.classList.add('changing');
    setTimeout(() => {
      subtitle.textContent = 'Setting up board...';
      subtitle.classList.remove('changing');
    }, 150);
  }

  // t=150ms: hex wipe begins
  setTimeout(() => {
    buildHexOverlay();

    // navigate after wave completes: wave (450ms) + tile animation (350ms) + buffer (50ms)
    setTimeout(() => {
      navigate(ROUTES.PLAY_NOW);
    }, 850);
  }, 150);
};
```

**Step 2: Update the Play Now click handler**

Find the existing `btnPlayNow` click handler (around line 119):

```js
btnPlayNow.addEventListener('click', () => {
  playClickSound();
  trackCTA(btnPlayNow, 'play-now');
  navigate(ROUTES.PLAY_NOW);
});
```

Replace it with:

```js
btnPlayNow.addEventListener('click', () => {
  trackCTA(btnPlayNow, 'play-now');
  startPlayNowSequence(btnPlayNow);
});
```

**Step 3: Compile SCSS (no changes, but run to confirm styles.css is current)**

```bash
npx sass styles.scss styles.css
```

**Step 4: Full manual test**

Open `index.html` in browser. Click the orange Play Now button. Verify in order:
1. Fanfare sound plays (3 ascending notes)
2. Button ripple visible (white circle expands from center)
3. Subtitle fades from "Create a room!" → "Setting up board..."
4. ~150ms later, hex tiles wipe across screen left-to-right in orange
5. Page navigates to `colonist.io/#newRoom` after tiles fill screen

Also verify the Spectate button still works (spinner + navigation to a live game).

**Step 5: Commit**

```bash
git add script.js styles.css
git commit -m "feat: Play Now button enhanced with fanfare, ripple, and hex-wipe transition"
```

---

## Final Verification

- [ ] Play Now: fanfare plays on click
- [ ] Play Now: white ripple expands from button center
- [ ] Play Now: subtitle changes from "Create a room!" → "Setting up board..."
- [ ] Play Now: hex tile wipe covers screen in orange wave
- [ ] Play Now: navigates to `colonist.io/#newRoom` after tiles fill screen
- [ ] Spectate: unaffected, still shows spinner and navigates to a live game
- [ ] No JS errors in DevTools console
- [ ] styles.css is compiled and up to date
