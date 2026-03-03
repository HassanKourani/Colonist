/**
 * Colonist A/B Test — Checkered CTA Buttons
 *
 * Button 1 (Play Now):   Routes to the main play page.
 * Button 2 (Live Games): Fetches game list on click, navigates to a
 *                         random live game. Falls back to lobby.
 */

// ----- Constants -----

const COLONIST_BASE = "https://colonist.io";

const ROUTES = {
  PLAY_NOW: COLONIST_BASE + "/#newRoom", // create new game
  LOBBY: COLONIST_BASE + "/#lobby=1", // fallback for games list api fail
};

const SPINNER_HTML = '<span class="spinner"></span>';

const GAMES_API = "https://n8n.dev.quiq.ly/webhook/colonist-games";

// ----- API -----


/**
 * Fetch the list of active games.
 *
 * Calls our own N8N Webhook which forwards
 * to colonist.io — this avoids CORS issues entirely.
 */
const fetchGameList = async () => {
  const res = await fetch(GAMES_API);
  if (!res.ok) throw new Error("API " + res.status);
  const games = await res.json();
  return games || [];
};

// ----- Utilities -----

/**
 * Toggle loading state on a button.
 * Swaps content for a spinner and disables interaction while loading.
 */
const setLoading = (button, isLoading) => {
  if (isLoading) {
    button.classList.add("is-loading");
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = SPINNER_HTML;
  } else {
    button.classList.remove("is-loading");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
};

// ----- A/B Tracking -----

/**
 * Dispatch a bubbling CustomEvent so any external analytics listener
 * (GA, Mixpanel, internal) can capture CTA interactions without
 * coupling to this module.
 */
const trackCTA = (button, action) => {
  button.dispatchEvent(
    new CustomEvent("cta:click", {
      bubbles: true,
      detail: {
        cta: button.dataset.cta,
        action,
        experiment: "checkered-cta",
      },
    })
  );
};

const getRandomGame = (games) => {
  return games[Math.floor(Math.random() * games.length)];
}

const navigate = (path) => {
  window.location.href = path
}

// ----- Audio context -----

let _audioCtx = null;
const getAudioContext = () => {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
};

// ----- Sound -----

const playFanfare = () => {
  const ctx = getAudioContext();
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

// ----- Ripple -----

const createRipple = (button) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
};

// ----- Hex overlay -----

const buildHexOverlay = () => {
  const overlay = document.getElementById('hex-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  const TILE_W = 80;
  const TILE_H = 72;
  const ROW_STEP = TILE_H * 0.75; // rows overlap by 25% for honeycomb packing
  const WAVE_MS = 450;

  const cols = Math.ceil(window.innerWidth / TILE_W) + 3;
  const rows = Math.ceil(window.innerHeight / ROW_STEP) + 3;

  for (let r = 0; r < rows; r++) {
    const rowOffset = (r % 2 === 1) ? TILE_W / 2 : 0; // stagger odd rows right
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('div');
      tile.className = 'hex-tile';
      tile.style.left = `${c * TILE_W + rowOffset - TILE_W}px`;
      tile.style.top  = `${r * ROW_STEP - ROW_STEP}px`;
      tile.style.animationDelay = `${(c / cols) * WAVE_MS}ms`;
      overlay.appendChild(tile);
    }
  }

  overlay.classList.add('active');
};

// ----- Play Now sequence -----

const startPlayNowSequence = (button) => {
  const subtitle = button.querySelector('.button-subtitle');

  // t=0: sound + ripple + subtitle fade
  playFanfare();
  createRipple(button);

  if (subtitle) subtitle.classList.add('changing');

  // t=150ms: text swap + hex wipe begins
  setTimeout(() => {
    if (subtitle) {
      subtitle.textContent = 'Setting up board...';
      subtitle.classList.remove('changing');
    }

    buildHexOverlay();

    // navigate after wave completes: wave (450ms) + tile animation (350ms) + buffer (50ms)
    setTimeout(() => {
      navigate(ROUTES.PLAY_NOW);
    }, 850);
  }, 150);
};

// ----- Init -----

document.addEventListener("DOMContentLoaded", () => {
  const btnPlayNow = document.getElementById("btn-play-now");
  const btnLiveGames = document.getElementById("btn-live-games");

  if (!btnPlayNow || !btnLiveGames) {
    console.warn("CTA buttons not found — check element IDs.");
    return;
  }

  // Button 1 — Play Now: animated sequence then navigate
  let isSequencePlaying = false;

  btnPlayNow.addEventListener('click', () => {
    if (isSequencePlaying) return;
    isSequencePlaying = true;
    trackCTA(btnPlayNow, 'play-now');
    startPlayNowSequence(btnPlayNow);
  });

  // Button 2 — Live Games: fetch and navigate to a random game immediately
  let isFetching = false;

  btnLiveGames.addEventListener("click", async () => {
    if (isFetching) return; // guard against double-clicks during fetch
    isFetching = true;

    playFanfare();
    trackCTA(btnLiveGames, "live-games");
    setLoading(btnLiveGames, true);

    try {
      const games = await fetchGameList();

      if (games.length > 0) {
        const game = getRandomGame(games)
        navigate(`${COLONIST_BASE}/#${game.id}`)
      } else {
        navigate(ROUTES.LOBBY);
      }
    } catch (err) {
      console.warn("Game list fetch failed, falling back to lobby.", err);
      navigate(ROUTES.LOBBY);
    } finally {
      isFetching = false;
    }
  });
});
