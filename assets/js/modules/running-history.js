// running-history.js - Comprehensive Activity History Management
class RunningHistory {
    constructor() {
        this.activities = [];
        this.filteredActivities = [];
        this.filters = {
            activityType: ['running', 'walking','hiking','cycling'],
            dateRange: 'all',
            customStart: null,
            customEnd: null,
            distance: ['medium'],
            sortBy: 'date-desc'
        };
        this.stats = {
            totalDistance: 0,
            totalActivities: 0,
            totalTime: 0,
            totalCalories: 0,
            monthlyDistance: 0,
            averagePace: '--:--',
            activitiesThisMonth: 0
        };
        
        this.init();
    }

    init() {
        this.loadActivities();
        this.setupEventListeners();
        this.applyFilters();
        this.updateStats();
        this.updateCharts();
    }

    loadActivities() {
        // Load from localStorage (will be replaced with Firebase)
        const savedSessions = localStorage.getItem('runningSessions');
        if (savedSessions) {
            this.activities = JSON.parse(savedSessions);
        } else {
            // Generate sample data for demonstration
            this.generateSampleData();
        }
    }

    generateSampleData() {
        const sampleActivities = [
            {
                id: 1,
                activityType: 'running',
                startTime: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
                endTime: Date.now() - (2 * 24 * 60 * 60 * 1000) + (32 * 60 * 1000),
                duration: 1920, // 32 minutes in seconds
                distance: 4.2,
                calories: 420,
                steps: 5460,
                averagePace: '7:37',
                splits: [
                    { distance: 1, time: '7:45', pace: '7:45' },
                    { distance: 2, time: '15:20', pace: '7:40' },
                    { distance: 3, time: '23:10', pace: '7:43' },
                    { distance: 4, time: '30:45', pace: '7:41' }
                ],
                route: []
            },
            {
                id: 2,
                activityType: 'walking',
                startTime: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
                endTime: Date.now() - (5 * 24 * 60 * 60 * 1000) + (45 * 60 * 1000),
                duration: 2700, // 45 minutes
                distance: 3.8,
                calories: 380,
                steps: 5320,
                averagePace: '11:50',
                splits: [],
                route: []
            },
            {
                id: 3,
                activityType: 'running',
                startTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
                endTime: Date.now() - (7 * 24 * 60 * 60 * 1000) + (48 * 60 * 1000),
                duration: 2880, // 48 minutes
                distance: 6.1,
                calories: 610,
                steps: 7930,
                averagePace: '7:52',
                splits: [
                    { distance: 1, time: '8:10', pace: '8:10' },
                    { distance: 2, time: '16:05', pace: '7:55' },
                    { distance: 3, time: '23:45', pace: '7:50' },
                    { distance: 4, time: '31:20', pace: '7:50' },
                    { distance: 5, time: '39:10', pace: '7:50' },
                    { distance: 6, time: '46:45', pace: '7:45' }
                ],
                route: []
            }
        ];

        this.activities = sampleActivities;
        localStorage.setItem('runningSessions', JSON.stringify(sampleActivities));
    }

    setupEventListeners() {
        // Filter checkboxes
        document.querySelectorAll('input[name="activity-type"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateActivityTypeFilters();
            });
        });

        document.querySelectorAll('input[name="distance"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDistanceFilters();
            });
        });

        // Date range buttons
        document.querySelectorAll('.date-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectDateRange(e.currentTarget);
            });
        });

        // Custom date inputs
        document.querySelectorAll('.date-inputs input').forEach(input => {
            input.addEventListener('change', () => {
                this.updateCustomDateRange();
            });
        });

        // Sort dropdown
        document.querySelector('.form-select').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Filter buttons
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        // View options
        document.querySelectorAll('.view-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.changeView(e.currentTarget);
            });
        });

        // Activity actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-secondary') && e.target.textContent === 'View Details') {
                const activityCard = e.target.closest('.activity-card');
                const activityId = parseInt(activityCard.dataset.id);
                this.showActivityDetails(activityId);
            }
        });

        // Load more button
        document.querySelector('.load-more-activities').addEventListener('click', () => {
            this.loadMoreActivities();
        });
    }

    updateActivityTypeFilters() {
        const checkedTypes = Array.from(document.querySelectorAll('input[name="activity-type"]:checked'))
            .map(checkbox => checkbox.value);
        this.filters.activityType = checkedTypes;
    }

    updateDistanceFilters() {
        const checkedDistances = Array.from(document.querySelectorAll('input[name="distance"]:checked'))
            .map(checkbox => checkbox.value);
        this.filters.distance = checkedDistances;
    }

    selectDateRange(selectedButton) {
        document.querySelectorAll('.date-option').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedButton.classList.add('active');
        
        this.filters.dateRange = selectedButton.dataset.range;
        this.filters.customStart = null;
        this.filters.customEnd = null;
        
        // Clear custom date inputs
        document.querySelectorAll('.date-inputs input').forEach(input => {
            input.value = '';
        });
    }

    updateCustomDateRange() {
        const startInput = document.querySelector('.date-inputs input:first-child');
        const endInput = document.querySelector('.date-inputs input:last-child');
        
        if (startInput.value && endInput.value) {
            this.filters.dateRange = 'custom';
            this.filters.customStart = new Date(startInput.value);
            this.filters.customEnd = new Date(endInput.value);
            
            // Update date buttons
            document.querySelectorAll('.date-option').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }

    applyFilters() {
        this.updateActivityTypeFilters();
        this.updateDistanceFilters();
        
        let filtered = this.activities.filter(activity => {
            // Activity type filter
            if (!this.filters.activityType.includes(activity.activityType)) {
                return false;
            }
            
            // Date range filter
            const activityDate = new Date(activity.startTime);
            if (!this.passesDateFilter(activityDate)) {
                return false;
            }
            
            // Distance filter
            if (!this.passesDistanceFilter(activity.distance)) {
                return false;
            }
            
            return true;
        });
        
        // Sort activities
        filtered = this.sortActivities(filtered);
        
        this.filteredActivities = filtered;
        this.displayActivities();
        this.updateStats();
        this.updateCharts();
    }

    passesDateFilter(activityDate) {
        const now = new Date();
        
        switch (this.filters.dateRange) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return activityDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return activityDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                return activityDate >= yearAgo;
            case 'custom':
                if (this.filters.customStart && this.filters.customEnd) {
                    return activityDate >= this.filters.customStart && activityDate <= this.filters.customEnd;
                }
                return true;
            default: // 'all'
                return true;
        }
    }

    passesDistanceFilter(distance) {
        if (this.filters.distance.length === 0) return true;
        
        const conditions = {
            short: distance < 5,
            medium: distance >= 5 && distance <= 10,
            long: distance > 10
        };
        
        return this.filters.distance.some(range => conditions[range]);
    }

    sortActivities(activities) {
        return activities.sort((a, b) => {
            switch (this.filters.sortBy) {
                case 'date-asc':
                    return a.startTime - b.startTime;
                case 'distance-desc':
                    return b.distance - a.distance;
                case 'distance-asc':
                    return a.distance - b.distance;
                case 'duration-desc':
                    return b.duration - a.duration;
                case 'pace-desc':
                    return this.paceToSeconds(a.averagePace) - this.paceToSeconds(b.averagePace);
                default: // 'date-desc'
                    return b.startTime - a.startTime;
            }
        });
    }

    paceToSeconds(pace) {
        if (pace === '--:--') return Infinity;
        const [minutes, seconds] = pace.split(':').map(Number);
        return minutes * 60 + seconds;
    }

    resetFilters() {
        // Reset checkboxes
        document.querySelectorAll('input[name="activity-type"]').forEach(checkbox => {
            checkbox.checked = ['running', 'walking'].includes(checkbox.value);
        });
        
        document.querySelectorAll('input[name="distance"]').forEach(checkbox => {
            checkbox.checked = checkbox.value === 'medium';
        });
        
        // Reset date range
        document.querySelector('.date-option[data-range="all"]').classList.add('active');
        this.filters.dateRange = 'all';
        
        // Reset sort
        document.querySelector('.form-select').value = 'date-desc';
        this.filters.sortBy = 'date-desc';
        
        // Clear custom dates
        document.querySelectorAll('.date-inputs input').forEach(input => {
            input.value = '';
        });
        this.filters.customStart = null;
        this.filters.customEnd = null;
        
        this.applyFilters();
    }

    changeView(selectedButton) {
        document.querySelectorAll('.view-option').forEach(btn => {
            btn.classList.remove('active');
        });
        selectedButton.classList.add('active');
        
        const view = selectedButton.dataset.view;
        this.displayActivities(view);
    }

    displayActivities(view = 'list') {
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = '';
        
        if (this.filteredActivities.length === 0) {
            activitiesList.innerHTML = `
                <div class="no-activities">
                    <h3>No activities found</h3>
                    <p>Try adjusting your filters or start a new activity!</p>
                </div>
            `;
            return;
        }
        
        this.filteredActivities.forEach(activity => {
            const activityElement = this.createActivityElement(activity, view);
            activitiesList.appendChild(activityElement);
        });
    }

    createActivityElement(activity, view) {
        const activityDate = new Date(activity.startTime);
        const now = new Date();
        const isToday = activityDate.toDateString() === now.toDateString();
        const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === activityDate.toDateString();
        
        let dateText;
        if (isToday) {
            dateText = `Today • ${this.formatTime(activityDate)}`;
        } else if (isYesterday) {
            dateText = `Yesterday • ${this.formatTime(activityDate)}`;
        } else {
            dateText = `${this.formatDate(activityDate)} • ${this.formatTime(activityDate)}`;
        }
        
        const activityCard = document.createElement('div');
        activityCard.className = 'activity-card';
        activityCard.dataset.id = activity.id;
        
        activityCard.innerHTML = `
            <div class="activity-header">
                <div class="activity-type ${activity.activityType}">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        ${this.getActivityIcon(activity.activityType)}
                    </svg>
                    <span>${activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)}</span>
                </div>
                <div class="activity-date">
                    <span>${dateText}</span>
                </div>
            </div>
            
            <div class="activity-content">
                <div class="activity-stats">
                    <div class="activity-stat">
                        <span class="stat-value">${activity.distance.toFixed(2)} km</span>
                        <span class="stat-label">Distance</span>
                    </div>
                    <div class="activity-stat">
                        <span class="stat-value">${this.formatDuration(activity.duration)}</span>
                        <span class="stat-label">Duration</span>
                    </div>
                    <div class="activity-stat">
                        <span class="stat-value">${activity.averagePace}</span>
                        <span class="stat-label">Avg Pace</span>
                    </div>
                    <div class="activity-stat">
                        <span class="stat-value">${activity.calories}</span>
                        <span class="stat-label">Calories</span>
                    </div>
                </div>

                <div class="activity-map-preview">
                    <div class="map-mini">
                        <div class="map-placeholder">Route Map</div>
                    </div>
                </div>
            </div>

            ${this.getActivityAchievements(activity)}

            <div class="activity-actions">
                <button class="btn btn-secondary btn-small">View Details</button>
                <button class="btn btn-secondary btn-small">Share</button>
                <button class="btn btn-secondary btn-small">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                </button>
            </div>
        `;
        
        return activityCard;
    }

    getActivityIcon(activityType) {
        const icons = {
            running: '<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>',
            walking: '<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>',
            hiking: '<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>',
            cycling: '<path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z"/>'
        };
        
        return icons[activityType] || icons.running;
    }

    getActivityAchievements(activity) {
        let achievements = '';
        
        // Check for personal bests
        const personalBests = this.calculatePersonalBests();
        if (activity.distance >= 5 && activity.averagePace === personalBests['5k']) {
            achievements += `
                <div class="activity-achievement">
                    <div class="achievement-badge">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                        <span>5K Personal Best!</span>
                    </div>
                </div>
            `;
        }
        
        // Check for longest distance
        const longestDistance = Math.max(...this.activities.map(a => a.distance));
        if (activity.distance === longestDistance) {
            achievements += `
                <div class="activity-achievement">
                    <div class="achievement-badge">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>
                        </svg>
                        <span>Longest Distance!</span>
                    </div>
                </div>
            `;
        }
        
        return achievements;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    updateStats() {
        this.calculateStats();
        this.updateStatsDisplay();
        this.updatePersonalBests();
        this.updateTrends();
        this.updateTrainingLoad();
        this.updateAchievements();
    }

    calculateStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        this.stats = {
            totalDistance: 0,
            totalActivities: this.filteredActivities.length,
            totalTime: 0,
            totalCalories: 0,
            monthlyDistance: 0,
            activitiesThisMonth: 0,
            averagePace: '--:--'
        };
        
        let totalPaceSeconds = 0;
        let paceCount = 0;
        
        this.filteredActivities.forEach(activity => {
            this.stats.totalDistance += activity.distance;
            this.stats.totalTime += activity.duration;
            this.stats.totalCalories += activity.calories;
            
            const activityDate = new Date(activity.startTime);
            if (activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear) {
                this.stats.monthlyDistance += activity.distance;
                this.stats.activitiesThisMonth++;
            }
            
            if (activity.averagePace !== '--:--') {
                totalPaceSeconds += this.paceToSeconds(activity.averagePace);
                paceCount++;
            }
        });
        
        // Calculate average pace
        if (paceCount > 0) {
            const avgPaceSeconds = totalPaceSeconds / paceCount;
            const avgPaceMins = Math.floor(avgPaceSeconds / 60);
            const avgPaceSecs = Math.floor(avgPaceSeconds % 60);
            this.stats.averagePace = `${avgPaceMins}:${avgPaceSecs.toString().padStart(2, '0')}`;
        }
    }

    updateStatsDisplay() {
        // Update lifetime stats
        document.querySelector('.lifetime-stat:nth-child(1) .stat-value').textContent = 
            this.stats.totalDistance.toFixed(1);
        document.querySelector('.lifetime-stat:nth-child(2) .stat-value').textContent = 
            this.stats.totalActivities;
        document.querySelector('.lifetime-stat:nth-child(3) .stat-value').textContent = 
            this.formatDuration(this.stats.totalTime);
        document.querySelector('.lifetime-stat:nth-child(4) .stat-value').textContent = 
            this.stats.totalCalories.toLocaleString();
        
        // Update main stats
        document.querySelector('.stat-card.large:nth-child(1) .stat-value').textContent = 
            `${this.stats.monthlyDistance.toFixed(1)} km`;
        document.querySelector('.stat-card.large:nth-child(2) .stat-value').textContent = 
            this.stats.averagePace;
        document.querySelector('.stat-card.large:nth-child(3) .stat-value').textContent = 
            this.stats.activitiesThisMonth;
    }

    updatePersonalBests() {
        const personalBests = this.calculatePersonalBests();
        const pbList = document.querySelector('.pb-list');
        
        pbList.innerHTML = '';
        
        Object.entries(personalBests).forEach(([distance, time]) => {
            if (time !== '--:--') {
                const pbItem = document.createElement('div');
                pbItem.className = 'pb-item';
                pbItem.innerHTML = `
                    <div class="pb-distance">${distance}</div>
                    <div class="pb-time">${time}</div>
                    <div class="pb-date">Recent</div>
                `;
                pbList.appendChild(pbItem);
            }
        });
    }

    calculatePersonalBests() {
        const pbs = {
            '1 km': '--:--',
            '5 km': '--:--',
            '10 km': '--:--'
        };
        
        this.filteredActivities.forEach(activity => {
            // Check for 5K PBs
            if (activity.distance >= 5 && activity.distance < 10) {
                if (pbs['5 km'] === '--:--' || this.paceToSeconds(activity.averagePace) < this.paceToSeconds(pbs['5 km'])) {
                    pbs['5 km'] = activity.averagePace;
                }
            }
            
            // Check for 10K PBs
            if (activity.distance >= 10) {
                if (pbs['10 km'] === '--:--' || this.paceToSeconds(activity.averagePace) < this.paceToSeconds(pbs['10 km'])) {
                    pbs['10 km'] = activity.averagePace;
                }
            }
        });
        
        return pbs;
    }

    updateCharts() {
        this.updateWeeklyChart();
    }

    updateWeeklyChart() {
        // Calculate weekly distances
        const weeklyData = this.calculateWeeklyDistances();
        const chartBars = document.querySelector('.chart-bars');
        
        if (!chartBars) return;
        
        chartBars.innerHTML = '';
        
        const maxDistance = Math.max(...weeklyData.map(day => day.distance), 1);
        
        weeklyData.forEach(day => {
            const height = (day.distance / maxDistance) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${height}%`;
            bar.innerHTML = `
                <span class="bar-value">${day.distance.toFixed(1)}km</span>
                <span class="bar-label">${day.label}</span>
            `;
            chartBars.appendChild(bar);
        });
    }

    calculateWeeklyDistances() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const weeklyData = [];
        
        // Get the last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const dayDistance = this.filteredActivities
                .filter(activity => {
                    const activityDate = new Date(activity.startTime);
                    return activityDate >= dayStart && activityDate < dayEnd;
                })
                .reduce((total, activity) => total + activity.distance, 0);
            
            weeklyData.push({
                label: days[date.getDay()],
                distance: dayDistance
            });
        }
        
        return weeklyData;
    }

    updateTrends() {
        const trendInfo = document.querySelector('.trend-info');
        if (!trendInfo) return;
        
        const trends = this.calculateTrends();
        
        trendInfo.innerHTML = '';
        
        trends.forEach(trend => {
            const trendItem = document.createElement('div');
            trendItem.className = `trend-item ${trend.status}`;
            trendItem.innerHTML = `
                <span class="trend-label">${trend.label}</span>
                <span class="trend-value">${trend.value}</span>
                <span class="trend-change">${trend.change}</span>
            `;
            trendInfo.appendChild(trendItem);
        });
    }

    calculateTrends() {
        // This would typically compare with previous period data
        // For now, we'll use some realistic trends
        return [
            {
                label: '5K Pace',
                value: '8:24 /km',
                change: '-0:23',
                status: 'improving'
            },
            {
                label: '10K Pace',
                value: '8:45 /km',
                change: '+0:05',
                status: 'stable'
            },
            {
                label: 'Recovery Pace',
                value: '9:30 /km',
                change: '-0:15',
                status: 'improving'
            }
        ];
    }

    updateTrainingLoad() {
        const optimalRange = '35-50 km';
        const currentLoad = this.stats.monthlyDistance;
        
        // Calculate load percentage (simplified)
        const loadPercentage = Math.min((currentLoad / 50) * 100, 100);
        
        const meterFill = document.querySelector('.meter-fill');
        const loadStats = document.querySelectorAll('.load-stat .stat-value');
        
        if (meterFill) {
            meterFill.style.width = `${loadPercentage}%`;
        }
        
        if (loadStats[0]) {
            loadStats[0].textContent = `${currentLoad.toFixed(1)} km`;
        }
        
        if (loadStats[1]) {
            loadStats[1].textContent = optimalRange;
        }
    }

    updateAchievements() {
        const achievementsList = document.querySelector('.achievements-list');
        if (!achievementsList) return;
        
        const achievements = this.calculateAchievements();
        
        achievementsList.innerHTML = '';
        
        achievements.forEach(achievement => {
            const achievementItem = document.createElement('div');
            achievementItem.className = 'achievement-item';
            achievementItem.innerHTML = `
                <div class="achievement-icon">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                        ${achievement.icon}
                    </svg>
                </div>
                <div class="achievement-info">
                    <span class="achievement-title">${achievement.title}</span>
                    <span class="achievement-date">${achievement.date}</span>
                </div>
            `;
            achievementsList.appendChild(achievementItem);
        });
    }

    calculateAchievements() {
        // Calculate recent achievements based on activity data
        const achievements = [];
        
        // 5K Personal Best
        const fiveKActivities = this.activities
            .filter(a => a.distance >= 5 && a.distance < 10)
            .sort((a, b) => this.paceToSeconds(a.averagePace) - this.paceToSeconds(b.averagePace));
        
        if (fiveKActivities.length > 0) {
            const best5K = fiveKActivities[0];
            achievements.push({
                title: '5K Personal Best',
                date: this.formatDate(new Date(best5K.startTime)),
                icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
            });
        }
        
        // Monthly Goal
        if (this.stats.monthlyDistance >= 50) {
            achievements.push({
                title: '50km Monthly Goal',
                date: 'This Month',
                icon: '<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"/>'
            });
        }
        
        // Consistency
        const recentActivities = this.activities
            .filter(a => new Date(a.startTime) > new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
            .length;
        
        if (recentActivities >= 7) {
            achievements.push({
                title: '7 Days in 10',
                date: 'Recent',
                icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>'
            });
        }
        
        return achievements.slice(0, 3); // Return top 3 achievements
    }

    showActivityDetails(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (!activity) return;
        
        const modal = document.getElementById('activity-detail-modal');
        const modalBody = modal.querySelector('.modal-body');
        
        modalBody.innerHTML = this.createActivityDetailHTML(activity);
        modal.style.display = 'flex';
        
        // Setup close button
        modal.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
        };
    }

    createActivityDetailHTML(activity) {
        const activityDate = new Date(activity.startTime);
        
        return `
            <div class="activity-detail">
                <div class="detail-header">
                    <h3>${activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)} on ${this.formatDate(activityDate)}</h3>
                    <p>${this.formatTime(activityDate)} • ${activity.distance.toFixed(2)} km • ${this.formatDuration(activity.duration)}</p>
                </div>
                
                <div class="detail-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <span class="stat-value">${activity.averagePace}</span>
                            <span class="stat-label">Average Pace</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${activity.calories}</span>
                            <span class="stat-label">Calories</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${activity.steps}</span>
                            <span class="stat-label">Steps</span>
                        </div>
                    </div>
                </div>
                
                ${activity.splits.length > 0 ? `
                <div class="splits-section">
                    <h4>Split Times</h4>
                    <div class="splits-table">
                        ${activity.splits.map(split => `
                            <div class="split-row">
                                <span class="split-distance">${split.distance} km</span>
                                <span class="split-time">${split.time}</span>
                                <span class="split-pace">${split.pace}/km</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="map-section">
                    <h4>Route Map</h4>
                    <div class="detail-map" id="detail-map-${activity.id}">
                        <div class="map-loading">Loading map...</div>
                    </div>
                </div>
            </div>
        `;
    }

    loadMoreActivities() {
        // In a real app, this would load more activities from the server
        // For now, we'll just show a message
        this.showNotification('Loading more activities...');
        
        setTimeout(() => {
            this.showNotification('No more activities to load');
        }, 1000);
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

// Initialize the history manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.runningHistory = new RunningHistory();
});