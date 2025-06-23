const readline = require("readline");

// Game config
const width = 800;
const height = 600;
const basketSensitivity = 12;
const level = 1;
const totalBalls = 50;
let ballSpeed = 2.0;

// Basket object
let basket = {
  x: (width - 180) / 2,
  y: height - 100,
  topWidth: 180,
  bottomWidth: 100,
  height: 80
};

// Game state
let balls = [];
let ballsDropped = 0;
let ballsCaught = 0;
let ballsMissed = 0;
let gameEnded = false;
let startTime = Date.now();
let lastBallTime = 0;

// Create a new ball
function createBall() {
  const x = Math.random() * (width - 50) + 25;
  return { x, y: 50, r: 25 };
}

// Update ball positions and check for collision
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

// Simulate encoder input processing
function processInputLine(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "hello") {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const encoderDelta = parseInt(nextLine.trim());
        if (!isNaN(encoderDelta)) {
          basket.x += encoderDelta * basketSensitivity;
          basket.x = Math.max(0, Math.min(basket.x, width - basket.topWidth));
        }
      }
      i++; // Skip next line
    }
  }
}

// Main game loop
function gameLoop() {
  const now = Date.now();
  if (ballsDropped < totalBalls && balls.length < level && now - lastBallTime > 1000) {
    balls.push(createBall());
    ballsDropped++;
    lastBallTime = now;
  }

  updateBalls();

  if (ballsDropped >= totalBalls && balls.length === 0 && !gameEnded) {
    gameEnded = true;
    const endTime = Date.now();
    const successRate = (ballsCaught / (ballsCaught + ballsMissed)) * 100;
    const timeTaken = ((endTime - startTime) / 1000).toFixed(1);

    console.log("🎮 Game Over!");
    console.log(`✅ Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⏱️ Time Taken: ${timeTaken} seconds`);
    return;
  }

  if (!gameEnded) {
    setTimeout(gameLoop, 100); // approx 10 FPS
  }
}

// Simulate receiving serial input every 2 seconds
function simulateSerialInput() {
  const lines = Math.random() > 0.5 ? ["hello", `${Math.floor(Math.random() * 3) - 1}`] : [];
  processInputLine(lines);
  if (!gameEnded) {
    setTimeout(simulateSerialInput, 2000);
  }
}

// Start game
console.log("🎯 Starting simulation...");
gameLoop();
simulateSerialInput();
