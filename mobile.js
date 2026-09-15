const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeMobileCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.98; 
}
window.addEventListener('resize', resizeMobileCanvas);
resizeMobileCanvas();

// --- ASSET LOADING ---
const bgLayers = [];
const bgFilenames = [
    'bg_1.png', 
    'bg_2.png', 
    'bg_3.png', 
    'bg_4.png'  
];

bgFilenames.forEach((filename, index) => {
    let img = new Image();
    img.src = `assets/${filename}`;
    bgLayers.push({ img: img, x: 0, speed: (index + 1) * 0.4 }); 
});

const runFrames = [];
['player_idle_run1.png', 'player_run2.png', 'player_run3.png'].forEach(src => {
    let img = new Image();
    img.src = `assets/${src}`;
    runFrames.push(img);
});

const jumpImg = new Image();
jumpImg.src = 'assets/player_hurt_jump.png';

const attackImg = new Image();
attackImg.src = 'assets/player_atkswing.png'; 

// UI Assets
const portraitFrameImg = new Image();
portraitFrameImg.src = 'assets/portrait.png';

const playerPortraitImg = new Image();
playerPortraitImg.src = 'assets/player_portrait.png';

const heroTextboxImg = new Image();
heroTextboxImg.src = 'assets/hero_textbox.png';

// Spawn Animation Assets
const spawnFrames = [];
['spawn_1.png', 'spawn_2.png', 'spawn_3.png'].forEach(src => {
    let img = new Image();
    img.src = `assets/${src}`;
    spawnFrames.push(img);
});

// --- PHYSICS & PLAYER VARIABLES ---
let gravity = 0.6;
let jumpStrength = -12;
let gameState = 'idle'; // Options: 'idle', 'spawning', 'playing'

let player = {
    x: 50,
    y: 200,
    width: 80,  
    height: 80,
    velocityY: 0,
    isGrounded: false,
    state: 'run', 
    frameIndex: 0,
    animTimer: 0,
    attackTimer: 0
};

let spawnData = {
    frameIndex: 0,
    timer: 0,
    maxTimer: 6 
};

// --- GAME LOOP ---
let lastTime = 0; 

function mobileGameLoop(timestamp) {
    // 1. Calculate Delta Time
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Base the speed on a 60FPS target (approx 16.67ms per frame)
    const timeScale = deltaTime / 16.67;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Parallax Backgrounds
    bgLayers.forEach((layer, index) => {
        if (layer.img.complete && layer.img.width > 0) {
            let scale = canvas.height / layer.img.height;
            let scaledWidth = Math.ceil(layer.img.width * scale);
            
            let currentSpeed = layer.speed;
            if (gameState === 'idle') {
                currentSpeed = (index === 1) ? layer.speed * 0.5 : 0; 
            }

            layer.x = (layer.x - (currentSpeed * timeScale)) % scaledWidth;

            for (let i = 0; i < 4; i++) {
                let drawX = layer.x + (i * scaledWidth);
                ctx.drawImage(layer.img, drawX, 0, scaledWidth + 1, canvas.height);
            }
        }
    });

    const floorY = canvas.height - 20; 

    if (gameState === 'idle') {
        // --- IDLE SCREEN UI ---
        
        const boxWidth = 400;
        const boxHeight = 120;
        const boxX = (canvas.width - boxWidth) / 2 + 50; 
        const boxY = (canvas.height - boxHeight) / 2; 

        const portSize = 140;
        const portX = boxX - portSize + 30; 
        const portY = boxY - 10; 

        if (heroTextboxImg.complete) {
            ctx.drawImage(heroTextboxImg, boxX, boxY, boxWidth, boxHeight);
        }

        if (portraitFrameImg.complete) {
            ctx.drawImage(portraitFrameImg, portX, portY, portSize, portSize);
        }

        if (playerPortraitImg.complete) {
            ctx.drawImage(playerPortraitImg, portX + 16, portY + 16, portSize - 32, portSize - 32);
        }

        ctx.fillStyle = '#ffffff'; 
        ctx.font = '28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("TAAAAP ALLLREADY!!", boxX + boxWidth / 2 + 10, boxY + boxHeight / 2);
        ctx.textAlign = 'left'; 
        
    } else if (gameState === 'spawning') {
        // --- SPAWN ANIMATION SEQUENCE ---
        
        let currentSpawnImg = spawnFrames[spawnData.frameIndex];
        
        if (currentSpawnImg && currentSpawnImg.complete) {
            const spawnYOffset = 20;
            ctx.drawImage(currentSpawnImg, player.x, (floorY - player.height) + spawnYOffset, player.width, player.height);
        }

        spawnData.timer += timeScale;
        if (spawnData.timer > spawnData.maxTimer) {
            spawnData.timer = 0;
            spawnData.frameIndex++;
            
            if (spawnData.frameIndex >= spawnFrames.length) {
                gameState = 'playing';
                player.y = floorY - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
                player.state = 'run';
            }
        }
        
    } else if (gameState === 'playing') {
        // --- ACTIVE GAMEPLAY ---
        
        player.velocityY += (gravity * timeScale);
        player.y += (player.velocityY * timeScale);

        if (player.y + player.height >= floorY) {
            player.y = floorY - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
            
            if (player.state === 'jump') {
                player.state = 'run';
            }
        }

        if (player.state === 'attack') {
            player.attackTimer -= timeScale;
            if (player.attackTimer <= 0) {
                player.state = player.isGrounded ? 'run' : 'jump';
            }
        }

        let currentImg;
        if (player.state === 'attack') {
            currentImg = attackImg;
        } else if (player.state === 'jump') {
            currentImg = jumpImg;
        } else {
            currentImg = runFrames[player.frameIndex];
            player.animTimer += timeScale;
            if (player.animTimer > 6) { 
                player.frameIndex = (player.frameIndex + 1) % runFrames.length;
                player.animTimer = 0;
            }
        }

        if (currentImg && currentImg.complete && currentImg.width > 0) {
            let drawWidth = player.width;
            
            if (player.state === 'attack') {
                const aspectRatio = currentImg.width / currentImg.height;
                drawWidth = player.height * aspectRatio;
            }
            
            ctx.drawImage(currentImg, player.x, player.y, drawWidth, player.height);
        } else {
            ctx.fillStyle = '#00ff41';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    requestAnimationFrame(mobileGameLoop);
}

// --- CONTROLS ---
window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.terminal-nav')) return;
    if (window.isMenuOpen) return;

    e.preventDefault(); 
    
    if (gameState === 'idle') {
        gameState = 'spawning';
        spawnData.frameIndex = 0;
        spawnData.timer = 0;
        document.getElementById('backBtn').style.display = 'block';
        return;
    }

    if (gameState === 'spawning') return;

    const touchX = e.touches[0].clientX;
    const screenCenter = window.innerWidth / 2;

    if (touchX < screenCenter) {
        if (player.isGrounded) {
            player.velocityY = jumpStrength;
            player.isGrounded = false;
            player.state = 'jump';
        }
    } else {
        player.state = 'attack';
        player.attackTimer = 15; 
    }
}, { passive: false });


// --- MOBILE UI OVERRIDES ---

document.body.style.backgroundColor = '#000000';
document.body.style.backgroundImage = 'none';

// Strip padding and borders from the layout container so the canvas sits flush
const gameColumn = document.querySelector('.game-column');
if (gameColumn) {
    gameColumn.style.padding = '0';
    gameColumn.style.border = 'none';
    gameColumn.style.backgroundColor = 'transparent';
    gameColumn.style.backdropFilter = 'none';
}

const layoutContainer = document.querySelector('.layout-container');
if (layoutContainer) {
    layoutContainer.style.margin = '0';
    layoutContainer.style.width = '100%';
}

const mobileTerminalContainer = document.createElement('div');
mobileTerminalContainer.style.position = 'absolute';
mobileTerminalContainer.style.bottom = '2.5dvh'; 
mobileTerminalContainer.style.right = '25px';
mobileTerminalContainer.style.zIndex = '1000';
mobileTerminalContainer.style.display = 'flex';
mobileTerminalContainer.style.flexDirection = 'column';
mobileTerminalContainer.style.alignItems = 'flex-end';

const terminalBox = document.createElement('div');
terminalBox.style.display = 'none'; 
terminalBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
terminalBox.style.color = '#00ff41';
terminalBox.style.border = '1px solid #00ff41';
terminalBox.style.padding = '10px';
terminalBox.style.marginBottom = '2px';
terminalBox.style.fontFamily = 'monospace';
terminalBox.style.fontSize = '14px';
terminalBox.style.borderRadius = '4px';
terminalBox.innerText = 'danielharder.stuff@gmail.com';

const toggleBtn = document.createElement('div');
toggleBtn.innerText = 'X';
toggleBtn.style.color = '#00ff41';
toggleBtn.style.fontFamily = 'monospace';
toggleBtn.style.fontSize = '24px';
toggleBtn.style.fontWeight = 'bold';
toggleBtn.style.cursor = 'pointer';
toggleBtn.style.userSelect = 'none';

toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    if (terminalBox.style.display === 'none') {
        terminalBox.style.display = 'block';
        toggleBtn.innerText = 'V';
    } else {
        terminalBox.style.display = 'none';
        toggleBtn.innerText = 'X';
    }
});

terminalBox.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
toggleBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });

mobileTerminalContainer.appendChild(terminalBox);
mobileTerminalContainer.appendChild(toggleBtn);
document.body.appendChild(mobileTerminalContainer);

// Build the Back Arrow UI
const backBtn = document.createElement('div');
backBtn.id = 'backBtn';
backBtn.innerText = '<';
backBtn.style.color = '#00ff41';
backBtn.style.fontFamily = 'monospace';
backBtn.style.fontSize = '28px';
backBtn.style.fontWeight = 'bold';
backBtn.style.position = 'absolute';
backBtn.style.top = '75px'; 
backBtn.style.right = '25px';
backBtn.style.cursor = 'pointer';
backBtn.style.userSelect = 'none';
backBtn.style.zIndex = '1000';
backBtn.style.display = 'none'; 

const handleBack = (e) => {
    e.stopPropagation(); 
    if (gameState === 'playing' || gameState === 'spawning') {
        gameState = 'idle';
        backBtn.style.display = 'none';
    }
};

backBtn.addEventListener('click', handleBack);
backBtn.addEventListener('touchstart', handleBack, { passive: false });

document.body.appendChild(backBtn);

requestAnimationFrame(mobileGameLoop);