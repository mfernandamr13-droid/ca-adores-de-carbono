// Configurações do jogo
const gameConfig = {
    playerSpeed: 5,
    jumpForce: 12,
    gravity: 0.5,
    co2SpawnRate: 1000,
    gameTime: 30,
    biomes: [
        {
            name: "Floresta Tropical",
            color: "#2E8B57",
            fact: "Florestas tropicais armazenam 25% do carbono terrestre e produzem 40% do oxigênio.",
            obstacles: ["fogo", "desmatamento"],
            background: "#87CEEB",
            groundColor: "#2E8B57"
        },
        {
            name: "Tundra",
            color: "#ADD8E6",
            fact: "O permafrost da tundra armazena quase o dobro de carbono que a atmosfera!",
            obstacles: ["derretimento"],
            background: "#E6E6FA",
            groundColor: "#B0E0E6"
        },
        {
            name: "Oceano",
            color: "#1E90FF",
            fact: "Os oceanos absorvem cerca de 30% do CO₂ emitido pelos humanos.",
            obstacles: ["poluição", "tempestade"],
            background: "#00008B",
            groundColor: "#1E90FF"
        },
        {
            name: "Plantações",
            color: "#9ACD32",
            fact: "Agricultura sustentável pode sequestrar carbono no solo.",
            obstacles: ["queimada"],
            background: "#F5DEB3",
            groundColor: "#9ACD32"
        }
    ],
    powerUps: [
        {
            name: "Árvore Mágica",
            color: "#00FF00",
            duration: 10,
            effect: "autoCapture"
        },
        {
            name: "Captura Direta",
            color: "#FFFF00",
            duration: 5,
            effect: "magnet"
        }
    ]
};

// Elementos do DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.getElementById('timer');
const co2CounterElement = document.getElementById('co2Counter');
const biomeNameElement = document.getElementById('biomeName');
const biomeInfoElement = document.getElementById('biomeInfo');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const finalCo2Element = document.getElementById('finalCo2');
const biomeFactElement = document.getElementById('biomeFact');
const nextLevelButton = document.getElementById('nextLevelButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const totalCo2Element = document.getElementById('totalCo2');
const restartButton = document.getElementById('restartButton');
const powerUpIndicator = document.getElementById('powerUpIndicator');
const mobileControls = document.getElementById('mobileControls');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const jumpButton = document.getElementById('jumpButton');
const actionButton = document.getElementById('actionButton');

// Estado do jogo
let gameState = {
    currentBiome: 0,
    player: {
        x: 50,
        y: 0,
        width: 40,
        height: 80,
        velocityY: 0,
        isJumping: false,
        score: 0,
        direction: 1,
        isMoving: false,
        powerUp: null,
        powerUpTime: 0
    },
    co2Particles: [],
    obstacles: [],
    powerUps: [],
    groundHeight: 100,
    gameTimeLeft: gameConfig.gameTime,
    gameInterval: null,
    isGameRunning: false,
    lastCo2Spawn: 0,
    lastObstacleSpawn: 0,
    lastPowerUpSpawn: 0,
    keys: {
        left: false,
        right: false,
        up: false,
        action: false
    },
    totalScore: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
};

// Inicializar jogo
function initGame() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    startButton.addEventListener('click', startGame);
    nextLevelButton.addEventListener('click', nextLevel);
    restartButton.addEventListener('click', restartGame);
    
    // Controles de teclado
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Controles mobile
    if (gameState.isMobile) {
        mobileControls.style.display = 'flex';
        
        leftButton.addEventListener('touchstart', () => gameState.keys.left = true);
        leftButton.addEventListener('touchend', () => gameState.keys.left = false);
        
        rightButton.addEventListener('touchstart', () => gameState.keys.right = true);
        rightButton.addEventListener('touchend', () => gameState.keys.right = false);
        
        jumpButton.addEventListener('touchstart', () => gameState.keys.up = true);
        jumpButton.addEventListener('touchend', () => gameState.keys.up = false);
        
        actionButton.addEventListener('touchstart', () => gameState.keys.action = true);
        actionButton.addEventListener('touchend', () => gameState.keys.action = false);
    }
    
    // Controles de clique/toque
    //canvas.addEventListener('click', handleClick);
   // canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    startScreen.style.display = 'flex';
}

function handleTouch(e) {
    e.preventDefault();
    handleClick(e.touches[0]);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameState.groundHeight = canvas.height * 0.8;
    
    if (gameState.isGameRunning) {
        gameState.player.y = gameState.groundHeight - gameState.player.height;
    }
}

function handleKeyDown(e) {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            gameState.keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
            gameState.keys.right = true;
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            gameState.keys.up = true;
            break;
        case 'e':
            gameState.keys.action = true;
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            gameState.keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
            gameState.keys.right = false;
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            gameState.keys.up = false;
            break;
        case 'e':
            gameState.keys.action = false;
            break;
    }
}

function handleClick(e) {
    if (!gameState.isGameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    for (let i = gameState.co2Particles.length - 1; i >= 0; i--) {
        const co2 = gameState.co2Particles[i];
        const distance = Math.sqrt(
            Math.pow(clickX - co2.x, 2) + 
            Math.pow(clickY - co2.y, 2)
        );
        
        if (distance < co2.radius) {
            captureCO2(co2);
            gameState.co2Particles.splice(i, 1);
            break;
        }
    }
}

function captureCO2(co2) {
    gameState.player.score += co2.value;
    co2CounterElement.textContent = gameState.player.score;
    
    // Efeito visual
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(co2.x, co2.y, co2.radius * 2, 0, Math.PI * 2);
    ctx.fill();
}

function startGame() {
    startScreen.style.display = 'none';
    levelCompleteScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameState.isGameRunning = true;
    
    setupCurrentBiome();
    
    gameState.player = {
        x: 50,
        y: gameState.groundHeight - 80,
        width: 40,
        height: 80,
        velocityY: 0,
        isJumping: false,
        score: 0,
        direction: 1,
        isMoving: false,
        powerUp: null,
        powerUpTime: 0
    };
    gameState.co2Particles = [];
    gameState.obstacles = [];
    gameState.powerUps = [];
    gameState.gameTimeLeft = gameConfig.gameTime;
    gameState.lastCo2Spawn = 0;
    gameState.lastObstacleSpawn = 0;
    gameState.lastPowerUpSpawn = 0;
    
    co2CounterElement.textContent = '0';
    timerElement.textContent = gameState.gameTimeLeft;
    powerUpIndicator.style.display = 'none';
    powerUpIndicator.textContent = '';
    
    if (gameState.gameInterval) clearInterval(gameState.gameInterval);
    gameState.gameInterval = setInterval(gameLoop, 1000 / 60);
}

function setupCurrentBiome() {
    const biome = gameConfig.biomes[gameState.currentBiome];
    biomeNameElement.textContent = biome.name;
    biomeInfoElement.textContent = biome.fact;
    canvas.style.backgroundColor = biome.background;
}

function nextLevel() {
    gameState.totalScore += gameState.player.score;
    gameState.currentBiome++;
    
    if (gameState.currentBiome >= gameConfig.biomes.length) {
        gameOver();
    } else {
        startGame();
    }
}

function gameOver() {
    gameState.isGameRunning = false;
    clearInterval(gameState.gameInterval);
    
    totalCo2Element.textContent = gameState.totalScore + gameState.player.score;
    gameOverScreen.style.display = 'flex';
}

function restartGame() {
    gameState.currentBiome = 0;
    gameState.totalScore = 0;
    startGame();
}

function gameLoop() {
    update();
    render();
}

function update() {
    gameState.gameTimeLeft -= 1/60;
    timerElement.textContent = Math.ceil(gameState.gameTimeLeft);
    
    if (gameState.gameTimeLeft <= 0) {
        levelComplete();
        return;
    }
    
    movePlayer();
    applyGravity();
    checkGroundCollision();
    spawnCO2();
    spawnObstacles();
    spawnPowerUps();
    updateCO2Particles();
    updateObstacles();
    updatePowerUps();
    updatePlayerPowerUp();
    checkObstacleCollisions();
    checkCO2Collisions(); 
}

function render() {
    const biome = gameConfig.biomes[gameState.currentBiome];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = biome.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = biome.groundColor;
    ctx.fillRect(0, gameState.groundHeight, canvas.width, canvas.height - gameState.groundHeight);
    
    drawObstacles();
    drawPowerUps();
    drawCO2Particles();
    drawPlayer();
    
    if (gameState.player.powerUp) {
        drawPowerUpEffect();
    }
}

function movePlayer() {
    gameState.player.isMoving = false;
    
    if (gameState.keys.left) {
        gameState.player.x -= gameConfig.playerSpeed;
        gameState.player.direction = -1;
        gameState.player.isMoving = true;
    }
    
    if (gameState.keys.right) {
        gameState.player.x += gameConfig.playerSpeed;
        gameState.player.direction = 1;
        gameState.player.isMoving = true;
    }
    
    if (gameState.keys.up && !gameState.player.isJumping) {
        gameState.player.velocityY = -gameConfig.jumpForce;
        gameState.player.isJumping = true;
    }
    
    if (gameState.player.x < 0) gameState.player.x = 0;
    if (gameState.player.x > canvas.width - gameState.player.width) {
        gameState.player.x = canvas.width - gameState.player.width;
    }
}

function applyGravity() {
    gameState.player.velocityY += gameConfig.gravity;
    gameState.player.y += gameState.player.velocityY;
}

function checkGroundCollision() {
    if (gameState.player.y >= gameState.groundHeight - gameState.player.height) {
        gameState.player.y = gameState.groundHeight - gameState.player.height;
        gameState.player.velocityY = 0;
        gameState.player.isJumping = false;
    }
}

function spawnCO2() {
    const now = Date.now();
    if (now - gameState.lastCo2Spawn > gameConfig.co2SpawnRate) {
        gameState.lastCo2Spawn = now;
        
        gameState.co2Particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (gameState.groundHeight - 200) + 50,
            radius: 15 + Math.random() * 5,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: (Math.random() - 0.5) * 2,
            value: 1 + Math.floor(Math.random() * 3)
        });
    }
}

function updateCO2Particles() {
    for (let i = 0; i < gameState.co2Particles.length; i++) {
        const co2 = gameState.co2Particles[i];
        
        co2.x += co2.velocityX;
        co2.y += co2.velocityY;
        
        if (co2.x < co2.radius || co2.x > canvas.width - co2.radius) {
            co2.velocityX *= -1;
        }
        
        if (co2.y < co2.radius || co2.y > gameState.groundHeight - co2.radius) {
            co2.velocityY *= -1;
        }
        
        if (gameState.player.powerUp && gameState.player.powerUp.effect === 'autoCapture') {
            const distance = Math.sqrt(
                Math.pow(co2.x - (gameState.player.x + gameState.player.width/2), 2) + 
                Math.pow(co2.y - (gameState.player.y + gameState.player.height/2), 2)
            );
            
            if (distance < 150) {
                captureCO2(co2);
                gameState.co2Particles.splice(i, 1);
                i--;
            }
        }
        
        if (gameState.player.powerUp && gameState.player.powerUp.effect === 'magnet' && gameState.keys.action) {
            const dx = (gameState.player.x + gameState.player.width/2) - co2.x;
            const dy = (gameState.player.y + gameState.player.height/2) - co2.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 250) {
                co2.x += dx * 0.05;
                co2.y += dy * 0.05;
                
                if (distance < 30) {
                    captureCO2(co2);
                    gameState.co2Particles.splice(i, 1);
                    i--;
                }
            }
        }
    }
}

function drawCO2Particles() {
    for (const co2 of gameState.co2Particles) {
        ctx.beginPath();
        ctx.arc(co2.x, co2.y, co2.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = `${Math.min(co2.radius, 12)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CO₂', co2.x, co2.y);
    }
}

function spawnObstacles() {
    const now = Date.now();
    if (now - gameState.lastObstacleSpawn > 3000) {
        gameState.lastObstacleSpawn = now;
        
        if (Math.random() > 0.7) {
            const biome = gameConfig.biomes[gameState.currentBiome];
            const obstacleType = biome.obstacles[Math.floor(Math.random() * biome.obstacles.length)];
            
            gameState.obstacles.push({
                x: canvas.width,
                y: gameState.groundHeight - 50,
                width: 60,
                height: 60,
                type: obstacleType,
                speed: 3 + Math.random() * 2
            });
        }
    }
}

function updateObstacles() {
    for (let i = 0; i < gameState.obstacles.length; i++) {
        const obstacle = gameState.obstacles[i];
        obstacle.x -= obstacle.speed;
        
        if (obstacle.x < -obstacle.width) {
            gameState.obstacles.splice(i, 1);
            i--;
        }
    }
}

function drawObstacles() {
    for (const obstacle of gameState.obstacles) {
        ctx.fillStyle = getObstacleColor(obstacle.type);
        ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, obstacle.width, obstacle.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getObstacleText(obstacle.type), obstacle.x + obstacle.width/2, obstacle.y - obstacle.height/2);
    }
}

function getObstacleColor(type) {
    switch(type) {
        case 'fogo': return 'rgba(255, 100, 0, 0.8)';
        case 'desmatamento': return 'rgba(139, 69, 19, 0.8)';
        case 'derretimento': return 'rgba(135, 206, 250, 0.8)';
        case 'poluição': return 'rgba(128, 128, 128, 0.8)';
        case 'tempestade': return 'rgba(0, 0, 139, 0.8)';
        case 'queimada': return 'rgba(255, 69, 0, 0.8)';
        default: return 'rgba(255, 0, 0, 0.8)';
    }
}

function getObstacleText(type) {
    switch(type) {
        case 'fogo': return 'Incêndio';
        case 'desmatamento': return 'Desmate';
        case 'derretimento': return 'Derretimento';
        case 'poluição': return 'Poluição';
        case 'tempestade': return 'Tempestade';
        case 'queimada': return 'Queimada';
        default: return 'Obstáculo';
    }
}

function checkObstacleCollisions() {
    const player = gameState.player;
    
    for (let i = 0; i < gameState.obstacles.length; i++) {
        const obstacle = gameState.obstacles[i];
        
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y &&
            player.y + player.height > obstacle.y - obstacle.height
        ) {
            gameState.player.score = Math.max(0, gameState.player.score - 5);
            co2CounterElement.textContent = gameState.player.score;
            
            gameState.obstacles.splice(i, 1);
            i--;
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }
}

function spawnPowerUps() {
    const now = Date.now();
    if (now - gameState.lastPowerUpSpawn > 10000) {
        gameState.lastPowerUpSpawn = now;
        
        if (Math.random() > 0.5) {
            const powerUpType = gameConfig.powerUps[Math.floor(Math.random() * gameConfig.powerUps.length)];
            
            gameState.powerUps.push({
                x: Math.random() * (canvas.width - 100) + 50,
                y: Math.random() * (gameState.groundHeight - 200) + 50,
                width: 40,
                height: 40,
                type: powerUpType,
                time: Date.now()
            });
        }
    }
}

function updatePowerUps() {
    const now = Date.now();
    
    for (let i = 0; i < gameState.powerUps.length; i++) {
        const powerUp = gameState.powerUps[i];
        
        if (now - powerUp.time > 10000) {
            gameState.powerUps.splice(i, 1);
            i--;
            continue;
        }
        
        const player = gameState.player;
        if (
            player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y
        ) {
            gameState.player.powerUp = powerUp.type;
            gameState.player.powerUpTime = now;
            
            powerUpIndicator.style.display = 'block';
            powerUpIndicator.textContent = powerUp.type.name;
            powerUpIndicator.style.backgroundColor = `rgba(${hexToRgb(powerUp.type.color)}, 0.3)`;
            
            gameState.powerUps.splice(i, 1);
            i--;
        }
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

function drawPowerUps() {
    for (const powerUp of gameState.powerUps) {
        ctx.fillStyle = powerUp.type.color;
        ctx.beginPath();
        ctx.roundRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height, 10);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (powerUp.type.effect === 'autoCapture') {
            ctx.fillText('Árvore', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 - 8);
            ctx.fillText('Mágica', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 8);
        } else {
            ctx.fillText('Captura', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 - 8);
            ctx.fillText('Direta', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 8);
        }
        
        const timeLeft = 1 - (Date.now() - powerUp.time) / 10000;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(powerUp.x, powerUp.y - 10, powerUp.width * timeLeft, 5);
    }
}

function updatePlayerPowerUp() {
    if (gameState.player.powerUp) {
        const timeLeft = (gameState.player.powerUp.duration * 1000) - (Date.now() - gameState.player.powerUpTime);
        
        if (timeLeft <= 0) {
            gameState.player.powerUp = null;
            powerUpIndicator.style.display = 'none';
        } else {
            const secondsLeft = Math.ceil(timeLeft / 1000);
            powerUpIndicator.textContent = `${gameState.player.powerUp.name} (${secondsLeft}s)`;
        }
    }
}

function drawPowerUpEffect() {
    if (!gameState.player.powerUp) return;
    
    const player = gameState.player;
    const centerX = player.x + player.width/2;
    const centerY = player.y + player.height/2;
    
    ctx.strokeStyle = gameState.player.powerUp.color;
    ctx.lineWidth = 2;
    
    if (gameState.player.powerUp.effect === 'autoCapture') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
        ctx.stroke();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * 120;
            const y = centerY + Math.sin(angle) * 120;
            
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(x - 3, y - 10, 6, 10);
            ctx.beginPath();
            ctx.moveTo(x, y - 20);
            ctx.lineTo(x - 10, y - 10);
            ctx.lineTo(x + 10, y - 10);
            ctx.closePath();
            ctx.fill();
        }
    } else if (gameState.player.powerUp.effect === 'magnet' && gameState.keys.action) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 250, 0, Math.PI * 2);
        ctx.stroke();
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * 250,
                centerY + Math.sin(angle) * 250
            );
            ctx.stroke();
        }
    }
}

function drawPlayer() {
    const player = gameState.player;
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(
        player.x + player.width/2, 
        player.y - 15, 
        20, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
        player.x + player.width/2 + (5 * player.direction), 
        player.y - 20, 
        5, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        player.x + player.width/2 + (5 * player.direction), 
        player.y - 10, 
        8, 
        0, 
        Math.PI
    );
    ctx.stroke();
    
    ctx.fillStyle = '#3498db';
    const armAngle = player.isMoving ? 
        Math.sin(Date.now() / 200) * 0.5 : 0;
    
    ctx.save();
    ctx.translate(player.x + 10, player.y + 20);
    ctx.rotate(armAngle * player.direction);
    ctx.fillRect(0, 0, 25, 10);
    ctx.restore();
    
    ctx.save();
    ctx.translate(player.x + player.width - 10, player.y + 20);
    ctx.rotate(-armAngle * player.direction);
    ctx.fillRect(-25, 0, 25, 10);
    ctx.restore();
    
    ctx.fillRect(player.x + 5, player.y + player.height, 15, -30);
    ctx.fillRect(player.x + player.width - 20, player.y + player.height, 15, -30);
}

function levelComplete() {
    gameState.isGameRunning = false;
    clearInterval(gameState.gameInterval);
    
    finalCo2Element.textContent = gameState.player.score;
    biomeFactElement.textContent = gameConfig.biomes[gameState.currentBiome].fact;
    levelCompleteScreen.style.display = 'flex';
}
function checkCO2Collisions() {
    const player = gameState.player;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    for (let i = gameState.co2Particles.length - 1; i >= 0; i--) {
        const co2 = gameState.co2Particles[i];
        const distance = Math.sqrt(
            Math.pow(playerCenterX - co2.x, 2) + 
            Math.pow(playerCenterY - co2.y, 2)
        );
        

        const collisionRadius = Math.max(player.width, player.height) / 2 + co2.radius;
        
        if (distance < collisionRadius) {
            captureCO2(co2);
            gameState.co2Particles.splice(i, 1);
        }
    }
}

window.onload = initGame;