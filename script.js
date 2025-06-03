// Weather App JavaScript - Using Free Open-Meteo API
class WeatherApp {
    constructor() {
        // Using Open-Meteo API - Completely FREE, no API key required!
        this.BASE_URL = 'https://api.open-meteo.com/v1';
        this.GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';
        
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeTheme();
        this.updateCurrentDate();
        
        // Load default city weather - Jordan (Amman)
        this.getWeatherData('Amman, Jordan');
    }

    initializeElements() {
        // Search elements
        this.cityInput = document.getElementById('cityInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        
        // Display elements
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.weatherDisplay = document.getElementById('weatherDisplay');
        
        // Weather info elements
        this.cityName = document.getElementById('cityName');
        this.countryName = document.getElementById('countryName');
        this.currentDate = document.getElementById('currentDate');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.weatherIconContainer = this.weatherIcon.parentElement;
        this.temperature = document.getElementById('temperature');
        this.weatherDescription = document.getElementById('weatherDescription');
        this.feelsLike = document.getElementById('feelsLike');
        this.visibility = document.getElementById('visibility');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        this.uvValue = document.getElementById('uvValue');
        this.uvLevel = document.getElementById('uvLevel');
        this.uvProgress = document.getElementById('uvProgress');
        this.forecastContainer = document.getElementById('forecastContainer');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
    }

    initializeEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Location functionality
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Input focus effects
        this.cityInput.addEventListener('focus', () => {
            this.cityInput.parentElement.style.transform = 'translateY(-2px)';
        });
        
        this.cityInput.addEventListener('blur', () => {
            if (!this.cityInput.value) {
                this.cityInput.parentElement.style.transform = 'translateY(0)';
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('weatherAppTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('weatherAppTheme', newTheme);
        this.updateThemeIcon(newTheme);
        
        // Add animation effect
        this.themeToggle.style.transform = 'scale(0.8) rotate(180deg)';
        setTimeout(() => {
            this.themeToggle.style.transform = 'scale(1) rotate(0deg)';
        }, 200);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        this.currentDate.textContent = now.toLocaleDateString('en-US', options);
    }

    showLoading() {
        this.hideError();
        this.weatherDisplay.classList.add('hidden');
        this.loadingSpinner.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingSpinner.classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.weatherDisplay.classList.add('hidden');
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showWeatherDisplay() {
        this.hideLoading();
        this.hideError();
        this.weatherDisplay.classList.remove('hidden');
    }

    handleSearch() {
        const city = this.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        
        this.getWeatherData(city);
        this.cityInput.value = '';
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        // Update loading message for location detection
        const loadingText = this.loadingSpinner.querySelector('p');
        if (loadingText) {
            loadingText.textContent = 'Getting your location...';
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Update loading message for weather data
                if (loadingText) {
                    loadingText.textContent = 'Finding your location name and getting weather data...';
                }
                this.getWeatherDataByCoords(latitude, longitude);
            },
            (error) => {
                let message = 'Unable to get your location';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                this.showError(message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }

    async getWeatherData(city) {
        this.showLoading();
        // Reset loading message for city search
        const loadingText = this.loadingSpinner.querySelector('p');
        if (loadingText) {
            loadingText.textContent = 'Getting weather data...';
        }
        
        try {
            // First, get coordinates for the city using geocoding
            const geocodingUrl = `${this.GEOCODING_URL}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geocodingResponse = await fetch(geocodingUrl);
            
            if (!geocodingResponse.ok) {
                throw new Error('Failed to find city location');
            }
            
            const geocodingData = await geocodingResponse.json();
            
            if (!geocodingData.results || geocodingData.results.length === 0) {
                throw new Error('City not found. Please check the spelling and try again.');
            }
            
            const location = geocodingData.results[0];
            const { latitude, longitude, name, country } = location;
            
            // Get weather data using coordinates
            await this.getWeatherDataByCoords(latitude, longitude, name, country);
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.showError(error.message || 'Failed to fetch weather data. Please try again.');
        }
    }

    async getWeatherDataByCoords(lat, lon, cityName = null, countryName = null) {
        try {
            // Get current weather and forecast
            const weatherUrl = `${this.BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=7`;
            
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const weatherData = await weatherResponse.json();
            
            // If we don't have city name, try to get it using reverse geocoding
            if (!cityName) {
                try {
                    // Use Nominatim (OpenStreetMap) for reverse geocoding as it's more reliable
                    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
                    
                    const nominatimResponse = await fetch(nominatimUrl, {
                        headers: {
                            'User-Agent': 'WeatherFlow-App/1.0'
                        }
                    });
                    
                    if (nominatimResponse.ok) {
                        const nominatimData = await nominatimResponse.json();
                        
                        if (nominatimData && nominatimData.address) {
                            const address = nominatimData.address;
                            
                            // Try to get the best available location name
                            cityName = address.city || 
                                     address.town || 
                                     address.village || 
                                     address.municipality || 
                                     address.county || 
                                     address.state_district || 
                                     address.state || 
                                     'Current Location';
                            
                            countryName = address.country || '';
                            
                            console.log('Location found:', cityName, countryName);
                        } else {
                            // Fallback to coordinate-based location
                            cityName = `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
                            countryName = '';
                        }
                    } else {
                        // If Nominatim fails, try a simpler approach with coordinates
                        cityName = `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
                        countryName = '';
                    }
                } catch (e) {
                    console.log('Reverse geocoding failed, using coordinate-based location');
                    // Fallback to showing coordinates
                    cityName = `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
                    countryName = '';
                }
            }
            
            this.displayWeatherData(weatherData, cityName || 'Current Location', countryName || '');
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.showError(error.message || 'Failed to fetch weather data for your location');
        }
    }

    displayWeatherData(weatherData, cityName, countryName) {
        const current = weatherData.current;
        const daily = weatherData.daily;
        const hourly = weatherData.hourly;
        
        // Update location info
        this.cityName.textContent = cityName;
        this.countryName.textContent = countryName;
        
        // Update weather icon based on weather code
        this.updateWeatherIcon(current.weather_code, current.is_day);
        
        // Update temperature
        this.temperature.textContent = Math.round(current.temperature_2m);
        this.weatherDescription.textContent = this.getWeatherDescription(current.weather_code);
        this.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
        
        // Update weather stats
        this.visibility.textContent = hourly.visibility && hourly.visibility[0] ? `${(hourly.visibility[0] / 1000).toFixed(1)} km` : 'N/A';
        this.humidity.textContent = `${current.relative_humidity_2m}%`;
        this.windSpeed.textContent = `${current.wind_speed_10m.toFixed(1)} km/h`;
        this.pressure.textContent = `${Math.round(current.pressure_msl)} hPa`;
        
        // Update sunrise/sunset
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = daily.time.findIndex(date => date === today);
        
        if (todayIndex !== -1) {
            const sunrise = new Date(daily.sunrise[todayIndex]);
            const sunset = new Date(daily.sunset[todayIndex]);
            
            this.sunrise.textContent = sunrise.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            this.sunset.textContent = sunset.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        // Update UV index
        const currentHour = new Date().getHours();
        const uvIndex = (hourly.uv_index && hourly.uv_index[currentHour]) || (daily.uv_index_max && daily.uv_index_max[0]) || 0;
        this.updateUVIndex(uvIndex);
        
        // Update forecast
        this.displayForecast(daily);
        
        // Show weather display
        this.showWeatherDisplay();
        
        // Add entrance animation
        this.weatherDisplay.style.animation = 'none';
        setTimeout(() => {
            this.weatherDisplay.style.animation = 'fadeInUp 0.6s ease-out';
        }, 10);
    }

    updateWeatherIcon(weatherCode, isDay) {
        const iconMap = {
            0: isDay ? '☀️' : '🌙', // Clear sky
            1: isDay ? '🌤️' : '🌙', // Mainly clear
            2: '⛅', // Partly cloudy
            3: '☁️', // Overcast
            45: '🌫️', // Fog
            48: '🌫️', // Depositing rime fog
            51: '🌦️', // Light drizzle
            53: '🌦️', // Moderate drizzle
            55: '🌧️', // Dense drizzle
            56: '🌨️', // Light freezing drizzle
            57: '🌨️', // Dense freezing drizzle
            61: '🌦️', // Slight rain
            63: '🌧️', // Moderate rain
            65: '🌧️', // Heavy rain
            66: '🌨️', // Light freezing rain
            67: '🌨️', // Heavy freezing rain
            71: '🌨️', // Slight snow fall
            73: '❄️', // Moderate snow fall
            75: '❄️', // Heavy snow fall
            77: '🌨️', // Snow grains
            80: '🌦️', // Slight rain showers
            81: '🌧️', // Moderate rain showers
            82: '⛈️', // Violent rain showers
            85: '🌨️', // Slight snow showers
            86: '❄️', // Heavy snow showers
            95: '⛈️', // Thunderstorm
            96: '⛈️', // Thunderstorm with slight hail
            99: '⛈️'  // Thunderstorm with heavy hail
        };
        
        const iconEmoji = iconMap[weatherCode] || '🌤️';
        
        // Safely update the weather icon container
        if (this.weatherIconContainer) {
            // Hide the original img element
            if (this.weatherIcon) {
                this.weatherIcon.style.display = 'none';
            }
            
            // Create or update the emoji icon
            let emojiIcon = this.weatherIconContainer.querySelector('.emoji-weather-icon');
            if (!emojiIcon) {
                emojiIcon = document.createElement('div');
                emojiIcon.className = 'emoji-weather-icon';
                this.weatherIconContainer.appendChild(emojiIcon);
            }
            
            emojiIcon.style.cssText = `
                font-size: 120px; 
                line-height: 1; 
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2)); 
                animation: bounce 2s ease-in-out infinite;
                text-align: center;
            `;
            emojiIcon.textContent = iconEmoji;
        }
    }

    getWeatherDescription(weatherCode) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return descriptions[weatherCode] || 'Unknown';
    }

    updateUVIndex(uvValue) {
        this.uvValue.textContent = Math.round(uvValue);
        
        let level, percentage;
        if (uvValue <= 2) {
            level = 'Low';
            percentage = (uvValue / 2) * 20;
        } else if (uvValue <= 5) {
            level = 'Moderate';
            percentage = 20 + ((uvValue - 2) / 3) * 30;
        } else if (uvValue <= 7) {
            level = 'High';
            percentage = 50 + ((uvValue - 5) / 2) * 25;
        } else if (uvValue <= 10) {
            level = 'Very High';
            percentage = 75 + ((uvValue - 7) / 3) * 20;
        } else {
            level = 'Extreme';
            percentage = 95 + Math.min((uvValue - 10) / 5, 1) * 5;
        }
        
        this.uvLevel.textContent = level;
        this.uvProgress.style.width = `${Math.min(percentage, 100)}%`;
        
        // Update UV progress color based on level
        const colors = {
            'Low': 'linear-gradient(90deg, #4ade80, #22c55e)',
            'Moderate': 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            'High': 'linear-gradient(90deg, #fb923c, #ea580c)',
            'Very High': 'linear-gradient(90deg, #f87171, #dc2626)',
            'Extreme': 'linear-gradient(90deg, #a855f7, #7c3aed)'
        };
        this.uvProgress.style.background = colors[level];
    }

    displayForecast(dailyData) {
        this.forecastContainer.innerHTML = '';
        
        // Show next 5 days (skip today)
        for (let i = 1; i < Math.min(6, dailyData.time.length); i++) {
            const forecastElement = this.createForecastElement(dailyData, i);
            this.forecastContainer.appendChild(forecastElement);
        }
    }

    createForecastElement(dailyData, index) {
        const date = new Date(dailyData.time[index]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.style.animationDelay = `${Math.random() * 0.5}s`;
        
        // Get weather icon for forecast
        const weatherCode = dailyData.weather_code[index];
        const iconMap = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️',
            71: '🌨️', 73: '❄️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        const iconEmoji = iconMap[weatherCode] || '🌤️';
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon" style="font-size: 60px; line-height: 1; margin: 0 auto 15px; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));">${iconEmoji}</div>
            <div class="forecast-temps">
                <span class="forecast-high">${Math.round(dailyData.temperature_2m_max[index])}°</span>
                <span class="forecast-low">${Math.round(dailyData.temperature_2m_min[index])}°</span>
            </div>
            <div class="forecast-desc">${this.getWeatherDescription(weatherCode)}</div>
        `;
        
        // Add hover effect
        forecastItem.addEventListener('mouseenter', () => {
            forecastItem.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        forecastItem.addEventListener('mouseleave', () => {
            forecastItem.style.transform = 'translateY(0) scale(1)';
        });
        
        return forecastItem;
    }
}

// Initialize the weather app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherApp();
    
    // Add some interactive effects
    addInteractiveEffects();
});

// Additional interactive effects
function addInteractiveEffects() {
    // Add parallax effect to background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('body::before');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
    
    // Add mouse move effect for cards
    document.querySelectorAll('.current-weather-card, .info-card, .forecast-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
    
    // Add typing effect to search input
    const searchInput = document.getElementById('cityInput');
    let typingTimer;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        searchInput.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        
        typingTimer = setTimeout(() => {
            searchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }, 1000);
    });
    
    // Add smooth scroll for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add loading animation to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 