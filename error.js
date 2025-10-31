// --- Variáveis Globais de Estado ---
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const questionDisplay = document.getElementById('question');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const comboDisplay = document.getElementById('combo');
const bossHealthDisplay = document.getElementById('bossHealth');

let GAME_WIDTH = 0;
let GAME_HEIGHT = 0;

let isGameRunning = false;
let score = 0;
let lives = 3;
let combo = 0;
let acertosDesdeUltimoBoss = 0; 
let currentLevel = 1;

let playerX = 0;
let playerY = 0;
const PLAYER_SPEED = 5;

let asteroids = [];
let bullets = [];
let question = {};
const keysPressed = {};
let bossProjectiles = [];
let bossAttackInterval = null;
let lastShootTime = 0;
const SHOOT_DELAY = 150;

const MOBILE_SHOOT = 'MobileShoot'; // Constante para identificar o disparo via botão móvel
const MOBILE_MOVE_LEFT = 'MobileLeft';
const MOBILE_MOVE_RIGHT = 'MobileRight';
// VARIÁVEIS PARA CONTROLE ANALÓGICO (LIVRE) VIA TOQUE
let touchTargetX = null; // Posição X para onde a nave deve ir
let touchTargetY = null; // Posição Y para onde a nave deve ir
// Fator que determina a velocidade e suavidade do movimento de toque
const TOUCH_MOVE_SPEED_FACTOR = 0.05; 
// O PLAYER_SPEED (ex: 5) ainda será o limite de velocidade.

let movementInterval = null;

let infoTimer = null; // Novo timer para gerenciar mensagens temporárias

// --- Variáveis do Boss ---
let isBossFight = false;
let boss = null;
let bossCurrentHealth = 0;
let isBossVulnerable = false;
let bossInterval = null;
let bossMovementTime = 0; // Variável para a oscilação do boss
let audioShoot;
let audioHit;
let audioDamage;
let audioHitasteroid;
let audioHitasteroidfail;
let audioGameOver;
let audioSucesso;
let audioBosswin;

let bossMovementState = 'moving'; // Pode ser 'moving' ou 'resting'
let bossMoveTimer = 0; // Tempo gasto no estado atual
let bossMoveDuration = 2; // Duração da movimentação (em segundos)
let bossRestDuration = 1.5; // Duração da parada (em segundos)
let bossTargetX = 0; // O deslocamento X para onde ele está se movendo (para onde parar)
let bossStartX = 0; // O deslocamento X de onde ele começou o movimento
let bossMoveSpeed = 80; // Velocidade de movimento (em pixels por segundo, ajustável)

const ASTEROID_GIFS = [
    'asteroid2.gif', // Asteroid 1º GIF
    'asteroid.gif', //  Asteroid 2º GIF
    'asteroid2.gif', // Asteroid 3º GIF
    'asteroid3.gif', // Asteroid 4º GIF
    'asteroid1.gif'  // Asteroid 5º GIF
];

const bossNames = ['Dr. nervoso', 'Cloud Mad', 'UFO', 'ghost', 'Buraco negro'];
const bossHealth = [6, 8, 12, 18, 20];

const BOSS_CHARACTERS = bossNames.map((name, i) => ({
  name,
  gifUrl: `boss${i + 1}.gif`,
  maxHealth: bossHealth[i]
}));


// --- Configurações de Dificuldade ---
const DIFFICULTY = [
    { name: 'NÍVEL 1: SOMA (1-10)', maxNum: 10, op: '+' },
    { name: 'NÍVEL 2: SOMA AVANÇADA (1-25)', maxNum: 25, op: '+' },
    { name: 'NÍVEL 3: SUBTRAÇÃO (1-25)', maxNum: 25, op: '-' },
    { name: 'NÍVEL 4: MULTIPLICAÇÃO (2-10)', maxNum: 10, op: '*' },
    { name: 'NÍVEL 5: MISTURA (1-30)', maxNum: 30, op: '+-*' }
];
const MAX_ASTEROIDS = 4;
let BASE_ASTEROID_SPEED = 50;
const ASTEROID_TYPES = ['type-a', 'type-b', 'type-c'];

// --- Arrays para Mensagens Aleatórias ---
const NEGATIVE_FEEDBACK = [
    "MENSAGEM DO BOSS: TIRO REPELIDO! ENXAME A CAMINHO!!",
    "O Boss repele seu ataque com facilidade!",
    "É só isso que você tem? Vou tomar chá de cálculos",
    "MISS! O boss nem sentiu!",
    "O boss desviou, ENXAME LIBERADO!",
    "TIRO BLOQUEADO! O boss contra-ataca!",
    "REPELIDO! TENTE NOVAMENTE."
];

const NEUTRAL_FEEDBACK = [
    "JÁ FOI!",
    "OBSOLETO!",
    "ALVO DESCARTADO."
];

/* Função showBossTitle (coloque esta em seu código) */
function showBossTitle(text = "BOSS FIGHT!") {
    // 0. ESCONDE a caixa de pergunta original **IMEDIATAMENTE**
    if (questionDisplay) {
        questionDisplay.style.display = 'none'; // ✅ Oculta
        questionDisplay.innerText = ""; 
    }

    // 1. Cria o elemento dinâmico... (Lógica inalterada)
    const bossTitle = document.createElement('div');
    bossTitle.id = 'dynamicBossTitle';
    bossTitle.className = 'boss-title-popup';
    bossTitle.innerText = text;
    document.getElementById('gameArea').appendChild(bossTitle);

    const animationDuration = 2000; 

    setTimeout(() => {
        // 4. Remove o elemento do DOM
        bossTitle.remove();

        // 5. MANTÉM OCULTA a caixa de pergunta original.
        if (questionDisplay) {
            questionDisplay.style.display = 'none'; // ✅ MANTÉM OCULTA
            questionDisplay.innerText = "";
            questionDisplay.classList.remove('error-msg', 'alert-msg');
        }

    }, animationDuration);
}
function getRandomMessage(messageArray) {
    if (!messageArray || messageArray.length === 0) {
        return "Alerta de Foco!"; 
    }
    const randomIndex = getRandomInt(0, messageArray.length - 1);
    return messageArray[randomIndex];
}
function showTemporaryMessage(message, duration = 2000, className = '') {
    // ... (Proteção contra o título animado) ...
    if (document.getElementById('dynamicBossTitle')) {
        return; 
    }
    
    if (infoTimer) clearTimeout(infoTimer);
    
    // ✅ NOVO: Exibe a caixa ANTES de setar o texto/classe
    questionDisplay.style.display = 'block'; 
    questionDisplay.className = 'question-box'; 
    
    if (className) {
        questionDisplay.classList.add(className);
    }
    questionDisplay.innerText = message;
     
    infoTimer = setTimeout(() => {
        questionDisplay.className = 'question-box'; 
        
        // 🛑 LÓGICA FINAL: Define o estado pós-mensagem
        if (isBossFight) {
            // Se for Boss Fight, oculta TUDO de novo
            questionDisplay.innerText = "";
            questionDisplay.style.display = 'none'; // ✅ OCULTA DEPOIS DO FEEDBACK
        } else if (question.text) {
            // Volta para a pergunta normal (modo asteroide)
            questionDisplay.innerText = question.text;
            questionDisplay.style.display = 'block'; // Volta a exibir a pergunta
        } else {
            questionDisplay.innerText = "Preparando...";
            questionDisplay.style.display = 'block';
        }
        infoTimer = null;
    }, duration);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.background = color;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 5 + 2; 
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        gameArea.appendChild(particle);
        
        let startTime = null;
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            if (progress < 1000) { 
                particle.style.left = `${parseFloat(particle.style.left) + vx}px`;
                particle.style.top = `${parseFloat(particle.style.top) + vy}px`;
                particle.style.opacity = 1 - (progress / 1000); 
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        requestAnimationFrame(animateParticle);
    }
}

// --- Funções de Input (Adicionadas/Verificadas) ---

function handleKeyDown(e) {
    // Adiciona KeyA e KeyD para movimento WASD, além das setas
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed['ArrowLeft'] = true;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed['ArrowRight'] = true;
    }
    // Adiciona Space para disparo
    if (e.code === 'Space') {
        keysPressed['Space'] = true;
    }

    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressed['ArrowLeft'] = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressed['ArrowRight'] = false;
    }
    if (e.code === 'Space') {
        keysPressed['Space'] = false;
    }
}

// Adiciona os event listeners para o movimento funcionar no PC
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// --- Função de Movimento do Player (Adicionada/Verificada) ---

function movePlayer() {
    if (!isGameRunning) return;

    let moved = false;
    let rotation = 0;

    if (keysPressed['ArrowLeft'] || keysPressed['KeyA'] || keysPressed[MOBILE_MOVE_LEFT]) {
        playerX -= PLAYER_SPEED;
        rotation = -10;
        moved = true;
    }
    if (keysPressed['ArrowRight'] || keysPressed['KeyD'] || keysPressed[MOBILE_MOVE_RIGHT]) {
        playerX += PLAYER_SPEED;
        rotation = 10;
        moved = true;
    }

    if (touchTargetX !== null) {
        const dx = touchTargetX - (playerX + player.offsetWidth / 2);

        if (Math.abs(dx) > 1) { 
            let moveAmount = dx * TOUCH_MOVE_SPEED_FACTOR;

            if (Math.abs(moveAmount) > PLAYER_SPEED) {
                moveAmount = moveAmount > 0 ? PLAYER_SPEED : -PLAYER_SPEED;
            }

            playerX += moveAmount;
            rotation = moveAmount * 2; 
            moved = true;

            if (Math.abs(dx) < 5) {
                touchTargetX = null;
            }
        }
    }

    playerX = Math.max(0, Math.min(playerX, GAME_WIDTH - player.offsetWidth));

    player.style.left = `${playerX}px`;
    player.style.transform = `rotate(${rotation}deg)`;

    if (player.style.bottom === '') { 
         player.style.top = `${playerY}px`;
    }
}


function generateNewQuestion() {
    // Lógica para criar a pergunta e os asteroides
    console.log("Gerando nova questão...");
}


function updateGameDimensions() {
    GAME_WIDTH = gameArea.clientWidth;
    GAME_HEIGHT = gameArea.clientHeight;
}

function startGame() {
    if (isGameRunning) return;
    
    const gameArea = document.getElementById('gameArea'); 

    loadAudio(); 
    updateGameDimensions();
    
    // Zera o estado das teclas pressionadas
    for (const key in keysPressed) {
        delete keysPressed[key];
    }
    
    // 1. ZERA AS VARIÁVEIS DO JOGO
    score = 0;
    lives = 5;
    combo = 0;
    acertosDesdeUltimoBoss = 0;
    currentLevel = 1;
    BASE_ASTEROID_SPEED = 15; // Velocidade base inicial dos asteroides
    isGameRunning = true;
    
    // Zera o estado do Boss
    isBossFight = false; 
    if (boss && boss.element.parentElement) {
        boss.element.remove();
    }
    boss = null;
    if (bossInterval) clearInterval(bossInterval);


    // 2. LIMPEZA DOS ELEMENTOS VISUAIS ANTIGOS
    asteroids.forEach(a => { if (a.element) a.element.remove(); });
    bullets.forEach(b => b.element.remove());
    asteroids = [];
    bullets = [];
    
    if (infoTimer) clearTimeout(infoTimer);

    // 3. REMOÇÃO DAS TELAS DE OVERLAY
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    questionDisplay.style.display = 'block';

    // RESTAURA O BACKGROUND DA ÁREA DE JOGO
    if (gameArea) {
        gameArea.style.backgroundImage = ''; 
        gameArea.style.backgroundColor = ''; 
    }


    // --------------------------------------------------------------------------------
    // 4. POSIÇÃO INICIAL DA NAVE (CORRIGIDA)
    // --------------------------------------------------------------------------------
    
    const shootButton = document.getElementById('shootButton'); 
    if (shootButton && shootButton.offsetWidth > 0) {
        
        const playerHeight = player.offsetHeight;
        const gameAreaRect = gameArea.getBoundingClientRect(); 
        const buttonRect = shootButton.getBoundingClientRect();
        
        const buttonTopInGameArea = buttonRect.top - gameAreaRect.top;
        
        playerY = buttonTopInGameArea - playerHeight - 5; 
        
        const playerWidth = player.offsetWidth;
        const marginBetween = 30; 
        const buttonWidth = shootButton.offsetWidth;
        
        const buttonPositionInsideGameArea = GAME_WIDTH - buttonWidth - 30; 
        playerX = buttonPositionInsideGameArea - marginBetween - (playerWidth / 2);
        
        if (playerX < 10) { playerX = 10; }
        player.style.left = `${playerX}px`;
        player.style.top = `${playerY}px`;
        player.style.bottom = 'auto'; 
        
    } else {
        
        playerX = GAME_WIDTH / 2 - 25; 
        player.style.left = `${playerX}px`;
        player.style.top = ''; 
        player.style.bottom = ''; 

        playerY = GAME_HEIGHT - 70; 
    }

    player.style.transform = 'rotate(0deg)';


    // 5. INICIA O JOGO
    updateHUD();
    generateNewQuestion(); 

    window.addEventListener('resize', updateGameDimensions);

    // Loop de movimento para 60 FPS
    movementInterval = setInterval(movePlayer, 1000 / 60);

    requestAnimationFrame(gameLoop);
}

const audios = {
    shoot: 'shoot.mp3',
    hit: 'hit.mp3',
    damage: 'damage.mp3',
    hitasteroid: 'hitasteroid.mp3',
    hitasteroidfail: 'hitasteroidfail.mp3',
    sucesso: 'Sucesso.mp3',
    gameOver: 'game-over.mp3',
    bosswin: 'bosswin.mp3'
};

const audioObjects = {};

function loadAudio() {
    for (const key in audios) {
        const audio = new Audio(audios[key]);
        audio.volume = 0.3;
        audioObjects[key] = audio;
    }
}

// --- Função Genérica para Tocar Áudio ---
function playSound(key) {
    const audio = audioObjects[key];
    if (audio) {
        const sound = audio.cloneNode();
        sound.play().catch(e => console.log(`Erro ao tocar áudio ${key}:`, e));
    }
}

function playShootSound() { playSound('shoot'); }
function playHitSound() { playSound('hit'); }
function playDamageSound() { playSound('damage'); }
function playHitasteroid() { playSound('hitasteroid'); }
function playHitasteroidfail() { playSound('hitasteroidfail'); }
function playSucesso() { playSound('sucesso'); }
function playgameover() { playSound('gameOver'); }
function playBosswin() { playSound('bosswin'); }


function endGame(isVictory = false) { 
    const gameArea = document.getElementById('gameArea'); 

    isGameRunning = false;
    clearInterval(movementInterval);
    if (bossInterval) clearInterval(bossInterval); 
    if (infoTimer) clearTimeout(infoTimer);
    window.removeEventListener('resize', updateGameDimensions); 
    
    if (isVictory) {
        playBosswin(); 
    } else {
        playgameover(); 
    }


    if (boss && boss.element.parentElement) {
    
        createExplosion(GAME_WIDTH / 2, 125, 'var(--cor-erro)'); 
        boss.element.remove();
    }
 
    if (gameArea) {
        gameArea.style.backgroundImage = 'none';
        gameArea.style.backgroundColor = '#000000'; 
    }
    
    isBossFight = false;
    boss = null;
    
    // Limpa asteroides e bullets
    asteroids.forEach(a => {
        // Adicionada explosão rápida para feedback antes de remover
        createExplosion(a.x, a.y, '#999'); 
        if (a.element) a.element.remove();
    });
    bullets.forEach(b => b.element.remove());
    asteroids = [];
    bullets = [];

    // 4. EXIBE TELA DE FIM DE JOGO
    const gameOverScreen = document.getElementById('gameOverScreen');
    
    const titleElement = gameOverScreen.querySelector('h2');
    if (titleElement) {
        titleElement.innerText = isVictory ? "MISSÃO CUMPRIDA!" : "MISSÃO FRACASSADA";
    } else {
        console.error("Elemento H2 não encontrado na tela de Game Over. Verifique seu HTML.");
    }
    
    document.getElementById('finalScore').innerText = score;
    gameOverScreen.style.display = 'flex';
    questionDisplay.style.display = 'none'; 
}

function handleShootButtonTouch(event) {
    event.preventDefault();
    event.stopPropagation(); 
    
    if (!isGameRunning) return;
    
    keysPressed[MOBILE_SHOOT] = true;

    shoot();

    const button = event.currentTarget;
    button.classList.add('active');
    setTimeout(() => {
        button.classList.remove('active');
    }, SHOOT_DELAY / 2);
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const gameAreaElement = document.getElementById('gameArea'); 
    // ⭐ NOVO: Referência ao botão de disparo exclusivo
    const shootButton = document.getElementById('shootButton'); 

    if (shootButton) {
        // Disparo ao clicar (desktop se o botão for visível)
        shootButton.addEventListener('click', handleShootButtonTouch);
        // Disparo ao tocar (mobile) — non-passive so preventDefault works
        shootButton.addEventListener('touchstart', handleShootButtonTouch, { passive: false });
        // Pointerdown fallback
        shootButton.addEventListener('pointerdown', (ev) => { ev.preventDefault && ev.preventDefault(); handleShootButtonTouch(ev); }, { passive: false });
        // Opcional: Remove o 'pressionado' ao soltar (se estiver usando keysPressed)
        shootButton.addEventListener('touchend', () => { delete keysPressed[MOBILE_SHOOT]; });
    }
    
    // 3. Adiciona suporte a toque na área do jogo
    if (gameAreaElement) {
        
        // ⭐ Movimento Touch (Inalterado) ⭐
        gameAreaElement.addEventListener('touchstart', handleMoveTouch);
        gameAreaElement.addEventListener('touchmove', handleMoveTouch); 
        gameAreaElement.addEventListener('touchend', handleMoveEnd); 
        gameAreaElement.addEventListener('touchcancel', handleMoveEnd); 
    }
});
function handleMoveTouch(event) {
    // 1. CHECAGEM DE CONTROLE MÓVEL (A CORREÇÃO PRINCIPAL)
    const touchTarget = event.touches[0].target;
    // Se o toque começou sobre o botão de disparo, ignore o movimento.
    if (touchTarget.id === 'shootButton') {
        return; 
    }
    // Adicione IDs de outros botões de controle móvel aqui se existirem
    
    event.preventDefault();
    if (!isGameRunning) return;
    const gameAreaElement = document.getElementById('gameArea'); 
    if (!gameAreaElement) return;
    
    const gameAreaRect = gameAreaElement.getBoundingClientRect();

    const touch = event.touches[0];
    if (touch) {
    
        // 2. LÓGICA DE MOVIMENTO (Inalterada)
        touchTargetX = touch.clientX - gameAreaRect.left;
        touchTargetY = touch.clientY - gameAreaRect.top;
    }
}

function updateHUD() {
    scoreDisplay.innerText = score;
    
    const MAX_LIVES_DISPLAY = 5; 
    let heartIcons = 'Vidas: ';

    for(let i = 1; i <= MAX_LIVES_DISPLAY; i++) {
        if (i <= lives) {
            heartIcons += `<span style="color:var(--cor-erro);">💖</span>`;
        } else if (i <= 3) { 
            heartIcons += `<span style="color:gray;">🤍</span>`;
        } else {
            heartIcons += `<span style="color:#222;">🤍</span>`;
        }
    }
    livesDisplay.innerHTML = heartIcons;

    if (combo > 1) {
        comboDisplay.innerText = `COMBO x${combo}! (+${10 + (combo * 5)}/acerto)`;
        comboDisplay.classList.add('combo-active');
    } else {
        comboDisplay.classList.remove('combo-active');
        comboDisplay.innerText = '';
    }

   // ⭐ NOVO: Lógica da Barra de Vida do Boss (Health Bar) ⭐
    if (isBossFight && boss) {
        const bossMaxHealth = boss.info.maxHealth; 
        // Calcula a porcentagem de vida
        const healthPercentage = (bossCurrentHealth / bossMaxHealth) * 100;
        
        // Define a cor da barra: VERDE se Vulnerável, LARANJA/VERMELHO caso contrário
        // Você pode ajustar 'var(--cor-acerto)' se tiver uma variável para verde
        const barColor = boss.isVulnerable ? 'var(--cor-acerto, green)' : 'red'; 
        
        let healthBarContent = `BOSS HP: `; 

        healthBarContent += `<div class="boss-hp-bar">`; 
        
        // A DIV interna que representa a vida atual
        healthBarContent += `<div 
            class="boss-hp-fill" 
            style="width: ${healthPercentage}%; background-color: ${barColor};">
        </div>`;
        
        // Exibe a porcentagem/número dentro ou ao lado da barra (opcional)
        healthBarContent += `<span class="hp-text">${bossCurrentHealth}/${bossMaxHealth}</span>`;

        healthBarContent += `</div>`; 

        bossHealthDisplay.innerHTML = healthBarContent; 
        bossHealthDisplay.style.display = 'flex'; 
        
    } else {
        bossHealthDisplay.style.display = 'none';
    }

        // --- LÓGICA DE VIDA BÔNUS A CADA 10 ACERTOS ---
        // Verifica se é um múltiplo de 10, está no modo normal, e se já passou do primeiro acerto
        if (!isBossFight && acertosDesdeUltimoBoss > 0 && acertosDesdeUltimoBoss % 10 === 0) {
            if (lives < MAX_LIVES_DISPLAY) { 
                lives++;
                playSucesso(); // Toca o som de sucesso/ganho
                showTemporaryMessage("VIDA EXTRA CONCEDIDA! (+1 vida)", 1500);
            }
        }
        
        // Lógica para chamar o Boss (Se 10 acertos ou mais)
        if (acertosDesdeUltimoBoss >= 1 && !isBossFight) {
            enterBossFight();
        }
    }
    

function generateQuestionData(diff) {
let num1, num2, answer, operator, questionText;
const op = diff.op.length > 1 ? diff.op[getRandomInt(0, diff.op.length - 1)] : diff.op;
operator = op;

 const maxNum = diff.maxNum;

if (operator === '+') {
 num1 = getRandomInt(Math.floor(maxNum / 2) + 1, maxNum);
num2 = getRandomInt(1, maxNum);
answer = num1 + num2;
questionText = `${num1} + ${num2}`;
} else if (operator === '-') {
 num1 = getRandomInt(Math.floor(maxNum / 2) + 1, maxNum);
num2 = getRandomInt(1, num1);
answer = num1 - num2;
questionText = `${num1} - ${num2}`;
} else if (operator === '*') {
 num1 = getRandomInt(2, Math.min(maxNum, 10));
num2 = getRandomInt(2, Math.min(maxNum, 10));
 answer = num1 * num2;
 questionText = `${num1} x ${num2}`;
 }

 return { text: questionText, answer: answer, maxRange: maxNum };
}

function generateNewQuestion(clearOld = true) {
    if (!isGameRunning || isBossFight) return;

    if (infoTimer) clearTimeout(infoTimer);
    asteroids.forEach(a => {
        if (a.element && a.element.parentElement) {
            a.element.remove();
        }
    });
    asteroids = [];
    
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    question = generateQuestionData(currentDiff);
    questionDisplay.innerText = question.text;

    const answers = new Set();
    answers.add(question.answer);
    const answerRange = Math.max(5, Math.floor(currentDiff.maxNum * 0.3));

    while (answers.size < MAX_ASTEROIDS) {
        let fakeAnswer;
        do {
            fakeAnswer = question.answer + getRandomInt(-answerRange, answerRange);
        } while (fakeAnswer <= 0 || answers.has(fakeAnswer) || Math.abs(fakeAnswer - question.answer) < 3);

        answers.add(fakeAnswer);
    }

    let answerArray = Array.from(answers);
    shuffleArray(answerArray);
    const posicoesX = [];
    const safeMargin = 40;
    const availableWidth = GAME_WIDTH - (safeMargin * 2);

    if (availableWidth <= 0) {
        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            posicoesX.push(GAME_WIDTH / 2);
        }
    } else {
        const slotWidth = availableWidth / MAX_ASTEROIDS;

        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            let slotCenter = safeMargin + (slotWidth / 2) + (i * slotWidth);
            let randomOffset = (Math.random() - 0.5) * (slotWidth * 0.2);
            
            posicoesX.push(slotCenter + randomOffset);
        }
    }
  
    for(let i = 0; i < MAX_ASTEROIDS; i++) {
        const value = answerArray[i];
        const asteroidElement = document.createElement('div');
        asteroidElement.className = 'asteroid';
        const gifUrl = ASTEROID_GIFS[getRandomInt(0, ASTEROID_GIFS.length - 1)];
        asteroidElement.style.backgroundImage = `url('${gifUrl}')`; 
        const answerSpan = document.createElement('span');
        answerSpan.innerText = value;
        asteroidElement.appendChild(answerSpan);
        
        const randomType = ASTEROID_TYPES[getRandomInt(0, ASTEROID_TYPES.length - 1)];
        asteroidElement.classList.add(randomType);

        // A posição X agora é o ponto central, mas ajustamos o baseX para o objeto JS
        const baseX = posicoesX[i] + 40; // O 40 aqui parece ser para oscilação, vamos manter
        const y = -100 - (i * 100);

        asteroidElement.style.left = `${posicoesX[i]}px`; // Usa posicoesX[i] como o left (o translate(-50%) centraliza)
        asteroidElement.style.top = `${y}px`;
        asteroidElement.style.transform = 'translate(-50%, -50%) scale(0.5)';
        asteroidElement.style.opacity = '0.5';

        gameArea.appendChild(asteroidElement);
        asteroids.push({
    element: asteroidElement,
    x: baseX,
    y: y,
    baseX: posicoesX[i], // A posição 'left' inicial
    value: value,
    isDestroyed: false,
    isCurrentTarget: true,
    isCorrectAnswer: (value === question.answer),
    speed: BASE_ASTEROID_SPEED + getRandomInt(0, 15),
    scale: 0.5,
    vx: (Math.random() - 0.5) * 20,
    oscillationOffset: Math.random() * 10,
    // ⭐ NOVO: Propriedades de vida do asteroide
    hits: 0,
    maxHits: 3 // 1/2 função outra logo a baixo na handleAsteroidHit
});
    }
}


function enterBossFight() {
    isBossFight = true;

    asteroids.forEach(a => { a.element.remove(); });
    asteroids = [];

   
    if (infoTimer) clearTimeout(infoTimer);
    questionDisplay.innerText = ""; 
    questionDisplay.style.display = 'none';
    const bossIndex = (currentLevel - 1) % BOSS_CHARACTERS.length;
    const bossInfo = BOSS_CHARACTERS[bossIndex];
    showBossTitle(`${bossInfo.name.toUpperCase()} APARECEU!`);
    
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    question = generateQuestionData(currentDiff);

    bossCurrentHealth = bossInfo.maxHealth; 
    bossMovementTime = 0;
    boss = {
        element: document.createElement('div'),
        info: bossInfo,
        currentAnswer: null,
        isVulnerable: false
    };
    boss.element.id = 'boss';
    
    // LINHAS INALTERADAS: Elementos visuais do boss
    boss.element.innerHTML = `
        <img class="boss-gif" src="${bossInfo.gifUrl}" alt="${bossInfo.name}">
        <span class="boss-question">${question.text} = ?</span>
        <div class="boss-answer-display">...</div>
    `;
    
    gameArea.appendChild(boss.element);
    boss.element.classList.add('invulnerable'); // Inicia invulnerável

    updateHUD();

    // Inicia a mecânica de resposta aleatória
    if (bossInterval) clearInterval(bossInterval);
    bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
    // (Ataque a cada 7 segundos, por exemplo)
    if (bossAttackInterval) clearInterval(bossAttackInterval);
    bossAttackInterval = setInterval(spawnBossAttack, 7000);
}
 function toggleBossVulnerability() {
 const answerDisplay = boss.element.querySelector('.boss-answer-display');
 const questionDisplayBoss = boss.element.querySelector('.boss-question');

 const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
 const answerRange = Math.max(5, Math.floor(currentDiff.maxNum * 0.3));

 if (boss.isVulnerable) {

boss.isVulnerable = false;
 boss.element.classList.remove('vulnerable');
 boss.element.classList.add('invulnerable');
 answerDisplay.innerText = '...';

 } else {

question = generateQuestionData(currentDiff);
 questionDisplayBoss.innerText = `${question.text} = ?`; 


const isVulnerableWindow = Math.random() < 0.5; // 50% de chance de ser o correto


if (isVulnerableWindow) {

boss.isVulnerable = true;
 boss.currentAnswer = question.answer;
boss.element.classList.remove('invulnerable');
boss.element.classList.add('vulnerable');
answerDisplay.innerText = question.answer;


setTimeout(() => {
 if(boss && boss.isVulnerable) { 
 boss.isVulnerable = false;
 boss.element.classList.remove('vulnerable');
boss.element.classList.add('invulnerable');
answerDisplay.innerText = '...';
 }
}, 3000 + getRandomInt(500, 1500)); 

} else {

boss.isVulnerable = false; // Garante que é falso
 boss.element.classList.remove('vulnerable');
boss.element.classList.add('invulnerable');

let fakeAnswer;
do {
fakeAnswer = question.answer + getRandomInt(-answerRange, answerRange);
 } while (fakeAnswer <= 0 || fakeAnswer === question.answer || Math.abs(fakeAnswer - question.answer) < 3);

boss.currentAnswer = fakeAnswer; 
 answerDisplay.innerText = fakeAnswer; 


setTimeout(() => {
if(boss && !boss.isVulnerable) { 
answerDisplay.innerText = '...';
 }
}, 1000 + getRandomInt(500, 1500)); 
 }
}
 }

function generatePunishmentAsteroids() {
    asteroids.forEach(a => { a.element.remove(); });
    asteroids = [];
    
    // Usa a nova função
    const repelMsg = getRandomMessage(NEGATIVE_FEEDBACK);
    showTemporaryMessage(repelMsg, 3000, 'error-msg');
    const answers = new Set();
    answers.add(question.answer);
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    const answerRange = Math.max(5, Math.floor(currentDiff.maxNum * 0.3));

    while (answers.size < MAX_ASTEROIDS) {
        let fakeAnswer;
        do {
            fakeAnswer = question.answer + getRandomInt(-answerRange, answerRange);
        } while (fakeAnswer <= 0 || answers.has(fakeAnswer) || Math.abs(fakeAnswer - question.answer) < 3);

        answers.add(fakeAnswer);
    }

    let answerArray = Array.from(answers);
    shuffleArray(answerArray); 
    const posicoesX = [];
    const safeMargin = 40;
    const availableWidth = GAME_WIDTH - (safeMargin * 2);

    if (availableWidth <= 0) {
        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            posicoesX.push(GAME_WIDTH / 2);
        }
    } else {
        const slotWidth = availableWidth / MAX_ASTEROIDS;

        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            let slotCenter = safeMargin + (slotWidth / 2) + (i * slotWidth);
            
            // Adiciona uma pequena variação aleatória (para não parecerem alinhados)
            let randomOffset = (Math.random() - 0.5) * (slotWidth * 0.2);
            
            posicoesX.push(slotCenter + randomOffset);
        }
    }
    // Cria os asteroides
    for(let i = 0; i < MAX_ASTEROIDS; i++) {
        const value = answerArray[i]; 
        const asteroidElement = document.createElement('div');
        asteroidElement.className = 'asteroid';
        
        // 🚀 CORREÇÃO PARA GIF: Define o GIF como a imagem de fundo
        const gifUrl = ASTEROID_GIFS[getRandomInt(0, ASTEROID_GIFS.length - 1)];
        asteroidElement.style.backgroundImage = `url('${gifUrl}')`; 
        
        // 🚀 CORREÇÃO PARA GIF: Cria o SPAN para o número e o anexa
        const answerSpan = document.createElement('span');
        answerSpan.innerText = value;
        asteroidElement.appendChild(answerSpan);

        const randomType = ASTEROID_TYPES[getRandomInt(0, ASTEROID_TYPES.length - 1)];
        asteroidElement.classList.add(randomType);
        
        const baseX = posicoesX[i] + 40; 
        const y = -100 - (i * 100); 
        
        // CORREÇÃO: Usa posicoesX[i] como o left (para seguir a lógica do translate no CSS)
        asteroidElement.style.left = `${posicoesX[i]}px`; 
        asteroidElement.style.top = `${y}px`;
        asteroidElement.style.transform = 'translate(-50%, -50%) scale(0.5)'; 
        asteroidElement.style.opacity = '0.5'; 
        
        gameArea.appendChild(asteroidElement);
        asteroids.push({
            element: asteroidElement,
            x: baseX,
            y: y,
            baseX: posicoesX[i], // A posição 'left' inicial
            value: value,
            isDestroyed: false, 
            isCurrentTarget: true,
            isCorrectAnswer: (value === question.answer), 
            speed: BASE_ASTEROID_SPEED * 2 + getRandomInt(0, 30), 
            scale: 0.5,
            vx: (Math.random() - 0.5) * 30, 
            oscillationOffset: Math.random() * 10 
        });
    }
}

function handleBossHit(bullet) {
    if (!boss || !boss.element.parentElement) return false;

    const bossRect = boss.element.getBoundingClientRect();
    const bulletRect = bullet.element.getBoundingClientRect();

    // 1. Verifica Colisão Física
    const collided = (
        bulletRect.left < bossRect.right &&
        bulletRect.right > bossRect.left &&
        bulletRect.top < bossRect.bottom &&
        bulletRect.bottom > bossRect.top
    );
    
    if (!collided) return false;

    createExplosion(bullet.x, bullet.y, 'white'); 

    // 2. Lógica do Jogo (Dano vs. Punição)
    const isCorrectHit = boss.isVulnerable && bullet.value === question.answer; 
    
    if (isCorrectHit) { 
        // --- ACERTO VÁLIDO (DANO) ---
        bossCurrentHealth--;
        score += 50; 
        combo++;
        playDamageSound(); 
        createExplosion(bullet.x, bullet.y, 'var(--cor-acerto)');
        boss.element.classList.add('hit');
        setTimeout(() => boss.element.classList.remove('hit'), 400);

       
        // ⭐ CRÍTICO: Limpa o intervalo imediatamente.
        if (bossInterval) clearInterval(bossInterval); 
        
        if (bossCurrentHealth <= 0) {
            // O intervalo já está limpo.
            bossInterval = null;
            exitBossFight(true); // Chama a saída, que agora é imediata
        } else {
            // Se não morreu, define um NOVO intervalo para o próximo ciclo
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
        }
        
    } else {
        // --- ACERTO INVÁLIDO (TIRO REPELIDO / PUNIÇÃO) ---
        playHitSound(); 
        combo = 0;
        
        createExplosion(bullet.x, bullet.y, 'var(--cor-erro)');
        boss.element.style.boxShadow = '0 0 50px var(--cor-erro)';
        setTimeout(() => {
            boss.element.style.boxShadow = '0 0 25px #ff00ff, 0 0 50px rgba(255, 0, 255, 0.5)';
        }, 200);
        
        const repelMsg = getRandomMessage(NEGATIVE_FEEDBACK);
        showTemporaryMessage(repelMsg + " Enxame de Asteroides!", 1500, 'error-msg');

        // Gera o enxame de asteroides de punição 
        if (bossInterval) clearInterval(bossInterval);
        boss.isVulnerable = false;
        boss.element.classList.remove('vulnerable');
        boss.element.classList.add('invulnerable');
        generatePunishmentAsteroids();
    }
    
    updateHUD();
    return true; 

}

// ⭐ Função que gera um único pulso do Buraco Negro e os projéteis
function spawnBossAttack() {
    if (!isBossFight || !boss || !boss.element) return;

    // Pega a posição ATUAL do boss
    const bossRect = boss.element.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    // Ponto de spawn: abaixo e no centro do boss
    const spawnX = (bossRect.left - gameRect.left) + (bossRect.width / 2);
    const spawnY = (bossRect.bottom - gameRect.top);

    // 1. Cria o efeito visual do "Buraco Negro"
    const blackHoleEl = document.createElement('div');
    blackHoleEl.className = 'black-hole-visual';
    blackHoleEl.style.left = `${spawnX}px`;
    blackHoleEl.style.top = `${spawnY}px`;
    gameArea.appendChild(blackHoleEl);

    // Remove o efeito visual após a animação
    setTimeout(() => {
        if (blackHoleEl.parentElement) {
            blackHoleEl.remove();
        }
    }, 2100); // Duração da animação CSS

    // 2. Cria os projéteis (asteroides) após um pequeno atraso
    setTimeout(() => {
        if (!isBossFight) return; 

        const numProjectiles = 5; 
        const spreadAngle = Math.PI / 2; 
        const startAngle = Math.PI / 4; 
        const projectileSpeed = 1;

        for (let i = 0; i < numProjectiles; i++) {
            // Calcula o ângulo para espalhar os projéteis
            const angle = startAngle + (i / (numProjectiles - 1)) * spreadAngle;

            // Calcula vetores de velocidade (vx, vy)
            const vx = Math.cos(angle) * projectileSpeed;
            const vy = Math.sin(angle) * projectileSpeed;

            const projEl = document.createElement('div');
            projEl.className = 'asteroid boss-projectile'; 
            
            const gifUrl = ASTEROID_GIFS[getRandomInt(0, ASTEROID_GIFS.length - 1)];
            projEl.style.backgroundImage = `url('${gifUrl}')`;
            
            projEl.style.left = `${spawnX}px`;
            projEl.style.top = `${spawnY}px`;
            
            gameArea.appendChild(projEl);

            bossProjectiles.push({
                element: projEl,
                x: spawnX,
                y: spawnY,
                // Usando a velocidade VX/VY para movimento em leque
                vx: vx * 100, // Ajuste: Multiplicar por um fator para compensar o delta time do gameLoop
                vy: vy * 100, // Ajuste: (Seu gameLoop usa deltaSeconds, 3 é muito lento)
                hits: 0,
                maxHits: 3 
            });
        }
    }, 500); 
}


function handleBossProjectileHit(index, bullet) {
    // Para projéteis que não estão no array 'asteroids'
    const projectile = bossProjectiles[index];

    createExplosion(bullet.x, bullet.y, 'gray');
    playHitSound(); // Toca um som de acerto/repelir

    // Lógica: Projéteis do Boss (que não são asteroides) são destruídos com 1 hit
    if (projectile) {
        projectile.element.remove();
        bossProjectiles.splice(index, 1); // Remove do array
        
        // Dá um pequeno bônus por repelir o ataque
        score = Math.min(score + 1, 99999); 
    }
}
// ⭐ NOVA FUNÇÃO: O Jogador é atingido por um Projétil/Asteroide de Ataque do Boss
function handlePlayerHitByBossProjectile(projectile) {
    lives--;
    combo = 0;
    score = Math.max(0, score - 5);
    playDamageSound();
    
    createExplosion(playerX + 25, playerY + 25, 'red');
    player.style.opacity = '0.5';
    setTimeout(() => player.style.opacity = '1', 500); // Pisca

    showTemporaryMessage("ATINGIDO! -1 Vida!", 1500, 'error-msg');

    // Remove o projétil que colidiu
    projectile.element.remove();
    
    // Atualiza o estado
    updateHUD();
    if (lives <= 0) {
        endGame();
    }
}
// Logica após derrotar o ultimo
function exitBossFight(success) {
    // Certifique-se de que 'gameArea' esteja definida (Ex: const gameArea = document.getElementById('gameArea');)
    const gameArea = document.getElementById('gameArea'); 

    if (!isBossFight) return;

    isBossFight = false;
    if (bossInterval) clearInterval(bossInterval);
    if (bossAttackInterval) clearInterval(bossAttackInterval);
    bossAttackInterval = null;
    bossProjectiles.forEach(p => p.element.remove());
    bossProjectiles = [];

    if (boss && boss.element.parentElement) {
         if (success) {
             // Explosão grande para o Boss
             createExplosion(GAME_WIDTH / 2, 125, '#ffcc00'); 
         }
         // A linha que remove o elemento visual do Boss
         boss.element.remove();
         boss = null; 
    }

    if (success) {
        score += 100; // Bônus extra
        acertosDesdeUltimoBoss = 0;
        
        // --- LÓGICA DE VITÓRIA FINAL (ÚLTIMO BOSS) ---
        const totalBosses = BOSS_CHARACTERS.length;
        
        if (currentLevel === totalBosses) {
            // Se o nível atual é o último da lista
            playBosswin(); 
            
            // ⭐ CRÍTICO: REMOÇÃO DO setTimeout. A tela final é chamada IMEDIATAMENTE. ⭐
            // showTemporaryMessage é opcional, mas se mantiver, use um tempo bem curto (ex: 500ms)
            showTemporaryMessage("PARABÉNS! VOCÊ VENCEU O JOGO!", 500);
            
            // Chama a função final do jogo. Isso irá parar o game loop e mostrar a tela.
            endGame(true); 

            // NOVO: Limpa o background do Boss (solução para o artefato visual)
            if (gameArea) {
                gameArea.style.backgroundImage = 'none'; 
                gameArea.style.backgroundColor = '#000000';
            }

            // Impede que o código de incremento de nível execute
            return; 
        }
        // --- FIM DA LÓGICA DE VITÓRIA FINAL ---

        // Lógica normal de incremento de nível (para bosses 1 a 4)
        currentLevel = Math.min(DIFFICULTY.length, currentLevel + 1);
        playBosswin(); 
        showTemporaryMessage(`BOSS DERROTADO! NÍVEL ${currentLevel} INICIADO!`, 2500);

    } else {
         // Se saiu do modo punição, volta ao modo normal.
         showTemporaryMessage(`VOCÊ ESCAPOU...`, 1500);
    }
    
    // Remove quaisquer asteroides de punição restantes
    asteroids.forEach(a => { a.element.remove(); });
    asteroids = [];

    // Vai gerar nova pergunta depois do timer da mensagem (apenas se o jogo não terminou)
    const delay = success ? 2500 : 1500;
    
    setTimeout(() => {
        // Só gera a nova pergunta se o jogo não foi reiniciado/finalizado
        if (isGameRunning) { 
            generateNewQuestion();
        }
    }, delay);
    
    updateHUD();
}


function movePlayer() {
    if (!isGameRunning) return;

    // Defensive guards: ensure player coordinates are valid numbers
    if (!isFinite(playerX) || playerX === null) playerX = (GAME_WIDTH || 320) / 2;
    if (!isFinite(playerY) || playerY === null) playerY = (GAME_HEIGHT || 240) - 70;

    let dx = 0;
    let dy = 0;
    let rotation = 0;
    
    // ⭐ AJUSTE CRÍTICO: Obtém as dimensões reais da nave (máximo 63px)
    const playerWidth = player.offsetWidth || 63; 
    const playerHeight = player.offsetHeight || 63; 
    const marginBottom = 20; // Correspondente ao bottom: 20px no CSS

    // ==========================================================
    // LÓGICA DE MOVIMENTO (Digital e Analógico)
    // ==========================================================
    if (touchTargetX === null) {
        // Lógica de Movimento PC (Digital)
        if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
            dx = -PLAYER_SPEED;
            rotation = -10;
        }
        if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
            // Verifica se ambas as teclas de direção horizontal estão pressionadas
            if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) { 
                dx = 0; // Anula o movimento horizontal
                rotation = 0;
            } else {
                 dx = PLAYER_SPEED;
                 rotation = 10;
            }
        }
        if (keysPressed['ArrowUp'] || keysPressed['KeyW']) dy = -PLAYER_SPEED;
        if (keysPressed['ArrowDown'] || keysPressed['KeyS']) dy = PLAYER_SPEED;
        
        // Aplica o fator diagonal
        if (dx !== 0 && dy !== 0) {
            const diagFactor = Math.sqrt(2);
            dx /= diagFactor;
            dy /= diagFactor;
        }

    } else {
        // Lógica de Movimento Mobile (Analógico/Touch)
        const playerCenterX = playerX + (playerWidth / 2);
        const playerCenterY = playerY + (playerHeight / 2);
        const diffX = touchTargetX - playerCenterX;
        const diffY = touchTargetY - playerCenterY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);
        const STOPPING_DISTANCE = 5;

        if (distance > STOPPING_DISTANCE) {
            dx = diffX * TOUCH_MOVE_SPEED_FACTOR; 
            dy = diffY * TOUCH_MOVE_SPEED_FACTOR;
            const speedMagnitude = Math.sqrt(dx * dx + dy * dy);
            if (speedMagnitude > PLAYER_SPEED) {
                dx = (dx / speedMagnitude) * PLAYER_SPEED;
                dy = (dy / speedMagnitude) * PLAYER_SPEED;
            }
            rotation = (dx / PLAYER_SPEED) * 15;
        } else {
            dx = 0;
            dy = 0;
        }
    }

    // ==========================================================
    // APLICAÇÃO DO MOVIMENTO E CLAMPING CORRIGIDO
    // ==========================================================
    
    // ⭐ LIMITE HORIZONTAL CORRIGIDO: Usa playerWidth para parar a nave na borda
    playerX = Math.max(0, Math.min(GAME_WIDTH - playerWidth, playerX + dx));
    
    // LIMITE VERTICAL CORRIGIDO: Usa playerHeight e a margem inferior de 20px
    playerY = Math.max(0, Math.min(GAME_HEIGHT - playerHeight - marginBottom, playerY + dy)); 

    // Atualiza Posição e Rotação
    player.style.left = `${playerX}px`; // Define a borda esquerda
    player.style.top = `${playerY}px`;
    player.style.transform = `rotate(${rotation}deg)`;

    // Lógica de Disparo
    const now = Date.now();
    if ((keysPressed['Space'] || keysPressed['Mouse0']) && (now - lastShootTime > SHOOT_DELAY)) {
        shoot();
        lastShootTime = now;
        player.classList.add('shooting');
        setTimeout(() => player.classList.remove('shooting'), 100);
    }
}
function shoot() {
    const currentTime = Date.now();
    
    // Verifica tempo e estado do jogo
    if (!isGameRunning || currentTime - lastShootTime < SHOOT_DELAY) {
        return; 
    }
    lastShootTime = currentTime;

    const bulletElement = document.createElement('div');
    bulletElement.className = 'bullet';

    // ⭐ AJUSTE CRÍTICO: Cálculo de centralização dinâmico
    const playerWidth = player.offsetWidth || 63; // Largura real da nave
    const bulletWidth = 4; // Largura do tiro (do seu CSS: width: 4px)

    // Posição 'left' da bala: 
    // playerX (borda esquerda) + (Meia Largura da Nave) - (Meia Largura da Bala)
    const bulletX = playerX + (playerWidth / 2) - (bulletWidth / 2); 
    const bulletY = playerY; // Topo da nave

    playShootSound(); 

    bulletElement.style.left = `${bulletX}px`;
    bulletElement.style.top = `${bulletY}px`;
    gameArea.appendChild(bulletElement);

    bullets.push({
        element: bulletElement,
        x: bulletX,
        y: bulletY,
        value: (question && question.answer !== undefined) ? question.answer : null 
    });
}

// --- Loop Principal do Jogo ---

let lastFrameTime = 0;
    const BULLET_SPEED = 10;
    
    function gameLoop(timestamp) {
        if (!isGameRunning) return;
        
        // 1. Cálculo do Delta Time para movimentos suaves e baseados no tempo
        if (lastFrameTime === 0) lastFrameTime = timestamp; // Inicializa na primeira chamada
        const deltaSeconds = (timestamp - lastFrameTime) / 1000; // Tempo em segundos
        lastFrameTime = timestamp;

        updateGameDimensions();

        // ----------------------------------------------------------------------
        // 1. Movimentação dos Tiros (Bullets)
        // ----------------------------------------------------------------------
        bullets = bullets.filter(bullet => {
            // Movimento (Baseado no tempo, para suavidade)
            bullet.y -= BULLET_SPEED * (deltaSeconds * 60); // Ajuste a velocidade se necessário
            bullet.element.style.top = `${bullet.y}px`;
        
            // Colisão com o Boss
            if (isBossFight && boss && handleBossHit(bullet)) {
                bullet.element.remove(); 
                return false;       
            }

            // Colisão com Asteroides (de pergunta ou punição do Boss)
            if (asteroids.length > 0) { // Simplificando a condição
                const collidedIndex = asteroids.findIndex(asteroid => !asteroid.isDestroyed && checkCollision(bullet, asteroid));
                if (collidedIndex !== -1) {
                    handleAsteroidHit(collidedIndex, bullet);
                    bullet.element.remove(); 
                    return false; 
                }
            }

            // ⭐ Colisão com Projéteis do Boss (Diferentes de Asteroides)
            if (isBossFight && bossProjectiles.length > 0) {
                const collidedProjIndex = bossProjectiles.findIndex(proj => checkCollision(bullet, proj));
                if (collidedProjIndex !== -1) {
                    // Chama a nova função para lidar com o acerto
                    handleBossProjectileHit(collidedProjIndex, bullet); 
                    bullet.element.remove(); // Destrói o tiro
                    return false; 
                }
            }

            // Remove tiros que saíram da tela
            if (bullet.y < -20) {
                bullet.element.remove();
                return false;
            }
            return true;
        });

        // ----------------------------------------------------------------------
        // 2. Movimentação de Asteroides e Tamanho
        // ----------------------------------------------------------------------
        // Constante de conversão, se estiver usando a lógica antiga de velocidade:
        // const deltaTimeOld = (deltaSeconds * 1000) / 1700; 

        asteroids = asteroids.filter(asteroid => {
            if (asteroid.isDestroyed) {
                return false; 
            }

            // Oscilação Horizontal e movimento para baixo
            asteroid.x = asteroid.baseX + Math.sin(timestamp / 700 + asteroid.oscillationOffset) * 15;
            // Movimento Y baseado no DeltaTime em segundos (mais preciso)
            asteroid.y += asteroid.speed * deltaSeconds; 
            
            asteroid.element.style.left = `${asteroid.x}px`;
            asteroid.element.style.top = `${asteroid.y}px`;

            // Aumenta a escala e opacidade ao se aproximar (efeito 3D)
            const ratio = (GAME_HEIGHT - asteroid.y) / GAME_HEIGHT;
            asteroid.scale = Math.min(1, 0.5 + (1 - ratio) * 0.3);
            asteroid.element.style.transform = `translate(-50%, -50%) scale(${asteroid.scale})`;
            asteroid.element.style.opacity = Math.min(1, 0.5 + (1 - ratio) * 0.5); // Corrigido a opacidade

            // Colisão com o Jogador (Agora usa a função CORRIGIDA)
            if (checkPlayerCollision(asteroid)) {
                playHitasteroidfail();
                // A colisão com asteroides de pergunta/ataque é a mesma:
                handlePlayerHit(asteroid); 
                // Se for um asteroide de ataque, removemos ele na colisão:
                if (asteroid.value === 'Attack') { 
                    asteroid.element.remove();
                    return false;
                }
                // Se for asteroide de pergunta, handlePlayerHit lida com a remoção
            }

            // Asteróide passou da tela (PERDEU UMA VIDA se for alvo atual)
            if (asteroid.y > GAME_HEIGHT + 50) {
                playHitasteroidfail();
                if (asteroid.isCurrentTarget) {
                    // Apenas asteroides de PERGUNTA que passaram descontam vida
                    handleMiss(asteroid.isCorrectAnswer);
                }
                asteroid.element.remove();
                return false;
            }

            return true;
        });
        
  // ... (dentro da função gameLoop, após a movimentação de Asteroides) ...

// ----------------------------------------------------------------------
// 3. Movimentação do Boss (Novo e Aprimorado com Paradas)
// ----------------------------------------------------------------------
if (isBossFight && boss) {
    // Usa o DeltaTime em SEGUNDOS
    bossMoveTimer += deltaSeconds; // Incrementa o tempo gasto no estado atual

    if (bossMovementState === 'moving') {
        // === Lógica de Movimento ===
        let progress = bossMoveTimer / bossMoveDuration; // Progresso de 0 a 1

        if (progress < 1) {
            // Movimento do Boss (Baseado no progresso temporal)
            const currentX = bossStartX + (bossTargetX - bossStartX) * progress;
            boss.element.style.left = `calc(50% + ${currentX}px)`;
        } else {
            // === Fim do Movimento: Transição para Parada ===
            boss.element.style.left = `calc(50% + ${bossTargetX}px)`;
            bossMovementState = 'resting';
            bossMoveTimer = 0; // Zera o timer para a parada
        }

    } else if (bossMovementState === 'resting') {
        // === Lógica de Parada ===
        if (bossMoveTimer >= bossRestDuration) {
            // === Fim da Parada: Transição para Novo Movimento ===
            bossStartX = bossTargetX;
            const maxSwing = 450; 
            
            let newTargetX;
            do {
                newTargetX = Math.floor(Math.random() * maxSwing * 2) - maxSwing; 
            } while (Math.abs(newTargetX - bossStartX) < 50); // Garante movimento mínimo

            bossTargetX = newTargetX;

            const distance = Math.abs(bossTargetX - bossStartX);
            // Isso garante que a velocidade (pixels/segundo) seja constante.
            bossMoveDuration = distance / bossMoveSpeed; 
            
            bossMovementState = 'moving';
            bossMoveTimer = 0; 
        }
    }
}

// ----------------------------------------------------------------------
// ⭐ NOVO: 4. Movimentação de Projéteis do Boss (Diferentes de Asteroides)
// ----------------------------------------------------------------------
bossProjectiles = bossProjectiles.filter(proj => {
    // MOVIMENTO SINCRONIZADO: 
    // proj.vx/vy deve ser a VELOCIDADE em pixels/SEGUNDO (ex: 300 pixels/s)
    proj.x += proj.vx * deltaSeconds;
    proj.y += proj.vy * deltaSeconds;
    
    proj.element.style.left = `${proj.x}px`;
    proj.element.style.top = `${proj.y}px`;

    // Colisão com o Jogador 
    if (checkPlayerCollision(proj)) { 
        handlePlayerHitByBossProjectile(proj); 
        proj.element.remove();
        return false; 
    }

    // Remove projéteis que saíram da tela
    if (proj.y > GAME_HEIGHT + 50 || proj.y < -50 || proj.x < -50 || proj.x > GAME_WIDTH + 50) {
        proj.element.remove();
        return false;
    }

    return true;
}); // Fim do loop de Projéteis do Boss


// 5. Lógica de "miss" (quando não há asteroides e a pergunta sumiu)
if (!isBossFight && asteroids.length === 0 && question.answer !== undefined) {
    // Apenas chame handleMiss(false) se o sistema de perguntas requer que o jogo
    // avance após um tempo sem resposta/colisão, o que geralmente é feito 
    // por um temporizador (timeout) externo e não neste loop de filtro.
    // Deixo comentado para evitar lógica duplicada de pontuação/vida.
    // handleMiss(false); 
}

requestAnimationFrame(gameLoop);
// ... (fim da função gameLoop) ...
    }
 function checkCollision(bullet, asteroid) {
const bulletRect = bullet.element.getBoundingClientRect();
 const asteroidRect = asteroid.element.getBoundingClientRect();

return (
 bulletRect.left < asteroidRect.right &&
 bulletRect.right > asteroidRect.left &&
bulletRect.top < asteroidRect.bottom &&
bulletRect.bottom > asteroidRect.top
 );
}

// ⭐ CORREÇÃO: Permite colisão com qualquer objeto que tenha 'element'
function checkPlayerCollision(gameObject) {
    if (!gameObject.element || gameObject.isDestroyed) return false;

    // Se for um asteroide, mas não for o TARGET da pergunta, 
    // ou se for um projétil do boss, ele deve colidir
    const isPlayerCollisionObject = 
        (gameObject.element.classList.contains('asteroid') && (gameObject.isCurrentTarget || gameObject.value === 'Attack')) ||
        gameObject.element.classList.contains('boss-projectile');

    if (!isPlayerCollisionObject) return false;
        
    const playerRect = player.getBoundingClientRect();
    const objectRect = gameObject.element.getBoundingClientRect();
    
    // Simplificando o cálculo de colisão
    return (
        playerRect.left < objectRect.right &&
        playerRect.right > objectRect.left &&
        playerRect.top < objectRect.bottom &&
        playerRect.bottom > objectRect.top
    );
}

function handleAsteroidHit(index, bullet) {
    const asteroid = asteroids[index];
    
    // 1. APLICA DANO E REMOVE A BALA
    asteroid.hits = (asteroid.hits || 0) + 1; // Incrementa o contador de acertos
    
    // Esta explosão é apenas o feedback de que o tiro acertou
    createExplosion(bullet.x, bullet.y, 'white'); 
    playHitSound(); // Toca um som de acerto/dano (não destruição)
    
    const MAX_HITS = asteroid.maxHits || 5; // Define o número máximo de acertos para destruir
    const shouldBeDestroyed = asteroid.hits >= MAX_HITS;

    if (!shouldBeDestroyed) {
        // --- ASTEROIDE LEVOU DANO, MAS NÃO FOI DESTRUÍDO ---
        
        // Feedback Visual de Dano: Aumenta escala e opacidade para parecer mais próximo/danificado
        const currentScale = parseFloat(asteroid.element.style.transform.match(/scale\(([^)]+)\)/)[1] || 0.5);
        asteroid.element.style.transform = `translate(-50%, -50%) scale(${currentScale + 0.1})`;
        
        // Faz o asteroide "brilhar" mais forte a cada acerto (0.5 -> 1.0)
        const opacityChange = 0.5 + (asteroid.hits / MAX_HITS) * 0.5;
        asteroid.element.style.opacity = opacityChange.toString();
        
        // Pára a execução aqui, pois o asteroide ainda está vivo.
        return; 
    }
    
    // -----------------------------------------------------------
    // LÓGICA DE DESTRUIÇÃO FINAL (Só continua se shouldBeDestroyed for true)
    // -----------------------------------------------------------

    // Remove o elemento visual (o asteroide)
    asteroid.isDestroyed = true; 
    if (asteroid.element && asteroid.element.parentElement) {
        // Garante a explosão final e remoção
        createExplosion(asteroid.x, asteroid.y, asteroid.isCorrectAnswer ? 'yellow' : 'gray'); 
        asteroid.element.remove(); 
    }

    let shouldResumeGame = false;

    if (asteroid.isCorrectAnswer) {
        // Lógica de acerto correto
        score += 10 + (combo > 1 ? combo * 5 : 0);
        playSucesso();

        if (isBossFight) {
            showTemporaryMessage("PUNIÇÃO CANCELADA! Batalha Retomada!", 2000, 'alert-msg');
            combo = 0;
            asteroids.forEach(a => {
                if (!a.isDestroyed && a.element) { a.isDestroyed = true; a.element.remove(); }
            });
            if (bossInterval) clearInterval(bossInterval);
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
            
        } else {
            combo++;
            acertosDesdeUltimoBoss++;
            shouldResumeGame = true; 
        }
        
    } else {
        // Lógica de acerto INCORRETO
        playHitasteroidfail();
        combo = 0;
        lives--;
        showTemporaryMessage("RESPOSTA INCORRETA! -1 Vida!", 1000);
        
        if (isBossFight) {
            // ... (Sua lógica para o Boss)
            asteroids.forEach(a => { 
                if (!a.isDestroyed && a.element) { a.isDestroyed = true; a.element.remove(); }
            });
            if (bossInterval) clearInterval(bossInterval);
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
            
        } else {
            shouldResumeGame = true;
        }
    }
    
    if (lives <= 0) {
        endGame();
        return;
    }
    
    updateHUD();
    if (shouldResumeGame) {
        // Se a resposta estiver correta/incorreta, o jogo avança
        setTimeout(() => generateNewQuestion(), 50); 
    }
}
function handlePlayerHit(asteroid) {

lives--;
combo = 0;
score = Math.max(0, score - 10);
createExplosion(playerX + 25, playerY + 25, 'var(--cor-erro)');
player.style.opacity = '0.5';
setTimeout(() => player.style.opacity = '1', 500); // Pisca
 showTemporaryMessage("COLISÃO! -1 Vida! Pergunta Reiniciada!", 1500);

asteroids.forEach(a => {
 if (a.element && a.element.parentElement && !a.isDestroyed) {
a.isDestroyed = true;
 a.element.remove();
}
 });

    touchTargetX = null;
    touchTargetY = null;
    const movementKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Mouse0', MOBILE_MOVE_LEFT, MOBILE_MOVE_RIGHT, MOBILE_SHOOT];
    movementKeys.forEach(k => { if (keysPressed[k]) keysPressed[k] = false; });

updateHUD();
 if (lives <= 0) {
 endGame();
return;
 }

setTimeout(() => {
 if (isBossFight) {
showTemporaryMessage("Ciclo do Boss Resetado!", 1000);
if (bossInterval) clearInterval(bossInterval);
bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
 } else {
generateNewQuestion(); 
}
 }, 50); 
}

function handleMiss(isCorrectAnswer) {
let shouldResetBoss = false;

 if (isBossFight) {
 shouldResetBoss = true;
 combo = 0;
showTemporaryMessage("ALVO PERDIDO! Ciclo do Boss Resetado!", 2000);

 } else if (isCorrectAnswer) {

lives--;
combo = 0;
score = Math.max(0, score - 10);
showTemporaryMessage("ALVO CORRETO PERDIDO! -1 Vida", 2000);
} else {
combo = 0;
showTemporaryMessage("ALVO PERDIDO...", 2000);
 }

updateHUD();
if (lives <= 0) endGame();
asteroids.forEach(a => {
 if (a.element && a.element.parentElement && !a.isDestroyed) {
 a.isDestroyed = true;
a.element.remove();
}
 });


setTimeout(() => {
 if (shouldResetBoss) {

if (bossInterval) clearInterval(bossInterval);
bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
} else {

 generateNewQuestion(); 
 }
}, 50);
}

    const _startBtn = document.getElementById('startButton');
    const _restartBtn = document.getElementById('restartButton');
    if (_startBtn) {
        _startBtn.addEventListener('click', (e) => { e.preventDefault && e.preventDefault(); console.log('start clicked'); showTemporaryMessage('Iniciando...', 600); try { startGame(); } catch(err) { console.error(err); showTemporaryMessage('Erro iniciando jogo',2000,'error-msg'); } });
        _startBtn.addEventListener('pointerdown', (e) => { e.preventDefault && e.preventDefault(); console.log('start pointerdown'); showTemporaryMessage('Iniciando...', 600); try { startGame(); } catch(err) { console.error(err); showTemporaryMessage('Erro iniciando jogo',2000,'error-msg'); } }, { passive: false });
        _startBtn.addEventListener('touchstart', (e) => { e.preventDefault && e.preventDefault(); console.log('start touchstart'); showTemporaryMessage('Iniciando...', 600); try { startGame(); } catch(err) { console.error(err); showTemporaryMessage('Erro iniciando jogo',2000,'error-msg'); } }, { passive: false });
    }
    if (_restartBtn) {
        _restartBtn.addEventListener('click', (e) => { e.preventDefault && e.preventDefault(); try { startGame(); } catch(err) { console.error(err); showTemporaryMessage('Erro iniciando jogo',2000,'error-msg'); } });
    }

window.addEventListener('keydown', (e) => {
 if (!isGameRunning) return;
 keysPressed[e.code] = true;
 e.preventDefault(); 
});

 window.addEventListener('keyup', (e) => {
 if (!isGameRunning) return;
keysPressed[e.code] = false;
 e.preventDefault(); 
});

gameArea.addEventListener('mousedown', (e) => {
if (!isGameRunning) return;
 keysPressed['Mouse0'] = true;
 e.preventDefault();
});

 gameArea.addEventListener('mouseup', (e) => {
 if (!isGameRunning) return;
keysPressed['Mouse0'] = false;
e.preventDefault();
});


function confirmExit() {

    if (isGameRunning) {
        isGameRunning = false;
        clearInterval(movementInterval);
        if (bossInterval) clearInterval(bossInterval);
      
    }

    return confirm("Tem certeza que deseja sair da missão e voltar para a tela anterior?");
}
