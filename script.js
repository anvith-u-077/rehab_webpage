console.log("✅ script.js loaded");

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

  if (getStartedBtn) {
    getStartedBtn.disabled = true;
    getStartedBtn.style.display = "none";
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    if (!emailRegex.test(email)) return false;
    const domain = email.split("@")[1].toLowerCase();
    return allowedDomains.includes(domain);
  }

  function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordRegex.test(password);
  }

  // ✅ Enable Get Started button for verified users
  onAuthStateChanged(auth, async (user) => {
    const getStartedBtn = document.getElementById("getStartedBtn");
    if (!getStartedBtn) return;

    if (user && user.emailVerified) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          getStartedBtn.disabled = false;
          getStartedBtn.style.display = "inline-block";
          getStartedBtn.classList.remove("disabled");
          getStartedBtn.onclick = () => {
            window.location.href = `main.html?uid=${user.uid}`;
          };
        } else {
          await auth.signOut();
          getStartedBtn.disabled = true;
          getStartedBtn.style.display = "none";
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        getStartedBtn.disabled = true;
        getStartedBtn.style.display = "none";
      }
    } else {
      getStartedBtn.disabled = true;
      getStartedBtn.style.display = "none";
    }
  });

  // ✅ Show success message
  const urlParams = new URLSearchParams(window.location.search);
const isSignupSuccess = urlParams.get("signup") === "success";
const isLoginSuccess = urlParams.get("login") === "success";

if ((isSignupSuccess || isLoginSuccess) && successMessage && successText) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let name = "User";

        if (userDocSnap.exists()) {
          name = userDocSnap.data().firstName || "User";
        }

        successText.textContent = isSignupSuccess
          ? `Sign Up Successful! 🎉 Welcome, ${name}`
          : `Login Successful! 🎉 Welcome back, ${name}`;
        successMessage.style.display = "block";

        setTimeout(() => {
          successMessage.style.display = "none";
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 5000);
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    }
  });
}


  // ✅ Signup logic
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

      if (!isValidPassword(password)) {
        alert("⚠️ Password must include uppercase, lowercase, number, special character, and be at least 8 characters long.");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          email,
          firstName,
          dob
        });

        await sendEmailVerification(user);
        alert("✅ Sign-up successful! A verification email has been sent. Please verify before logging in.");

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

  // ✅ Login logic
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

  // ✅ Forgot Password
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault();
      let email = prompt("Please enter your registered email to reset your password:");
      if (!email) return alert("❗Email cannot be empty.");

      email = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return alert("⚠️ Invalid email format.");

      try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length === 0) {
          alert("⚠️ This email is not registered with us.");
          return;
        }

        await sendPasswordResetEmail(auth, email);
        alert("✅ Password reset email sent! Please check your inbox.");
      } catch (error) {
        console.error("❌ Reset error:", error);
        alert("❌ Failed to send reset email: " + error.message);
      }
    });
  }

  // ✅ Floating Prompt (index.html only)
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    let floatCount = 0;
    const maxFloats = 3;

    const showFloatingMessage = () => {
      if (floatCount >= maxFloats) return;

      onAuthStateChanged(auth, (user) => {
        if (!user) {
          const floatPrompt = document.createElement("div");
          floatPrompt.textContent = "👉 Please login or sign up to get started!";
          floatPrompt.style.cssText = `
            position: fixed;
            top: 130px;
            right: 20px;
            background: #fff;
            color: #2f5fad;
            font-weight: 500;
            padding: 12px 20px;
            border: 2px solid transparent;
            border-radius: 20px;
            font-family: 'Poppins', sans-serif;
            z-index: 999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: float-border 4s linear infinite;
          `;
          document.body.appendChild(floatPrompt);

          setTimeout(() => floatPrompt.remove(), 5000);

          floatCount++;
          if (floatCount < maxFloats) {
            setTimeout(showFloatingMessage, 7000);
          }
        }
      });
    };

    // Add animation style
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes float-border {
        0% {
          border: 2px solid #2f5fad;
        }
        50% {
          border: 2px solid transparent;
        }
        100% {
          border: 2px solid #2f5fad;
        }
      }
    `;
    document.head.appendChild(style);

    setTimeout(showFloatingMessage, 1500);
  }
});
