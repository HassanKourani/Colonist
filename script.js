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
  PLAY_NOW: COLONIST_BASE + "/#newRoom",
  LOBBY: COLONIST_BASE + "/#lobby=1",
};

const SPINNER_HTML = '<span class="spinner"></span>';

const watchLiveHTML = (count) =>
  `<span class="button-title">WATCH LIVE</span>` +
  `<span class="button-subtitle">Watch one of the ${count} games live!</span>`;

// ----- API -----

// Replace with your deployed Vercel URL after running: cd colonist-api && vercel
const GAMES_API = "https://n8n.dev.quiq.ly/webhook/colonist-games";

/**
 * Fetch the list of active games.
 *
 * Calls our own proxy API (deployed separately on Vercel) which forwards
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

// ----- Init -----

document.addEventListener("DOMContentLoaded", () => {
  const btnPlayNow = document.getElementById("btn-play-now");
  const btnLiveGames = document.getElementById("btn-live-games");

  if (!btnPlayNow || !btnLiveGames) {
    console.warn("CTA buttons not found — check element IDs.");
    return;
  }

  // Button 1 — Play Now: route to main play page
  btnPlayNow.addEventListener("click", () => {
    window.location.href = ROUTES.PLAY_NOW;
  });

  // Button 2 — Live Games: first click fetches, second click navigates
  let cachedGames = null;

  btnLiveGames.addEventListener("click", async () => {
    // Second click — games already fetched, navigate to a random one
    if (cachedGames) {
      const game = cachedGames[Math.floor(Math.random() * cachedGames.length)];
      window.location.href = COLONIST_BASE + "/#" + game.id;
      return;
    }

    // First click — fetch game list
    setLoading(btnLiveGames, true);

    try {
      const games = await fetchGameList();

      if (games.length > 0) {
        cachedGames = games;
        btnLiveGames.classList.remove("is-loading");
        btnLiveGames.innerHTML = watchLiveHTML(games.length);
      } else {
        window.location.href = ROUTES.LOBBY;
      }
    } catch {
      window.location.href = ROUTES.LOBBY;
    } finally {
      if (!cachedGames) {
        setLoading(btnLiveGames, false);
      }
    }
  });
});
