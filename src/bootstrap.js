// src/bootstrap.js
import GymAppConfig from "/assets/config/api.js";

/* tiny JSON/HTTP wrapper that returns parsed JSON or throws with response body */
async function apiFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
    err.status = res.status;
    err.response = body;
    throw err;
  }
  return body;
}

/** resolve API key with fallbacks:
 * 1) value from GymAppConfig (imported config module)
 * 2) direct import.meta.env value (Vite)
 * 3) attempt a dynamic import of the config module as last-resort
 */
async function resolveKey(namespace = "weather", keyName = "apiKey", envName = "VITE_OPENWEATHER_KEY") {
  // 1) try GymAppConfig passed in
  const fromConfig = (GymAppConfig && GymAppConfig[namespace] && GymAppConfig[namespace][keyName]) || null;
  if (fromConfig) {
    // console.info('Resolved key from GymAppConfig');
    return { key: fromConfig, source: "GymAppConfig" };
  }

  // 2) try import.meta.env directly
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[envName]) {
    // console.info('Resolved key from import.meta.env');
    return { key: import.meta.env[envName], source: "import.meta.env" };
  }

  // 3) try dynamic import as last attempt (sometimes module path resolution differs)
  try {
    const mod = await import('/assets/config/api.js');
    const cfg = mod.default || mod;
    const key = cfg && cfg[namespace] && cfg[namespace][keyName];
    if (key) return { key, source: "dynamic-import" };
  } catch (e) {
    // ignore - dynamic import may fail if path isn't accessible
  }

  return { key: null, source: null };
}

function makeUrlWithApiKey(base, path, params = {}) {
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  return url.toString();
}

window.GymAPI = {
  config: GymAppConfig,

  async fetchWeatherByCity(city, units = "metric") {
    const res = await resolveKey("weather", "apiKey", "VITE_OPENWEATHER_KEY");
    if (!res.key) {
      const err = new Error("Missing weather API key (checked GymAppConfig, import.meta.env). Ensure VITE_OPENWEATHER_KEY is set and restart dev server.");
      err.hint = "Set VITE_OPENWEATHER_KEY in your .env at project root and restart Vite.";
      throw err;
    }
    const url = makeUrlWithApiKey(GymAppConfig.weather.baseURL || "https://api.openweathermap.org/data/2.5", "/weather", {
      q: city, appid: res.key, units
    });
    return apiFetch(url);
  },

  async fetchWeatherByCoords(lat, lon, units = "metric") {
    const res = await resolveKey("weather", "apiKey", "VITE_OPENWEATHER_KEY");
    if (!res.key) {
      const err = new Error("Missing weather API key (checked GymAppConfig, import.meta.env). Ensure VITE_OPENWEATHER_KEY is set and restart dev server.");
      err.hint = "Set VITE_OPENWEATHER_KEY in your .env at project root and restart Vite.";
      throw err;
    }
    const url = makeUrlWithApiKey(GymAppConfig.weather.baseURL || "https://api.openweathermap.org/data/2.5", "/weather", {
      lat, lon, appid: res.key, units
    });
    return apiFetch(url);
  },

  // Existing helpers unchanged (exercise/spoonacular etc)
  async searchRecipes(query, opts = {}) {
    const key = GymAppConfig.spoonacular.apiKey || import.meta.env.VITE_SPOONACULAR_KEY;
    if (!key) throw new Error('Missing spoonacular API key (VITE_SPOONACULAR_KEY).');
    const url = makeUrlWithApiKey(GymAppConfig.spoonacular.baseUrl, "/recipes/complexSearch", {
      query,
      number: opts.number ?? 10,
      addRecipeInformation: opts.addRecipeInformation ?? true,
      apiKey: key
    });
    return apiFetch(url);
  },

  async getExercisesByBodyPart(bodyPart) {
    const url = `${GymAppConfig.exerciseDB.baseURL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
    const headers = {
      "X-RapidAPI-Key": GymAppConfig.exerciseDB.apiKey || import.meta.env.VITE_EXERCISEDB_KEY,
      "X-RapidAPI-Host": GymAppConfig.exerciseDB.rapidHost || import.meta.env.VITE_EXERCISEDB_HOST
    };
    if (!headers["X-RapidAPI-Key"]) throw new Error("Missing ExerciseDB RapidAPI key (VITE_EXERCISEDB_KEY).");
    return apiFetch(url, { headers });
  },

  async getAllExercises() {
    const url = `${GymAppConfig.exerciseDB.baseURL}/exercises`;
    const headers = {
      "X-RapidAPI-Key": GymAppConfig.exerciseDB.apiKey || import.meta.env.VITE_EXERCISEDB_KEY,
      "X-RapidAPI-Host": GymAppConfig.exerciseDB.rapidHost || import.meta.env.VITE_EXERCISEDB_HOST
    };
    if (!headers["X-RapidAPI-Key"]) throw new Error("Missing ExerciseDB RapidAPI key (VITE_EXERCISEDB_KEY).");
    return apiFetch(url, { headers });
  },

  async findNearbyGyms(lat, lng, radius = 5000) {
    const key = GymAppConfig.places.apiKey || import.meta.env.VITE_GOOGLE_PLACES_KEY;
    if (!key) throw new Error("Missing Google Places key (VITE_GOOGLE_PLACES_KEY).");
    const url = `${GymAppConfig.places.baseURL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gym&key=${key}`;
    return apiFetch(url);
  },

  async proxyFetch(path, opts = {}) {
    const proxy = import.meta.env.VITE_API_PROXY_URL;
    if (!proxy) throw new Error("No VITE_API_PROXY_URL configured for proxyFetch");
    const url = proxy.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
    return apiFetch(url, opts);
  }
};

if (!console.group) console.group = () => {};
if (!console.groupEnd) console.groupEnd = () => {};
