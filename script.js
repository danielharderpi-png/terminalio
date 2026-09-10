const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Helper function to dynamically load numbered image sequences
function loadSequence(prefix, frameCount) {
    let frames = [];
    for (let i = 1; i <= frameCount; i++) {
        let img = new Image();
        let paddedNum = i.toString().padStart(2, '0');
        img.src = `assets/${prefix}_${paddedNum}.png`;
        frames.push(img);
    }
    return frames;
}

// --- SPRITE CONFIGURATION ---
const sprites = {
    heroIdle: { isSequence: true, frames: 10, imgs: loadSequence('hero_idle', 10) },
    heroIdleToRun: { isSequence: true, frames: 1, imgs: loadSequence('hero_idleto_run', 1) },
    heroRun: { isSequence: true, frames: 8, imgs: loadSequence('hero_run', 8) },
    heroAttack: { isSequence: true, frames: 7, imgs: loadSequence('hero_atk3', 7) },
    heroHurt: { isSequence: true, frames: 1, imgs: loadSequence('hero_hurt', 1) },
    heroHurtToIdle: { isSequence: true, frames: 8, imgs: loadSequence('hero_hurt2idle', 8) },
    heroDead: { isSequence: true, frames: 8, imgs: loadSequence('hero_dead', 8) },
    catIdle: { img: new Image(), src: 'assets/cat_IDLE.png', frames: 4 },
    catWalk: { img: new Image(), src: 'assets/cat_WALK.png', frames: 8 },
    catRun: { img: new Image(), src: 'assets/cat_RUN.png', frames: 8 },
    catJump: { img: new Image(), src: 'assets/cat_RUNNING JUMP.png', frames: 8 },
    catHurt: { img: new Image(), src: 'assets/cat_HURT.png', frames: 4 },
    catAttack: { img: new Image(), src: 'assets/cat_ATTACK 1.png', frames: 8 }
};

Object.values(sprites).forEach(sprite => {
    if (!sprite.isSequence) {
        sprite.img.src = sprite.src;
    }
});

// --- STATE MACHINES & ANIMATION VARIABLES ---
let heroState = 'idle';
let heroSequence = []; 
let heroAnim = { frameX: 0, frameTimer: 0, holdTimer: 0 };
let heroHP = 3; 

let bossCat = {
    x: 1200, 
    y: 480, 
    hp: 2, 
    state: 'run', 
    frameX: 0,
    frameTimer: 0,
    idleTimer: 0,
    hurtTimer: 0
};

// --- PARALLAX BACKGROUND LOGIC ---
const bgImageSources = [
    { src: 'assets/sunny_1.png', speed: 0.1 },
    { src: 'assets/sunny_2.png', speed: 0.2 },
    { src: 'assets/sunny_3.png', speed: 0.4 },
    { src: 'assets/sunny_5.png', speed: 0.8 },
    { src: 'assets/sunny_8.png', speed: 1.5 }
];

class BackgroundLayer {
    constructor(imageSrc, speedModifier) {
        this.x = 0;
        this.y = 0;
        this.width = 0; 
        this.height = 0;
        this.speedModifier = speedModifier;
        this.image = new Image();
        this.image.src = imageSrc;
        this.image.onload = () => {
            this.height = canvas.height;
            this.width = Math.ceil((this.image.width / this.image.height) * this.height);
        };
    }
    update(gameState, layerIndex) {
        let currentSpeed = this.speedModifier;
        
        let heroBraking = (heroState === 'hurt' || heroState === 'hurt2idle' || heroState === 'dead');
        
        if (gameState !== 'playing' || heroBraking) {
            if (layerIndex <= 1) { 
                currentSpeed = this.speedModifier * 0.5; 
            } else {
                currentSpeed = 0; 
            }
        }

        this.x -= currentSpeed;
        if (this.x <= -this.width) {
            this.x = 0;
        }
    }
    draw(ctx) {
        if (this.width > 0) {
            let drawX = Math.floor(this.x);
            let tilesNeeded = Math.ceil(canvas.width / this.width) + 1;
            
            for (let i = 0; i < tilesNeeded; i++) {
                ctx.drawImage(this.image, drawX + (this.width * i) - i, this.y, this.width, this.height);
            }
        }
    }
}

let backgroundLayers = [];
function initParallax() {
    backgroundLayers = bgImageSources.map(layer => new BackgroundLayer(layer.src, layer.speed));
}

function resizeCanvas() {
    const gameColumn = document.querySelector('.game-column');
    canvas.width = gameColumn.clientWidth - 60; 
    canvas.height = 600; 
    initParallax(); 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- AUDIO LOGIC ---
const bgMusic = new Audio('assets/backgroundvibe.mp3');
bgMusic.loop = true; 
bgMusic.volume = 0; 
const errorSound = new Audio('assets/smallboom.wav');
const successSound = new Audio('assets/successboom.wav');
const clackSound = new Audio('assets/clack.wav'); 

const smokeImg = new Image();
smokeImg.src = 'assets/explosion_01.png';

// Add this right here to load the portrait for the dialogue box
const heroPortrait = new Image();
heroPortrait.src = 'assets/hero_portrait.png';

const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
    bgMusic.muted = !bgMusic.muted;
    muteBtn.innerText = bgMusic.muted ? '🔈 Unmute' : '🔊 Mute';
});

const sharedWords = [
    'ping', 'ssh', 'ftp', 'dns', 'dhcp', 'mac', 'lan', 'wan', 'ram', 'cpu', 
    'gpu', 'ssd', 'hdd', 'usb', 'bios', 'uefi', 'arp', 'nat', 'sudo', 'dir', 
    'ls', 'pwd', 'grep', 'cat', 'echo', 'kill', 'top', 'vim', 'nano', 'tcp', 
    'udp', 'tls', 'ssl', 'http', 'pop3', 'imap', 'smtp', 'bash', 'cmd', 'host',
    'port21', 'port22', 'port23', 'port25', 'port53', 'port80', 'port443', 'port3389',
    'router', 'switch', 'firewall', 'subnet', 'gateway', 'packet', 'malware', 
    'phishing', 'botnet', 'trojan', 'rootkit', 'spyware', 'adware', 'crypto', 
    'kernel', 'proxy', 'cache', 'vlan', 'ipconfig', 'ifconfig', 'netstat', 
    'tracert', 'nslookup', 'taskkill', 'chmod', 'chown', 'systemd', 'service', 
    'docker', 'hyperv', 'vmware', 'apache', 'linux', 'windows', 'server'
];

const wordLibrary = {
    practice: sharedWords,
    medium: sharedWords,
    hard: [
        'motherboard', 'virtualization', 'troubleshooting', 'authentication', 
        'authorization', 'cryptography', 'steganography', 'ransomware', 
        'vulnerability', 'penetration', 'cybersecurity', 'infrastructure', 
        'encapsulation', 'asymmetric', 'symmetric', 'biometrics', 'hypervisor', 
        'provisioning', 'redundancy', 'scalability', 'middleware', 'deployment', 
        'repository', 'powershell', 'wireshark', 'nmap', 'metasploit', 'tcpdump', 
        'traceroute', 'activedirectory', 'grouppolicy', 'sysinternals', 'throughput'
    ]
};

const difficultySelect = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn'); 
const endBtn = document.getElementById('endBtn'); 

endBtn.addEventListener('click', () => {
    if (gameState === 'playing') {
        gameState = 'idle';
        bgMusic.pause();
        bgMusic.currentTime = 0;
        bgMusic.volume = 0;
        activeWords = [];
        particles = [];
        bossCat.x = canvas.width + 100;
        setHeroState('idle'); 
    }
});

let sessionPlayer = null;
let leaderboard = JSON.parse(localStorage.getItem('termLeaderboard')) || [];

function updateLeaderboardUI() {
    const grid = document.getElementById('leaderboardGrid');
    grid.innerHTML = ''; 
    for (let i = 0; i < 3; i++) {
        let user = leaderboard[i];
        if (user) {
            grid.innerHTML += `
                <div class="score-card">
                    <span class="rank">#${i + 1}</span>
                    <span class="name">${user.name}</span>
                    <span class="score">Score: ${user.score}</span>
                    <span class="wpm">Speed: ${user.wpm} WPM</span>
                </div>
            `;
        } else {
            grid.innerHTML += `
                <div class="score-card empty">
                    <span class="rank">#${i + 1}</span>
                    <span class="name">---</span>
                    <span class="score">Score: ---</span>
                    <span class="wpm">Speed: ---</span>
                </div>
            `;
        }
    }
}
updateLeaderboardUI(); 

function saveToLeaderboard(name, newScore, newWpm) {
    let existingUser = leaderboard.find(user => user.name === name);
    if (existingUser) {
        if (newScore > existingUser.score) existingUser.score = newScore;
        if (newWpm > existingUser.wpm) existingUser.wpm = newWpm;
    } else {
        leaderboard.push({ name: name, score: newScore, wpm: newWpm });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 3);
    localStorage.setItem('termLeaderboard', JSON.stringify(leaderboard));
    updateLeaderboardUI();
}

document.getElementById('saveNameBtn').addEventListener('click', () => {
    let name = document.getElementById('playerNameInput').value.trim().toUpperCase() || 'ANON';
    sessionPlayer = name;
    document.getElementById('nameModal').classList.add('hidden');
    saveToLeaderboard(sessionPlayer, score, finalWPM);
});

document.getElementById('playerNameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('saveNameBtn').click();
    }
});

let currentDifficulty = difficultySelect.value; 
let activeWords = []; 
let targetedWord = null; 

let score = 0;
let gameState = 'idle'; 
let startTime = Date.now();
let totalKeysTyped = 0;
let totalErrors = 0;
let finalWPM = 0;
let frameCount = 0; 
let isFlashing = false;
let flashFrames = 0;
let particles = [];

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 8; 
        this.vy = (Math.random() - 0.5) * 8; 
        this.life = 1.0; 
        this.decay = Math.random() * 0.05 + 0.02; 
        this.size = Math.random() * 20 + 20; 
        this.rotation = Math.random() * Math.PI * 2; 
    }
    update() { 
        this.x += this.vx; 
        this.y += this.vy; 
        this.life -= this.decay; 
        this.size += 0.5; 
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life); 
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (smokeImg.complete && smokeImg.width > 0) {
            ctx.drawImage(smokeImg, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

function triggerExplosion(x, y, wordWidth) {
    for(let i = 0; i < 15; i++) particles.push(new Particle(x + (wordWidth / 2), y - 20));
}

function spawnWord() {
    const list = wordLibrary[currentDifficulty];
    const activeStartingLetters = activeWords.map(w => w.text[0]);
    
    let availableWords = list.filter(word => !activeStartingLetters.includes(word[0]));
    if (availableWords.length === 0) {
        availableWords = list.filter(word => !activeWords.some(active => active.text === word));
    }
    
   const text = availableWords.length > 0 
        ? availableWords[Math.floor(Math.random() * availableWords.length)]
        : list[Math.floor(Math.random() * list.length)];

    ctx.font = '32px "Fredoka", sans-serif';
    const wordWidth = ctx.measureText(text).width;

    let y;
    let x = canvas.width + 50;
    let attempts = 0;
    let isOverlapping = true;

    while (isOverlapping && attempts < 15) {
        y = 100 + (Math.random() * ((canvas.height / 2) - 50)); 
        
        isOverlapping = activeWords.some(activeWord => {
            let yOverlap = Math.abs(y - activeWord.y) < 50; 
            let xOverlap = Math.abs(x - activeWord.x) < (wordWidth + 150); 
            return yOverlap && xOverlap;
        });
        
        if (isOverlapping) x += 150; 
        attempts++;
    }

    const speed = Math.random() * 0.8 + 1.5; 
    activeWords.push({ text: text, typed: '', x: x, y: y, speed: speed, frameX: 0, frameTimer: 0 });
}

difficultySelect.addEventListener('change', (e) => currentDifficulty = e.target.value);

function setHeroState(newState, queue = []) {
    heroState = newState;
    heroSequence = queue;
    heroAnim.frameX = 0;
    heroAnim.frameTimer = 0;
    heroAnim.holdTimer = 0;
}

startBtn.addEventListener('click', () => {
    gameState = 'playing';
    activeWords = [];
    targetedWord = null;
    score = 0;
    totalKeysTyped = 0;
    totalErrors = 0;
    isFlashing = false;
    flashFrames = 0;
    particles = []; 
    frameCount = 0;
    startTime = Date.now();
    startBtn.blur(); 
    
    heroHP = 3; 
    setHeroState('idle2run', ['run']); 

    bossCat = {
        x: canvas.width + 50,
        y: canvas.height - 220,
        hp: 2,
        state: 'run',
        frameX: 0,
        frameTimer: 0,
        idleTimer: 0,
        hurtTimer: 0
    };

    // Start music on game start
    bgMusic.play();
    let fadeInterval = setInterval(() => {
        if (bgMusic.volume < 0.35) {
            bgMusic.volume = Math.min(0.35, bgMusic.volume + 0.05);
        } else { clearInterval(fadeInterval); }
    }, 100); 

    spawnWord(); 
});

canvas.addEventListener('click', (e) => {
    if (gameState === 'idle') {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const btnX = canvas.width / 2 - 75;
        const btnY = canvas.height / 2 + 20;
        const btnWidth = 150;
        const btnHeight = 40;
        
        if (clickX >= btnX && clickX <= btnX + btnWidth && clickY >= btnY && clickY <= btnY + btnHeight) {
            startBtn.click(); 
        }
    }
});

function triggerHeroDamage() {
    totalErrors++; 
    isFlashing = true; 
    flashFrames = 15; 
    errorSound.currentTime = 0;
    errorSound.play();
    
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 200);

    heroHP -= 1; 

    if (heroHP <= 0) {
        setHeroState('dead', []);
    } else {
        setHeroState('hurt', ['hurt2idle', 'idle2run', 'run']);
    }

    if (targetedWord) {
        targetedWord.typed = ''; 
        targetedWord = null; 
    }
}

function triggerTypoPenalty() {
    totalErrors++; 
    score = Math.max(0, score - 5);
    errorSound.currentTime = 0;
    errorSound.play();
    
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 200);

    if (targetedWord) {
        targetedWord.typed = ''; 
        targetedWord = null; 
    }
}

// --- UPDATED KEYDOWN LISTENER ---
window.addEventListener('keydown', (e) => {
    if (typeof terminalOpen !== 'undefined' && terminalOpen) return;
    if (gameState !== 'playing' || isFlashing || heroState === 'dead') return; 
    
    // Ignore the spacebar entirely
    if (e.code === 'Space') return; 
    if (e.key.length !== 1) return; 

    // Convert all keystrokes to lowercase to ignore Caps Lock/Shift
    const key = e.key.toLowerCase(); 

    clackSound.currentTime = 0;
    clackSound.play();

    if (!targetedWord) {
        let possibleTargets = activeWords.filter(w => w.text.startsWith(key));
        
        if (possibleTargets.length > 0) {
            possibleTargets.sort((a, b) => a.x - b.x); 
            targetedWord = possibleTargets[0];
            targetedWord.typed += key;
            totalKeysTyped++;
        } else {
            triggerTypoPenalty(); 
        }
    } else {
        const expectedLetter = targetedWord.text[targetedWord.typed.length].toLowerCase();
        if (key === expectedLetter) {
            targetedWord.typed += key;
            totalKeysTyped++; 
            
            if (targetedWord.typed === targetedWord.text) {
                score += 10;
                successSound.currentTime = 0;
                successSound.play();
                
                ctx.font = '32px "Fredoka", sans-serif';
                triggerExplosion(targetedWord.x, targetedWord.y, ctx.measureText(targetedWord.text).width);
                
                setHeroState('attack', ['run']);

                if (currentDifficulty !== 'practice') {
                    bossCat.hp -= 1;
                    
                    if (bossCat.hp <= 0) {
                        triggerExplosion(bossCat.x + 45, bossCat.y + 105, 100);
                        bossCat.x = canvas.width + 100;
                        bossCat.hp = 2; 
                        bossCat.state = 'run';
                        bossCat.idleTimer = 0;
                        bossCat.hurtTimer = 0;
                    } else {
                        bossCat.state = 'hurt';
                        bossCat.hurtTimer = 30; 
                    }
                }

                activeWords = activeWords.filter(w => w !== targetedWord);
                targetedWord = null; 
            }
        } else {
            triggerTypoPenalty();
        }
    }
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    backgroundLayers.forEach((layer, index) => {
        layer.update(gameState, index);
        layer.draw(ctx);
    });

    if (gameState === 'idle') {
        ctx.fillStyle = '#00ff41'; ctx.font = '40px monospace';
        ctx.fillText("SYSTEM READY", canvas.width / 2 - 140, canvas.height / 2);
        
        ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
        ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2 + 20, 150, 40);
        ctx.strokeStyle = '#00ff41';
        ctx.strokeRect(canvas.width / 2 - 75, canvas.height / 2 + 20, 150, 40);
        
        ctx.fillStyle = '#00ff41'; ctx.font = '24px monospace';
        ctx.fillText("START", canvas.width / 2 - 35, canvas.height / 2 + 48);

        let activeSprite = sprites.heroIdle;
        let frameImg = activeSprite.imgs[heroAnim.frameX];

        if (frameImg && frameImg.complete && frameImg.width > 0) {
            heroAnim.frameTimer++;
            if (heroAnim.frameTimer >= 6) { 
                heroAnim.frameX = (heroAnim.frameX + 1) % activeSprite.frames;
                heroAnim.frameTimer = 0;
            }
            
            const heroScale = 3; 
            let destWidth = frameImg.width * heroScale;
            let destHeight = frameImg.height * heroScale;
            let destY = (canvas.height - 90) - destHeight;
            
            ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, 150, destY, destWidth, destHeight);
        }

        requestAnimationFrame(gameLoop);
        return; 
    }

    if (gameState === 'gameover') {
        if (heroHP <= 0) {
            // --- DEATH SCREEN (HP hits 0) ---
            ctx.fillStyle = '#ff003c'; ctx.font = '40px monospace';
            ctx.fillText("SYSTEM FAILURE", canvas.width / 2 - 160, canvas.height / 2 - 40);
            ctx.fillStyle = '#00ff41'; ctx.font = '20px monospace';
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 90, canvas.height / 2 + 10);
            ctx.fillText(`Net Speed: ${finalWPM} WPM`, canvas.width / 2 - 90, canvas.height / 2 + 40);
            
            let activeSprite = sprites.heroDead;
            let frameImg = activeSprite.imgs[activeSprite.frames - 1];

            if (frameImg && frameImg.complete && frameImg.width > 0) {
                const heroScale = 3; 
                let destWidth = frameImg.width * heroScale;
                let destHeight = frameImg.height * heroScale;
                let destY = (canvas.height - 90) - destHeight;
                ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, 150, destY, destWidth, destHeight);
            }
        } else {
            // --- SURVIVAL SCREEN (Timer ran out) ---
            ctx.fillStyle = '#00ff41'; ctx.font = '40px monospace';
            ctx.fillText("TIME UP - SURVIVED", canvas.width / 2 - 200, canvas.height / 2 - 90);
            ctx.font = '20px monospace';
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 90, canvas.height / 2 - 50);
            ctx.fillText(`Net Speed: ${finalWPM} WPM`, canvas.width / 2 - 90, canvas.height / 2 - 20);

            // Draw Dialogue Box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(canvas.width / 2 - 250, canvas.height / 2 + 20, 500, 100, 10);
                ctx.fill();
                ctx.strokeStyle = '#00ff41';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillRect(canvas.width / 2 - 250, canvas.height / 2 + 20, 500, 100);
                ctx.strokeStyle = '#00ff41';
                ctx.strokeRect(canvas.width / 2 - 250, canvas.height / 2 + 20, 500, 100);
            }

            // Draw Portrait (Assuming 80x80 size)
            if (heroPortrait.complete && heroPortrait.width > 0) {
                ctx.drawImage(heroPortrait, canvas.width / 2 - 240, canvas.height / 2 + 30, 80, 80);
            }

            // Draw Dwarven Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px monospace';
            ctx.fillText('"Aye, fine work lad! Ye type like', canvas.width / 2 - 140, canvas.height / 2 + 55);
            ctx.fillText('a true champion of the deep halls!"', canvas.width / 2 - 140, canvas.height / 2 + 85);

            // Animate the Idle Hero
            let activeSprite = sprites.heroIdle;
            let frameImg = activeSprite.imgs[heroAnim.frameX];

            if (frameImg && frameImg.complete && frameImg.width > 0) {
                heroAnim.frameTimer++;
                if (heroAnim.frameTimer >= 6) { 
                    heroAnim.frameX = (heroAnim.frameX + 1) % activeSprite.frames;
                    heroAnim.frameTimer = 0;
                }
                
                const heroScale = 3; 
                let destWidth = frameImg.width * heroScale;
                let destHeight = frameImg.height * heroScale;
                let destY = (canvas.height - 90) - destHeight;
                ctx.drawImage(frameImg, 0, 0, frameImg.width, frameImg.height, 150, destY, destWidth, destHeight);
            }
        }

        requestAnimationFrame(gameLoop);
        return; 
    }

    let elapsedMs = Date.now() - startTime;
    
    // Set 5 minutes (300,000ms) for practice mode, and 90 seconds (90,000ms) for medium and hard
    let timeLimitMs = (currentDifficulty === 'practice') ? (5 * 60 * 1000) : (90 * 1000); 

    if (elapsedMs >= timeLimitMs) {
        endGame(elapsedMs);
    }

    // Calculate remaining time for the countdown
    let remainingMs = Math.max(0, timeLimitMs - elapsedMs);
    let minutes = Math.floor(remainingMs / 60000);
    let seconds = Math.floor((remainingMs % 60000) / 1000);
    let formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    let hSpriteMap = {
        'idle': sprites.heroIdle,
        'idle2run': sprites.heroIdleToRun,
        'run': sprites.heroRun,
        'attack': sprites.heroAttack,
        'hurt': sprites.heroHurt,
        'hurt2idle': sprites.heroHurtToIdle,
        'dead': sprites.heroDead
    };

    let activeSprite = hSpriteMap[heroState] || sprites.heroRun;
    
    let frameImg, sX, sY, sWidth, sHeight;

    if (activeSprite.isSequence) {
        frameImg = activeSprite.imgs[heroAnim.frameX];
        if (frameImg) {
            sX = 0;
            sY = 0;
            sWidth = frameImg.width;
            sHeight = frameImg.height;
        }
    } else {
        frameImg = activeSprite.img;
        if (frameImg) {
            sWidth = Math.floor(frameImg.width / activeSprite.frames); 
            sHeight = frameImg.height;
            sX = heroAnim.frameX * sWidth;
            sY = 0;
        }
    }

    if (frameImg && frameImg.complete && frameImg.width > 0) {
        let animSpeed = 5; 
        
        if (activeSprite.frames === 1) {
            heroAnim.holdTimer++;
            if (heroAnim.holdTimer >= 4) { 
                if (heroSequence.length > 0) {
                    setHeroState(heroSequence.shift(), heroSequence);
                }
            }
        } else {
            heroAnim.frameTimer++;
            if (heroAnim.frameTimer >= animSpeed) { 
                heroAnim.frameTimer = 0;
                
                if (heroState === 'dead' && heroAnim.frameX === activeSprite.frames - 1) {
                    endGame(elapsedMs); 
                } else {
                    heroAnim.frameX++;
                    
                    if (heroAnim.frameX >= activeSprite.frames) {
                        if (heroSequence.length > 0) {
                            setHeroState(heroSequence.shift(), heroSequence);
                        } else {
                            heroAnim.frameX = 0;
                        }
                    }
                }
            }
        }

        const heroScale = 3; 
        let destWidth = sWidth * heroScale;
        let destHeight = sHeight * heroScale;
        let groundLevel = canvas.height - 90;
        let destY = groundLevel - destHeight;

        ctx.drawImage(
            frameImg, 
            sX, sY, sWidth, sHeight,
            150, destY, destWidth, destHeight
        );
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update(); p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (!isFlashing && heroState !== 'dead') {
        frameCount++;
        
        // Slightly faster base spawn rate to keep the pace up
        let currentSpawnRate = Math.max(120, 260 - Math.floor(score / 20) * 10);
        
        // Keep at least 3 words in play at all times so you never wait
        if (activeWords.length < 3 || frameCount >= currentSpawnRate) {
            spawnWord();
            frameCount = 0; 
        }
        activeWords.forEach(w => w.x -= w.speed);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(10, 15, 200, 130, 8);
        ctx.fill();
    } else {
        ctx.fillRect(10, 15, 200, 130);
    }
    
    ctx.fillStyle = '#00ff41'; ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Errors: ${totalErrors}`, 20, 70); 
    ctx.fillText(`Time: ${formattedTime}`, 20, 100); 
    ctx.fillText(`HP: ${heroHP}`, 20, 130); 

    ctx.font = '32px "Fredoka", sans-serif';
    
    activeWords.forEach(w => {
        let typedWidth = ctx.measureText(w.typed).width;
        let remainingWord = w.text.slice(w.typed.length);
        let nextLetter = remainingWord[0] || '';
        let restOfWord = remainingWord.slice(1);
        let fullWordWidth = ctx.measureText(w.text).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(w.x - 10, w.y - 25, fullWordWidth + 20, 34, 5);
            ctx.fill();
        } else {
            ctx.fillRect(w.x - 10, w.y - 25, fullWordWidth + 20, 34);
        }

        if (w === targetedWord) {
            ctx.fillStyle = '#00ff41';
            ctx.fillText(w.typed, w.x, w.y);
        }
        
        if (isFlashing && w === targetedWord) {
            ctx.fillStyle = '#ff003c'; 
        } else {
            ctx.fillStyle = '#ffffff'; 
        }
        
        if (nextLetter) {
            ctx.fillText(nextLetter, w.x + typedWidth, w.y);
            let nextLetterWidth = ctx.measureText(nextLetter).width;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(restOfWord, w.x + typedWidth + nextLetterWidth, w.y);
        }

        if (w.x < -100) {
            activeWords = activeWords.filter(active => active !== w);
            score = Math.max(0, score - 10);
        }
    });

    let previousState = bossCat.state;

    if (bossCat.hurtTimer > 0) {
        bossCat.hurtTimer--;
        bossCat.state = 'hurt'; 
    } else if (!isFlashing && heroState !== 'dead') {
        let speedMod = (bossCat.hp === 1) ? 0.5 : 1; 

        if (currentDifficulty === 'practice') {
            bossCat.state = 'run';
            bossCat.x -= (2.0 * speedMod); 
            if (bossCat.x < -150) { 
                bossCat.x = canvas.width + 100; 
                bossCat.hp = 2; 
            }
        } else {
            if (bossCat.x > 250) {
                bossCat.state = 'run';
                bossCat.x -= (2.0 * speedMod); 
            } else {
                bossCat.state = 'attack';
            }
        }
    }

    if (previousState !== bossCat.state) {
        bossCat.frameX = 0;
        bossCat.frameTimer = 0;
    }

    let catSprite = sprites.catRun;
    let animSpeedCat = 5; 
    
    if (bossCat.state === 'hurt') {
        catSprite = sprites.catHurt;
        animSpeedCat = 8;
    }
    if (bossCat.state === 'attack') {
        catSprite = sprites.catAttack;
        animSpeedCat = 6; 
    }

    if (catSprite.img.complete && catSprite.img.width > 0) {
        let frameWidth = Math.floor(catSprite.img.width / catSprite.frames); 
        let frameHeight = catSprite.img.height;
        
        bossCat.frameTimer++;
        if (bossCat.frameTimer >= animSpeedCat) { 
            bossCat.frameX = (bossCat.frameX + 1) % catSprite.frames;
            bossCat.frameTimer = 0;
        }
        
        ctx.drawImage(
            catSprite.img, 
            bossCat.frameX * frameWidth, 0, frameWidth, frameHeight,
            bossCat.x, bossCat.y + 15, 140, 140 
        );

        if (bossCat.x <= 250 && currentDifficulty !== 'practice' && heroState !== 'dead') {
            bossCat.idleTimer++; 
            if (bossCat.idleTimer >= 45) { 
                triggerHeroDamage(); 
                bossCat.x = canvas.width + 100; 
                bossCat.hp = 2; 
                bossCat.state = 'run';
                bossCat.idleTimer = 0;
            }
        }
    }

    if (isFlashing) {
        flashFrames--; 
        if (flashFrames <= 0) isFlashing = false; 
    }

    requestAnimationFrame(gameLoop);
}

function endGame(elapsedMs) {
    if (gameState === 'gameover') return; 
    gameState = 'gameover';

    // If time ran out and we are still alive, go back to idle
    if (heroHP > 0) {
        setHeroState('idle', []);
    }

    let minutesPlayed = elapsedMs / 60000;
    let grossWords = (totalKeysTyped / 5);
    finalWPM = Math.max(0, Math.round((grossWords - totalErrors) / minutesPlayed));
    
    bgMusic.pause();
    bgMusic.currentTime = 0;

    if (score > 0) {
        if (!sessionPlayer) {
            document.getElementById('nameModal').classList.remove('hidden');
            document.getElementById('playerNameInput').focus();
        } else {
            saveToLeaderboard(sessionPlayer, score, finalWPM);
        }
    }
}

gameLoop();

// --- TERMINAL OVERLAY LOGIC ---
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalInputLine = document.querySelector('.terminal-input-line');
let terminalOpen = false;
let hasBooted = false; 

// Listen for Left CTRL key to toggle terminal
document.addEventListener('keydown', (e) => {
    if (e.code === 'ControlLeft') {
        terminalOpen = !terminalOpen;
        if (terminalOpen) {
            if (typeof gameState !== 'undefined' && gameState === 'playing') {
                document.getElementById('endBtn').click();
            }

            terminalOverlay.classList.remove('hidden');
            
            if (!hasBooted) {
                runBootSequence();
            } else {
                terminalInput.value = ''; 
                setTimeout(() => terminalInput.focus(), 50); 
            }
        } else {
            terminalOverlay.classList.add('hidden');
            terminalInput.blur();
        }
    }
});

function runBootSequence() {
    hasBooted = true;
    terminalInput.disabled = true;
    terminalOutput.innerHTML = '';
    terminalInputLine.style.display = 'none'; 

    // Updated Diagnostic Boot Sequence
    const bootLines = [
        "[00.388] initializing sandbox...",
        "[00.401] mounting local filesystem...",
        "[00.417] starting diagnostic service...",
        "[00.433] starting network service...",
        "[00.449] starting guest session...",
        "<br>[00.452] running environment verification...<br>",
        "filesystem ............ <span style='color: #00ff41;'>OK</span>",
        "network ............... <span style='color: #00ff41;'>OK</span>",
        "runtime ............... <span style='color: #00ff41;'>OK</span>",
        "permissions ........... <span style='color: #00ff41;'>OK</span><br>",
        "[00.501] loading terminal interface...",
        "[00.512] terminal interface ready<br>",
        "SYSTEM STATUS: <span style='color: #00ff41;'>NOMINAL</span>"
    ];

    let delay = 0;
    bootLines.forEach((line) => {
        setTimeout(() => {
            terminalOutput.innerHTML += `<div>${line}</div>`;
            terminalOverlay.scrollTop = terminalOverlay.scrollHeight;
        }, delay);
        delay += (Math.random() * 300) + 150; 
    });

    setTimeout(() => {
        terminalOutput.innerHTML += `<br>`;
        terminalInputLine.style.display = 'flex';
        terminalInput.disabled = false;
        
        // Adds the blinking hint as a placeholder
        terminalInput.placeholder = '/help to begin';
        terminalInput.classList.add('blink-placeholder');
        
        terminalInput.focus();
        terminalOverlay.scrollTop = terminalOverlay.scrollHeight;
    }, delay + 600);
}

// Clear the placeholder completely as soon as the user types
terminalInput.addEventListener('input', () => {
    terminalInput.classList.remove('blink-placeholder');
    terminalInput.placeholder = ''; // Wipes the text so it never comes back
});

// Handle commands when hitting Enter
terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value.trim();
        if (command) {
            processCommand(command);
        }
        terminalInput.value = ''; // Just clear the input field, don't reset the placeholder
    }
});

function processCommand(cmd) {
    terminalOutput.innerHTML += `<div><span class="prompt">guest@terminalio:~$</span> ${cmd}</div>`;
    
    const formattedCmd = cmd.toLowerCase();

    if (formattedCmd === '/help') {
        terminalOutput.innerHTML += `<div style="color: #aaa; margin: 10px 0;">
AVAILABLE COMMANDS:<br>
-------------------<br>
/sys-check     - Run local hardware and network diagnostics<br>
/whoami        - Display current user profile credentials<br>
/clear         - Wipe terminal output<br>
/close         - Exit the terminal overlay
</div>`;
    } else if (formattedCmd === '/sys-check') {
        const cores = navigator.hardwareConcurrency || 'Unknown';
        const ram = navigator.deviceMemory ? `>=${navigator.deviceMemory}` : 'Unknown';
        const platform = navigator.platform || 'Unknown';
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        
        let gpu = 'Unknown';
        try {
            const tempCanvas = document.createElement('canvas');
            const gl = tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        } catch (e) {}

        const agent = navigator.userAgent.split(' ')[0]; 

        terminalOutput.innerHTML += `<div style="color: #00ff41; margin: 10px 0;">
[CLIENT DIAGNOSTICS DETECTED]<br>
Platform: ${platform}<br>
Logical Cores: ${cores}<br>
Memory: ${ram} GB<br>
Display: ${screenRes}<br>
GPU: ${gpu}<br>
Agent: ${agent}<br>
Status: Optimal
</div>`;
    } else if (formattedCmd === '/whoami') {
        terminalOutput.innerHTML += `<div style="color: #aaa; margin: 10px 0;">guest - standard restricted access</div>`;
    } else if (formattedCmd === '/clear') {
        terminalOutput.innerHTML = '';
    } else if (formattedCmd === '/close') {
        terminalOpen = false;
        terminalOverlay.classList.add('hidden');
    } else {
        terminalOutput.innerHTML += `<div style="color: #ff5555; margin: 10px 0;">Command not found: ${cmd}. Type /help for a list of commands.</div>`;
    }
    
    terminalOverlay.scrollTop = terminalOverlay.scrollHeight;
}