document.addEventListener("DOMContentLoaded", () => {
  const { canvas, ctx } = setupCanvas();

  // הגדרת גודל קנבס רספונסיבי
  function resizeCanvas() {
    const container = document.querySelector(".game-board");
    
    // Calculate optimal size for laptop screens
    const maxSize = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.8);
    const size = Math.min(maxSize, 800); // Cap at 800px
    
    canvas.width = size;
    canvas.height = size;
    
    // Adjust grid size for better visibility on laptop
    tileCount = 20; // Keep grid cells big enough
    gridSize = Math.floor(size / tileCount);
    
    // Clear canvas with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // מניעת גלילה בטלפון
  document.body.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // קביעת גודל הקנבס הראשוני
  let gridSize = 20;
  let tileCount = canvas.width / gridSize;

  let snake = [{ x: 10, y: 10 }];
  let food = { x: 5, y: 5 };
  let dx = 0;
  let dy = 0;
  let score = 0;
  let highScore = localStorage.getItem("snakeHighScore") || 0;
  let gameSpeed = 100;
  let gameLoop;
  let gameRunning = true;
  let isPaused = false;

  // הוספה לתחילת הקובץ script.js
  let lastFrameTime = 0;
  const FRAME_RATE = 60;

  // Add these variables at the top
  let speed = 10; // Initial speed
  const maxSpeed = 20;
  const speedIncrement = 0.5;
  let lastUpdate = 0;

  // עדכון שיא
  document.getElementById("highScore").textContent = highScore;

  // הוספת תמיכה במכשירים ניידים
  const upBtn = document.getElementById("upBtn");
  const downBtn = document.getElementById("downBtn");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");

  function changeDirection(newDx, newDy) {
    // מונע תנועה הפוכה
    if (
      (dx === 1 && newDx === -1) ||
      (dx === -1 && newDx === 1) ||
      (dy === 1 && newDy === -1) ||
      (dy === -1 && newDy === 1)
    )
      return;

    dx = newDx;
    dy = newDy;
  }

  // מאזיני מקשים וכפתורים
  function setupControlListeners() {
    // מאזיני מקשי חיצים
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
          if (dy !== 1) {
            changeDirection(0, -1);
            event.preventDefault();
          }
          break;
        case "ArrowDown":
          if (dy !== -1) {
            changeDirection(0, 1);
            event.preventDefault();
          }
          break;
        case "ArrowLeft":
          if (dx !== 1) {
            changeDirection(-1, 0);
            event.preventDefault();
          }
          break;
        case "ArrowRight":
          if (dx !== -1) {
            changeDirection(1, 0);
            event.preventDefault();
          }
          break;
      }
    });

    // מאזיני כפתורי מגע
    upBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (dy !== 1) changeDirection(0, -1);
      },
      { passive: false }
    );

    downBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (dy !== -1) changeDirection(0, 1);
      },
      { passive: false }
    );

    leftBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (dx !== 1) changeDirection(-1, 0);
      },
      { passive: false }
    );

    rightBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        if (dx !== -1) changeDirection(1, 0);
      },
      { passive: false }
    );

    // מניעת אירועי ברירת מחדל
    upBtn.addEventListener("touchend", (e) => e.preventDefault(), {
      passive: false,
    });
    downBtn.addEventListener("touchend", (e) => e.preventDefault(), {
      passive: false,
    });
    leftBtn.addEventListener("touchend", (e) => e.preventDefault(), {
      passive: false,
    });
    rightBtn.addEventListener("touchend", (e) => e.preventDefault(), {
      passive: false,
    });

    document.addEventListener("keydown", togglePause);

    // הוספת תמיכה בג'סטורות מגע
    let touchStartX, touchStartY;
    
    canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        changeDirection(deltaX > 0 ? 1 : -1, 0);
      } else {
        changeDirection(0, deltaY > 0 ? 1 : -1);
      }
      
      touchStartX = touchEndX;
      touchStartY = touchEndY;
    });
  }

  // יצירת אוכל במיקום רנדומלי
  function createFood() {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
    // וידוא שהאוכל לא נוצר על הנחש
    snake.forEach((part) => {
      if (part.x === food.x && part.y === food.y) {
        createFood();
      }
    });
  }

  // ציור הנחש
  function drawSnake() {
    snake.forEach((part, index) => {
      const distanceFromHead = index === 0 ? 15 : Math.max(5, 15 - index);
      ctx.fillStyle = index === 0 ? "#4CAF50" : "#388E3C";
      ctx.shadowBlur = distanceFromHead;
      ctx.shadowColor = "rgba(76, 175, 80, 0.5)";
      ctx.fillRect(
        part.x * gridSize,
        part.y * gridSize,
        gridSize - 2,
        gridSize - 2
      );
      ctx.shadowBlur = 0;
    });
  }

  // ציור האוכל
  function drawFood() {
    ctx.fillStyle = "#FF5252";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 82, 82, 0.5)";
    ctx.beginPath();
    ctx.arc(
      food.x * gridSize + gridSize / 2,
      food.y * gridSize + gridSize / 2,
      gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // עדכון מיקום הנחש
  function moveSnake() {
    const now = Date.now();
    if (now - lastUpdate < 1000 / speed) return;
    lastUpdate = now;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // בדיקת התנגשות בקירות
    if (head.x < 0) head.x = tileCount - 1;
    if (head.x >= tileCount) head.x = 0;
    if (head.y < 0) head.y = tileCount - 1;
    if (head.y >= tileCount) head.y = 0;

    // בדיקת התנגשות עצמית - רק אם הנחש זז ויש יותר מחלק אחד
    if ((dx !== 0 || dy !== 0) && snake.length > 1) {
      // בדיקה רק מול חלקי הגוף (לא כולל הראש)
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
          gameOver();
          return;
        }
      }
    }

    snake.unshift(head);

    // בדיקה אם הנחש אכל
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      updateScore(score);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        document.getElementById("highScore").textContent = highScore;
      }
      createFood();
      // הגברת מהירות המשחק
      if (gameSpeed > 50) {
        gameSpeed -= 2;
        clearInterval(gameLoop);
        gameLoop = setInterval(gameUpdate, gameSpeed);
      }
      if (speed < maxSpeed) {
        speed += speedIncrement;
      }
    } else {
      snake.pop();
    }
  }

  // עדכון המשחק
  function gameUpdate(timestamp) {
    if (!gameRunning || isPaused) return;
    
    const elapsed = timestamp - lastFrameTime;
    if (elapsed > 1000 / FRAME_RATE) {
      // נקה את הקנבס עם רקע שחור
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      moveSnake();
      drawFood();
      drawSnake();
      lastFrameTime = timestamp;
    }
    
    requestAnimationFrame(gameUpdate);
  }

  // טיפול בסיום משחק
  function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    document.getElementById("finalScore").textContent = score;
    const gameOverElement = document.getElementById("gameOver");
    gameOverElement.classList.add("show");
    gameOverElement.style.display = "block";
  }

  // אתחול מחדש של המשחק
  function restartGame() {
    const gameOverElement = document.getElementById("gameOver");
    gameOverElement.classList.remove("show");

    setTimeout(() => {
      gameOverElement.style.display = "none";
      snake = [{ x: 10, y: 10 }];
      dx = 0;
      dy = 0;
      score = 0;
      document.getElementById("score").textContent = score;
      gameSpeed = 100;
      createFood();
      gameRunning = true;
      clearInterval(gameLoop);
      gameLoop = setInterval(gameUpdate, gameSpeed);
    }, 300);
  }

  // טיפול בגודל מסך משתנה
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  // קריאה ראשונית לשינוי גודל
  resizeCanvas();

  // אתחול לחצן התחל מחדש
  document
    .getElementById("restartButton")
    .addEventListener("click", restartGame);

  // הגדרת מאזיני שליטה
  setupControlListeners();

  // התחלת המשחק
  createFood();
  gameLoop = setInterval(gameUpdate, gameSpeed);
  
  // קריאה לפונקציית הרסייז בטעינה ובכל שינוי גודל מסך
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);
});

// Add pause toggle function
function togglePause(e) {
  if (e.key === "p" || e.key === "P") {
    isPaused = !isPaused;
    if (isPaused) {
      clearInterval(gameLoop);
    } else {
      gameLoop = setInterval(gameUpdate, gameSpeed);
    }
  }
}

// Add to when score changes
function updateScore(newScore) {
  const scoreElement = document.getElementById("score");
  scoreElement.style.transform = "scale(1.2)";
  scoreElement.textContent = newScore;
  setTimeout(() => {
    scoreElement.style.transform = "scale(1)";
  }, 200);
}

// Add this function for canvas setup
function setupCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Default size optimized for laptop screens
    const defaultSize = 800;
    canvas.width = defaultSize;
    canvas.height = defaultSize;
    
    return { canvas, ctx };
}
