# Weather App

A responsive weather application with dark/light mode, geolocation support, and capital city autocomplete search.

## Features

- 🌍 **Auto-geolocation** - Automatically shows weather for your current location on first load
- 🔍 **Smart Search** - Autocomplete search for capital cities with keyboard navigation
- 🌓 **Dark/Light Mode** - Theme toggle with localStorage persistence
- 📊 **3-Day Forecast** - View upcoming weather conditions
- ⚡ **Performance** - Debounced input, in-memory caching, and optimized API calls
- ♿ **Accessible** - ARIA attributes, keyboard navigation, and semantic HTML

## Setup Instructions

### 1. Get an API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key from your account dashboard

### 2. Configure the App

Open `app.js` and replace the placeholder with your API key:

\`\`\`javascript
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your actual key
\`\`\`

### 3. Run the App

Simply open `index.html` in a modern web browser. No build process required!

For local development with live reload, you can use any static server:

\`\`\`bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve

# Using PHP
php -S localhost:8000
\`\`\`

Then visit `http://localhost:8000` in your browser.

## Usage

- **Current Location**: Click the location icon in the header to fetch weather for your current position
- **Search**: Type a capital city name in the search box to see autocomplete suggestions
- **Keyboard Navigation**: Use arrow keys to navigate suggestions, Enter to select, Escape to close
- **Theme Toggle**: Click the sun/moon icon to switch between light and dark modes

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies

- HTML5
- TailwindCSS (via CDN)
- Vanilla JavaScript (ES6+)
- OpenWeatherMap API

## License

MIT
