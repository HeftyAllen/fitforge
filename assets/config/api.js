// assets/config/api.js
// No Vite. No import.meta. Plain JS.

const E = (typeof process !== "undefined" && process.env) ? process.env : window?.__env__ ?? {};

// helper to get env var
const getEnv = (key, fallback = "") => {
  return E[key] ?? fallback;
};

const GymAppConfig = {
  app: {
    name: getEnv("APP_NAME", "FitForge"),
    env: getEnv("ENV", "development")
  },

  firebase: {
    apiKey: getEnv("FIREBASE_API_KEY"),
    authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("FIREBASE_APP_ID"),
    measurementId: getEnv("FIREBASE_MEASUREMENT_ID")
  },

  spoonacular: {
    apiKey: getEnv("SPOONACULAR_KEY"),
    host: "api.spoonacular.com",
    baseUrl: "https://api.spoonacular.com"
  },

  exerciseDB: {
    apiKey: getEnv("EXERCISEDB_KEY"),
    rapidHost: getEnv("EXERCISEDB_HOST", "exercisedb.p.rapidapi.com"),
    baseURL: "https://exercisedb.p.rapidapi.com"
  },

  weather: {
    apiKey: getEnv("OPENWEATHER_KEY"),
    baseURL: "https://api.openweathermap.org/data/2.5"
  },

  places: {
    apiKey: getEnv("GOOGLE_PLACES_KEY"),
    baseURL: "https://maps.googleapis.com/maps/api/place"
  },

  proxy: {
    enabled: getEnv("API_PROXY_ENABLED") === "true",
    url: getEnv("API_PROXY_URL")
  },

  ai: {
    apiKey: getEnv("AI_API_KEY"),
    apiUrl: getEnv("AI_API_URL")
  }
};

// Debugging
if (typeof window !== "undefined") {
  window.GymAppConfig = GymAppConfig;
}

export default GymAppConfig;
