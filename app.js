// Configuration
const API_KEY = "dce5fd2b2e2b2df82e050e177833635a";
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

// State
let capitals = []; // now contains all cities
const weatherCache = new Map();
let debounceTimer = null;
let selectedIndex = -1;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const suggestionsEl = document.getElementById("suggestions");
const weatherDisplay = document.getElementById("weatherDisplay");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const themeToggle = document.getElementById("themeToggle");
const geolocateBtn = document.getElementById("geolocateBtn");

// Initialize
async function init() {
  await loadCities();
  initTheme();
  attachEventListeners();
  requestGeolocation();
}

// Load cities data (all world cities)
async function loadCities() {
  try {
    const response = await fetch("cities.json"); // place the full cities.json in your project
    const data = await response.json();

    // Map city data to expected structure
    capitals = data.map(city => ({
      name: city.name,
      country: city.country,
      lat: city.coord.lat,
      lon: city.coord.lon,
    }));
  } catch (error) {
    console.error("[v0] Failed to load cities:", error);
    showError("Failed to load city data. Please refresh the page.");
  }
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

// Geolocation
function requestGeolocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.log("[v0] Geolocation denied or unavailable:", error);
        showError("Location access denied. Please search for a city manually.");
      },
    );
  } else {
    showError("Geolocation not supported by your browser.");
  }
}

// Autocomplete
function handleSearchInput(event) {
  const query = event.target.value.trim();

  clearTimeout(debounceTimer);

  if (query.length === 0) {
    hideSuggestions();
    return;
  }

  debounceTimer = setTimeout(() => {
    const matches = capitals
      .filter((capital) => capital.name.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 20); // limit to top 20 to avoid lag

    displaySuggestions(matches);
  }, 250);
}

function displaySuggestions(matches) {
  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  selectedIndex = -1;
  suggestionsEl.innerHTML = matches
    .map(
      (capital, index) => `
    <li 
      class="suggestion-item px-4 py-3 cursor-pointer text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
      role="option"
      data-index="${index}"
      data-name="${capital.name}"
      data-country="${capital.country}"
      data-lat="${capital.lat}"
      data-lon="${capital.lon}">
      <div class="font-medium">${capital.name}</div>
      <div class="text-sm text-gray-500 dark:text-gray-400">${capital.country}</div>
    </li>
  `,
    )
    .join("");

  suggestionsEl.classList.remove("hidden");
  searchInput.setAttribute("aria-expanded", "true");
}

function hideSuggestions() {
  suggestionsEl.classList.add("hidden");
  searchInput.setAttribute("aria-expanded", "false");
  selectedIndex = -1;
}

function handleKeyboardNavigation(event) {
  const items = suggestionsEl.querySelectorAll(".suggestion-item");

  if (items.length === 0) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelectedItem(items);
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelectedItem(items);
      break;
    case "Enter":
      event.preventDefault();
      if (selectedIndex >= 0) {
        items[selectedIndex].click();
      }
      break;
    case "Escape":
      hideSuggestions();
      break;
  }
}

function updateSelectedItem(items) {
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.setAttribute("aria-selected", "true");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.setAttribute("aria-selected", "false");
    }
  });
}

// Weather API
async function fetchWeatherByCoords(lat, lon) {
  showLoading();
  hideError();

  const cacheKey = `${lat},${lon}`;

  if (weatherCache.has(cacheKey)) {
    displayWeather(weatherCache.get(cacheKey));
    return;
  }

  try {
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error("Weather data unavailable");
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const weatherData = {
      current: currentData,
      forecast: processForecast(forecastData),
    };

    weatherCache.set(cacheKey, weatherData);
    displayWeather(weatherData);
  } catch (error) {
    console.error("[v0] Weather fetch error:", error);
    showError("Failed to fetch weather data. Please try again.");
    hideLoading();
  }
}

async function fetchWeatherByCity(name) {
  searchInput.value = name;
  hideSuggestions();

  showLoading();
  hideError();

  try {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      name,
    )}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      name,
    )}&appid=${API_KEY}&units=metric`;

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error("City not found or weather unavailable");
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const weatherData = {
      current: currentData,
      forecast: processForecast(forecastData),
    };

    displayWeather(weatherData);
  } catch (error) {
    console.error("[v0] City weather fetch error:", error);
    showError("Unable to fetch weather for that city. Please try again.");
    hideLoading();
  }
}

function processForecast(data) {
  const dailyData = {};

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();

    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        date: item.dt,
      };
    }

    dailyData[date].temps.push(item.main.temp);
  });

  return Object.values(dailyData)
    .slice(1, 4)
    .map((day) => ({
      date: day.date,
      minTemp: Math.round(Math.min(...day.temps)),
      maxTemp: Math.round(Math.max(...day.temps)),
      icon: day.icon,
      description: day.description,
    }));
}

// Display
function displayWeather(data) {
  const { current, forecast } = data;

  document.getElementById("cityName").textContent = `${current.name}, ${current.sys.country}`;
  document.getElementById("temperature").textContent = `${Math.round(current.main.temp)}°C`;
  document.getElementById("description").textContent = current.weather[0].description;
  document.getElementById("feelsLike").textContent = `${Math.round(current.main.feels_like)}°C`;
  document.getElementById("humidity").textContent = `${current.main.humidity}%`;
  document.getElementById("windSpeed").textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;

  const weatherIcon = document.getElementById("weatherIcon");
  weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
  weatherIcon.alt = current.weather[0].description;

  const now = new Date();
  document.getElementById("lastUpdated").textContent = `Last updated: ${now.toLocaleTimeString()}`;

  const forecastContainer = document.getElementById("forecastContainer");
  forecastContainer.innerHTML = forecast
    .map((day) => {
      const date = new Date(day.date * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      return `
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
        <p class="font-semibold text-gray-800 dark:text-white mb-2">${dayName}</p>
        <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="w-12 h-12 mx-auto mb-2">
        <p class="text-sm text-gray-600 dark:text-gray-300 capitalize mb-2">${day.description}</p>
        <p class="text-gray-800 dark:text-white">
          <span class="font-semibold">${day.maxTemp}°</span> / <span class="text-gray-500 dark:text-gray-400">${day.minTemp}°</span>
        </p>
      </div>
    `;
    })
    .join("");

  hideLoading();
  weatherDisplay.classList.remove("hidden");
}

function showLoading() {
  weatherDisplay.classList.add("hidden");
  loadingState.classList.remove("hidden");
}

function hideLoading() {
  loadingState.classList.add("hidden");
}

function showError(message) {
  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
  setTimeout(() => hideError(), 5000);
}

function hideError() {
  errorState.classList.add("hidden");
}

// Event Listeners
function attachEventListeners() {
  searchInput.addEventListener("input", handleSearchInput);
  searchInput.addEventListener("keydown", handleKeyboardNavigation);

  suggestionsEl.addEventListener("click", (event) => {
    const item = event.target.closest(".suggestion-item");
    if (item) {
      const { name } = item.dataset;
      fetchWeatherByCity(name);
    }
  });

  themeToggle.addEventListener("click", toggleTheme);
  geolocateBtn.addEventListener("click", requestGeolocation);

  document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !suggestionsEl.contains(event.target)) {
      hideSuggestions();
    }
  });
}

// Start the app
init();
