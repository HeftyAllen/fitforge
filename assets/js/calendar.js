// calendar.js - Workout Calendar Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    let calendar;
    let currentView = 'month';
    
    // Sample workout data
    const workoutData = [
        {
            id: 1,
            title: 'Full Body Strength',
            start: new Date(new Date().setHours(18, 0, 0, 0)),
            end: new Date(new Date().setHours(18, 45, 0, 0)),
            type: 'strength',
            duration: '45 min',
            difficulty: 'intermediate',
            description: 'Compound movements for overall strength development',
            exercises: [
                { name: 'Barbell Squat', sets: '3×8', icon: '🏋️' },
                { name: 'Bench Press', sets: '3×8', icon: '💪' },
                { name: 'Bent-over Rows', sets: '3×10', icon: '🚣' },
                { name: 'Overhead Press', sets: '3×10', icon: '⬆️' },
                { name: 'Deadlifts', sets: '3×5', icon: '🔗' }
            ],
            sets: 5,
            exerciseCount: 5,
            estimatedCalories: 320
        },
        {
            id: 2,
            title: 'HIIT Cardio',
            start: new Date(new Date().setDate(new Date().getDate() + 1)),
            end: new Date(new Date().setDate(new Date().getDate() + 1)),
            type: 'hiit',
            duration: '30 min',
            difficulty: 'beginner',
            description: 'High-intensity intervals for maximum calorie burn',
            exercises: [
                { name: 'Jumping Jacks', sets: '4×30s', icon: '🌟' },
                { name: 'Burpees', sets: '4×30s', icon: '🔥' },
                { name: 'Mountain Climbers', sets: '4×30s', icon: '⛰️' },
                { name: 'High Knees', sets: '4×30s', icon: '🦵' }
            ],
            sets: 4,
            exerciseCount: 4,
            estimatedCalories: 280
        },
        {
            id: 3,
            title: 'Upper Body Strength',
            start: new Date(new Date().setDate(new Date().getDate() + 2)),
            end: new Date(new Date().setDate(new Date().getDate() + 2)),
            type: 'strength',
            duration: '60 min',
            difficulty: 'advanced',
            description: 'Focus on chest, back, and shoulder muscle growth',
            exercises: [
                { name: 'Incline Bench Press', sets: '4×8', icon: '💪' },
                { name: 'Pull-ups', sets: '4×10', icon: '🧗' },
                { name: 'Dumbbell Shoulder Press', sets: '4×10', icon: '⬆️' },
                { name: 'Barbell Rows', sets: '4×8', icon: '🚣' },
                { name: 'Dips', sets: '4×12', icon: '🔽' }
            ],
            sets: 5,
            exerciseCount: 5,
            estimatedCalories: 380
        },
        {
            id: 4,
            title: 'Yoga & Mobility',
            start: new Date(new Date().setDate(new Date().getDate() + 3)),
            end: new Date(new Date().setDate(new Date().getDate() + 3)),
            type: 'yoga',
            duration: '40 min',
            difficulty: 'beginner',
            description: 'Improve flexibility and recovery',
            exercises: [
                { name: 'Sun Salutations', sets: '5 rounds', icon: '☀️' },
                { name: 'Warrior Poses', sets: '3×30s', icon: '⚔️' },
                { name: 'Hip Openers', sets: '3×30s', icon: '🕊️' }
            ],
            sets: 3,
            exerciseCount: 3,
            estimatedCalories: 180
        },
        {
            id: 5,
            title: 'Leg Day Power',
            start: new Date(new Date().setDate(new Date().getDate() + 4)),
            end: new Date(new Date().setDate(new Date().getDate() + 4)),
            type: 'strength',
            duration: '75 min',
            difficulty: 'intermediate',
            description: 'Build lower body strength and muscle mass',
            exercises: [
                { name: 'Barbell Squats', sets: '4×8', icon: '🏋️' },
                { name: 'Romanian Deadlifts', sets: '4×10', icon: '🔗' },
                { name: 'Leg Press', sets: '4×12', icon: '🦵' },
                { name: 'Walking Lunges', sets: '3×20', icon: '🚶' }
            ],
            sets: 4,
            exerciseCount: 4,
            estimatedCalories: 420
        }
    ];

    // Initialize calendar
    function initCalendar() {
        const calendarEl = document.getElementById('calendar');
        
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: false,
            height: 'auto',
            aspectRatio: 1.5,
            dayMaxEvents: 3,
            events: workoutData.map(workout => ({
                id: workout.id,
                title: workout.title,
                start: workout.start,
                end: workout.end,
                extendedProps: {
                    type: workout.type,
                    duration: workout.duration,
                    difficulty: workout.difficulty,
                    description: workout.description,
                    exercises: workout.exercises,
                    sets: workout.sets,
                    exerciseCount: workout.exerciseCount,
                    estimatedCalories: workout.estimatedCalories
                },
                className: `workout-event ${workout.type}`,
                backgroundColor: getWorkoutColor(workout.type)
            })),
            eventClick: function(info) {
                showWorkoutModal(info.event);
            },
            dateClick: function(info) {
                // Optional: Add workout on date click
                // quickAddWorkout(info.dateStr);
            },
            eventDidMount: function(info) {
                // Add tooltip with workout details
                info.el.setAttribute('title', `${info.event.title} - ${info.event.extendedProps.duration}`);
            }
        });

        calendar.render();
        updateCurrentPeriod();
    }

    // Get workout color based on type
    function getWorkoutColor(type) {
        const colors = {
            strength: '#3b82f6',
            cardio: '#10b981',
            hiit: '#ef4444',
            yoga: '#f59e0b',
            rest: '#6b7280'
        };
        return colors[type] || '#3b82f6';
    }

    // Update current period display
    function updateCurrentPeriod() {
        const currentDate = calendar.getDate();
        const periodElement = document.getElementById('current-period');
        
        if (currentView === 'month') {
            periodElement.textContent = currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
        } else if (currentView === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            periodElement.textContent = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (currentView === 'day') {
            periodElement.textContent = currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
    }

    // Show workout modal
    function showWorkoutModal(event) {
        const modal = document.getElementById('workout-modal');
        const extendedProps = event.extendedProps;
        
        // Populate modal content
        document.getElementById('modal-workout-title').textContent = event.title;
        document.getElementById('modal-duration').textContent = extendedProps.duration;
        document.getElementById('modal-difficulty').textContent = extendedProps.difficulty;
        document.getElementById('modal-date').textContent = event.start.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('modal-description').textContent = extendedProps.description;
        document.getElementById('modal-sets').textContent = extendedProps.sets;
        document.getElementById('modal-exercise-count').textContent = extendedProps.exerciseCount;
        document.getElementById('modal-estimated-calories').textContent = extendedProps.estimatedCalories;
        
        // Populate exercises
        const exercisesContainer = document.getElementById('modal-exercises');
        exercisesContainer.innerHTML = extendedProps.exercises.map(exercise => `
            <div class="exercise-item">
                <div class="exercise-icon">${exercise.icon}</div>
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-sets">${exercise.sets}</div>
                </div>
            </div>
        `).join('');
        
        // Set up modal buttons
        document.getElementById('modal-edit-btn').onclick = () => {
            window.location.href = `workout-builder.html?workout=${event.id}`;
        };
        
        document.getElementById('modal-start-btn').onclick = () => {
            window.location.href = `player.html?workout=${event.id}`;
        };
        
        // Show modal
        modal.classList.add('active');
    }

    // Event Listeners
    function setupEventListeners() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.dataset.view;
                switchView(view);
                
                // Update active state
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Navigation controls
        document.getElementById('prev-period').addEventListener('click', () => {
            calendar.prev();
            updateCurrentPeriod();
        });
        
        document.getElementById('next-period').addEventListener('click', () => {
            calendar.next();
            updateCurrentPeriod();
        });
        
        document.getElementById('today-btn').addEventListener('click', () => {
            calendar.today();
            updateCurrentPeriod();
        });
        
        // Modal controls
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
        // Quick actions
        document.getElementById('quick-add-workout').addEventListener('click', () => {
            window.location.href = 'workout-builder.html';
        });
        
        document.getElementById('quick-rest-day').addEventListener('click', () => {
            addRestDay();
        });
        
        document.getElementById('quick-share-plan').addEventListener('click', () => {
            shareWorkoutPlan();
        });
        
        // Start workout buttons
        document.querySelectorAll('.start-workout').forEach(btn => {
            btn.addEventListener('click', function() {
                const workoutId = this.dataset.workout;
                window.location.href = `player.html?workout=${workoutId}`;
            });
        });
        
        // Edit workout buttons
        document.querySelectorAll('.edit-workout').forEach(btn => {
            btn.addEventListener('click', function() {
                const workoutId = this.dataset.workout;
                window.location.href = `workout-builder.html?workout=${workoutId}`;
            });
        });
        
        // Sync and export
        document.getElementById('sync-calendar').addEventListener('click', syncCalendar);
        document.getElementById('export-calendar').addEventListener('click', exportCalendar);
        
        // Keyboard events
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    // Switch calendar view
    function switchView(view) {
        currentView = view;
        calendar.changeView(getFullCalendarView(view));
        updateCurrentPeriod();
    }
    
    // Map view names to FullCalendar views
    function getFullCalendarView(view) {
        const viewMap = {
            month: 'dayGridMonth',
            week: 'timeGridWeek',
            day: 'timeGridDay',
            list: 'listWeek'
        };
        return viewMap[view] || 'dayGridMonth';
    }
    
    // Close modal
    function closeModal() {
        document.getElementById('workout-modal').classList.remove('active');
    }
    
    // Add rest day
    function addRestDay() {
        const today = new Date();
        const restEvent = {
            id: 'rest-' + Date.now(),
            title: 'Rest Day',
            start: today,
            end: today,
            type: 'rest',
            className: 'workout-event rest'
        };
        
        calendar.addEvent(restEvent);
        
        // Show confirmation
        showNotification('Rest day added to your calendar!', 'success');
    }
    
    // Share workout plan
    function shareWorkoutPlan() {
        if (navigator.share) {
            navigator.share({
                title: 'My FitForge Workout Plan',
                text: 'Check out my workout schedule on FitForge!',
                url: window.location.href
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Calendar link copied to clipboard!', 'success');
            });
        }
    }
    
    // Sync calendar (placeholder)
    function syncCalendar() {
        showNotification('Syncing calendar with external services...', 'info');
        // In a real app, this would sync with Google Calendar, Apple Calendar, etc.
        setTimeout(() => {
            showNotification('Calendar synced successfully!', 'success');
        }, 2000);
    }
    
    // Export calendar (placeholder)
    function exportCalendar() {
        showNotification('Exporting calendar data...', 'info');
        // In a real app, this would export to CSV, PDF, or other formats
        setTimeout(() => {
            showNotification('Calendar exported successfully!', 'success');
        }, 1500);
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;
        
        // Add styles
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--surface-primary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: var(--space-3);
                    box-shadow: var(--shadow-lg);
                    z-index: var(--z-tooltip);
                    max-width: 300px;
                    animation: slideInRight 0.3s ease-out;
                }
                .notification-success {
                    border-left: 4px solid var(--success-500);
                }
                .notification-info {
                    border-left: 4px solid var(--primary-500);
                }
                .notification-error {
                    border-left: 4px solid var(--error-500);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: var(--space-3);
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: var(--text-lg);
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    // Initialize everything
    function init() {
        initCalendar();
        setupEventListeners();
        
        // Add slideOutRight animation for notifications
        if (!document.querySelector('#notification-animations')) {
            const animations = document.createElement('style');
            animations.id = 'notification-animations';
            animations.textContent = `
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(animations);
        }
    }
    
    // Start the application
    init();
});