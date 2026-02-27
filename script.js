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
    trackCTA(btnPlayNow, "play-now");
    navigate(ROUTES.PLAY_NOW);
  });

  // Button 2 — Live Games: fetch and navigate to a random game immediately
  let isFetching = false;

  btnLiveGames.addEventListener("click", async () => {
    if (isFetching) return; // guard against double-clicks during fetch
    isFetching = true;

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
