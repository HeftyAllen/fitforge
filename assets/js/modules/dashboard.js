// Dashboard Module for FitForge
// Handles personalized greetings, stats, and dashboard functionality

async function ensureFirebaseInit() {
  if (window.ensureFirebaseInit) {
    return await window.ensureFirebaseInit()
  }
  throw new Error("Firebase not initialized")
}

// Array of unique welcome messages
const welcomeMessages = [
  "Ready to crush your fitness goals today?",
  "Let's make today count on your fitness journey!",
  "Time to push your limits and achieve greatness!",
  "Your future self will thank you for today's effort!",
  "Every workout brings you closer to your dreams!",
  "Let's turn your goals into reality, one rep at a time!",
]

// Get a random welcome message
function getRandomWelcomeMessage() {
  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
}

// Check if user is authenticated and has completed onboarding
async function checkAuthentication() {
  try {
    const { auth, db } = await ensureFirebaseInit()
    const { onAuthStateChanged } = window.firebaseAuth
    const { doc, getDoc } = window.firestore

    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log("[v0] User authenticated:", user.uid)

          // Check if onboarding is complete
          const userDoc = await getDoc(doc(db, "users", user.uid))

          if (!userDoc.exists() || !userDoc.data().onboardingComplete) {
            console.log("[v0] Onboarding not complete, redirecting...")
            window.location.href = "onboarding-step1.html"
            reject(new Error("Onboarding not complete"))
            return
          }

          resolve({ user, userData: userDoc.data() })
        } else {
          console.log("[v0] User not authenticated, redirecting to login")
          window.location.href = "auth-login.html"
          reject(new Error("Not authenticated"))
        }
      })
    })
  } catch (error) {
    console.error("[v0] Authentication check failed:", error)
    window.location.href = "auth-login.html"
    throw error
  }
}

// Update welcome section with personalized greeting
function updateWelcomeSection(userData) {
  const welcomeTitle = document.querySelector(".welcome-content h1")
  const welcomeText = document.querySelector(".welcome-content p")

  if (welcomeTitle && userData.firstName) {
    welcomeTitle.textContent = `Welcome back, ${userData.firstName}!`
  }

  if (welcomeText) {
    welcomeText.textContent = getRandomWelcomeMessage()
  }

  console.log("[v0] Welcome section updated with user data")
}

// Calculate and display basic stats (placeholder for now)
function updateDashboardStats(userData) {
  // Since we don't have workout/progress data yet, we'll show basic onboarding-based info
  const streakValue = document.querySelector(".stat-card:nth-child(1) .stat-value")
  const workoutsValue = document.querySelector(".stat-card:nth-child(2) .stat-value")
  const progressValue = document.querySelector(".stat-card:nth-child(3) .stat-value")

  // Default placeholder values
  if (streakValue) streakValue.textContent = "1"
  if (workoutsValue) workoutsValue.textContent = "0"
  if (progressValue) progressValue.textContent = "0%"

  console.log("[v0] Dashboard stats updated")
}

// Update nutrition card with user's targets
function updateNutritionCard(userData) {
  const caloriesTotal = document.querySelector(".calories-total")

  if (caloriesTotal && userData.onboarding?.step2?.calorieTarget) {
    const target = userData.onboarding.step2.calorieTarget
    caloriesTotal.textContent = `/ ${target} cal`
  }

  console.log("[v0] Nutrition card updated")
}

// Update today's workout based on user's plan
function updateTodaysWorkout(userData) {
  const workoutType = document.querySelector(".workout-type")
  const workoutDuration = document.querySelector(".workout-duration")

  if (userData.onboarding?.step1) {
    const { experienceLevel, sessionLength } = userData.onboarding.step1

    if (workoutType) {
      // Default workout based on experience level
      const workouts = {
        beginner: "Full Body Workout",
        intermediate: "Upper Body Strength",
        advanced: "Advanced Split Training",
      }
      workoutType.textContent = workouts[experienceLevel] || "Recommended Workout"
    }

    if (workoutDuration) {
      const levels = {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
      }
      workoutDuration.textContent = `${sessionLength} min • ${levels[experienceLevel]}`
    }
  }

  console.log("[v0] Today's workout updated")
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    console.log("[v0] Initializing dashboard...")

    const { user, userData } = await checkAuthentication()

    // Update all dashboard sections with user data
    updateWelcomeSection(userData)
    updateDashboardStats(userData)
    updateNutritionCard(userData)
    updateTodaysWorkout(userData)

    console.log("[v0] Dashboard initialized successfully")
  } catch (error) {
    console.error("[v0] Failed to initialize dashboard:", error)
  }
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard)
} else {
  initializeDashboard()
}
