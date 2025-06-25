const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

let basket = {
  x: (width - 180) / 2,
  y: height - 100,
  topWidth: 300,
  bottomWidth: 170,
  height: 80
};

let level = 1;
let totalBalls = 50;
let ballSpeed = 2.0;
const basketSensitivity = 12;

let balls = [];
let ballsDropped = 0;
let ballsCaught = 0;
let ballsMissed = 0;
let lastBallTime = 0;
let gameStarted = false;
let gameEnded = false;
let startTime, endTime;
let serialPort = null;
let serialReader = null;

// ✅ URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const levelParam = parseInt(urlParams.get("level"));
const sessionParam = parseInt(urlParams.get("session"));
const uidParam = urlParams.get("uid");

// UI elements
const connectButton = document.getElementById("connectButton");
const startButton = document.getElementById("startButton");
const connectionStatus = document.getElementById("connectionStatus");

// Arduino connection
connectButton.addEventListener("click", async () => {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialReader = serialPort.readable.getReader();

    console.log("✅ Arduino connected.");
    connectionStatus.textContent = "✅ Connected to Arduino";
    connectionStatus.style.color = "green";

    startButton.disabled = false;
    connectButton.disabled = true;
  } catch (error) {
    console.error("❌ Failed to connect to Arduino:", error);
    alert("Failed to connect. Make sure your Arduino is plugged in.");
    connectionStatus.textContent = "❌ Failed to connect.";
    connectionStatus.style.color = "red";
  }
});

function drawBasket() {
  const { x, y, topWidth, bottomWidth, height } = basket;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + topWidth, y);
  ctx.lineTo(x + topWidth - (topWidth - bottomWidth) / 2, y + height);
  ctx.lineTo(x + (topWidth - bottomWidth) / 2, y + height);
  ctx.closePath();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#8B4513";
  ctx.stroke();
}

function createBall() {
  const x = Math.random() * (width - 50) + 25;
  return { x, y: 50, r: 25 };
}

function updateBalls() {
  for (let i = balls.length - 1; i >= 0; i--) {
    const ball = balls[i];
    ball.y += ballSpeed;

    if (
      ball.y + ball.r >= basket.y &&
      ball.x > basket.x &&
      ball.x < basket.x + basket.topWidth
    ) {
      ballsCaught++;
      balls.splice(i, 1);
    } else if (ball.y > height) {
      ballsMissed++;
      balls.splice(i, 1);
    }
  }
}

async function readSerial() {
  if (!serialReader) return;

  try {
    const { value, done } = await serialReader.read();
    if (done) {
      serialReader.releaseLock();
      serialReader = null;
      return;
    }

    if (value) {
      const text = new TextDecoder().decode(value);
      const lines = text.trim().split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith("hello")) {
          const encoderDelta = parseInt(line.slice(5).trim());
          if (!isNaN(encoderDelta)) {
            basket.x += encoderDelta * basketSensitivity;
            basket.x = Math.max(0, Math.min(basket.x, width - basket.topWidth));
          }
        }
      }
    }
  } catch (error) {
    console.error("Serial read error:", error);
  }
}

function drawStats() {
  ctx.fillStyle = "#00ff00";
  ctx.fillText(`Caught: ${ballsCaught}`, 20, 30);
  ctx.fillStyle = "#ff0000";
  ctx.fillText(`Missed: ${ballsMissed}`, width - 180, 30);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Dropped: ${ballsDropped}/${totalBalls}`, width / 2 - 60, 30);
}

function gameOver() {
  gameEnded = true;
  endTime = Date.now();
  const successRate = (ballsCaught / (ballsCaught + ballsMissed)) * 100;
  const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

  ctx.fillStyle = "#323232";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "48px Arial";
  ctx.fillText("Game Over!", width / 2 - 120, height / 2 - 40);
  ctx.fillStyle = "#00ff00";
  ctx.fillText(`Success Rate: ${successRate.toFixed(2)}%`, width / 2 - 180, height / 2 + 20);
  ctx.fillStyle = "#ffff00";
  ctx.fillText(`Time Taken: ${timeTaken} sec`, width / 2 - 200, height / 2 + 80);

  // ✅ Send result to parent window
  const messageData = {
    type: "gameEnded",
    uid: uidParam,
    session: sessionParam,
    level: levelParam,
    successRatio: successRate.toFixed(2),
    timeTaken: timeTaken
  };

  console.log("📤 Posting message to opener:", messageData);

  window.opener?.postMessage(messageData, "*");

  // ✅ Optional: delay close for debugging
  setTimeout(() => window.close(), 15000);
}

function gameLoop() {
  if (!gameStarted) {
    startTime = Date.now();
    gameStarted = true;
  }

  ctx.fillStyle = "#323232";
  ctx.fillRect(0, 0, width, height);

  if (serialReader) readSerial();

  const now = Date.now();
  if (ballsDropped < totalBalls && balls.length < level && now - lastBallTime > (level > 1 ? 1000 : 0)) {
    balls.push(createBall());
    ballsDropped++;
    lastBallTime = now;
  }

  updateBalls();
  drawBasket();
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
  });

  ctx.font = "20px Arial";
  drawStats();

  if (ballsDropped >= totalBalls && balls.length === 0 && !gameEnded) {
    gameOver();
    return;
  }

  if (!gameEnded) requestAnimationFrame(gameLoop);
}

function startLevel(lv, ballsCount) {
  level = lv;
  totalBalls = ballsCount;
  balls = [];
  ballsCaught = 0;
  ballsMissed = 0;
  ballsDropped = 0;
  gameStarted = false;
  gameEnded = false;
  gameLoop();
}

// ✅ Start Game
startButton.addEventListener("click", () => {
  if (!isNaN(levelParam) && levelParam >= 1 && levelParam <= 3 &&
      !isNaN(sessionParam) && sessionParam >= 1 && sessionParam <= 10) {
    const ballsPerLevel = { 1: 10, 2: 15, 3: 20 };
    startLevel(levelParam, ballsPerLevel[levelParam]);
    startButton.disabled = true;
  } else {
    ctx.fillStyle = "#323232";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText("Invalid level or session input.", 250, 300);
  }
});
