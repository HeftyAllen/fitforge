// assets/js/legacy-weather-widget.js
(async function () {
  const target = document.getElementById("weather");
  if (!window.GymAPI || !window.GymAPI.fetchWeatherByCity) {
    if (target) target.textContent = "Weather unavailable";
    return;
  }

  try {
    const data = await window.GymAPI.fetchWeatherByCity("Cape Town");
    if (target) {
      target.innerHTML = `
        <strong>${data.name}</strong>
        <div>${Math.round(data.main.temp)}°C — ${data.weather[0].description}</div>
      `;
    }
  } catch (err) {
    console.error("Weather widget error:", err);
    if (target) target.textContent = "Weather error";
  }
})();
