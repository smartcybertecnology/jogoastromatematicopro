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
// VARIÁVEIS PARA CONTROLE DE ARRASTE (DRAG)
let isTouchActive = false;    // true se um toque de movimento está ativo
let isDraggingPlayer = false; // true se o toque começou na nave (Modo 1: Drag)

// Modo 1: Drag 1:1
let touchOffsetX = 0;       // Offset X do "agarre" na nave
let touchOffsetY = 0;       // Offset Y do "agarre" na nave
let dragTargetX = null;     // Posição X para onde a nave (em drag) deve ir
let dragTargetY = null;     // Posição Y para onde a nave (em drag) deve ir

// Modo 2: Delta Move (Arrastar tela)
let touchDeltaX = 0;        // O quanto o dedo moveu no eixo X desde o último frame
let touchDeltaY = 0;        // O quanto o dedo moveu no eixo Y desde o último frame
let lastTouchX = null;      // Posição X anterior do toque (para calcular o delta)
let lastTouchY = null;      // Posição Y anterior do toque (para calcular o delta)

let movementInterval = null;

let infoTimer = null; // Novo timer para gerenciar mensagens temporárias

// --- Variáveis do Boss ---
let isBossFight = false;
let boss = null;
let bossCurrentHealth = 0;
let isBossVulnerable = false;
let bossInterval = null;
let bossMovementTime = 0; // Variável para a oscilação do boss

let bossIsInPunishment = false; // Controla se o boss está punindo
let bossMovementState = 'moving'; // Pode ser 'moving' ou 'resting'
let bossMoveTimer = 0; // Tempo gasto no estado atual
let bossMoveDuration = 2; // Duração da movimentação (em segundos)
let bossRestDuration = 1.5; // Duração da parada (em segundos)
let bossTargetX = 0; // O deslocamento X para onde ele está se movendo (para onde parar)
let bossStartX = 0; // O deslocamento X de onde ele começou o movimento
let bossMoveSpeed = 80; // Velocidade de movimento (em pixels por segundo, ajustável)
let bossProjectiles = [];
let bossAttackInterval = null;

const ASTEROID_GIFS = [
    'asteroid2.gif', // Asteroid 1º GIF
    'asteroid.gif', //  Asteroid 2º GIF
    'asteroid2.gif', // Asteroid 3º GIF
    'asteroid3.gif', // Asteroid 4º GIF
    'asteroid1.gif'  // Asteroid 5º GIF
];

const bossNames = ['Dr. nervoso', 'Cloud Mad', 'UFO', 'ghost', 'Buraco negro'];
const bossHealth = [1, 1, 1, 1, 1];

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
let BASE_ASTEROID_SPEED = 5;
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

    // 🔹 Para de rodar o game loop e timers
    isGameRunning = false;
    clearInterval(movementInterval);
    if (bossInterval) clearInterval(bossInterval); 
    if (infoTimer) clearTimeout(infoTimer);
    window.removeEventListener('resize', updateGameDimensions); 
    
    // 🔹 Sons de vitória ou derrota
    if (isVictory) {
        playBosswin(); 
    } else {
        playgameover(); 
    }

    // 🔹 Remove o boss se existir
    if (boss && boss.element && boss.element.parentElement) {
        createExplosion(GAME_WIDTH / 2, 125, 'var(--cor-erro)'); 
        boss.element.remove();
    }

    // 🔹 Limpa fundo do game
    if (gameArea) {
        gameArea.style.backgroundImage = 'none';
        gameArea.style.backgroundColor = '#000000'; 
    }

    // 🔹 Reset de status do boss
    isBossFight = false;
    boss = null;
    bossIsInPunishment = false; // garante que a punição encerre
    if (bossInterval) clearInterval(bossInterval);

    // 🔹 Limpa asteroides e bullets
    asteroids.forEach(a => {
        createExplosion(a.x, a.y, '#999'); 
        if (a.element && a.element.parentElement) a.element.remove();
    });
    bullets.forEach(b => {
        if (b.element && b.element.parentElement) b.element.remove();
    });
    asteroids = [];
    bullets = [];

    // 🔹 Limpa projéteis do boss
    bossProjectiles.forEach(p => {
        if (p.element && p.element.parentElement) p.element.remove();
    });
    bossProjectiles = [];

    // 🔹 Exibe tela de Game Over
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        const titleElement = gameOverScreen.querySelector('h2');
        if (titleElement) {
            titleElement.innerText = isVictory ? "MISSÃO CUMPRIDA!" : "MISSÃO FRACASSADA";
        } else {
            console.error("Elemento H2 não encontrado na tela de Game Over. Verifique seu HTML.");
        }

        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) finalScoreElement.innerText = score;

        gameOverScreen.style.display = 'flex';
    } else {
        console.error("Tela de Game Over não encontrada. Verifique seu HTML.");
    }

    // 🔹 Oculta display de pergunta
    if (questionDisplay) questionDisplay.style.display = 'none';
}


function handleShootButtonTouch(event) {
    event.preventDefault();
    event.stopPropagation(); 
    event.stopImmediatePropagation(); // ⭐ IMPORTANTE: Para completamente a propagação
    
    if (!isGameRunning) return;
    
    // Marca que é um toque no botão de disparo para evitar conflitos
    keysPressed[MOBILE_SHOOT] = true;

    shoot();

    const button = event.currentTarget;
    button.classList.add('active');
    setTimeout(() => {
        button.classList.remove('active');
        // Remove o estado após um delay
        delete keysPressed[MOBILE_SHOOT];
    }, SHOOT_DELAY / 2);
    
    // ⭐ CRÍTICO: Retorna false para prevenir qualquer comportamento padrão
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const gameAreaElement = document.getElementById('gameArea'); 
    // ⭐ NOVO: Referência ao botão de disparo exclusivo
    const shootButton = document.getElementById('shootButton'); 

  // No DOMContentLoaded, atualize os event listeners:
if (shootButton) {
    // Remove listeners antigos para evitar duplicação
    shootButton.removeEventListener('click', handleShootButtonTouch);
    shootButton.removeEventListener('touchstart', handleShootButtonTouch);
    shootButton.removeEventListener('pointerdown', handleShootButtonTouch);
    shootButton.removeEventListener('touchend', handleShootButtonTouch);
    
    // Adiciona listeners novos
    shootButton.addEventListener('click', handleShootButtonTouch);
    shootButton.addEventListener('touchstart', handleShootButtonTouch, { passive: false });
    shootButton.addEventListener('pointerdown', (ev) => { 
        ev.preventDefault(); 
        handleShootButtonTouch(ev); 
    }, { passive: false });
    
    // ⭐ MELHORIA: Listener separado para touchend
    shootButton.addEventListener('touchend', (ev) => {
        ev.stopPropagation();
        delete keysPressed[MOBILE_SHOOT];
    });
    
    shootButton.addEventListener('touchcancel', (ev) => {
        ev.stopPropagation();
        delete keysPressed[MOBILE_SHOOT];
    });
}
    
    // 3. Adiciona suporte a toque na área do jogo (MODIFICADO)
if (gameAreaElement) {
 
        // 'touchstart' verifica o alvo (player ou gameArea)
gameAreaElement.addEventListener('touchstart', handleTouchStart, { passive: false });

// 'touchmove' e 'touchend' são globais (na window) para
        // capturar o arrasto mesmo se o dedo sair da 'gameArea'.
 window.addEventListener('touchmove', handleTouchMove, { passive: false });
window.addEventListener('touchend', handleTouchEnd); 
window.addEventListener('touchcancel', handleTouchEnd); 
}
});
function handleTouchStart(event) {
    if (!isGameRunning) return;
    
    const touch = event.touches[0];
    if (!touch) return;
    const target = touch.target;

    // ⭐ MELHORIA: Verificação mais robusta para o botão de disparo
    if (target.id === 'shootButton' || target.closest('#shootButton')) {
        // ⭐ IMPORTANTE: Se for o botão de disparo, NÃO processa movimento
        event.preventDefault();
        event.stopPropagation();
        return; 
    }
    
    // ⭐ NOVO: Se já estiver processando um toque de disparo, ignora
    if (keysPressed[MOBILE_SHOOT]) {
        return;
    }
    
    // Resto do código existente...
    event.preventDefault();
    isTouchActive = true;
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const relativeX = touch.clientX - gameAreaRect.left;
    const relativeY = touch.clientY - gameAreaRect.top;

    if (target.id === 'player') {
        // MODO 1: Drag 1:1 (Tocou na nave)
        isDraggingPlayer = true;
        touchOffsetX = relativeX - playerX;
        touchOffsetY = relativeY - playerY;
        dragTargetX = playerX;
        dragTargetY = playerY;
    } else {
        // MODO 2: Delta Move (Tocou na tela)
        isDraggingPlayer = false;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        touchDeltaX = 0;
        touchDeltaY = 0;
    }
}

/**
 * Lida com o movimento do toque (touchmove).
 * Atualiza o 'dragTarget' (Modo 1) ou o 'touchDelta' (Modo 2).
 */
function handleTouchMove(event) {
    if (!isGameRunning || !isTouchActive) return; 
    
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;

    if (isDraggingPlayer) {
        // MODO 1: Atualiza o *alvo* (onde a nave deve ir)
        const gameAreaRect = gameArea.getBoundingClientRect();
        const relativeX = touch.clientX - gameAreaRect.left;
        const relativeY = touch.clientY - gameAreaRect.top;
        
        dragTargetX = relativeX - touchOffsetX;
        dragTargetY = relativeY - touchOffsetY;
    } else {
        // MODO 2: Calcula o *delta* (o quanto mover)
        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;
        
        // Armazena o delta para ser usado no movePlayer
        touchDeltaX = deltaX;
        touchDeltaY = deltaY;

        // Atualiza a posição "anterior" para o próximo frame
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    }
}

/**
 * Lida com o fim do toque (touchend / touchcancel).
 * Reseta todos os estados de toque.
 */
function handleTouchEnd(event) {
    isTouchActive = false;
    isDraggingPlayer = false;
    
    // Reseta Modo 1
    dragTargetX = null;
    dragTargetY = null;
    touchOffsetX = 0;
    touchOffsetY = 0;

    // Reseta Modo 2
    touchDeltaX = 0;
    touchDeltaY = 0;
    lastTouchX = null;
    lastTouchY = null;
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
        
  // Lógica para chamar o Boss (Se 1 acerto ou mais)
    if (acertosDesdeUltimoBoss >= 1 && !isBossFight) {
        
        // NOTA: A verificação de VITÓRIA FINAL foi movida para exitBossFight.
        // Se o currentLevel for o do último boss, ele será derrotado
        // e o exitBossFight(true) vai chamar endGame(true).
        // Se não for o último, chamamos o próximo boss.
        
        // Apenas verifica se o nível atual é menor ou igual ao total de bosses
        if (currentLevel <= BOSS_CHARACTERS.length) {
            enterBossFight(); 
        }
        
        // Se currentLevel for maior (estado de vitória), o endGame já foi chamado, 
        // ou o game loop vai parar logo. Se o endGame falhar, este `if` evita 
        // chamar enterBossFight com currentLevel em um estado inválido.
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
    speed: BASE_ASTEROID_SPEED + getRandomInt(0, 10), //Velocidade dos 
    scale: 0.5,
    vx: (Math.random() - 0.5) * 20,
    oscillationOffset: Math.random() * 10,
    // ⭐ NOVO: Propriedades de vida do asteroide
    hits: 0,
    maxHits: 3 // 1/2 função outra logo a baixo na handleAsteroidHit
});
    }
}
function generatePunishmentAsteroids() { 
    // Remove asteroides anteriores
    asteroids.forEach(a => { if (a.element) a.element.remove(); });
    asteroids = [];

    bossIsInPunishment = true; // Entra no modo punição
    if (bossInterval) clearInterval(bossInterval); // Pausa o ciclo normal do boss

    // Mensagem aleatória de punição
    const repelMsg = getRandomMessage(NEGATIVE_FEEDBACK);
    showTemporaryMessage(repelMsg, 3000, 'error-msg');

    // Geração de respostas
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

    const answerArray = Array.from(answers);
    shuffleArray(answerArray);

    // Calcula posições X
    const posicoesX = [];
    const safeMargin = 40;
    const availableWidth = GAME_WIDTH - (safeMargin * 2);
    const slotWidth = availableWidth / MAX_ASTEROIDS;

    for (let i = 0; i < MAX_ASTEROIDS; i++) {
        const slotCenter = safeMargin + (slotWidth / 2) + (i * slotWidth);
        const randomOffset = (Math.random() - 0.5) * (slotWidth * 0.2);
        posicoesX.push(slotCenter + randomOffset);
    }

    // Cria os asteroides
    for (let i = 0; i < MAX_ASTEROIDS; i++) {
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

        const baseX = posicoesX[i] + 40;
        const y = -100 - (i * 100);

        asteroidElement.style.left = `${posicoesX[i]}px`;
        asteroidElement.style.top = `${y}px`;
        asteroidElement.style.transform = 'translate(-50%, -50%) scale(0.5)';
        asteroidElement.style.opacity = '0.5';

        gameArea.appendChild(asteroidElement);
        asteroids.push({
            element: asteroidElement,
            x: baseX,
            y: y,
            baseX: posicoesX[i],
            value: value,
            isDestroyed: false,
            isCurrentTarget: true,
            isCorrectAnswer: (value === question.answer),
            speed: BASE_ASTEROID_SPEED * 2 + getRandomInt(0, 1), // Velocidade asteroid Punish
            scale: 0.5,
            vx: (Math.random() - 0.5) * 30,
            oscillationOffset: Math.random() * 10
        });
    }
}
// ==========================
// ENTRADA DE BOSS
// ==========================
function enterBossFight() {
    isBossFight = true;
    bossIsInPunishment = false;

    // Limpa asteroides antigos e projéteis
    asteroids.forEach(a => { if(a.element) a.element.remove(); });
    bullets.forEach(b => b.element.remove());
    bossProjectiles.forEach(p => { if(p.element) p.element.remove(); });
    asteroids = [];
    bullets = [];
    bossProjectiles = [];

    // Limpa intervalos antigos
    if (bossInterval) clearInterval(bossInterval);
    if (bossAttackInterval) clearInterval(bossAttackInterval);
    bossInterval = null;
    bossAttackInterval = null;

    // Limpa tela de pergunta
    if (infoTimer) clearTimeout(infoTimer);
    questionDisplay.innerText = "";
    questionDisplay.style.display = 'none';

    // Cria novo boss
    const bossIndex = (currentLevel - 1) % BOSS_CHARACTERS.length;
    const bossInfo = BOSS_CHARACTERS[bossIndex];
    showBossTitle(`${bossInfo.name.toUpperCase()} APARECEU!`);

    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    question = generateQuestionData(currentDiff);
    bossCurrentHealth = bossInfo.maxHealth;

    boss = {
        element: document.createElement('div'),
        info: bossInfo,
        currentAnswer: null,
        isVulnerable: false
    };

    boss.element.id = 'boss';
    boss.element.innerHTML = `
        <img class="boss-gif" src="${bossInfo.gifUrl}" alt="${bossInfo.name}">
        <span class="boss-question">${question.text} = ?</span>
        <div class="boss-answer-display">...</div>
    `;
    boss.element.classList.add('invulnerable');
    gameArea.appendChild(boss.element);

    updateHUD();

    // Intervalos do boss
    bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
    bossAttackInterval = setInterval(spawnBossAttack, 7000);
}

// ==========================
// CICLO DE VULNERABILIDADE
// ==========================
function toggleBossVulnerability() {
    if (!boss || !boss.element.parentElement) return;

    const answerDisplay = boss.element.querySelector('.boss-answer-display');
    const questionDisplayBoss = boss.element.querySelector('.boss-question');
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    const answerRange = Math.max(5, Math.floor(currentDiff.maxNum * 0.3));

    if (bossIsInPunishment) return; // pausa vulnerabilidade durante punição

    // Gera nova pergunta do boss
    question = generateQuestionData(currentDiff);
    questionDisplayBoss.innerText = `${question.text} = ?`;

    const isVulnerableWindow = Math.random() < 0.5;

    if (isVulnerableWindow) {
        boss.isVulnerable = true;
        boss.currentAnswer = question.answer;
        boss.element.classList.remove('invulnerable');
        boss.element.classList.add('vulnerable');
        answerDisplay.innerText = question.answer;

        setTimeout(() => {
            if (boss && boss.isVulnerable) {
                boss.isVulnerable = false;
                boss.element.classList.remove('vulnerable');
                boss.element.classList.add('invulnerable');
                answerDisplay.innerText = '...';
            }
        }, 3000 + getRandomInt(500, 1500));

    } else {
        boss.isVulnerable = false;
        boss.element.classList.remove('vulnerable');
        boss.element.classList.add('invulnerable');

        let fakeAnswer;
        do {
            fakeAnswer = question.answer + getRandomInt(-answerRange, answerRange);
        } while (fakeAnswer <= 0 || fakeAnswer === question.answer || Math.abs(fakeAnswer - question.answer) < 3);

        boss.currentAnswer = fakeAnswer;
        answerDisplay.innerText = fakeAnswer;

        setTimeout(() => {
            if (boss && !boss.isVulnerable) answerDisplay.innerText = '...';
        }, 1000 + getRandomInt(500, 1500));
    }
}

// ==========================
// ACERTO OU ERRO NO BOSS
// ==========================
function handleBossHit(bullet) {
    if (!boss || !boss.element.parentElement) return false;

    const bossRect = boss.element.getBoundingClientRect();
    const bulletRect = bullet.element.getBoundingClientRect();

    const collided = (
        bulletRect.left < bossRect.right &&
        bulletRect.right > bossRect.left &&
        bulletRect.top < bossRect.bottom &&
        bulletRect.bottom > bossRect.top
    );

    if (!collided || bossIsInPunishment) return false;

    createExplosion(bullet.x, bullet.y, 'white');

    const isCorrectHit = boss.isVulnerable && bullet.value === question.answer;

    if (isCorrectHit) {
        bossCurrentHealth--;
        score += 50;
        combo++;
        playDamageSound();
        createExplosion(bullet.x, bullet.y, 'var(--cor-acerto)');
        boss.element.classList.add('hit');
        setTimeout(() => boss.element.classList.remove('hit'), 400);

        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

        if (bossCurrentHealth <= 0) {
            if (bossInterval) clearInterval(bossInterval);
            exitBossFight(true);
        } else {
            // Reinicia intervalo do boss
            if (bossInterval) clearInterval(bossInterval);
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
        }

    } else {
        // Acerto inválido → punição
        playHitSound();
        combo = 0;
        createExplosion(bullet.x, bullet.y, 'var(--cor-erro)');
        bossIsInPunishment = true;

        if (bossInterval) clearInterval(bossInterval);
        boss.isVulnerable = false;
        boss.element.classList.remove('vulnerable');
        boss.element.classList.add('invulnerable');

        generatePunishmentAsteroids();
    }

    updateHUD();
    return true;
}

// ==========================
// PROJÉTEIS DO BOSS
// ==========================
function spawnBossAttack() {
    if (!isBossFight || !boss || !boss.element) return;

    const bossRect = boss.element.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();
    const spawnX = (bossRect.left - gameRect.left) + bossRect.width/2;
    const spawnY = bossRect.bottom - gameRect.top;

    const blackHoleEl = document.createElement('div');
    blackHoleEl.className = 'black-hole-visual';
    blackHoleEl.style.left = `${spawnX}px`;
    blackHoleEl.style.top = `${spawnY}px`;
    gameArea.appendChild(blackHoleEl);

    setTimeout(() => { if (blackHoleEl.parentElement) blackHoleEl.remove(); }, 2100);

    setTimeout(() => {
        if (!isBossFight) return;
        const numProjectiles = 5;
        const spreadAngle = Math.PI / 2;
        const startAngle = Math.PI / 4;
        const projectileSpeed = 0.5; // Velocidade do asteroid buraco negro

        for (let i = 0; i < numProjectiles; i++) {
            const angle = startAngle + (i / (numProjectiles-1)) * spreadAngle;
            const vx = Math.cos(angle) * projectileSpeed;
            const vy = Math.sin(angle) * projectileSpeed;

            const projEl = document.createElement('div');
            projEl.className = 'asteroid boss-projectile';
            projEl.style.backgroundImage = `url('${ASTEROID_GIFS[getRandomInt(0, ASTEROID_GIFS.length-1)]}')`;
            projEl.style.left = `${spawnX}px`;
            projEl.style.top = `${spawnY}px`;
            gameArea.appendChild(projEl);

            bossProjectiles.push({ element: projEl, x: spawnX, y: spawnY, vx: vx*100, vy: vy*100, hits: 0, maxHits: 3 });
        }
    }, 500);
}

function handleBossProjectileHit(index, bullet) {
    const projectile = bossProjectiles[index];
    if (!projectile) return;

    createExplosion(bullet.x, bullet.y, 'gray');
    playHitSound();
    projectile.element.remove();
    bossProjectiles.splice(index, 1);
    score = Math.min(score + 1, 99999);
}

function handlePlayerHitByBossProjectile(projectile) {
    lives--;
    combo = 0;
    score = Math.max(0, score-5);
    playDamageSound();
    if (navigator.vibrate) navigator.vibrate([40,60,40]);
    createExplosion(playerX+25, playerY+25, 'red');
    player.style.opacity='0.5';
    setTimeout(()=>player.style.opacity='1',500);
    showTemporaryMessage("ATINGIDO! -1 Vida!",1500,'error-msg');
    projectile.element.remove();
    updateHUD();
    if (lives <=0) endGame();
}

// ==========================
// SAÍDA DO BOSS
function exitBossFight(success) {
    // Se o jogo não está rodando ou não estamos em luta, sai.
    if (!isGameRunning || !isBossFight) return;

    // 1. Limpeza e Reset Básico
    isBossFight = false;
    bossIsInPunishment = false;

    if (bossInterval) clearInterval(bossInterval);
    if (bossAttackInterval) clearInterval(bossAttackInterval);
    bossInterval = null;
    bossAttackInterval = null;

    bossProjectiles.forEach(p => { if (p.element) p.element.remove(); });
    bossProjectiles = [];

    // 2. Remoção Visual e Explosão
    if (boss && boss.element && boss.element.parentElement) {
        if (success) createExplosion(GAME_WIDTH/2, 125, '#ffcc00'); 
        boss.element.remove();
        boss = null;
    }
    
    // Limpa asteroides remanescentes
    asteroids.forEach(a => { if (a.element) a.element.remove(); });
    asteroids = [];
    
    // Se não foi sucesso, apenas limpa e notifica. O dano já foi tomado.
    if (!success) {
        showTemporaryMessage(`VOCÊ ESCAPOU...`, 1500, 'alert-msg');
        setTimeout(() => { if (isGameRunning) generateNewQuestion(); }, 1500);
        updateHUD();
        return;
    }
    
    // --- Lógica de Sucesso (Boss Derrotado) ---
    const totalBosses = BOSS_CHARACTERS.length;
    score += 100;
    
    // ⭐ NOVO CÓDIGO AQUI: Verifica se o chefe derrotado é o ÚLTIMO
    if (currentLevel >= totalBosses) {
        // Se o nível atual é o último (ou superior, por segurança), é VITÓRIA FINAL.
        
        playBosswin(); 
        
        // Remove background do Boss imediatamente antes da tela de fim
        if (gameArea) {
            gameArea.style.backgroundImage = 'none'; 
            gameArea.style.backgroundColor = '#000000';
        }
        
        // Exibe mensagem rápida e chama o fim do jogo (endGame(true) cuida de parar tudo)
        showTemporaryMessage("PARABÉNS! VOCÊ VENCEU O JOGO!", 500, 'success-msg');
        endGame(true);
        
        // O endGame(true) vai parar o loop e o updateHUD não será chamado novamente
        return; 
    }
    
    // --- Lógica de Avanço de Nível (Chefes Intermediários) ---
    
    // Avança para o próximo nível
    currentLevel++; 
    acertosDesdeUltimoBoss = 0;
    
    playBosswin();
    showTemporaryMessage(`BOSS DERROTADO! NÍVEL ${currentLevel} INICIADO!`, 2500, 'success-msg');
    
    // Reinicia o ciclo para o novo nível
    setTimeout(() => { 
        if (isGameRunning) {
            generateNewQuestion(); 
        }
    }, 2500);
    
    updateHUD();
}



function movePlayer() {
 if (!isGameRunning) return;


if (!isFinite(playerX) || playerX === null) playerX = (GAME_WIDTH || 320) / 2;
if (!isFinite(playerY) || playerY === null) playerY = (GAME_HEIGHT || 240) - 70;

 let dx = 0;
 let dy = 0;
 let rotation = 0;

const playerWidth = player.offsetWidth || 63; 
 const playerHeight = player.offsetHeight || 63; 
 const marginBottom = 20; // Correspondente ao bottom: 20px no CSS

    if (isTouchActive) {


        if (isDraggingPlayer) {
            // MODO 1: Drag 1:1 (move para dragTargetX/Y)
            // A nave "gruda" no dedo
            
            const playerCenterX = playerX + (playerWidth / 2);
            const playerCenterY = playerY + (playerHeight / 2);
            
            // O alvo é o canto (dragTargetX/Y) + metade da nave
            const targetCenterX = dragTargetX + (playerWidth / 2);
            const targetCenterY = dragTargetY + (playerHeight / 2);

            const diffX = targetCenterX - playerCenterX;
            const diffY = targetCenterY - playerCenterY;
            
            // Move 1:1 (sem suavização, sem limite de vel.)
            // O 'clamping' (limites) no final da função vai segurar a nave.
            dx = diffX;
            dy = diffY;
            
            rotation = (dx / (PLAYER_SPEED * 2)) * 15; // Rotação baseada no delta

        } else {
            dx = touchDeltaX;
            dy = touchDeltaY;
            rotation = (dx / PLAYER_SPEED) * 15;
            touchDeltaX = 0;
            touchDeltaY = 0;
        }

    } else {

 if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
            dx = -PLAYER_SPEED;
            rotation = -10;
        }
if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
 if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) { 
 dx = 0; rotation = 0;
} else {
 dx = PLAYER_SPEED; rotation = 10;
 }
 }
if (keysPressed['ArrowUp'] || keysPressed['KeyW']) dy = -PLAYER_SPEED;
if (keysPressed['ArrowDown'] || keysPressed['KeyS']) dy = PLAYER_SPEED;

 if (dx !== 0 && dy !== 0) {
 const diagFactor = Math.sqrt(2);
 dx /= diagFactor; dy /= diagFactor;
}
    }

    playerX += dx;
    playerY += dy;

playerX = Math.max(0, Math.min(GAME_WIDTH - playerWidth, playerX));


playerY = Math.max(0, Math.min(GAME_HEIGHT - playerHeight - marginBottom, playerY)); 

player.style.left = `${playerX}px`;
player.style.top = `${playerY}px`;
player.style.transform = `rotate(${rotation}deg)`;


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
    // Movimento baseado no DeltaTime
    bullet.y -= BULLET_SPEED * (deltaSeconds * 60);
    bullet.element.style.top = `${bullet.y}px`;

    // Colisão com o Boss
    if (isBossFight && boss && handleBossHit(bullet)) {
        bullet.element.remove(); 
        return false;       
    }

    // Colisão com Asteroides
    if (asteroids.length > 0) {
        const collidedIndex = asteroids.findIndex(asteroid => !asteroid.isDestroyed && checkCollision(bullet, asteroid));
        if (collidedIndex !== -1) {
            handleAsteroidHit(collidedIndex, bullet);
            bullet.element.remove(); 
            return false; 
        }
    }

    // Colisão com projéteis do boss
    if (isBossFight && bossProjectiles.length > 0) {
        const collidedProjIndex = bossProjectiles.findIndex(proj => checkCollision(bullet, proj));
        if (collidedProjIndex !== -1) {
            handleBossProjectileHit(collidedProjIndex, bullet); 
            bullet.element.remove();
            return false; 
        }
    }

    // Remove tiros fora da tela
    if (bullet.y < -20) {
        bullet.element.remove();
        return false;
    }
    return true;
});


        // ----------------------------------------------------------------------
        // 2. Movimentação de Asteroides e Tamanho
        // ----------------------------------------------------------------------
 asteroids = asteroids.filter(asteroid => {
    if (asteroid.isDestroyed) return false;

    // Movimento e oscilação
    asteroid.x = asteroid.baseX + Math.sin(timestamp / 700 + asteroid.oscillationOffset) * 15;
    asteroid.y += asteroid.speed * deltaSeconds;

    asteroid.element.style.left = `${asteroid.x}px`;
    asteroid.element.style.top = `${asteroid.y}px`;

    // Escala e opacidade
    const ratio = (GAME_HEIGHT - asteroid.y) / GAME_HEIGHT;
    asteroid.scale = Math.min(1, 0.5 + (1 - ratio) * 0.3);
    asteroid.element.style.transform = `translate(-50%, -50%) scale(${asteroid.scale})`;
    asteroid.element.style.opacity = Math.min(1, 2.7 + (1 - ratio) * 0.5);

    // Colisão com o jogador
    if (checkPlayerCollision(asteroid)) {
        playHitasteroidfail();
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

        handlePlayerHit(asteroid);

        // Remove asteroide de ataque
        if (asteroid.value === 'Attack') {
            asteroid.element.remove();
            return false;
        }
    }

    // Asteroide passou da tela
    if (asteroid.y > GAME_HEIGHT + 50) {
        playHitasteroidfail();
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

        if (asteroid.isCurrentTarget) {
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
handlePlayerCollisionWithBoss(deltaSeconds);

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
function handlePlayerCollisionWithBoss(deltaSeconds) {
    if (!isBossFight || !boss || !boss.element) return;

    const bossRect = boss.element.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    const collided = (
        playerRect.left < bossRect.right &&
        playerRect.right > bossRect.left &&
        playerRect.top < bossRect.bottom &&
        playerRect.bottom > bossRect.top
    );

    if (!collided) return;

    // Reduz vida
    if (!player.justHitBoss) {
        lives--;
        combo = 0;
        score = Math.max(0, score - 5);
        playDamageSound();
        if (navigator.vibrate) navigator.vibrate([40,60,40]);
        createExplosion(playerX + playerRect.width/2, playerY + playerRect.height/2, 'red');
        showTemporaryMessage("-1 VIDA! CUIDADO COM O BOSS!", 1500, 'error-msg');
        updateHUD();

        player.justHitBoss = true;
        setTimeout(() => { player.justHitBoss = false; }, 1000);
    }

    // Calcula vetor do knockback (empurrão)
    const bossCenterX = bossRect.left + bossRect.width / 2;
    const bossCenterY = bossRect.top + bossRect.height / 2;
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top + playerRect.height / 2;

    let dx = playerCenterX - bossCenterX;
    let dy = playerCenterY - bossCenterY;
    const distance = Math.sqrt(dx*dx + dy*dy) || 1;
    dx /= distance;
    dy /= distance;

    // 🔥 AUMENTAR A FORÇA DO EMPURRÃO E ADICIONAR VARIAÇÃO ALEATÓRIA
    const KNOCKBACK_FORCE = 400 + Math.random() * 100; // mais forte e imprevisível
    playerX += dx * KNOCKBACK_FORCE * deltaSeconds;
    playerY += dy * KNOCKBACK_FORCE * deltaSeconds;

    // Mantém o jogador dentro da tela
    const playerWidth = player.offsetWidth || 63;
    const playerHeight = player.offsetHeight || 63;
    playerX = Math.max(0, Math.min(GAME_WIDTH - playerWidth, playerX));
    playerY = Math.max(0, Math.min(GAME_HEIGHT - playerHeight - 20, playerY));

    // Atualiza posição visual
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
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

    // 1️⃣ APLICA DANO E REMOVE A BALA
    asteroid.hits = (asteroid.hits || 0) + 1; // Incrementa contador
    createExplosion(bullet.x, bullet.y, 'white');
    playHitSound();

    const MAX_HITS = asteroid.maxHits || 5;
    const shouldBeDestroyed = asteroid.hits >= MAX_HITS;

    if (!shouldBeDestroyed) {
        // --- ASTEROIDE LEVOU DANO, MAS NÃO FOI DESTRUÍDO ---
        const currentScale = parseFloat(asteroid.element.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 0.5);
        asteroid.element.style.transform = `translate(-50%, -50%) scale(${currentScale + 0.1})`;

        const opacityChange = 0.5 + (asteroid.hits / MAX_HITS) * 0.5;
        asteroid.element.style.opacity = opacityChange.toString();
        return;
    }

    // 2️⃣ ASTEROIDE DESTRUÍDO — EFEITOS DE EXPLOSÃO E VIBRAÇÃO
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    asteroid.isDestroyed = true;

    if (asteroid.element && asteroid.element.parentElement) {
        createExplosion(asteroid.x, asteroid.y, asteroid.isCorrectAnswer ? 'yellow' : 'gray');
        asteroid.element.remove();
    }

    // 3️⃣ SE FOR A RESPOSTA CORRETA...
    if (asteroid.isCorrectAnswer) {
        createExplosion(asteroid.x, asteroid.y, 'yellow');
        playSucesso();

        asteroid.isDestroyed = true;
        if (asteroid.element) asteroid.element.remove();

        // ⚔️ CONTRA-ATAQUE SE ESTIVER NA FASE DE PUNIÇÃO DO BOSS
        if (isBossFight && bossIsInPunishment) {
            const counter = document.createElement('div');
            counter.className = 'counter-attack';
            counter.style.position = 'absolute';
            counter.style.left = `${asteroid.x}px`;
            counter.style.top = `${asteroid.y}px`;
            counter.style.width = '20px';
            counter.style.height = '20px';
            counter.style.borderRadius = '50%';
            counter.style.background = 'yellow';
            counter.style.boxShadow = '0 0 20px 10px yellow';
            gameArea.appendChild(counter);

            const bossRect = boss.element.getBoundingClientRect();
            const gameRect = gameArea.getBoundingClientRect();
            const targetX = bossRect.left + bossRect.width / 2 - gameRect.left;
            const targetY = bossRect.top + bossRect.height / 2 - gameRect.top;

            // Animação do contra-ataque
            counter.animate([
                { transform: `translate(-50%, -50%) scale(1)`, opacity: 1 },
                { transform: `translate(${targetX - asteroid.x}px, ${targetY - asteroid.y}px) scale(2)`, opacity: 0.2 }
            ], {
                duration: 800,
                easing: 'ease-out'
            }).onfinish = () => {
                counter.remove();
                createExplosion(targetX, targetY, 'white');
                playDamageSound();
                if (navigator.vibrate) navigator.vibrate([50, 80, 50]);

                bossCurrentHealth--;
                if (bossCurrentHealth <= 0) {
                    exitBossFight(true);
                } else {
                    showTemporaryMessage("CONTRA-ATAQUE BEM-SUCEDIDO!", 2000, 'alert-msg');
                    bossIsInPunishment = false;

                    // 🔁 Reinicia o ciclo do boss após o fim da punição
                    if (bossInterval) clearInterval(bossInterval);
                    bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
                }
            };
        } else {
            // 🌍 ACERTO NORMAL (fora da punição)
            score += 10 + (combo > 1 ? combo * 5 : 0);
            combo++;
            acertosDesdeUltimoBoss++;
            setTimeout(() => generateNewQuestion(), 50);
        }

        updateHUD();
        return;
    }

    // 4️⃣ CASO NÃO SEJA A RESPOSTA CORRETA (NORMAL)
    if (isBossFight && bossIsInPunishment) {
        // ❌ Errou o asteroide durante a punição — apenas remove
        createExplosion(asteroid.x, asteroid.y, 'gray');
        playHitasteroidfail();
        asteroid.isDestroyed = true;
        if (asteroid.element) asteroid.element.remove();
    }

    updateHUD();
}


function handlePlayerHit(asteroid) {
    lives--;
    combo = 0;
    score = Math.max(0, score - 10);
    createExplosion(playerX + 25, playerY + 25, 'var(--cor-erro)');
    player.style.opacity = '0.5';
    setTimeout(() => player.style.opacity = '1', 500);
    showTemporaryMessage("COLISÃO! -1 Vida! Pergunta Reiniciada!", 1500);

    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);

    // Remove todos os asteroides restantes
    asteroids.forEach(a => {
        if (a.element && a.element.parentElement && !a.isDestroyed) {
            a.isDestroyed = true;
            a.element.remove();
        }
    });
    asteroids = [];

    // Reset dos controles do jogador
    const movementKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Mouse0', MOBILE_MOVE_LEFT, MOBILE_MOVE_RIGHT, MOBILE_SHOOT];
    movementKeys.forEach(k => { if (keysPressed[k]) keysPressed[k] = false; });

    updateHUD();

    if (lives <= 0) {
        endGame();
        return;
    }

    // Reinicia pergunta ou ciclo do boss
    setTimeout(() => {
        if (isBossFight) {
            showTemporaryMessage("Ciclo do Boss Resetado!", 1000);
            bossIsInPunishment = false;
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
        combo = 0;
        showTemporaryMessage("ALVO DE PUNIÇÃO PERDIDO! Ciclo Reiniciado!", 2000);

        bossIsInPunishment = false;
        if (bossInterval) clearInterval(bossInterval);
        bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));

        // Remove todos os asteroides restantes
        asteroids.forEach(a => { if (a.element && a.element.parentElement) a.element.remove(); });
        asteroids = [];
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

    asteroids.forEach(a => { if (a.element && a.element.parentElement && !a.isDestroyed) { a.isDestroyed = true; a.element.remove(); } });

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
