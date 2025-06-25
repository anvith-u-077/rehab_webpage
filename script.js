import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  sendEmailVerification 
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";



// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD-u1XOfV0bCl2UqXvFTwFPqJ1b1RKcX5U",
  authDomain: "login-form-f494d.firebaseapp.com",
  projectId: "login-form-f494d",
  storageBucket: "login-form-f494d.appspot.com",
  messagingSenderId: "617501226321",
  appId: "1:617501226321:web:09d45797628d5cb5b10f70",
  measurementId: "G-XNKX3VMV5L"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const getStartedBtn = document.getElementById("getStartedBtn");
  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  const welcomeName = document.getElementById("welcomeName");

  // Disable Get Started button immediately on page load
  if (getStartedBtn) {
    getStartedBtn.disabled = true;
    getStartedBtn.classList.add("disabled");
    getStartedBtn.onclick = null;
  }

  // Email validation function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    if (!emailRegex.test(email)) return false;

    const domain = email.split("@")[1].toLowerCase();
    return allowedDomains.includes(domain);
  }

  // Password validation function
  function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  }

  // Firebase auth state change listener to enable/disable Get Started button
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // If no user data found in Firestore, sign out and disable button
          await auth.signOut();
          if (getStartedBtn) {
            getStartedBtn.disabled = true;
            getStartedBtn.classList.add("disabled");
            getStartedBtn.onclick = null;
          }
          return;
        }

        const userData = userDocSnap.data();

        if (getStartedBtn) {
          getStartedBtn.disabled = false;
          getStartedBtn.classList.remove("disabled");
          getStartedBtn.onclick = () => {
            window.location.href = `main.html?uid=${user.uid}`;
          };
        }

        if (welcomeName) {
          welcomeName.textContent = userData.firstName || "User";
        }
      } catch {
        if (getStartedBtn) {
          getStartedBtn.disabled = true;
          getStartedBtn.classList.add("disabled");
          getStartedBtn.onclick = null;
        }
      }
    } else {
      if (getStartedBtn) {
        getStartedBtn.disabled = true;
        getStartedBtn.classList.add("disabled");
        getStartedBtn.onclick = null;
      }
    }
  });

  // Show success messages for signup/login
  const urlParams = new URLSearchParams(window.location.search);
  const isSignupSuccess = urlParams.get("signup") === "success";
  const isLoginSuccess = urlParams.get("login") === "success";

  if ((isSignupSuccess || isLoginSuccess) && successMessage && successText) {
    successText.textContent = isSignupSuccess
      ? "Sign Up Successful! 🎉 Welcome"
      : "Login Successful! 🎉 Welcome";
    successMessage.style.display = "block";

    setTimeout(() => {
      successMessage.style.display = "none";
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 5000);
  }

// Signup form logic
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signupemail").value.trim();
    const password = document.getElementById("signuppassword").value;
    const firstName = document.getElementById("signupname").value.trim();
    const dob = document.getElementById("signupdate").value.trim();

    if (!email || !password || !firstName || !dob) {
      alert("❗ Please fill in all the fields.");
      return;
    }

    // Basic password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("⚠️ Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.");
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        firstName,
        dob
      });

      // Send email verification
      await sendEmailVerification(user);

      alert("✅ Sign-up successful! A verification email has been sent to your inbox. Please verify before logging in.");

      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 4000);

    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("⚠️ This email is already registered. Please log in instead.");
      } else {
        console.error("Signup error:", error);
        alert("❌ Signup failed: " + error.message);
      }
    }
  });
}



  // Login form logic
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginemail").value.trim();
      const password = document.getElementById("loginpasscode").value;

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Invalid email format or unsupported domain.");
        return;
      }

      if (!isValidPassword(password)) {
        alert("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
        return;
      }

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "index.html?login=success";
      } catch (error) {
        alert("Login failed: " + error.message);
      }
    });
  }

  //forgot password logic
  // Forgot password logic with Firebase Auth email existence check
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = prompt("Please enter your registered email to reset your password:");

    if (!email) return alert("❗Email cannot be empty.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return alert("⚠️ Invalid email format.");
    }

    try {
      // Check if email exists in Firebase Auth via fetchSignInMethodsForEmail
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        alert("This email is not registered with us.");
        return;
      }

      await sendPasswordResetEmail(auth, email);
      alert(" Password reset email sent! Please check your inbox (including spam/promotions).");
    } catch (error) {
      console.error("Reset error:", error);
      alert("❌ Failed to send reset email: " + error.message);
    }
  });
}


// ✅ Floating login/signup prompt on index.html, 3 times only per visit
// Show floating login/signup prompt ONLY on index.html for non-logged-in users
// Show floating login/signup prompt ONLY on index.html
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  setTimeout(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        const floatPrompt = document.createElement("div");
        floatPrompt.textContent = "👉 Please login or sign up to get started!";
        floatPrompt.style.cssText = `
          position: fixed;
          top: 130px;
          right: 20px;
          background: #f0f8ff;
          padding: 12px 20px;
          border: 2px solid #2f5fad;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          font-family: 'Poppins', sans-serif;
          z-index: 999;
        `;
        document.body.appendChild(floatPrompt);

        setTimeout(() => {
          floatPrompt.remove();
        }, 5000);
      }
    });
  }, 5000);
}



});
