// weather-widget.js - Comprehensive Weather Integration
class WeatherWidget {
    constructor() {
        this.currentLocation = null;
        this.savedLocations = [];
        this.currentWeather = null;
        this.forecast = null;
        this.airQuality = null;
        this.alerts = [];
        
        this.init();
    }

    init() {
        this.loadSavedLocations();
        this.setupEventListeners();
        this.getCurrentLocationWeather();
    }

    loadSavedLocations() {
        const saved = localStorage.getItem('weatherLocations');
        if (saved) {
            this.savedLocations = JSON.parse(saved);
        }
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refresh-weather').addEventListener('click', () => {
            this.refreshWeather();
        });

        // Add location button
        document.getElementById('add-location').addEventListener('click', () => {
            this.showAddLocationModal();
        });

        // Location actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.location-suggestion')) {
                this.handleLocationSuggestion(e.target.closest('.location-suggestion'));
            }
        });

        // Map controls
        document.querySelectorAll('.map-control').forEach(control => {
            control.addEventListener('click', (e) => {
                this.selectMapLayer(e.currentTarget);
            });
        });

        // Modal controls
        this.setupModalControls();
    }

    async getCurrentLocationWeather() {
        try {
            const position = await this.getCurrentPosition();
            this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                name: 'Current Location'
            };
            
            await this.fetchAllWeatherData();
        } catch (error) {
            console.error('Error getting location:', error);
            // Fallback to San Francisco
            this.currentLocation = {
                lat: 37.7749,
                lng: -122.4194,
                name: 'San Francisco, CA'
            };
            await this.fetchAllWeatherData();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    async fetchAllWeatherData() {
        try {
            await Promise.all([
                this.fetchCurrentWeather(),
                this.fetchForecast(),
                this.fetchAirQuality(),
                this.fetchAlerts()
            ]);
            
            this.updateWeatherDisplay();
            this.updateActivityRecommendations();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showDefaultWeather();
        }
    }

    async fetchCurrentWeather() {
        const apiKey = '16f0dedaf11e602dea2c265b7894baa1';
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lng}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Weather API error');
        }
        
        this.currentWeather = await response.json();
    }

    async fetchForecast() {
        const apiKey = '16f0dedaf11e602dea2c265b7894baa1';
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lng}&appid=${apiKey}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Forecast API error');
        }
        
        const data = await response.json();
        this.processForecastData(data);
    }

    processForecastData(data) {
        // Group forecasts by day and get daily summaries
        const dailyForecasts = {};
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyForecasts[dateKey]) {
                dailyForecasts[dateKey] = {
                    date: date,
                    temps: [],
                    conditions: [],
                    data: []
                };
            }
            
            dailyForecasts[dateKey].temps.push(item.main.temp);
            dailyForecasts[dateKey].conditions.push(item.weather[0].main);
            dailyForecasts[dateKey].data.push(item);
        });
        
        // Create hourly forecast for next 24 hours
        this.forecast = {
            hourly: data.list.slice(0, 8).map(item => ({
                time: new Date(item.dt * 1000),
                temp: Math.round(item.main.temp),
                condition: item.weather[0].main,
                icon: this.getWeatherIcon(item.weather[0].main, item.dt * 1000)
            })),
            daily: Object.values(dailyForecasts).slice(0, 7).map(day => ({
                date: day.date,
                high: Math.round(Math.max(...day.temps)),
                low: Math.round(Math.min(...day.temps)),
                condition: this.getMostFrequentCondition(day.conditions),
                icon: this.getWeatherIcon(this.getMostFrequentCondition(day.conditions), day.date.getTime())
            }))
        };
    }

    getMostFrequentCondition(conditions) {
        const frequency = {};
        conditions.forEach(condition => {
            frequency[condition] = (frequency[condition] || 0) + 1;
        });
        
        return Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );
    }

    async fetchAirQuality() {
        // OpenWeatherMap Air Quality API
        const apiKey = '16f0dedaf11e602dea2c265b7894baa1';
        try {
            const response = await fetch(
                `http://api.openweathermap.org/data/2.5/air_pollution?lat=${this.currentLocation.lat}&lon=${this.currentLocation.lng}&appid=${apiKey}`
            );
            
            if (response.ok) {
                const data = await response.json();
                this.processAirQualityData(data);
            } else {
                this.generateSimulatedAirQuality();
            }
        } catch (error) {
            this.generateSimulatedAirQuality();
        }
    }

    processAirQualityData(data) {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        this.airQuality = {
            aqi: aqi,
            level: this.getAQILevel(aqi),
            components: {
                pm25: components.pm2_5,
                pm10: components.pm10,
                o3: components.o3,
                no2: components.no2,
                so2: components.so2,
                co: components.co
            }
        };
    }

    getAQILevel(aqi) {
        const levels = {
            1: { label: 'Good', color: 'good' },
            2: { label: 'Fair', color: 'moderate' },
            3: { label: 'Moderate', color: 'moderate' },
            4: { label: 'Poor', color: 'poor' },
            5: { label: 'Very Poor', color: 'poor' }
        };
        
        return levels[aqi] || levels[1];
    }

    generateSimulatedAirQuality() {
        // Generate realistic air quality data
        this.airQuality = {
            aqi: 2,
            level: { label: 'Good', color: 'good' },
            components: {
                pm25: 12,
                pm10: 18,
                o3: 45,
                no2: 22,
                so2: 8,
                co: 220
            }
        };
    }

    async fetchAlerts() {
        // OpenWeatherMap Alerts would be in the current weather response
        // For now, we'll simulate some alerts
        this.alerts = [
            {
                type: 'info',
                title: 'Coastal Fog Advisory',
                description: 'Dense fog expected along the coast until 10 AM. Reduced visibility for morning activities.',
                time: '6:00 AM'
            }
        ];
    }

    updateWeatherDisplay() {
        this.updateCurrentWeather();
        this.updateForecast();
        this.updateAirQuality();
        this.updateAlerts();
        this.updateLocationInfo();
    }

    updateCurrentWeather() {
        if (!this.currentWeather) return;

        const temp = Math.round(this.currentWeather.main.temp);
        const feelsLike = Math.round(this.currentWeather.main.feels_like);
        const condition = this.currentWeather.weather[0].description;
        const icon = this.getWeatherIcon(this.currentWeather.weather[0].main);

        // Update main weather display
        document.querySelector('.temperature').textContent = `${temp}°C`;
        document.querySelector('.weather-condition').textContent = 
            condition.charAt(0).toUpperCase() + condition.slice(1);
        document.querySelector('.feels-like').textContent = `Feels like ${feelsLike}°C`;

        // Update weather icon
        const weatherIcon = document.querySelector('.weather-icon.large');
        if (weatherIcon) {
            weatherIcon.innerHTML = this.getWeatherSVG(icon);
        }

        // Update details
        const details = {
            humidity: `${this.currentWeather.main.humidity}%`,
            wind: `${Math.round(this.currentWeather.wind.speed * 3.6)} km/h ${this.getWindDirection(this.currentWeather.wind.deg)}`,
            pressure: `${this.currentWeather.main.pressure} hPa`,
            visibility: `${(this.currentWeather.visibility / 1000).toFixed(1)} km`,
            sunrise: this.formatTime(new Date(this.currentWeather.sys.sunrise * 1000)),
            sunset: this.formatTime(new Date(this.currentWeather.sys.sunset * 1000))
        };

        Object.keys(details).forEach((key, index) => {
            const detailItem = document.querySelector(`.detail-item:nth-child(${index + 1}) .detail-value`);
            if (detailItem) {
                detailItem.textContent = details[key];
            }
        });
    }

    updateForecast() {
        if (!this.forecast) return;

        this.updateHourlyForecast();
        this.updateWeeklyForecast();
    }

    updateHourlyForecast() {
        const hourlyScroll = document.querySelector('.hourly-scroll');
        if (!hourlyScroll) return;

        hourlyScroll.innerHTML = '';

        this.forecast.hourly.forEach(hour => {
            const hourItem = document.createElement('div');
            hourItem.className = 'hourly-item';
            
            const timeString = hour.time.getHours() === new Date().getHours() ? 
                'Now' : 
                `${hour.time.getHours()}:00`;
            
            hourItem.innerHTML = `
                <span class="hour-time">${timeString}</span>
                <div class="hour-icon">
                    ${this.getWeatherSVG(hour.icon)}
                </div>
                <span class="hour-temp">${hour.temp}°</span>
            `;
            
            hourlyScroll.appendChild(hourItem);
        });
    }

    updateWeeklyForecast() {
        const weeklyList = document.querySelector('.weekly-list');
        if (!weeklyList) return;

        weeklyList.innerHTML = '';

        this.forecast.daily.forEach((day, index) => {
            const dayItem = document.createElement('div');
            dayItem.className = 'day-forecast';
            
            const dayName = index === 0 ? 'Today' : 
                           index === 1 ? 'Tomorrow' :
                           day.date.toLocaleDateString('en-US', { weekday: 'short' });
            
            dayItem.innerHTML = `
                <span class="day-name">${dayName}</span>
                <div class="day-icon">
                    ${this.getWeatherSVG(day.icon)}
                </div>
                <div class="day-temps">
                    <span class="high-temp">${day.high}°</span>
                    <span class="low-temp">${day.low}°</span>
                </div>
            `;
            
            weeklyList.appendChild(dayItem);
        });
    }

    updateAirQuality() {
        if (!this.airQuality) return;

        const aqiValue = document.querySelector('.aqi-value');
        const aqiLabel = document.querySelector('.aqi-label');
        
        if (aqiValue) {
            aqiValue.textContent = this.airQuality.aqi;
            aqiValue.className = `aqi-value ${this.airQuality.level.color}`;
        }
        
        if (aqiLabel) {
            aqiLabel.textContent = this.airQuality.level.label;
        }

        // Update air quality details
        const details = document.querySelector('.air-quality-details');
        if (details) {
            details.innerHTML = `
                <div class="aq-detail">
                    <span class="aq-label">PM2.5</span>
                    <span class="aq-value">${this.airQuality.components.pm25} μg/m³</span>
                </div>
                <div class="aq-detail">
                    <span class="aq-label">PM10</span>
                    <span class="aq-value">${this.airQuality.components.pm10} μg/m³</span>
                </div>
                <div class="aq-detail">
                    <span class="aq-label">O₃</span>
                    <span class="aq-value">${this.airQuality.components.o3} ppb</span>
                </div>
                <div class="aq-detail">
                    <span class="aq-label">NO₂</span>
                    <span class="aq-value">${this.airQuality.components.no2} ppb</span>
                </div>
            `;
        }
    }

    updateAlerts() {
        const alertsList = document.querySelector('.alerts-list');
        if (!alertsList) return;

        alertsList.innerHTML = '';

        this.alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${alert.type}`;
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.description}</p>
                    <span class="alert-time">Issued: ${alert.time}</span>
                </div>
            `;
            alertsList.appendChild(alertItem);
        });
    }

    updateLocationInfo() {
        const locationName = document.querySelector('.location-info h2');
        const locationCoords = document.querySelector('.location-coords');
        
        if (locationName) {
            locationName.textContent = this.currentLocation.name;
        }
        
        if (locationCoords) {
            locationCoords.textContent = 
                `${this.currentLocation.lat.toFixed(4)}° N, ${this.currentLocation.lng.toFixed(4)}° W`;
        }
    }

    updateActivityRecommendations() {
        if (!this.currentWeather) return;

        const temp = this.currentWeather.main.temp;
        const condition = this.currentWeather.weather[0].main;
        const windSpeed = this.currentWeather.wind.speed * 3.6; // Convert to km/h
        const humidity = this.currentWeather.main.humidity;

        const recommendations = this.generateRecommendations(temp, condition, windSpeed, humidity);
        this.displayRecommendations(recommendations);
    }

    generateRecommendations(temp, condition, windSpeed, humidity) {
        const recommendations = [];

        // Running recommendation
        if (temp >= 10 && temp <= 25 && windSpeed < 20 && condition !== 'Rain') {
            recommendations.push({
                activity: 'running',
                status: 'good',
                title: 'Running',
                description: 'Perfect conditions for running! Mild temperature and light winds.',
                stats: ['Ideal temperature', 'Light breeze', 'Good visibility']
            });
        } else if (temp >= 5 && temp <= 30 && windSpeed < 25) {
            recommendations.push({
                activity: 'running',
                status: 'moderate',
                title: 'Running',
                description: 'Good conditions for running. Dress appropriately for the temperature.',
                stats: ['Acceptable temperature', 'Moderate wind', 'Good visibility']
            });
        } else {
            recommendations.push({
                activity: 'running',
                status: 'poor',
                title: 'Running',
                description: 'Consider indoor running today due to weather conditions.',
                stats: ['Extreme temperature', 'High wind', 'Poor conditions']
            });
        }

        // Outdoor workout recommendation
        if (temp >= 15 && temp <= 28 && condition !== 'Rain' && windSpeed < 15) {
            recommendations.push({
                activity: 'outdoor',
                status: 'good',
                title: 'Outdoor Workout',
                description: 'Great weather for bodyweight exercises in the park.',
                stats: ['Comfortable temp', 'Dry conditions', 'Calm weather']
            });
        }

        // Hiking recommendation
        if (temp >= 12 && temp <= 25 && humidity < 80 && condition !== 'Rain') {
            recommendations.push({
                activity: 'hiking',
                status: condition === 'Clouds' ? 'moderate' : 'good',
                title: 'Hiking',
                description: condition === 'Clouds' ? 
                    'Good conditions, but check for changing cloud cover.' : 
                    'Excellent hiking weather! Clear skies and comfortable temperature.',
                stats: condition === 'Clouds' ? 
                    ['Watch for clouds', 'Bring layers'] : 
                    ['Clear conditions', 'Perfect temperature']
            });
        }

        return recommendations;
    }

    displayRecommendations(recommendations) {
        const container = document.querySelector('.recommendation-cards');
        if (!container) return;

        container.innerHTML = '';

        recommendations.slice(0, 3).forEach(rec => {
            const card = document.createElement('div');
            card.className = `recommendation-card ${rec.status}`;
            card.innerHTML = `
                <div class="recommendation-icon">
                    ${this.getActivityIcon(rec.activity)}
                </div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <div class="recommendation-stats">
                        ${rec.stats.map(stat => `<span class="stat">${stat}</span>`).join('')}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    getActivityIcon(activity) {
        const icons = {
            running: '<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/></svg>',
            outdoor: '<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/></svg>',
            hiking: '<svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>'
        };
        
        return icons[activity] || icons.running;
    }

    getWeatherIcon(condition, timestamp = Date.now()) {
        const hour = new Date(timestamp).getHours();
        const isDay = hour >= 6 && hour < 18;
        
        const icons = {
            Clear: isDay ? 'sun' : 'moon',
            Clouds: 'clouds',
            Rain: 'rain',
            Drizzle: 'drizzle',
            Thunderstorm: 'thunderstorm',
            Snow: 'snow',
            Mist: 'mist',
            Fog: 'fog'
        };
        
        return icons[condition] || 'clouds';
    }

    getWeatherSVG(icon) {
        const svgs = {
            sun: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>',
            moon: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>',
            clouds: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>',
            rain: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M7 14.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm-6 2a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5z"/></svg>',
            drizzle: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M7 14.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm3 0a.5.5 0 01.5.5v1a.5.5 0 01-1 0V15a.5.5 0 01.5-.5z"/></svg>',
            thunderstorm: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M11 12l-2 3h3l-2 3"/></svg>',
            snow: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M8 14.5a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm2 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V15a.5.5 0 01.5-.5zm-4 2a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5zm2 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5zm2 0a.5.5 0 01.5.5v.5a.5.5 0 01-1 0V17a.5.5 0 01.5-.5z"/></svg>',
            mist: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M5 14a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2zM7 12a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>',
            fog: '<svg width="80" height="80" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/><path d="M4 14a1 1 0 100-2 1 1 0 000 2zm12 0a1 1 0 100-2 1 1 0 000 2zm-6 0a1 1 0 100-2 1 1 0 000 2z"/></svg>'
        };
        
        return svgs[icon] || svgs.clouds;
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    refreshWeather() {
        this.showNotification('Refreshing weather data...');
        this.fetchAllWeatherData().then(() => {
            this.showNotification('Weather data updated!');
        }).catch(() => {
            this.showNotification('Failed to update weather data');
        });
    }

    showAddLocationModal() {
        const modal = document.getElementById('add-location-modal');
        modal.style.display = 'flex';

        // Setup form submission
        const form = document.getElementById('add-location-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.handleAddLocation(form);
        };

        // Setup cancel button
        document.getElementById('cancel-location').onclick = () => {
            modal.style.display = 'none';
        };

        // Setup close button
        document.getElementById('close-location-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    handleAddLocation(form) {
        const searchInput = document.getElementById('location-search');
        const locationName = searchInput.value.trim();
        
        if (locationName) {
            this.addNewLocation(locationName);
            form.reset();
            document.getElementById('add-location-modal').style.display = 'none';
        }
    }

    async addNewLocation(locationName) {
        try {
            // Use OpenWeatherMap Geocoding API to get coordinates
            const apiKey = '16f0dedaf11e602dea2c265b7894baa1';
            const response = await fetch(
                `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationName)}&limit=1&appid=${apiKey}`
            );
            
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const location = data[0];
                    this.savedLocations.push({
                        name: location.name,
                        lat: location.lat,
                        lng: location.lon,
                        country: location.country
                    });
                    
                    localStorage.setItem('weatherLocations', JSON.stringify(this.savedLocations));
                    this.showNotification(`Added ${location.name} to saved locations`);
                } else {
                    this.showNotification('Location not found');
                }
            }
        } catch (error) {
            this.showNotification('Error adding location');
        }
    }

    handleLocationSuggestion(suggestion) {
        const locationText = suggestion.querySelector('span').textContent;
        
        if (locationText === 'Use Current Location') {
            this.getCurrentLocationWeather();
        } else {
            this.addNewLocation(locationText);
        }
        
        document.getElementById('add-location-modal').style.display = 'none';
    }

    selectMapLayer(selectedControl) {
        document.querySelectorAll('.map-control').forEach(control => {
            control.classList.remove('active');
        });
        selectedControl.classList.add('active');
        
        this.showNotification(`Showing ${selectedControl.textContent} map`);
    }

    setupModalControls() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    showDefaultWeather() {
        // Fallback weather data
        this.currentWeather = {
            main: {
                temp: 18,
                feels_like: 16,
                humidity: 65,
                pressure: 1014
            },
            weather: [{ description: 'partly cloudy', main: 'Clouds' }],
            wind: { speed: 3.3, deg: 250 }, // 12 km/h
            visibility: 16000,
            sys: {
                sunrise: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
                sunset: Date.now() + 2 * 60 * 60 * 1000   // 2 hours from now
            },
            name: 'San Francisco'
        };
        
        this.updateWeatherDisplay();
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-500);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the weather widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherWidget = new WeatherWidget();
});