// running-tracker.js - Comprehensive Running Tracker with Dynamic Data
class RunningTracker {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = null;
        this.pauseTime = null;
        this.totalPausedTime = 0;
        this.currentDistance = 0;
        this.currentSteps = 0;
        this.caloriesBurned = 0;
        this.positions = [];
        this.map = null;
        this.routeLayer = null;
        this.markerLayer = null;
        this.heartRate = 72;
        this.heartRateInterval = null;
        this.stepCounterInterval = null;
        this.updateInterval = null;
        this.audioPlaying = false;
        this.currentActivityType = 'running';
        this.currentGoal = { type: 'distance', value: 5.0 };
        this.splits = [];
        this.lastSplitDistance = 0;
        this.watchId = null;
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.setupEventListeners();
        this.initializeWeather();
        this.initializeStepCounter();
        this.initializeHeartRate();
        this.checkGPSStatus();
        this.loadUserPreferences();
    }

    loadUserPreferences() {
        // Load saved user preferences
        const savedActivity = localStorage.getItem('lastActivityType');
        const savedGoal = localStorage.getItem('lastGoal');
        
        if (savedActivity) {
            this.selectActivityType(document.querySelector(`[data-type="${savedActivity}"]`));
        }
        
        if (savedGoal) {
            const goalData = JSON.parse(savedGoal);
            this.currentGoal = goalData;
            this.updateGoalDisplay();
        }
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('map-container').setView([0, 0], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        this.routeLayer = L.layerGroup().addTo(this.map);
        this.markerLayer = L.layerGroup().addTo(this.map);

        this.showMapLoading(true);
        this.getCurrentLocation();
    }

    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        
                        this.map.setView([lat, lng], 15);
                        this.showMapLoading(false);
                        
                        // Add marker for current location
                        L.marker([lat, lng])
                            .addTo(this.markerLayer)
                            .bindPopup('Your current location')
                            .openPopup();
                        
                        this.positions.push({ lat, lng, timestamp: Date.now() });
                        resolve({ lat, lng });
                    },
                    (error) => {
                        console.error('Error getting location:', error);
                        this.showMapLoading(false);
                        this.showLocationModal();
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            } else {
                this.showMapLoading(false);
                reject(new Error('Geolocation not supported'));
            }
        });
    }

    startGPSWatch() {
        if (this.watchId) return;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                // Update GPS accuracy indicator
                this.updateGPSIndicator(accuracy);

                if (this.isRunning && !this.isPaused) {
                    this.positions.push({ 
                        lat, 
                        lng, 
                        timestamp: Date.now(),
                        accuracy 
                    });
                    this.updateRoute();
                    this.calculateDistance();
                    this.checkSplit();
                }

                // Update map center if running
                if (this.isRunning) {
                    this.map.setView([lat, lng], this.map.getZoom());
                }
            },
            (error) => {
                console.error('GPS watch error:', error);
                this.updateGPSIndicator(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    stopGPSWatch() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    updateGPSIndicator(accuracy) {
        const gpsDot = document.querySelector('.gps-dot');
        const gpsText = document.querySelector('.gps-indicator span');
        
        if (!accuracy) {
            gpsDot.style.background = '#ef4444';
            gpsText.textContent = 'GPS Signal: Weak';
            return;
        }

        if (accuracy < 10) {
            gpsDot.style.background = '#22c55e';
            gpsText.textContent = 'GPS Signal: Strong';
        } else if (accuracy < 25) {
            gpsDot.style.background = '#f59e0b';
            gpsText.textContent = 'GPS Signal: Moderate';
        } else {
            gpsDot.style.background = '#ef4444';
            gpsText.textContent = 'GPS Signal: Weak';
        }
    }

    updateRoute() {
        // Clear existing route
        this.routeLayer.clearLayers();

        if (this.positions.length > 1) {
            const latlngs = this.positions.map(pos => [pos.lat, pos.lng]);
            const polyline = L.polyline(latlngs, {
                color: '#0ea5e9',
                weight: 4,
                opacity: 0.7,
                smoothFactor: 1
            }).addTo(this.routeLayer);

            // Add start marker
            if (this.positions.length > 0) {
                L.marker([this.positions[0].lat, this.positions[0].lng])
                    .addTo(this.markerLayer)
                    .bindPopup('Start')
                    .openPopup();
            }

            // Add current position marker if running
            if (this.isRunning && !this.isPaused) {
                const currentPos = this.positions[this.positions.length - 1];
                L.marker([currentPos.lat, currentPos.lng])
                    .addTo(this.markerLayer)
                    .bindPopup('Current Position');
            }
        }
    }

    calculateDistance() {
        if (this.positions.length < 2) return;

        let totalDistance = 0;
        for (let i = 1; i < this.positions.length; i++) {
            const prev = this.positions[i - 1];
            const curr = this.positions[i];
            totalDistance += this.calculateDistanceBetween(prev.lat, prev.lng, curr.lat, curr.lng);
        }

        this.currentDistance = totalDistance;
        this.updateLiveStats();
    }

    calculateDistanceBetween(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    checkSplit() {
        const splitDistance = 1; // 1 km splits
        if (this.currentDistance - this.lastSplitDistance >= splitDistance) {
            const splitTime = this.getCurrentTime();
            const splitPace = this.calculateCurrentPace();
            
            this.splits.push({
                distance: Math.floor(this.currentDistance),
                time: splitTime,
                pace: splitPace
            });
            
            this.lastSplitDistance = Math.floor(this.currentDistance);
            this.updateSplitsDisplay();
        }
    }

    updateSplitsDisplay() {
        const splitsList = document.querySelector('.splits-list');
        splitsList.innerHTML = '';

        this.splits.forEach((split, index) => {
            const splitItem = document.createElement('div');
            splitItem.className = 'split-item';
            splitItem.innerHTML = `
                <span class="split-number">${index + 1}</span>
                <span class="split-distance">${split.distance} km</span>
                <span class="split-time">${split.time}</span>
            `;
            splitsList.appendChild(splitItem);
        });

        // Update remaining splits
        for (let i = this.splits.length; i < 5; i++) {
            const splitItem = document.createElement('div');
            splitItem.className = 'split-item';
            splitItem.innerHTML = `
                <span class="split-number">${i + 1}</span>
                <span class="split-distance">${i + 1} km</span>
                <span class="split-time">--:--</span>
            `;
            splitsList.appendChild(splitItem);
        }
    }

    setupEventListeners() {
        // Activity type selection
        document.querySelectorAll('.activity-type').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectActivityType(e.currentTarget);
            });
        });

        // Goal options
        document.querySelectorAll('.goal-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectGoalType(e.currentTarget);
            });
        });

        // Goal input
        document.querySelector('.goal-input input').addEventListener('input', (e) => {
            this.currentGoal.value = parseFloat(e.target.value) || 0;
            localStorage.setItem('lastGoal', JSON.stringify(this.currentGoal));
        });

        // Control buttons
        document.getElementById('start-run-btn').addEventListener('click', () => {
            this.startRun();
        });

        document.getElementById('warmup-btn').addEventListener('click', () => {
            this.startWarmup();
        });

        document.getElementById('route-planning-btn').addEventListener('click', () => {
            this.planRoute();
        });

        // Audio controls
        this.setupAudioControls();

        // Safety button
        document.querySelector('.emergency-contact .btn').addEventListener('click', () => {
            this.shareLocation();
        });

        // Modal controls
        this.setupModalControls();

        // Session controls
        document.getElementById('pause-session').addEventListener('click', () => {
            this.pauseSession();
        });

        document.getElementById('stop-session').addEventListener('click', () => {
            this.stopSession();
        });

        document.getElementById('close-session-modal').addEventListener('click', () => {
            this.closeSessionModal();
        });
    }

    selectActivityType(selectedButton) {
        document.querySelectorAll('.activity-type').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedButton.classList.add('active');
        
        this.currentActivityType = selectedButton.dataset.type;
        localStorage.setItem('lastActivityType', this.currentActivityType);
        
        this.updateActivityStats();
        this.updateCalorieCalculation();
    }

    selectGoalType(selectedButton) {
        document.querySelectorAll('.goal-option').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedButton.classList.add('active');
        
        this.currentGoal.type = selectedButton.dataset.goal;
        this.updateGoalDisplay();
        localStorage.setItem('lastGoal', JSON.stringify(this.currentGoal));
    }

    updateGoalDisplay() {
        const goalUnit = document.querySelector('.goal-unit');
        const goalInput = document.querySelector('.goal-input input');
        
        switch(this.currentGoal.type) {
            case 'distance':
                goalUnit.textContent = 'km';
                goalInput.placeholder = '5.0';
                break;
            case 'time':
                goalUnit.textContent = 'min';
                goalInput.placeholder = '30';
                break;
            case 'calories':
                goalUnit.textContent = 'cal';
                goalInput.placeholder = '300';
                break;
        }
        
        goalInput.value = this.currentGoal.value || '';
    }

    updateActivityStats() {
        // This would typically fetch from user's historical data
        // For now, we'll use realistic averages
        const stats = {
            running: { pace: '8:24', totalKm: '24.5' },
            walking: { pace: '12:30', totalKm: '18.2' },
            hiking: { pace: '15:45', totalKm: '12.8' },
            cycling: { pace: '4:15', totalKm: '35.6' }
        };
        
        const stat = stats[this.currentActivityType] || stats.running;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = stat.pace;
        document.querySelector('.stat-card:first-child .stat-value').textContent = stat.totalKm;
    }

    updateCalorieCalculation() {
        // Different activities have different calorie burn rates
        const calorieRates = {
            running: 60,  // calories per km
            walking: 40,
            hiking: 70,
            cycling: 25
        };
        
        const rate = calorieRates[this.currentActivityType] || 60;
        this.caloriesBurned = Math.round(this.currentDistance * rate);
        this.updateLiveStats();
    }

    startWarmup() {
        this.showCountdown(5, () => {
            this.showNotification('Warm-up complete! Ready to start your activity.');
        });
    }

    startRun() {
        if (this.isRunning) return;
        
        this.showCountdown(3, () => {
            this.beginRunningSession();
        });
    }

    showCountdown(seconds, callback) {
        const modal = document.getElementById('countdown-modal');
        const countdownDisplay = modal.querySelector('.countdown-number');
        modal.style.display = 'flex';

        let count = seconds;
        countdownDisplay.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;
            countdownDisplay.textContent = count;

            if (count <= 0) {
                clearInterval(countdownInterval);
                modal.style.display = 'none';
                if (callback) callback();
            }
        }, 1000);
    }

    beginRunningSession() {
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.positions = [];
        this.splits = [];
        this.lastSplitDistance = 0;
        this.currentDistance = 0;
        this.currentSteps = 0;
        this.caloriesBurned = 0;

        // Get initial position
        this.getCurrentLocation().then(position => {
            this.positions.push({ 
                lat: position.lat, 
                lng: position.lng, 
                timestamp: Date.now() 
            });
        });

        this.startGPSWatch();
        this.startUpdateInterval();
        this.startStepCounter();
        this.startHeartRateMonitor();
        this.showActiveSessionModal();

        // Update UI
        document.getElementById('start-run-btn').innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            Pause Run
        `;

        this.showNotification(`${this.currentActivityType.charAt(0).toUpperCase() + this.currentActivityType.slice(1)} session started!`);
    }

    pauseSession() {
        if (!this.isRunning) return;

        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseTime = Date.now();
            this.stopStepCounter();
            this.showNotification('Session paused');
            
            document.getElementById('pause-session').innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                </svg>
                Resume
            `;
        } else {
            this.totalPausedTime += Date.now() - this.pauseTime;
            this.startStepCounter();
            this.showNotification('Session resumed');
            
            document.getElementById('pause-session').innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Pause
            `;
        }
    }

    stopSession() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = false;
        
        const endTime = Date.now();
        const duration = (endTime - this.startTime - this.totalPausedTime) / 1000;
        
        this.stopGPSWatch();
        this.stopUpdateInterval();
        this.stopStepCounter();
        this.stopHeartRateMonitor();
        this.closeSessionModal();

        // Save session data
        this.saveSessionToFirebase({
            activityType: this.currentActivityType,
            startTime: this.startTime,
            endTime: endTime,
            duration: duration,
            distance: this.currentDistance,
            calories: this.caloriesBurned,
            steps: this.currentSteps,
            averagePace: this.calculateAveragePace(),
            splits: this.splits,
            route: this.positions
        });

        // Reset UI
        document.getElementById('start-run-btn').innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
            </svg>
            Start Run
        `;

        this.showNotification(`Session completed! Distance: ${this.currentDistance.toFixed(2)}km, Time: ${this.formatTime(duration)}`);
        
        // Reset stats
        this.resetStats();
    }

    saveSessionToFirebase(sessionData) {
        // Firebase integration will be added later
        console.log('Saving session to Firebase:', sessionData);
        
        // For now, save to localStorage
        const sessions = JSON.parse(localStorage.getItem('runningSessions') || '[]');
        sessions.push(sessionData);
        localStorage.setItem('runningSessions', JSON.stringify(sessions));
    }

    resetStats() {
        this.currentDistance = 0;
        this.currentSteps = 0;
        this.caloriesBurned = 0;
        this.updateLiveStats();
        this.updateStepCounter();
    }

    startUpdateInterval() {
        this.updateInterval = setInterval(() => {
            this.updateLiveStats();
            this.updateSessionModal();
            this.checkGoalAchievement();
        }, 1000);
    }

    stopUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateLiveStats() {
        const currentTime = this.getCurrentTime();
        const currentPace = this.calculateCurrentPace();

        document.getElementById('current-time').textContent = currentTime;
        document.getElementById('current-distance').textContent = this.currentDistance.toFixed(2);
        document.getElementById('current-pace').textContent = currentPace;
        document.getElementById('current-calories').textContent = this.caloriesBurned;
    }

    getCurrentTime() {
        if (!this.startTime) return '00:00:00';
        
        const currentTime = this.isPaused ? this.pauseTime : Date.now();
        const elapsed = (currentTime - this.startTime - this.totalPausedTime) / 1000;
        return this.formatTime(elapsed);
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    calculateCurrentPace() {
        if (this.currentDistance === 0) return '--:--';
        
        const currentTime = this.isPaused ? this.pauseTime : Date.now();
        const elapsed = (currentTime - this.startTime - this.totalPausedTime) / 1000;
        const paceSecondsPerKm = elapsed / this.currentDistance;
        
        const paceMins = Math.floor(paceSecondsPerKm / 60);
        const paceSecs = Math.floor(paceSecondsPerKm % 60);
        
        return `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
    }

    calculateAveragePace() {
        if (this.currentDistance === 0) return '--:--';
        
        const elapsed = (Date.now() - this.startTime - this.totalPausedTime) / 1000;
        const paceSecondsPerKm = elapsed / this.currentDistance;
        
        const paceMins = Math.floor(paceSecondsPerKm / 60);
        const paceSecs = Math.floor(paceSecondsPerKm % 60);
        
        return `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
    }

    checkGoalAchievement() {
        if (!this.currentGoal.value) return;

        let achieved = false;
        switch (this.currentGoal.type) {
            case 'distance':
                achieved = this.currentDistance >= this.currentGoal.value;
                break;
            case 'time':
                const currentTime = this.isPaused ? this.pauseTime : Date.now();
                const elapsedMinutes = (currentTime - this.startTime - this.totalPausedTime) / 60000;
                achieved = elapsedMinutes >= this.currentGoal.value;
                break;
            case 'calories':
                achieved = this.caloriesBurned >= this.currentGoal.value;
                break;
        }

        if (achieved) {
            this.showNotification(`Goal achieved! ${this.currentGoal.value} ${this.currentGoal.type} completed!`);
            this.currentGoal.value = null; // Prevent repeated notifications
        }
    }

    initializeStepCounter() {
        // Check if device has accelerometer
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        } else {
            // Fallback to simulated step counter
            this.startSimulatedStepCounter();
        }
    }

    handleDeviceMotion(event) {
        if (!this.isRunning || this.isPaused) return;

        const acceleration = event.accelerationIncludingGravity;
        if (acceleration) {
            const magnitude = Math.sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
            );

            // Simple step detection
            if (magnitude > 15) { // Threshold for step detection
                this.currentSteps++;
                this.updateStepCounter();
                this.updateCalorieCalculation();
            }
        }
    }

    startSimulatedStepCounter() {
        // Simulate steps based on distance and activity type
        this.stepCounterInterval = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                const stepsPerKm = {
                    running: 1300,
                    walking: 1400,
                    hiking: 1200,
                    cycling: 0
                };

                const stepRate = stepsPerKm[this.currentActivityType] || 1300;
                const newSteps = Math.round(this.currentDistance * stepRate);
                
                if (newSteps > this.currentSteps) {
                    this.currentSteps = newSteps;
                    this.updateStepCounter();
                }
            }
        }, 2000);
    }

    startStepCounter() {
        if (this.stepCounterInterval) return;
        this.startSimulatedStepCounter();
    }

    stopStepCounter() {
        if (this.stepCounterInterval) {
            clearInterval(this.stepCounterInterval);
            this.stepCounterInterval = null;
        }
    }

    updateStepCounter() {
        const stepCountElement = document.querySelector('.step-count');
        const progressFill = document.querySelector('.progress-fill');
        
        if (stepCountElement) {
            stepCountElement.textContent = this.currentSteps.toLocaleString();
        }
        
        if (progressFill) {
            const progress = Math.min((this.currentSteps / 10000) * 100, 100);
            progressFill.style.width = `${progress}%`;
        }
    }

    initializeHeartRate() {
        // Check if heart rate monitoring is available
        if (navigator.bluetooth) {
            this.connectHeartRateMonitor();
        } else {
            this.startSimulatedHeartRate();
        }
    }

    connectHeartRateMonitor() {
        // Bluetooth heart rate monitor integration would go here
        console.log('Bluetooth HR monitoring not implemented yet');
        this.startSimulatedHeartRate();
    }

    startSimulatedHeartRate() {
        this.heartRateInterval = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                // Simulate heart rate based on activity intensity
                const baseRate = 72;
                const activityBoost = {
                    running: 40,
                    walking: 20,
                    hiking: 30,
                    cycling: 35
                };

                const boost = activityBoost[this.currentActivityType] || 30;
                const randomVariation = Math.random() * 10 - 5; // ±5 bpm
                this.heartRate = Math.round(baseRate + boost + randomVariation);
            } else {
                // Gradually return to resting heart rate
                this.heartRate = Math.max(72, this.heartRate - 1);
            }
            
            this.updateHeartRateDisplay();
        }, 3000);
    }

    startHeartRateMonitor() {
        // HR monitor is already running via simulated interval
    }

    stopHeartRateMonitor() {
        // Keep the interval running to show resting heart rate
    }

    updateHeartRateDisplay() {
        const heartRateValue = document.querySelector('.heart-rate-value');
        if (heartRateValue) {
            heartRateValue.textContent = this.heartRate;
        }
    }

    planRoute() {
        this.showNotification('Route planning mode activated. Click on the map to set waypoints.');
        
        // Enable click-based route planning
        this.map.on('click', this.handleMapClick.bind(this));
        
        // Create a temporary layer for planned route
        this.plannedRouteLayer = L.layerGroup().addTo(this.map);
        this.plannedWaypoints = [];
    }

    handleMapClick(e) {
        if (!this.plannedRouteLayer) return;

        const { lat, lng } = e.latlng;
        this.plannedWaypoints.push([lat, lng]);

        // Add marker
        L.marker([lat, lng])
            .addTo(this.plannedRouteLayer)
            .bindPopup(`Waypoint ${this.plannedWaypoints.length}`)
            .openPopup();

        // Draw route
        if (this.plannedWaypoints.length > 1) {
            L.polyline(this.plannedWaypoints, {
                color: '#f97316',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10'
            }).addTo(this.plannedRouteLayer);
        }

        // Calculate and show distance
        if (this.plannedWaypoints.length >= 2) {
            let totalDistance = 0;
            for (let i = 1; i < this.plannedWaypoints.length; i++) {
                const prev = this.plannedWaypoints[i - 1];
                const curr = this.plannedWaypoints[i];
                totalDistance += this.calculateDistanceBetween(prev[0], prev[1], curr[0], curr[1]);
            }
            
            this.showNotification(`Planned route: ${totalDistance.toFixed(2)} km`);
        }
    }

    setupAudioControls() {
        const audioButtons = document.querySelectorAll('.audio-btn');
        
        audioButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                
                if (btn.classList.contains('play-pause')) {
                    this.toggleAudio();
                } else {
                    this.showNotification('Audio controls would switch tracks');
                }
            });
        });
    }

    toggleAudio() {
        this.audioPlaying = !this.audioPlaying;
        const playPauseBtn = document.querySelector('.audio-btn.play-pause');
        
        if (this.audioPlaying) {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
            `;
            this.showNotification('Audio playing: Power Workout Mix');
        } else {
            playPauseBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                </svg>
            `;
            this.showNotification('Audio paused');
        }
    }

    shareLocation() {
        if (navigator.share && this.positions.length > 0) {
            const lastPos = this.positions[this.positions.length - 1];
            navigator.share({
                title: 'My Current Location',
                text: `I'm currently at ${lastPos.lat.toFixed(6)}, ${lastPos.lng.toFixed(6)}`,
                url: `https://maps.google.com/?q=${lastPos.lat},${lastPos.lng}`
            });
        } else {
            this.showNotification('Location sharing activated. Emergency contacts notified.');
        }
    }

    initializeWeather() {
        this.fetchCurrentWeather();
    }

    async fetchCurrentWeather() {
        try {
            const apiKey = '16f0dedaf11e602dea2c265b7894baa1'; // From your .env
            const position = await this.getCurrentLocation();
            
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${position.lat}&lon=${position.lng}&appid=${apiKey}&units=metric`
            );
            
            if (response.ok) {
                const data = await response.json();
                this.updateWeatherDisplay(data);
            } else {
                this.showDefaultWeather();
            }
        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showDefaultWeather();
        }
    }

    updateWeatherDisplay(weatherData) {
        const weatherTemp = document.querySelector('.weather-temp');
        const weatherCondition = document.querySelector('.weather-condition');
        const weatherLocation = document.querySelector('.weather-location');
        const humidity = document.querySelector('.weather-stat:nth-child(1) .stat-value');
        const wind = document.querySelector('.weather-stat:nth-child(2) .stat-value');

        if (weatherTemp) weatherTemp.textContent = `${Math.round(weatherData.main.temp)}°C`;
        if (weatherCondition) weatherCondition.textContent = weatherData.weather[0].description;
        if (weatherLocation) weatherLocation.textContent = weatherData.name;
        if (humidity) humidity.textContent = `${weatherData.main.humidity}%`;
        if (wind) wind.textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
    }

    showDefaultWeather() {
        // Fallback weather data
        const weatherTemp = document.querySelector('.weather-temp');
        const weatherCondition = document.querySelector('.weather-condition');
        
        if (weatherTemp) weatherTemp.textContent = '18°C';
        if (weatherCondition) weatherCondition.textContent = 'Partly Cloudy';
    }

    checkGPSStatus() {
        // GPS status is updated in watchPosition callback
    }

    showMapLoading(show) {
        const mapContainer = document.getElementById('map-container');
        const loadingElement = mapContainer.querySelector('.map-loading');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        
        if (!show) {
            mapContainer.classList.add('map-loaded');
        }
    }

    showLocationModal() {
        const modal = document.getElementById('location-modal');
        modal.style.display = 'flex';
        
        document.getElementById('allow-location').onclick = () => {
            modal.style.display = 'none';
            this.getCurrentLocation();
        };
        
        document.getElementById('deny-location').onclick = () => {
            modal.style.display = 'none';
            // Set map to default location (San Francisco)
            this.map.setView([37.7749, -122.4194], 10);
            this.showMapLoading(false);
        };
    }

    showActiveSessionModal() {
        const modal = document.getElementById('active-session-modal');
        modal.style.display = 'flex';
    }

    closeSessionModal() {
        const modal = document.getElementById('active-session-modal');
        modal.style.display = 'none';
    }

    updateSessionModal() {
        document.getElementById('session-time').textContent = this.getCurrentTime();
        document.getElementById('session-distance').textContent = `${this.currentDistance.toFixed(2)} km`;
        document.getElementById('session-pace').textContent = this.calculateCurrentPace();
    }

    setupModalControls() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
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

// Initialize the tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.runningTracker = new RunningTracker();
});