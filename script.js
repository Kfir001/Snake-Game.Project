document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // הגדרת גודל קנבס רספונסיבי
  function resizeCanvas() {
    const container = document.querySelector(".game-board");
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth, window.innerHeight * 0.6);

    canvas.width = size;
    canvas.height = size;

    // עדכון גודל הרשת
    gridSize = Math.floor(size / 20);
    tileCount = Math.floor(size / gridSize);

    // יצירת מזון מחדש
    createFood();
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
    } else {
      snake.pop();
    }
  }

  // עדכון המשחק
  function gameUpdate() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    moveSnake();
    drawFood();
    drawSnake();
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
