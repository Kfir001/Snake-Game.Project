// Snake Game with 80s Retro Start Screen
class SnakeGame {
    constructor() {
        // Initialize canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set initial canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.gridSize = 20;
        this.tileCount = 20;

        // Add roundRect polyfill if needed
        if (!this.ctx.roundRect) {
            this.ctx.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.beginPath();
                this.moveTo(x + r, y);
                this.arcTo(x + w, y, x + w, y + h, r);
                this.arcTo(x + w, y + h, x, y + h, r);
                this.arcTo(x, y + h, x, y, r);
                this.arcTo(x, y, x + w, y, r);
                this.closePath();
                return this;
            };
        }

        // Initial game state
        this.snake = [];
        this.food = null;
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.gameOver = true; // Start in game over state
        this.gameLoop = null;
        this.lastRender = 0;
        this.moveInterval = 150;
        this.gameStarted = false;

        // Touch controls
        this.touchStartX = null;
        this.touchStartY = null;

        // Animation properties
        this.foodAlpha = 1;
        this.foodScale = 1;
        this.scoreAnimation = { value: 0, target: 0 };
        this.foodAnimationTime = 0;
        this.gameTime = 0;
        this.gridOffset = 0;
        this.gridAlpha = 0.2;
        this.trailParticles = [];
        this.stars = [];
        this.menuSnake = [];
        this.menuSnakeDirection = { x: 1, y: 0 };
        this.menuAnimationTime = 0;

        // 80s retro colors
        this.neonColors = {
            blue: '#00FFFF',
            pink: '#FF00FF',
            green: '#39FF14',
            purple: '#6A0DAD',
            yellow: '#FFFF00'
        };

        // Snake colors - Create a Tron-like glow effect
        this.snakeColors = this.generateSnakeGradient();

        // Audio elements
        this.sounds = {
            menuSelect: null,
            menuMove: null,
            gameStart: null,
            gameOver: null,
            eat: null,
            background: null
        };

        // UI elements
        this.scoreElement = document.getElementById('score');
        this.startButton = document.getElementById('startButton');
        this.gameOverAlert = document.getElementById('gameOver');
        this.startScreen = document.getElementById('startScreen');
        this.scoreContainer = document.getElementById('scoreContainer');
        this.gameControls = document.getElementById('gameControls');
        this.menuItems = document.querySelectorAll('.menu-item');
        this.starField = document.getElementById('starField');

        // Bind event listeners
        this.bindEventListeners();

        // Initial setup
        this.setupCanvas();
        this.initStarField();
        this.initMenuSnake();
        this.resetGame(); // Set up initial game state
        this.startScreenAnimation(); // Start the menu animation
    }

    resetGame() {
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.scoreAnimation.value = 0;
        this.scoreAnimation.target = 0;
        this.gameOver = true;
        this.trailParticles = [];
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    setupCanvas() {
        const containerWidth = this.canvas.parentElement.clientWidth;
        const size = Math.min(containerWidth, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        this.gridSize = size / this.tileCount;
    }

    bindEventListeners() {
        // Menu item selection
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });

            item.addEventListener('mouseover', () => {
                // Play hover sound effect
                this.playSound('menuMove');
            });
        });

        // Start button
        this.startButton.addEventListener('click', () => {
            if (this.gameOver) {
                this.startGame();
            }
        });

        // Keyboard controls for game
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Keyboard controls for menu navigation
        document.addEventListener('keydown', (e) => this.handleMenuKeyPress(e));

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }

    handleMenuKeyPress(e) {
        if (!this.startScreen.classList.contains('d-none')) {
            const activeItem = document.querySelector('.menu-item.active');
            const menuItems = Array.from(this.menuItems);
            const currentIndex = menuItems.indexOf(activeItem);
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        activeItem.classList.remove('active');
                        menuItems[currentIndex - 1].classList.add('active');
                        this.playSound('menuMove');
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < menuItems.length - 1) {
                        activeItem.classList.remove('active');
                        menuItems[currentIndex + 1].classList.add('active');
                        this.playSound('menuMove');
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const action = activeItem.dataset.action;
                    this.handleMenuAction(action);
                    break;
            }
        }
    }

    handleMenuAction(action) {
        this.playSound('menuSelect');
        
        switch(action) {
            case 'start':
                this.hideStartScreen();
                this.startGame();
                break;
            case 'modes':
                // For this demo, we'll just flash the option
                alert('Game modes would be implemented here: Classic, Timed, Endless');
                break;
            case 'scores':
                alert('High scores would be displayed here');
                break;
            case 'settings':
                alert('Settings options would be displayed here');
                break;
        }
    }

    // Initialize retro star field
    initStarField() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1
            });
        }
    }

    // Initialize decorative menu snake
    initMenuSnake() {
        // Create a small snake for the menu animation
        this.menuSnake = [];
        for (let i = 0; i < 10; i++) {
            this.menuSnake.push({
                x: 5 - i,
                y: 5
            });
        }
    }

    // Start screen animation loop
    startScreenAnimation() {
        if (this.gameStarted) return;
        
        const timestamp = performance.now();
        const lastTime = this.menuAnimationTime || timestamp;
        const progress = timestamp - lastTime;
        
        this.menuAnimationTime = timestamp;
        this.gameTime += progress / 1000;
        
        // Update and draw the start screen
        this.updateMenuSnake();
        this.drawStartScreen();
        
        // Continue the animation loop
        requestAnimationFrame(() => this.startScreenAnimation());
    }

    updateMenuSnake() {
        // Only update snake every 200ms for a slower animation
        const now = performance.now();
        if (!this.lastMenuUpdate || now - this.lastMenuUpdate > 200) {
            this.lastMenuUpdate = now;
            
            // Move the menu snake
            const head = {
                x: this.menuSnake[0].x + this.menuSnakeDirection.x,
                y: this.menuSnake[0].y + this.menuSnakeDirection.y
            };
            
            // Check boundaries and change direction
            if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
                // Change direction randomly while avoiding going back in the same direction
                const directions = [
                    {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
                ];
                
                // Filter out the opposite of the current direction
                const validDirections = directions.filter(dir => {
                    return !(dir.x === -this.menuSnakeDirection.x && dir.y === -this.menuSnakeDirection.y);
                });
                
                // Choose a random direction
                const newDir = validDirections[Math.floor(Math.random() * validDirections.length)];
                this.menuSnakeDirection = newDir;
                
                // Recalculate head position with new direction
                head.x = this.menuSnake[0].x + this.menuSnakeDirection.x;
                head.y = this.menuSnake[0].y + this.menuSnakeDirection.y;
                
                // If still out of bounds, force it to a valid position
                if (head.x < 0) head.x = 0;
                if (head.x >= this.tileCount) head.x = this.tileCount - 1;
                if (head.y < 0) head.y = 0;
                if (head.y >= this.tileCount) head.y = this.tileCount - 1;
            }
            
            // Add new head and remove tail
            this.menuSnake.unshift(head);
            this.menuSnake.pop();
        }
    }

    drawStartScreen() {
        // Clear canvas with a dark background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#21002b'); // Deep purple
        gradient.addColorStop(1, '#000000'); // Black
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid with perspective
        this.drawRetroGrid();
        
        // Draw decorative menu snake
        this.drawMenuSnake();
    }

    drawMenuSnake() {
        // Draw snake with a trail effect
        this.menuSnake.forEach((segment, index) => {
            // Create a pulsing effect
            const pulseIntensity = 0.5 + 0.5 * Math.sin(this.gameTime * 2);
            const size = this.gridSize - 4 - (index * 0.2);
            
            if (size <= 0) return;
            
            const x = segment.x * this.gridSize + 2;
            const y = segment.y * this.gridSize + 2;
            
            // Determine color based on position in snake
            let color;
            if (index === 0) {
                color = this.neonColors.blue; // Head
            } else if (index < 3) {
                color = this.neonColors.blue;
            } else {
                // Gradient from blue to pink
                const ratio = Math.min(1, (index - 3) / (this.menuSnake.length - 3));
                const r = Math.floor(this.lerp(0, 255, ratio));
                const g = Math.floor(this.lerp(255, 0, ratio));
                const b = 255;
                color = `rgb(${r}, ${g}, ${b})`;
            }
            
            // Draw glow effect
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15 * pulseIntensity;
            
            // Draw snake segment
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, size, size, 4);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Draw inner highlight for head
            if (index === 0) {
                const innerSize = size * 0.5;
                const innerX = x + (size - innerSize) / 2;
                const innerY = y + (size - innerSize) / 2;
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.beginPath();
                this.ctx.roundRect(innerX, innerY, innerSize, innerSize, 2);
                this.ctx.fill();
            }
        });
    }

    hideStartScreen() {
        this.startScreen.classList.add('d-none');
        this.scoreContainer.classList.remove('d-none');
        this.gameControls.classList.remove('d-none');
    }

    showStartScreen() {
        this.startScreen.classList.remove('d-none');
        this.scoreContainer.classList.add('d-none');
        this.gameControls.classList.add('d-none');
        // Start menu animation again
        this.gameStarted = false;
        this.startScreenAnimation();
    }

    startGame() {
        // Reset game state
        this.resetGame();
        this.gameOver = false;
        this.gameStarted = true;
        this.dx = 1; // Start moving right
        this.dy = 0;

        // Reset UI
        this.scoreElement.textContent = '0';
        this.gameOverAlert.classList.add('d-none');

        // Play start sound
        this.playSound('gameStart');

        // Start game loop
        this.lastRender = performance.now();
        this.gameLoop = requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    update(timestamp) {
        if (this.gameOver) return;

        const progress = timestamp - this.lastRender;
        this.gameTime += progress / 1000;

        // Update grid animation
        this.gridOffset = (this.gridOffset + progress * 0.01) % this.gridSize;
        this.gridAlpha = 0.2 + 0.1 * Math.sin(this.gameTime);

        // Update food animations
        this.foodAnimationTime += progress / 1000;
        this.foodAlpha = 0.7 + 0.3 * Math.sin(this.foodAnimationTime * 4);
        this.foodScale = 0.8 + 0.2 * Math.sin(this.foodAnimationTime * 4);

        // Update score animation
        if (this.scoreAnimation.value < this.scoreAnimation.target) {
            this.scoreAnimation.value = Math.min(
                this.scoreAnimation.value + progress * 0.05,
                this.scoreAnimation.target
            );
            this.scoreElement.textContent = Math.round(this.scoreAnimation.value);
        }

        // Update particles
        this.updateParticles(progress);

        // Move snake at fixed intervals
        if (progress >= this.moveInterval) {
            this.moveSnake();
            this.checkCollision();
            this.draw();
            this.lastRender = timestamp;
        } else {
            // Draw animation frames even between moves
            this.draw();
        }

        // Continue game loop if game is not over
        if (!this.gameOver) {
            this.gameLoop = requestAnimationFrame((t) => this.update(t));
        }
    }

    updateParticles(progress) {
        // Fade out existing particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.life -= progress * 0.002;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }

        // Add new particles for the snake head if moving
        if (this.dx !== 0 || this.dy !== 0) {
            const head = this.snake[0];
            this.trailParticles.push({
                x: head.x,
                y: head.y,
                life: 1.0
            });
        }
    }

    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        this.snake.unshift(head);

        if (this.checkFood()) {
            this.score += 10;
            this.scoreAnimation.target = this.score;
            this.food = this.generateFood();
            
            // Play eat sound
            this.playSound('eat');
            
            // Make the game faster as score increases
            this.moveInterval = Math.max(80, 150 - (this.score / 10) * 3);
        } else {
            this.snake.pop();
        }
    }

    checkCollision() {
        const head = this.snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }

        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
    }

    checkFood() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }

    generateSnakeGradient() {
        const colors = [];
        for (let i = 0; i < 20; i++) {
            // Create a gradient from head to tail with neon glow effect
            if (i === 0) {
                colors.push(this.neonColors.blue); // Head is bright blue
            } else if (i < 3) {
                colors.push(this.neonColors.blue); // First few segments stay blue
            } else {
                // Transition to purple and then pink for the tail
                const ratio = (i - 3) / 17;
                const r = Math.floor(this.lerp(0, 255, ratio));
                const g = Math.floor(this.lerp(255, 0, ratio));
                const b = Math.floor(this.lerp(255, 255, ratio));
                colors.push(`rgb(${r}, ${g}, ${b})`);
            }
        }
        return colors;
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    draw() {
        // Clear canvas with a dark background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#21002b'); // Deep purple
        gradient.addColorStop(1, '#000000'); // Black
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw retro grid with perspective effect
        this.drawRetroGrid();
        
        // Draw snake trail particles
        this.drawTrailParticles();

        // Draw snake
        this.drawSnake();

        // Draw food with glow effect
        this.drawFood();
    }

    drawRetroGrid() {
        // Draw horizontal grid lines with perspective effect
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        for (let i = 0; i <= this.tileCount; i++) {
            // Horizontal lines (stronger perspective)
            const y = i * this.gridSize;
            const opacity = 0.1 + (i / this.tileCount) * 0.3;
            
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * this.gridAlpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
            
            // Vertical lines (less perspective)
            const x = i * this.gridSize;
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.15 * this.gridAlpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }

    drawTrailParticles() {
        for (const particle of this.trailParticles) {
            const alpha = particle.life * 0.7;
            const size = this.gridSize * 0.8;
            
            const x = particle.x * this.gridSize + (this.gridSize - size) / 2;
            const y = particle.y * this.gridSize + (this.gridSize - size) / 2;
            
            // Draw glow
            this.ctx.shadowColor = this.neonColors.blue;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(x - 2, y - 2, size + 4, size + 4, 6);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        }
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            const color = this.snakeColors[Math.min(index, this.snakeColors.length - 1)];
            
            const size = this.gridSize - 4;
            const x = segment.x * this.gridSize + 2;
            const y = segment.y * this.gridSize + 2;
            
            // Draw glow effect
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            
            // Draw snake segment with rounded corners
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, size, size, 4);
            this.ctx.fill();
            
            // Reset shadow for performance
            this.ctx.shadowBlur = 0;
            
            // Draw inner highlight
            if (index === 0) { // Head
                const innerSize = size * 0.5;
                const innerX = x + (size - innerSize) / 2;
                const innerY = y + (size - innerSize) / 2;
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.beginPath();
                this.ctx.roundRect(innerX, innerY, innerSize, innerSize, 2);
                this.ctx.fill();
            }
        });
    }

    drawFood() {
        const foodSize = this.gridSize * this.foodScale;
        const foodX = this.food.x * this.gridSize + (this.gridSize - foodSize) / 2;
        const foodY = this.food.y * this.gridSize + (this.gridSize - foodSize) / 2;

        // Draw outer glow
        this.ctx.shadowColor = this.neonColors.pink;
        this.ctx.shadowBlur = 15;
        
        // Draw food
        this.ctx.fillStyle = `rgba(255, 0, 255, ${this.foodAlpha})`;
        this.ctx.beginPath();
        this.ctx.roundRect(foodX, foodY, foodSize, foodSize, 4);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw sparkle effect
        const sparkTime = this.foodAnimationTime * 5;
        const sparkSize = foodSize * 0.3;
        const sparkX = foodX + foodSize / 2;
        const sparkY = foodY + foodSize / 2;
        
        // Draw plus shape
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + Math.abs(Math.sin(sparkTime)) + ')';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(sparkX - sparkSize / 2, sparkY);
        this.ctx.lineTo(sparkX + sparkSize / 2, sparkY);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(sparkX, sparkY - sparkSize / 2);
        this.ctx.lineTo(sparkX, sparkY + sparkSize / 2);
        this.ctx.stroke();
    }

    handleKeyPress(e) {
        if (this.gameOver) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();

            switch(e.key) {
                case 'ArrowUp':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    break;
                case 'ArrowDown':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    break;
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
    }

    handleTouchMove(e) {
        e.preventDefault();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchStartX || !this.touchStartY) return;

        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const touchEndX = touch.clientX - rect.left;
        const touchEndY = touch.clientY - rect.top;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        const minSwipeDistance = 20;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && this.dx !== -1) {
                    this.dx = 1;
                    this.dy = 0;
                } else if (deltaX < 0 && this.dx !== 1) {
                    this.dx = -1;
                    this.dy = 0;
                }
            }
        } else {
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && this.dy !== -1) {
                    this.dx = 0;
                    this.dy = 1;
                } else if (deltaY < 0 && this.dy !== 1) {
                    this.dx = 0;
                    this.dy = -1;
                }
            }
        }

        this.touchStartX = null;
        this.touchStartY = null;
    }

    playSound(soundType) {
        // Sound elements would be implemented here
        // For now, we'll leave this as a stub
    }

    endGame() {
        this.gameOver = true;
        this.gameOverAlert.classList.remove('d-none');
        this.playSound('gameOver');
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        // Return to start screen after a short delay
        setTimeout(() => {
            this.showStartScreen();
        }, 3000);
    }
}

// Create game instance after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
});
