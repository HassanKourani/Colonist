/**
 * Colonist A/B Test — Checkered CTA Buttons
 *
 * Button 1 (Play Now):   Routes to the main play page.
 * Button 2 (Live Games): Fetches game list on click, navigates to a
 *                         random live game. Falls back to lobby.
 */

// ----- Constants -----

const COLONIST_BASE = 'https://colonist.io';

const generateRoomName = () => {
  const adjectives = ['big', 'red', 'old', 'dry', 'icy', 'odd', 'raw', 'hot', 'new', 'top'];
  const nouns = ['bay', 'oak', 'ore', 'sea', 'elk', 'fox', 'gem', 'cay', 'sun', 'bay'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100–999
  return adj + '-' + noun + num;
};

const ROUTES = {
  playNow: () => COLONIST_BASE + '/#' + generateRoomName(), // create new game
  LOBBY: COLONIST_BASE + '/#lobby=1',   // fallback for games list api fail
};

const SPINNER_HTML = '<span class="spinner"></span>';

const GAMES_API = 'https://n8n.dev.quiq.ly/webhook/colonist-games';

const EXPERIMENT_ID = 'checkered-cta';

const SUBTITLE_DELAY_MS = 150; // delay before text swap + hex wipe begins
const NAV_DELAY_MS = 850;      // wave (450ms) + tile animation (350ms) + buffer (50ms)

// ----- API -----

/**
 * Fetch the list of active games.
 *
 * Calls our own N8N Webhook which forwards
 * to colonist.io — this avoids CORS issues entirely.
 */
const fetchGameList = async () => {
  const res = await fetch(GAMES_API);
  if (!res.ok) throw new Error('API ' + res.status);
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
    button.classList.add('is-loading');
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = SPINNER_HTML;
  } else {
    button.classList.remove('is-loading');
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
    new CustomEvent('cta:click', {
      bubbles: true,
      detail: {
        cta: button.dataset.cta,
        action,
        experiment: EXPERIMENT_ID,
      },
    })
  );
};

const getRandomGame = (games) => games[Math.floor(Math.random() * games.length)];

const navigate = (path) => {
  window.location.href = path;
};

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

// Plays a short C-major arpeggio fanfare using the Web Audio API
const playFanfare = () => {
  const ctx = getAudioContext();
  // Frequencies for C4, E4, G4 — a C major triad
  const notes = [261.63, 329.63, 392.00];

  notes.forEach((freq, i) => {
    // Create an oscillator (tone generator) and a gain node (volume control)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Stagger each note by 80ms so they play in quick succession
    const t = ctx.currentTime + i * 0.08;

    // Use a pure sine wave at the given frequency
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    // Start silent, ramp up to 0.3 in 20ms (quick attack), then fade out exponentially by 150ms
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    // Connect the signal chain: oscillator → gain → speakers
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
    // Clean up nodes after playback to prevent memory leaks
    osc.addEventListener('ended', () => { osc.disconnect(); gain.disconnect(); }, { once: true });
  });
};

// ----- Ripple -----

const createRipple = (button) => {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  button.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  // Fallback removal in case animationend never fires (e.g. prefers-reduced-motion)
  setTimeout(() => ripple.isConnected && ripple.remove(), 600);
};

// ----- Hex overlay -----

// Builds a full-screen honeycomb hex-tile overlay that wipes across the viewport
const buildHexOverlay = (variant = 'orange') => {
  // Grab the overlay container; bail out if it doesn't exist
  const overlay = document.getElementById('hex-overlay');
  if (!overlay) return;
  // Clear any previous tiles from a prior animation
  overlay.innerHTML = '';

  // Tile dimensions and layout constants
  const TILE_W = 80;
  const TILE_H = 72;
  // Rows overlap by 25% to create the honeycomb packing effect
  const ROW_STEP = TILE_H * 0.75;
  // Total duration of the left-to-right wave animation
  const WAVE_MS = 450;

  // Calculate how many tiles are needed to cover the viewport (+ extra for overflow)
  const cols = Math.ceil(window.innerWidth / TILE_W) + 3;
  const rows = Math.ceil(window.innerHeight / ROW_STEP) + 3;
  // Pick the CSS class based on the color variant
  const tileClass = variant === 'green' ? 'hex-tile hex-tile--green' : 'hex-tile';

  for (let r = 0; r < rows; r++) {
    // Shift odd rows right by half a tile width to create the honeycomb stagger
    const rowOffset = (r % 2 === 1) ? TILE_W / 2 : 0;
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('div');
      tile.className = tileClass;
      // Position each tile; offset by -1 tile to cover left/top edges
      tile.style.left = `${c * TILE_W + rowOffset - TILE_W}px`;
      tile.style.top  = `${r * ROW_STEP - ROW_STEP}px`;
      // Stagger animation delay by column so tiles reveal in a left-to-right wave
      tile.style.animationDelay = `${(c / cols) * WAVE_MS}ms`;
      overlay.appendChild(tile);
    }
  }

  // Activate the overlay to trigger the CSS animations
  overlay.classList.add('active');
};

// Shared wipe + navigate: run hex overlay then route after animation completes.
const wipeAndNavigate = (url, variant = 'orange') => {
  buildHexOverlay(variant);
  setTimeout(() => navigate(url), NAV_DELAY_MS);
};

// ----- Play Now sequence -----

const startPlayNowSequence = (button, disableFn) => {
  const subtitle = button.querySelector('.button-subtitle');
  disableFn();

  // t=0: sound + ripple + subtitle fade
  playFanfare();
  createRipple(button);

  if (subtitle) subtitle.classList.add('changing');

  // t=SUBTITLE_DELAY_MS: text swap + hex wipe begins
  setTimeout(() => {
    if (subtitle) {
      subtitle.textContent = 'Setting up board...';
      subtitle.classList.remove('changing');
    }

    wipeAndNavigate(ROUTES.playNow());
  }, SUBTITLE_DELAY_MS);
};

// ----- Init -----

document.addEventListener('DOMContentLoaded', () => {
  const btnPlayNow = document.getElementById('btn-play-now');
  const btnLiveGames = document.getElementById('btn-live-games');

  if (!btnPlayNow || !btnLiveGames) {
    console.warn('CTA buttons not found — check element IDs.');
    return;
  }

  // Closes over cached button refs — no repeated DOM queries.
  const disableBothButtons = () => {
    btnPlayNow.disabled = true;
    btnLiveGames.disabled = true;
  };

  // Button 1 — Play Now: animated sequence then navigate
  let isSequencePlaying = false;

  btnPlayNow.addEventListener('click', () => {
    if (isSequencePlaying) return;
    isSequencePlaying = true;
    trackCTA(btnPlayNow, 'play-now');
    startPlayNowSequence(btnPlayNow, disableBothButtons);
  });

  // Reset overlay + button state when navigating back (back-forward cache restore)
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const overlay = document.getElementById('hex-overlay');
    if (overlay) { overlay.classList.remove('active'); overlay.innerHTML = ''; }
    btnPlayNow.disabled = false;
    btnLiveGames.disabled = false;
    isSequencePlaying = false;
    isFetching = false;
    setLoading(btnLiveGames, false);
    const subtitle = btnPlayNow.querySelector('.button-subtitle');
    if (subtitle) { subtitle.textContent = 'Create a room!'; subtitle.classList.remove('changing'); }
  });

  // Button 2 — Live Games: fetch and navigate to a random game immediately
  let isFetching = false;

  btnLiveGames.addEventListener('click', async () => {
    if (isFetching) return; // guard against double-clicks during fetch
    isFetching = true;

    disableBothButtons();
    playFanfare();
    trackCTA(btnLiveGames, 'live-games');
    setLoading(btnLiveGames, true);

    try {
      const games = await fetchGameList();
      const url = games.length > 0
        ? `${COLONIST_BASE}/#${getRandomGame(games).id}`
        : ROUTES.LOBBY;
      setLoading(btnLiveGames, false);
      wipeAndNavigate(url, 'green');
    } catch (err) {
      console.warn('Game list fetch failed, falling back to lobby.', err);
      setLoading(btnLiveGames, false);
      wipeAndNavigate(ROUTES.LOBBY, 'green');
    } finally {
      isFetching = false;
    }
  });
});
