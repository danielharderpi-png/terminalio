const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeMobileCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.85; 
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

// --- PHYSICS & PLAYER VARIABLES ---
let gravity = 0.6;
let jumpStrength = -12;
let gameState = 'idle'; 

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

// --- GAME LOOP ---
function mobileGameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Parallax Backgrounds
    bgLayers.forEach((layer) => {
        if (layer.img.complete && layer.img.width > 0) {
            let scale = canvas.height / layer.img.height;
            let scaledWidth = Math.ceil(layer.img.width * scale);
            
            let currentSpeed = layer.speed;
            if (gameState === 'idle') {
                currentSpeed = layer.speed * 0.25; 
            }

            layer.x = (layer.x - currentSpeed) % scaledWidth;

            for (let i = 0; i < 4; i++) {
                let drawX = layer.x + (i * scaledWidth);
                ctx.drawImage(layer.img, drawX, 0, scaledWidth + 1, canvas.height);
            }
        }
    });

    const floorY = canvas.height - 20; 

    if (gameState === 'idle') {
        // --- IDLE SCREEN UI (Scaled Up) ---
        
        const boxWidth = 400;
        const boxHeight = 120;
        const boxX = (canvas.width - boxWidth) / 2 + 50; 
        const boxY = (canvas.height - boxHeight) / 2; 

        const portSize = 140;
        const portX = boxX - portSize + 30; 
        const portY = boxY - 10; 

        // 1. Textbox Background
        if (heroTextboxImg.complete) {
            ctx.drawImage(heroTextboxImg, boxX, boxY, boxWidth, boxHeight);
        }

        // 2. Portrait Frame (Solid center, so we draw it before the face)
        if (portraitFrameImg.complete) {
            ctx.drawImage(portraitFrameImg, portX, portY, portSize, portSize);
        }

        // 3. Player Face (Drawn on top, scaled to fit inside the metal border)
        if (playerPortraitImg.complete) {
            ctx.drawImage(playerPortraitImg, portX + 16, portY + 16, portSize - 32, portSize - 32);
        }

        // Dialogue Text
        ctx.fillStyle = '#ffffff'; 
        ctx.font = '28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("TAAAAP ALLLREADY!!", boxX + boxWidth / 2 + 10, boxY + boxHeight / 2);
        ctx.textAlign = 'left'; 
        
    } else if (gameState === 'playing') {
        // --- ACTIVE GAMEPLAY ---
        
        player.velocityY += gravity;
        player.y += player.velocityY;

        if (player.y + player.height >= floorY) {
            player.y = floorY - player.height;
            player.velocityY = 0;
            player.isGrounded = true;
            
            if (player.state === 'jump') {
                player.state = 'run';
            }
        }

        if (player.state === 'attack') {
            player.attackTimer--;
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
            player.animTimer++;
            if (player.animTimer > 6) { 
                player.frameIndex = (player.frameIndex + 1) % runFrames.length;
                player.animTimer = 0;
            }
        }

        if (currentImg && currentImg.complete && currentImg.width > 0) {
            ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle = '#00ff41';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }

    requestAnimationFrame(mobileGameLoop);
}

// --- CONTROLS ---
window.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    
    if (gameState === 'idle') {
        gameState = 'playing';
        player.y = canvas.height - 20 - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
        player.state = 'run';
        return;
    }

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

mobileGameLoop();