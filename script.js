import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
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
const provider = new GoogleAuthProvider();

document.addEventListener("DOMContentLoaded", () => {
  const getStartedBtn = document.getElementById("getStartedBtn");
  const successMessage = document.getElementById("successMessage");
  const successText = document.getElementById("successText");
  const welcomeName = document.getElementById("welcomeName");

  if (getStartedBtn) {
    getStartedBtn.disabled = true;
    getStartedBtn.classList.add("disabled");
    getStartedBtn.onclick = null;
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

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
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

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("signupemail").value.trim();
      const password = document.getElementById("signuppassword").value;
      const firstName = document.getElementById("signupname").value.trim();
      const dob = document.getElementById("signupdate").value.trim();

      if (!isValidEmail(email)) {
        alert("Please enter a valid email (e.g., user@gmail.com).");
        return;
      }

      if (!isValidPassword(password)) {
        alert("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
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

        window.location.href = "index.html?signup=success";
      } catch (error) {
        alert("Signup failed: " + error.message);
      }
    });
  }

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

  const googleLoginBtn = document.getElementById("googleLoginBtn");
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            firstName: user.displayName || "",
            dob: ""
          });
        }

        window.location.href = "index.html?login=success";
      } catch (error) {
        alert("Google Sign-In failed: " + error.message);
      }
    });
  }
});
