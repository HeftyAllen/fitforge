// Universal User Header Module
// Displays user name and avatar in the header across all pages

async function ensureFirebaseInit() {
  if (window.ensureFirebaseInit) {
    return await window.ensureFirebaseInit()
  }
  throw new Error("Firebase not initialized")
}

// Update user display in header
async function updateUserHeader() {
  try {
    const { auth, db } = await ensureFirebaseInit()
    const { onAuthStateChanged } = window.firebaseAuth
    const { doc, getDoc } = window.firestore

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("[v0] Updating header for user:", user.uid)

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data()
          const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User"

          // Update user name in header
          const userNameElement = document.querySelector(".user-name")
          if (userNameElement) {
            userNameElement.textContent = userName
          }

          // Update avatar if photoURL exists
          const avatarElement = document.querySelector(".user-avatar")
          if (avatarElement && userData.photoURL) {
            avatarElement.src = userData.photoURL
          }

          console.log("[v0] User header updated successfully")
        }
      } else {
        console.log("[v0] No user logged in")
      }
    })
  } catch (error) {
    console.error("[v0] Failed to update user header:", error)
  }
}

// Handle user menu dropdown toggle
function setupUserMenu() {
  const userBtn = document.querySelector(".user-btn")
  const userDropdown = document.querySelector(".user-dropdown")

  if (userBtn && userDropdown) {
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("show")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show")
    })
  }
}

// Handle sign out
async function handleSignOut(e) {
  e.preventDefault()

  try {
    const { auth } = await ensureFirebaseInit()
    await auth.signOut()

    console.log("[v0] User signed out successfully")

    // Clear any cached data
    localStorage.clear()

    // Redirect to login
    window.location.href = "auth-login.html"
  } catch (error) {
    console.error("[v0] Sign out error:", error)
    alert("Failed to sign out. Please try again.")
  }
}

// Setup sign out button
function setupSignOut() {
  const signOutLink = document.querySelector(".dropdown-item.text-danger")
  if (signOutLink) {
    signOutLink.addEventListener("click", handleSignOut)
  }
}

// Initialize header functionality
function initializeUserHeader() {
  console.log("[v0] Initializing user header...")

  updateUserHeader()
  setupUserMenu()
  setupSignOut()

  console.log("[v0] User header initialized")
}

// Run initialization when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeUserHeader)
} else {
  initializeUserHeader()
}

// Export for use in other modules
window.updateUserHeader = updateUserHeader
