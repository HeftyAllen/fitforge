// assets/js/onboarding.js
// Onboarding Flow Module for FitForge

let firebaseInitialized = false
let auth = null
let db = null
let firestore = null

async function ensureFirebaseInit() {
  if (firebaseInitialized && auth && db && firestore) {
    return { auth, db, firestore }
  }

  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js")
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")
    const { doc, setDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")

    // Check if Firebase is already initialized (by auth.js or another script)
    const existingApps = getApps()
    let app

    if (existingApps.length > 0) {
      app = existingApps[0]
      console.log("[v0] Using existing Firebase app")
    } else {
      const firebaseConfig = {
        apiKey: "AIzaSyClwU7qKNudqNYd5xCrULeu78pkApB9wfI",
        authDomain: "fitforge-b9ef3.firebaseapp.com",
        projectId: "fitforge-b9ef3",
        storageBucket: "fitforge-b9ef3.firebasestorage.app",
        messagingSenderId: "777782404602",
        appId: "1:777782404602:web:23c5be47f99cf66abdf043",
        measurementId: "G-XJL80KCWZL",
      }

      app = initializeApp(firebaseConfig)
      console.log("[v0] Firebase initialized in onboarding.js")
    }

    auth = getAuth(app)
    db = getFirestore(app)
    firestore = { doc, setDoc, getDoc }
    firebaseInitialized = true

    return { auth, db, firestore }
  } catch (error) {
    console.error("[v0] Firebase initialization error in onboarding:", error)
    throw error
  }
}

// ===== UTILITY FUNCTIONS =====

function showMessage(elementId, message, type = "success") {
  const messageElement = document.getElementById(elementId)
  if (messageElement) {
    messageElement.textContent = message
    messageElement.className = `form-message ${type}`
    messageElement.style.display = "block"

    setTimeout(() => {
      messageElement.style.display = "none"
    }, 5000)
  }
}

function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`)
  return Array.from(checkboxes).map((cb) => cb.value)
}

// ===== SAVE PROGRESS FUNCTIONS =====

async function saveStepToFirebase(stepNumber, stepData) {
  try {
    const { auth, db, firestore } = await ensureFirebaseInit()
    const user = auth.currentUser

    if (!user) {
      console.error("[v0] No authenticated user found")
      throw new Error("Not authenticated")
    }

    const updateData = {
      [`onboarding.step${stepNumber}`]: stepData,
      [`onboarding.step${stepNumber}CompletedAt`]: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { doc, setDoc } = firestore
    await setDoc(doc(db, "users", user.uid), updateData, { merge: true })

    console.log(`[v0] Step ${stepNumber} saved to Firebase`)
    return true
  } catch (error) {
    console.error(`[v0] Error saving step ${stepNumber} to Firebase:`, error)
    throw error
  }
}

// ===== STEP 1: GOALS & PREFERENCES =====

function handleStep1Submit(event) {
  event.preventDefault()

  const form = event.target
  const primaryGoal = form.querySelector('input[name="primaryGoal"]:checked')?.value
  const workoutDays = form.workoutDays.value
  const sessionLength = form.sessionLength.value
  const experienceLevel = form.experienceLevel.value
  const equipment = getCheckedValues("equipment")

  // Validation
  if (!primaryGoal) {
    showMessage("step1-msg", "Please select your primary fitness goal", "error")
    return
  }

  if (!workoutDays || !sessionLength || !experienceLevel) {
    showMessage("step1-msg", "Please complete all required fields", "error")
    return
  }

  if (equipment.length === 0) {
    showMessage("step1-msg", "Please select at least one equipment option", "error")
    return
  }

  const step1Data = {
    primaryGoal,
    workoutDays,
    sessionLength,
    experienceLevel,
    equipment,
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  submitBtn.disabled = true
  submitBtn.textContent = "Saving..."

  // Save to Firebase
  saveStepToFirebase(1, step1Data)
    .then(() => {
      showMessage("step1-msg", "Progress saved! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "onboarding-step2.html"
      }, 1000)
    })
    .catch((error) => {
      console.error("[v0] Error saving step 1:", error)
      showMessage("step1-msg", "Failed to save. Please try again.", "error")
      submitBtn.disabled = false
      submitBtn.textContent = "Save & Continue"
    })
}

function loadStep1Data() {
  // Placeholder for loadStep1Data function
}

// ===== STEP 2: NUTRITION =====

function calculateMacros() {
  const calorieInput = document.getElementById("calorieTarget")
  const macroSplitInput = document.getElementById("macroSplit")
  const macroPreview = document.getElementById("macro-preview")

  if (!calorieInput || !macroSplitInput || !macroPreview) return

  const calories = Number.parseInt(calorieInput.value) || 2000
  const split = macroSplitInput.value || "balanced"

  let proteinPct, carbsPct, fatPct

  switch (split) {
    case "high-protein":
      ;[proteinPct, carbsPct, fatPct] = [40, 40, 20]
      break
    case "low-carb":
      ;[proteinPct, carbsPct, fatPct] = [30, 20, 50]
      break
    case "high-carb":
      ;[proteinPct, carbsPct, fatPct] = [25, 55, 20]
      break
    case "keto":
      ;[proteinPct, carbsPct, fatPct] = [25, 5, 70]
      break
    case "balanced":
    default:
      ;[proteinPct, carbsPct, fatPct] = [30, 40, 30]
  }

  const protein = Math.round((calories * proteinPct) / 100 / 4)
  const carbs = Math.round((calories * carbsPct) / 100 / 4)
  const fat = Math.round((calories * fatPct) / 100 / 9)

  console.log("[v0] Macros calculated:", { calories, split, protein, carbs, fat })

  // Update preview
  const proteinItem = macroPreview.querySelector(".macro-item.protein")
  const carbsItem = macroPreview.querySelector(".macro-item.carbs")
  const fatItem = macroPreview.querySelector(".macro-item.fat")

  if (proteinItem) {
    proteinItem.querySelector(".macro-value").textContent = `${protein}g`
    proteinItem.querySelector(".macro-fill").style.width = `${proteinPct}%`
  }

  if (carbsItem) {
    carbsItem.querySelector(".macro-value").textContent = `${carbs}g`
    carbsItem.querySelector(".macro-fill").style.width = `${carbsPct}%`
  }

  if (fatItem) {
    fatItem.querySelector(".macro-value").textContent = `${fat}g`
    fatItem.querySelector(".macro-fill").style.width = `${fatPct}%`
  }
}

function handleStep2Submit(event) {
  event.preventDefault()

  console.log("[v0] Step 2 form submitted")

  const form = event.target
  const dietType = form.querySelector('input[name="dietType"]:checked')?.value
  const calorieTarget = form.calorieTarget.value
  const macroSplit = form.macroSplit.value
  const restrictions = getCheckedValues("restrictions")
  const otherRestrictions = form.otherRestrictions?.value || ""
  const mealTimes = getCheckedValues("mealTimes")
  const cookingTime = form.cookingTime?.value || "moderate"

  // Validation
  if (!dietType) {
    showMessage("step2-msg", "Please select your dietary style", "error")
    return
  }

  if (!calorieTarget || !macroSplit) {
    showMessage("step2-msg", "Please complete all required nutrition fields", "error")
    return
  }

  const step2Data = {
    dietType,
    calorieTarget,
    macroSplit,
    restrictions,
    otherRestrictions,
    mealTimes,
    cookingTime,
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  submitBtn.disabled = true
  submitBtn.textContent = "Saving..."

  // Save to Firebase
  saveStepToFirebase(2, step2Data)
    .then(() => {
      console.log("[v0] Step 2 data saved to Firebase, redirecting to step 3")
      showMessage("step2-msg", "Progress saved! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "onboarding-step3.html"
      }, 1000)
    })
    .catch((error) => {
      console.error("[v0] Error saving step 2:", error)
      showMessage("step2-msg", "Failed to save. Please try again.", "error")
      submitBtn.disabled = false
      submitBtn.textContent = "Save & Continue"
    })
}

function loadStep2Data() {
  // Placeholder for loadStep2Data function
}

// ===== STEP 3: HEALTH =====

function handleStep3Submit(event) {
  event.preventDefault()

  const form = event.target
  const conditions = getCheckedValues("conditions")
  const conditionDetails = form.conditionDetails?.value || ""
  const injuries = getCheckedValues("injuries")
  const injuryDetails = form.injuryDetails?.value || ""
  const mobilityLevel = form.mobilityLevel.value
  const accessibility = getCheckedValues("accessibility")
  const accessibilityNotes = form.accessibilityNotes?.value || ""
  const avoidExercises = getCheckedValues("avoidExercises")

  // Validation
  if (!mobilityLevel) {
    showMessage("step3-msg", "Please select your mobility level", "error")
    return
  }

  const step3Data = {
    conditions,
    conditionDetails,
    injuries,
    injuryDetails,
    mobilityLevel,
    accessibility,
    accessibilityNotes,
    avoidExercises,
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  submitBtn.disabled = true
  submitBtn.textContent = "Saving..."

  // Save to Firebase
  saveStepToFirebase(3, step3Data)
    .then(() => {
      showMessage("step3-msg", "Progress saved! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "onboarding-step4.html"
      }, 1000)
    })
    .catch((error) => {
      console.error("[v0] Error saving step 3:", error)
      showMessage("step3-msg", "Failed to save. Please try again.", "error")
      submitBtn.disabled = false
      submitBtn.textContent = "Save & Continue"
    })
}

function loadStep3Data() {
  // Placeholder for loadStep3Data function
}

// ===== STEP 4: COMPLETE PROFILE =====

async function handleStep4Submit(event) {
  event.preventDefault()

  const form = event.target
  const weight = form.weight.value
  const height = form.height.value
  const age = form.age.value
  const weeklyGoal = form.weekly_goal?.value || ""
  const neck = form.neck?.value || ""
  const waist = form.waist?.value || ""
  const hip = form.hip?.value || ""
  const consent = form.consent.checked

  // Validation
  if (!weight || !height || !age) {
    showMessage("step4-msg", "Please fill in all required measurements", "error")
    return
  }

  if (Number.parseInt(age) < 13) {
    showMessage("step4-msg", "You must be at least 13 years old to create an account", "error")
    return
  }

  if (!consent) {
    showMessage("step4-msg", "Please agree to the Terms of Service and Privacy Policy", "error")
    return
  }

  try {
    const submitBtn = form.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.textContent = "Completing setup..."

    const step4Data = {
      weight,
      height,
      age,
      weeklyGoal,
      neck,
      waist,
      hip,
    }

    const { auth, db, firestore } = await ensureFirebaseInit()
    const user = auth.currentUser

    if (!user) {
      showMessage("step4-msg", "Session expired. Please sign in again.", "error")
      setTimeout(() => {
        window.location.href = "auth-login.html"
      }, 2000)
      return
    }

    const { doc, setDoc } = firestore

    // Save step 4 data and mark onboarding as complete
    await setDoc(
      doc(db, "users", user.uid),
      {
        "onboarding.step4": step4Data,
        "onboarding.step4CompletedAt": new Date().toISOString(),
        "onboarding.completedAt": new Date().toISOString(),
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )

    console.log("[v0] Onboarding completed for user:", user.uid)

    showMessage("step4-msg", "Profile completed! Redirecting to your dashboard...", "success")

    setTimeout(() => {
      window.location.href = "home.html"
    }, 2000)
  } catch (error) {
    console.error("[v0] Error completing onboarding:", error)
    showMessage("step4-msg", "Failed to save your profile. Please try again.", "error")

    const submitBtn = form.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Finish & Start Using FitForge"
  }
}

function loadStep4Data() {
  // Placeholder for loadStep4Data function
}

// ===== INITIALIZE ONBOARDING PAGES =====

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Onboarding page loaded")

  const currentPage = window.location.pathname

  // Step 1: Goals
  if (currentPage.includes("step1")) {
    loadStep1Data()
    const goalsForm = document.getElementById("goals-form")
    if (goalsForm) {
      goalsForm.addEventListener("submit", handleStep1Submit)
    }
  }

  // Step 2: Nutrition
  if (currentPage.includes("step2")) {
    loadStep2Data()
    const nutritionForm = document.getElementById("nutrition-form")
    if (nutritionForm) {
      nutritionForm.addEventListener("submit", handleStep2Submit)

      const calorieInput = document.getElementById("calorieTarget")
      const macroSplitInput = document.getElementById("macroSplit")

      if (calorieInput) {
        calorieInput.addEventListener("input", calculateMacros)
        calorieInput.addEventListener("change", calculateMacros)
      }
      if (macroSplitInput) {
        macroSplitInput.addEventListener("change", calculateMacros)
      }

      // Initial calculation
      setTimeout(calculateMacros, 100)
    }
  }

  // Step 3: Health
  if (currentPage.includes("step3")) {
    loadStep3Data()
    const healthForm = document.getElementById("health-form")
    if (healthForm) {
      healthForm.addEventListener("submit", handleStep3Submit)
    }
  }

  // Step 4: Complete
  if (currentPage.includes("step4")) {
    loadStep4Data()
    const step4Form = document.getElementById("step4-form")
    if (step4Form) {
      step4Form.addEventListener("submit", handleStep4Submit)
    }
  }
})

window.saveProgress = () => {
  const currentPage = window.location.pathname

  if (currentPage.includes("step1")) {
    const form = document.getElementById("goals-form")
    if (form) {
      const data = {
        primaryGoal: form.querySelector('input[name="primaryGoal"]:checked')?.value,
        workoutDays: form.workoutDays.value,
        sessionLength: form.sessionLength.value,
        experienceLevel: form.experienceLevel.value,
        equipment: getCheckedValues("equipment"),
      }
      saveStepToFirebase(1, data)
        .then(() => {
          showMessage("step1-msg", "Progress saved!", "success")
        })
        .catch(() => {
          showMessage("step1-msg", "Failed to save progress", "error")
        })
    }
  } else if (currentPage.includes("step2")) {
    const form = document.getElementById("nutrition-form")
    if (form) {
      const data = {
        dietType: form.querySelector('input[name="dietType"]:checked')?.value,
        calorieTarget: form.calorieTarget.value,
        macroSplit: form.macroSplit.value,
        restrictions: getCheckedValues("restrictions"),
        otherRestrictions: form.otherRestrictions?.value,
        mealTimes: getCheckedValues("mealTimes"),
        cookingTime: form.cookingTime?.value,
      }
      saveStepToFirebase(2, data)
        .then(() => {
          showMessage("step2-msg", "Progress saved!", "success")
        })
        .catch(() => {
          showMessage("step2-msg", "Failed to save progress", "error")
        })
    }
  } else if (currentPage.includes("step3")) {
    const form = document.getElementById("health-form")
    if (form) {
      const data = {
        conditions: getCheckedValues("conditions"),
        conditionDetails: form.conditionDetails?.value,
        injuries: getCheckedValues("injuries"),
        injuryDetails: form.injuryDetails?.value,
        mobilityLevel: form.mobilityLevel.value,
        accessibility: getCheckedValues("accessibility"),
        accessibilityNotes: form.accessibilityNotes?.value,
        avoidExercises: getCheckedValues("avoidExercises"),
      }
      saveStepToFirebase(3, data)
        .then(() => {
          showMessage("step3-msg", "Progress saved!", "success")
        })
        .catch(() => {
          showMessage("step3-msg", "Failed to save progress", "error")
        })
    }
  } else if (currentPage.includes("step4")) {
    const form = document.getElementById("step4-form")
    if (form) {
      const data = {
        weight: form.weight.value,
        height: form.height.value,
        age: form.age.value,
        weeklyGoal: form.weekly_goal?.value,
        neck: form.neck?.value,
        waist: form.waist?.value,
        hip: form.hip?.value,
      }
      saveStepToFirebase(4, data)
        .then(() => {
          showMessage("step4-msg", "Progress saved!", "success")
        })
        .catch(() => {
          showMessage("step4-msg", "Failed to save progress", "error")
        })
    }
  }
}
