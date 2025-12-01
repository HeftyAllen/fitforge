// assets/js/auth.js
// Firebase Authentication Module for FitForge

let auth = null
let db = null
let firebaseApp = null

// Initialize Firebase when the script loads
async function initializeFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js")
    const {
      getAuth,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signInWithPopup,
      GoogleAuthProvider,
      sendPasswordResetEmail,
      sendSignInLinkToEmail,
      isSignInWithEmailLink,
      signInWithEmailLink,
      onAuthStateChanged,
    } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js")
    const { getFirestore, doc, setDoc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
    )

    const firebaseConfig = {
      apiKey: "AIzaSyClwU7qKNudqNYd5xCrULeu78pkApB9wfI",
      authDomain: "fitforge-b9ef3.firebaseapp.com",
      projectId: "fitforge-b9ef3",
      storageBucket: "fitforge-b9ef3.firebasestorage.app",
      messagingSenderId: "777782404602",
      appId: "1:777782404602:web:23c5be47f99cf66abdf043",
      measurementId: "G-XJL80KCWZL",
    }

    firebaseApp = initializeApp(firebaseConfig)
    auth = getAuth(firebaseApp)
    db = getFirestore(firebaseApp)

    console.log("[v0] Firebase initialized successfully")

    window.firebaseAuth = {
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signInWithPopup,
      GoogleAuthProvider,
      sendPasswordResetEmail,
      sendSignInLinkToEmail,
      isSignInWithEmailLink,
      signInWithEmailLink,
      onAuthStateChanged,
    }

    window.firestore = {
      doc,
      setDoc,
      getDoc,
    }

    return { auth, db }
  } catch (error) {
    console.error("[v0] Firebase initialization error:", error)
    throw error
  }
}

const firebaseInitPromise = initializeFirebase()

async function ensureFirebaseInit() {
  if (!auth || !db) {
    await firebaseInitPromise
  }
  return { auth, db }
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId)
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = "block"
  }
}

function clearErrors() {
  const errorElements = document.querySelectorAll(".form-error")
  errorElements.forEach((el) => {
    el.textContent = ""
    el.style.display = "none"
  })
}

function showMessage(message, type = "success") {
  const messageDiv = document.createElement("div")
  messageDiv.className = `form-message ${type}`
  messageDiv.textContent = message
  messageDiv.style.cssText =
    "position: fixed; top: 20px; right: 20px; padding: 1rem; border-radius: 8px; z-index: 9999;"
  document.body.appendChild(messageDiv)

  setTimeout(() => {
    messageDiv.remove()
  }, 4000)
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePassword(password) {
  return password.length >= 8
}

function updatePasswordStrength(password) {
  const strengthFill = document.getElementById("strength-fill")
  const strengthText = document.getElementById("strength-text")

  if (!strengthFill || !strengthText) return

  let strength = 0
  if (password.length >= 8) strength++
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
  if (password.match(/[0-9]/)) strength++
  if (password.match(/[^a-zA-Z0-9]/)) strength++

  const strengthLevels = ["Weak", "Fair", "Good", "Strong"]
  const widths = ["25%", "50%", "75%", "100%"]
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#059669"]

  strengthFill.style.width = widths[strength - 1] || "0%"
  strengthFill.style.backgroundColor = colors[strength - 1] || "#ef4444"
  strengthText.textContent = strengthLevels[strength - 1] || "Weak"
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll(".password-toggle")

  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.previousElementSibling
      const type = input.getAttribute("type") === "password" ? "text" : "password"
      input.setAttribute("type", type)

      const svg = this.querySelector("svg")
      if (type === "text") {
        svg.innerHTML =
          '<path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
      } else {
        svg.innerHTML =
          '<path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>'
      }
    })
  })
}

async function handleLogin(event) {
  event.preventDefault()
  clearErrors()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const remember = document.getElementById("remember")?.checked

  if (!validateEmail(email)) {
    showError("email-error", "Please enter a valid email address")
    return
  }

  if (!password) {
    showError("password-error", "Please enter your password")
    return
  }

  try {
    const { auth } = await ensureFirebaseInit()
    const { signInWithEmailAndPassword } = window.firebaseAuth

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.textContent = "Signing in..."

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("[v0] User signed in:", userCredential.user.uid)

    if (remember) {
      localStorage.setItem("fitforge_remember", "true")
    }

    showMessage("Successfully signed in!", "success")

    const { db } = await ensureFirebaseInit()
    const { doc, getDoc } = window.firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

    setTimeout(() => {
      if (userDoc.exists() && userDoc.data().onboardingComplete) {
        window.location.href = "home.html"
      } else {
        window.location.href = "onboarding-step1.html"
      }
    }, 1000)
  } catch (error) {
    console.error("[v0] Login error:", error)
    let errorMessage = "Failed to sign in. Please try again."

    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email."
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Incorrect password."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address."
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "This account has been disabled."
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later."
    }

    showError("email-error", errorMessage)

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Sign In to Your Account"
  }
}

async function handleSignup(event) {
  event.preventDefault()
  clearErrors()

  const firstName = document.getElementById("firstName").value
  const lastName = document.getElementById("lastName").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const terms = document.getElementById("terms").checked
  const newsletter = document.getElementById("newsletter")?.checked

  if (!firstName || !lastName) {
    showError("firstName-error", "Please enter your name")
    return
  }

  if (!validateEmail(email)) {
    showError("email-error", "Please enter a valid email address")
    return
  }

  if (!validatePassword(password)) {
    showError("password-error", "Password must be at least 8 characters")
    return
  }

  if (password !== confirmPassword) {
    showError("confirmPassword-error", "Passwords do not match")
    return
  }

  if (!terms) {
    showError("terms-error", "You must agree to the Terms of Service")
    return
  }

  try {
    const { auth, db } = await ensureFirebaseInit()
    const { createUserWithEmailAndPassword } = window.firebaseAuth
    const { doc, setDoc } = window.firestore

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.textContent = "Creating account..."

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("[v0] User created:", userCredential.user.uid)

    // Create Firestore user document immediately with basic info
    await setDoc(doc(db, "users", userCredential.user.uid), {
      firstName,
      lastName,
      email,
      newsletter: newsletter || false,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log("[v0] Initial Firestore document created")

    showMessage("Account created! Redirecting to onboarding...", "success")

    setTimeout(() => {
      window.location.href = "onboarding-step1.html"
    }, 1500)
  } catch (error) {
    console.error("[v0] Signup error:", error)
    let errorMessage = "Failed to create account. Please try again."

    if (error.code === "auth/email-already-in-use") {
      errorMessage = "An account with this email already exists."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address."
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Use at least 8 characters."
    }

    showError("email-error", errorMessage)

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Create Account & Start Journey"
  }
}

async function socialLogin(provider) {
  if (provider !== "google") {
    showMessage("Apple sign-in coming soon!", "info")
    return
  }

  try {
    const { auth, db } = await ensureFirebaseInit()
    const { signInWithPopup, GoogleAuthProvider } = window.firebaseAuth
    const { doc, setDoc, getDoc } = window.firestore

    const googleProvider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, googleProvider)

    console.log("[v0] Google sign-in successful:", result.user.uid)

    const userDoc = await getDoc(doc(db, "users", result.user.uid))

    if (!userDoc.exists()) {
      // New Google user - create Firestore document immediately
      const names = result.user.displayName?.split(" ") || ["", ""]

      await setDoc(doc(db, "users", result.user.uid), {
        firstName: names[0],
        lastName: names.slice(1).join(" "),
        email: result.user.email,
        photoURL: result.user.photoURL,
        provider: "google",
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      console.log("[v0] Firestore document created for new Google user")

      showMessage("Welcome! Let's complete your profile...", "success")
      setTimeout(() => {
        window.location.href = "onboarding-step1.html"
      }, 1500)
    } else {
      showMessage("Welcome back!", "success")
      setTimeout(() => {
        if (userDoc.data().onboardingComplete) {
          window.location.href = "home.html"
        } else {
          window.location.href = "onboarding-step1.html"
        }
      }, 1000)
    }
  } catch (error) {
    console.error("[v0] Google sign-in error:", error)
    if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
      showMessage("Failed to sign in with Google. Please try again.", "error")
    }
  }
}

async function socialSignup(provider) {
  await socialLogin(provider)
}

async function handleForgotPassword(event) {
  event.preventDefault()
  clearErrors()

  const email = document.getElementById("email").value

  if (!validateEmail(email)) {
    showError("email-error", "Please enter a valid email address")
    return
  }

  try {
    const { auth } = await ensureFirebaseInit()
    const { sendPasswordResetEmail } = window.firebaseAuth

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.textContent = "Sending..."

    await sendPasswordResetEmail(auth, email)

    console.log("[v0] Password reset email sent to:", email)

    document.getElementById("sent-email").textContent = email
    document.querySelector(".form-group").style.display = "none"
    document.querySelector('button[type="submit"]').style.display = "none"
    document.getElementById("success-state").style.display = "block"
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    let errorMessage = "Failed to send reset link. Please try again."

    if (error.code === "auth/user-not-found") {
      errorMessage = "No account found with this email address."
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address."
    }

    showError("email-error", errorMessage)

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Send Reset Link"
  }
}

function resetForm() {
  document.querySelector(".form-group").style.display = "block"
  document.querySelector('button[type="submit"]').style.display = "block"
  document.getElementById("success-state").style.display = "none"
  document.getElementById("email").value = ""
}

async function handleSendMagicLink(event) {
  event.preventDefault()
  clearErrors()

  const email = document.getElementById("email").value

  if (!validateEmail(email)) {
    showError("email-error", "Please enter a valid email address")
    return
  }

  try {
    const { auth } = await ensureFirebaseInit()
    const { sendSignInLinkToEmail } = window.firebaseAuth

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = true
    submitBtn.textContent = "Sending..."

    const actionCodeSettings = {
      url: window.location.origin + "/auth-magic-link.html",
      handleCodeInApp: true,
    }

    await sendSignInLinkToEmail(auth, email, actionCodeSettings)

    localStorage.setItem("emailForSignIn", email)

    console.log("[v0] Magic link sent to:", email)

    document.getElementById("sent-magic-email").textContent = email
    document.querySelector("#send-magic-form .form-group").style.display = "none"
    document.querySelector('#send-magic-form button[type="submit"]').style.display = "none"
    document.getElementById("send-success").style.display = "block"
  } catch (error) {
    console.error("[v0] Magic link error:", error)
    showError("email-error", "Failed to send magic link. Please try again.")

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Send Magic Link"
  }
}

async function handleVerifyMagicLink(event) {
  event.preventDefault()
  clearErrors()

  const token = document.getElementById("token").value

  if (!token) {
    showError("token-error", "Please enter your magic link or token")
    return
  }

  try {
    const { auth, db } = await ensureFirebaseInit()
    const { isSignInWithEmailLink, signInWithEmailLink } = window.firebaseAuth
    const { doc, getDoc } = window.firestore

    let email = localStorage.getItem("emailForSignIn")
    if (!email) {
      email = prompt("Please provide your email for confirmation")
    }

    if (isSignInWithEmailLink(auth, token) || isSignInWithEmailLink(auth, window.location.href)) {
      const submitBtn = event.target.querySelector('button[type="submit"]')
      submitBtn.disabled = true
      submitBtn.textContent = "Verifying..."

      const result = await signInWithEmailLink(auth, email, token.includes("http") ? token : window.location.href)

      localStorage.removeItem("emailForSignIn")

      console.log("[v0] Magic link verified:", result.user.uid)

      document.querySelector("#verify-magic-form .form-group").style.display = "none"
      document.querySelector('#verify-magic-form button[type="submit"]').style.display = "none"
      document.getElementById("verify-success").style.display = "block"

      setTimeout(() => {
        if (result.user.uid) {
          window.location.href = "home.html"
        } else {
          window.location.href = "onboarding-step1.html"
        }
      }, 2000)
    } else {
      showError("token-error", "Invalid or expired magic link")
    }
  } catch (error) {
    console.error("[v0] Magic link verification error:", error)
    showError("token-error", "Failed to verify magic link. Please try again.")

    const submitBtn = event.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.textContent = "Verify & Sign In"
  }
}

function resetSendForm() {
  document.querySelector("#send-magic-form .form-group").style.display = "block"
  document.querySelector('#send-magic-form button[type="submit"]').style.display = "block"
  document.getElementById("send-success").style.display = "none"
  document.getElementById("email").value = ""
}

async function checkForMagicLink() {
  try {
    const { auth } = await ensureFirebaseInit()
    const { isSignInWithEmailLink } = window.firebaseAuth

    if (isSignInWithEmailLink(auth, window.location.href)) {
      console.log("[v0] Magic link detected in URL")
      const email = localStorage.getItem("emailForSignIn")
      if (email) {
        document.getElementById("token").value = window.location.href
        const verifyForm = document.getElementById("verify-magic-form")
        if (verifyForm) {
          handleVerifyMagicLink({ preventDefault: () => {}, target: verifyForm })
        }
      }
    }
  } catch (error) {
    console.error("[v0] Magic link check error:", error)
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[v0] Auth page loaded")

  setupPasswordToggles()

  const passwordInput = document.getElementById("password")
  if (passwordInput && document.getElementById("strength-fill")) {
    passwordInput.addEventListener("input", (e) => {
      updatePasswordStrength(e.target.value)
    })
  }

  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  const signupForm = document.getElementById("signup-form")
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup)
  }

  const forgotForm = document.getElementById("forgot-form")
  if (forgotForm) {
    forgotForm.addEventListener("submit", handleForgotPassword)
  }

  const sendMagicForm = document.getElementById("send-magic-form")
  if (sendMagicForm) {
    sendMagicForm.addEventListener("submit", handleSendMagicLink)
  }

  const verifyMagicForm = document.getElementById("verify-magic-form")
  if (verifyMagicForm) {
    verifyMagicForm.addEventListener("submit", handleVerifyMagicLink)
  }

  if (window.location.pathname.includes("magic-link")) {
    checkForMagicLink()
  }

  window.socialLogin = socialLogin
  window.socialSignup = socialSignup
  window.resetForm = resetForm
  window.resetSendForm = resetSendForm
  window.ensureFirebaseInit = ensureFirebaseInit
  window.getAuth = () => auth
  window.getDb = () => db
})
