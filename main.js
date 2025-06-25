import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

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
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

window.onload = async function () {
  const logoutBtn = document.getElementById("logoutBtn");
  const startGameBtn = document.getElementById("startGameBtn");
  const sessionInput = document.getElementById("sessionNumber");
  const levelInput = document.getElementById("levelInput");
  const sessionError = document.getElementById("sessionError");
  const levelError = document.getElementById("levelError");
  const resultDiv = document.getElementById("gameResult");
  const visualizeBtn = document.getElementById("visualizeBtn");
  const lockDataBtn = document.getElementById("lockDataBtn");
  const analyticsContainer = document.getElementById("analyticsContainer");
  const sessionChart = document.getElementById("sessionChart").getContext("2d");
  const chartOverlay = document.getElementById("chartOverlay");
  const closeChartBtn = document.getElementById("closeChartBtn");
  const successBtn = document.getElementById("successRateBtn");
  const timeBtn = document.getElementById("timeTakenBtn");
  const tableOverlay = document.getElementById("tableOverlay");
  const closeTableBtn = document.getElementById("closeTableBtn");

  let currentView = "successRate";
  let chart;

  const urlParams = new URLSearchParams(window.location.search);
  const uid = urlParams.get("uid");

  if (!uid) {
    alert("Missing user session. Please login.");
    window.location.href = "login.html";
    return;
  }

  closeChartBtn.addEventListener("click", () => {
    chartOverlay.style.display = "none";
  });

  closeTableBtn.addEventListener("click", () => {
    tableOverlay.style.display = "none";
  });

  function highlightSelectedButton(button) {
    successBtn.style.backgroundColor = "";
    timeBtn.style.backgroundColor = "";
    button.style.backgroundColor = "#b2f2bb";
  }

  successBtn.addEventListener("click", () => {
    highlightSelectedButton(successBtn);
    currentView = "successRate";
    lockDataBtn.click();
  });

  timeBtn.addEventListener("click", () => {
    highlightSelectedButton(timeBtn);
    currentView = "timeTaken";
    lockDataBtn.click();
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user || user.uid !== uid) {
      alert("Unauthorized access. Please log in.");
      window.location.href = "login.html";
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        alert("User data not found.");
        window.location.href = "login.html";
        return;
      }

      const userData = userDoc.data();
      document.getElementById("userName").textContent = userData.firstName || '';
      document.getElementById("userDOB").textContent = userData.dob || '';
      document.getElementById("userPassword").textContent = "********";
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Failed to load user data.");
      window.location.href = "login.html";
    }
  });

  sessionInput.addEventListener("input", () => {
    const val = parseInt(sessionInput.value);
    sessionError.textContent = (val < 1 || val > 10 || isNaN(val))
      ? "⚠️ Session number must be between 1 and 10." : "";
  });

  levelInput.addEventListener("input", () => {
    const val = parseInt(levelInput.value);
    levelError.textContent = (val < 1 || val > 3 || isNaN(val))
      ? "⚠️ Therapist level must be between 1 and 3." : "";
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign-out error:", e.message);
    }
    window.location.href = "login.html";
  });

  let gameEnded = false;
  let checkClosedInterval = null;

  startGameBtn.addEventListener("click", async () => {
    const session = parseInt(sessionInput.value);
    const level = parseInt(levelInput.value);
    let valid = true;

    if (isNaN(session) || session < 1 || session > 10) {
      sessionError.textContent = "⚠️ Session number must be between 1 and 10.";
      valid = false;
    } else {
      sessionError.textContent = "";
    }

    if (isNaN(level) || level < 1 || level > 3) {
      levelError.textContent = "⚠️ Therapist level must be between 1 and 3.";
      valid = false;
    } else {
      levelError.textContent = "";
    }

    if (!valid) return;

    const gameUrl = `game.html?uid=${uid}&level=${level}&session=${session}`;
    const gameWindow = window.open(gameUrl, "_blank");

    startGameBtn.disabled = true;
    sessionInput.disabled = true;
    levelInput.disabled = true;
    visualizeBtn.disabled = true;
    lockDataBtn.disabled = true;
    gameEnded = false;

    checkClosedInterval = setInterval(() => {
      if (gameWindow.closed) {
        clearInterval(checkClosedInterval);
        startGameBtn.disabled = false;
        sessionInput.disabled = false;
        levelInput.disabled = false;
      }
    }, 500);
  });

  window.addEventListener("message", async (event) => {
    if (event.data.type === "gameEnded") {
      clearInterval(checkClosedInterval);
      startGameBtn.disabled = false;
      sessionInput.disabled = false;
      levelInput.disabled = false;
      visualizeBtn.disabled = false;
      gameEnded = true;

      const gameData = {
        session: event.data.session,
        level: event.data.level,
        timeTaken: parseFloat(event.data?.timeTaken || 0),
        successRate: parseFloat(event.data?.successRatio || 0),
        timestamp: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, `users/${uid}/gameSessions`), gameData);
        console.log(`✅ Game session added under users/${uid}/gameSessions`);
      } catch (err) {
        console.error("🔥 Failed to add game session to user subcollection:", err);
      }

      if (event.data.successRatio) {
        resultDiv.innerHTML = `<strong>Success Ratio:</strong> ${event.data.successRatio}%`;
      }
    }
  });

  visualizeBtn.addEventListener("click", async () => {
    if (!gameEnded) {
      alert("⚠️ Please play the game to visualize your progress.");
      return;
    }

    lockDataBtn.disabled = false;

    try {
      const q = query(collection(db, `users/${uid}/gameSessions`));
      const snapshot = await getDocs(q);
      const sessionData = Array.from({ length: 10 }, (_, i) => ({ session: i + 1, levels: {} }));

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const sIdx = data.session - 1;
        if (!sessionData[sIdx].levels[data.level]) {
          sessionData[sIdx].levels[data.level] = data;
        }
      });

      analyticsContainer.innerHTML = "";

      sessionData.forEach((sessionObj) => {
        if (Object.keys(sessionObj.levels).length === 0) return;
        const table = document.createElement("table");
        table.classList.add("analytics-table");
        table.innerHTML = `
          <caption><strong>Session ${sessionObj.session}</strong></caption>
          <thead>
            <tr>
              <th>Level</th>
              <th>Success Rate (%)</th>
              <th>Time Taken (s)</th>
              <th>Played On</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(sessionObj.levels).map(level => `
              <tr>
                <td>${level.level}</td>
                <td>${level.successRate}</td>
                <td>${level.timeTaken}</td>
                <td>${new Date(level.timestamp).toLocaleString()}</td>
              </tr>`).join("")}
          </tbody>
        `;
        analyticsContainer.appendChild(table);
      });

      tableOverlay.style.display = "block";
    } catch (err) {
      console.error("❌ Error visualizing data:", err);
      alert("Failed to fetch analytics data.");
    }
  });

  lockDataBtn.addEventListener("click", () => {
    chartOverlay.style.display = "flex";
    chartOverlay.style.overflow = "visible";
    chartOverlay.style.height = "auto";
    chartOverlay.style.paddingBottom = "40px";
    sessionChart.canvas.parentElement.style.height = "500px";
    sessionChart.canvas.parentElement.style.width = "100%";

    const tables = analyticsContainer.querySelectorAll("table");
    const sessionLabels = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
    const level1Data = new Array(10).fill(null);
    const level2Data = new Array(10).fill(null);
    const level3Data = new Array(10).fill(null);

    tables.forEach((table, index) => {
      const sessionIndex = index;
      const rows = table.querySelectorAll("tbody tr");

      rows.forEach(row => {
        const level = parseInt(row.children[0].textContent);
        const value = currentView === "successRate"
          ? parseFloat(row.children[1].textContent)
          : parseFloat(row.children[2].textContent);

        if (level === 1) level1Data[sessionIndex] = value;
        if (level === 2) level2Data[sessionIndex] = value;
        if (level === 3) level3Data[sessionIndex] = value;
      });
    });

    if (chart) chart.destroy();

    chart = new Chart(sessionChart, {
      type: "bar",
      data: {
        labels: sessionLabels,
        datasets: [
          {
            label: "Level 1",
            data: level1Data,
            backgroundColor: "#4e79a7"
          },
          {
            label: "Level 2",
            data: level2Data,
            backgroundColor: "#f28e2c"
          },
          {
            label: "Level 3",
            data: level3Data,
            backgroundColor: "#e15759"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Session vs ${currentView === "successRate" ? "Success Rate (%)" : "Time Taken (s)"}`
          },
          legend: { position: "top" }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  });
};