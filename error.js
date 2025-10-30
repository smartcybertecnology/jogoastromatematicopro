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

// URLs dos GIFs - AGORA COM 'maxHealth' PARA CADA CHEFE
const BOSS_CHARACTERS = [
    { 
        name: 'Dr. nervoso', 
        gifUrl: 'boss1.gif',
        maxHealth: 3 
    },
    { 
        name: 'Cloud Mad', 
        gifUrl: 'boss2.gif',
        maxHealth: 4 
    },
    { 
        name: 'UFO', 
        gifUrl: 'boss3.gif',
        maxHealth: 5 
    },
    { 
        name: 'ghost', 
        gifUrl: 'boss4.gif',
        maxHealth: 6 
    },  
    { 
        name: 'Buraco negro', 
        gifUrl: 'boss5.gif',
        maxHealth: 8 
    }
];

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

    // 1. Movimento pelo teclado (PC) e Botões Móveis
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

    // 2. Movimento por Toque (Analógico, se estiver ativo)
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


    // 3. Limites de Borda 
    playerX = Math.max(0, Math.min(playerX, GAME_WIDTH - player.offsetWidth));

    // 4. Aplica a posição e rotação
    player.style.left = `${playerX}px`;
    player.style.transform = `rotate(${rotation}deg)`;
    
    // IMPORTANTE: Manter o playerY fixo (ou definido pelo CSS no PC)
    // No modo PC, o CSS define 'bottom', então não precisamos setar 'top'
    // Se o estilo 'top' foi definido, precisamos mantê-lo ou redefini-lo:
    if (player.style.bottom === '') { 
         player.style.top = `${playerY}px`;
    }
}

// --- Funções de Jogo VAZIAS (Apenas para evitar erros de referência) ---
// Você deve preencher estas funções com a sua lógica real.
function updateHUD() {
    scoreDisplay.innerText = score;
    livesDisplay.innerText = lives;
    comboDisplay.innerText = combo;
    // ... lógica para bossHealthDisplay
}

function generateNewQuestion() {
    // Lógica para criar a pergunta e os asteroides
    console.log("Gerando nova questão...");
}

let lastFrameTime = 0;
function gameLoop(timestamp) {
    if (!isGameRunning) return;
    
    const deltaTime = timestamp - lastFrameTime; // Usado para física baseada no tempo
    lastFrameTime = timestamp;

    // movePlayer já é chamado pelo setInterval, mas algumas lógicas podem ser feitas aqui
    // Ex: Mover balas e asteroides
    
    // ... Lógica para mover asteroides e balas
    
    requestAnimationFrame(gameLoop);
}


// --- Funções de Inicialização e Jogo (COM A CORREÇÃO DE POSICIONAMENTO) ---

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
    lives = 3;
    combo = 0;
    acertosDesdeUltimoBoss = 0;
    currentLevel = 1;
    BASE_ASTEROID_SPEED = 35; 
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

    // LÓGICA CONDICIONAL: CELULAR OU DESKTOP
    // Se o botão 'shootButton' existir E estiver visível (modo móvel)
    if (shootButton && shootButton.offsetWidth > 0) {
        
        // 🚀 MODO CELULAR: Calcula a posição Y e X acima/longe do botão de tiro
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

        // Aplica estilos MÓVEIS (usa 'top' e zera 'bottom')
        player.style.left = `${playerX}px`;
        player.style.top = `${playerY}px`;
        player.style.bottom = 'auto'; 
        
    } else {
        
        // 💻 MODO DESKTOP: Usa a posição X central e depende do CSS para o Y (bottom: 20px)
        playerX = GAME_WIDTH / 2 - 25; 
        
        // Aplica estilos DESKTOP (zera 'top' e usa 'bottom' do CSS)
        player.style.left = `${playerX}px`;
        player.style.top = ''; 
        player.style.bottom = ''; 
        
        // Define a variável playerY para a lógica do jogo (aproximadamente a posição do CSS)
        playerY = GAME_HEIGHT - 70; 
    }

    // Estilo de inicialização (comum a ambos)
    player.style.transform = 'rotate(0deg)';


    // 5. INICIA O JOGO
    updateHUD();
    generateNewQuestion(); 

    window.addEventListener('resize', updateGameDimensions);

    // Loop de movimento para 60 FPS
    movementInterval = setInterval(movePlayer, 1000 / 60);

    requestAnimationFrame(gameLoop);
}

// --- Funções Auxiliares para Tocar Áudio (EXISTENTES) ---
function loadAudio() {
    audioShoot = new Audio('shoot.mp3');
    audioShoot.volume = 0.3;
    audioHit = new Audio('hit.mp3');
    audioHit.volume = 0.3;
    audioDamage = new Audio('damage.mp3');
    audioDamage.volume = 0.3;
    audioHitasteroid = new Audio('hitasteroid.mp3');
    audioHitasteroid.volume = 0.3;
    audioHitasteroidfail = new Audio('hitasteroidfail.mp3');
    audioHitasteroidfail.volume = 0.3;
    audioSucesso = new Audio('Sucesso.mp3');
    audioSucesso.volume = 0.3;
    audioGameOver = new Audio('game-over.mp3');
    audioGameOver.volume = 0.3;
    audioBosswin = new Audio('bosswin.mp3');
    audioBosswin.volume = 0.3;
}

function playShootSound() {
    if (audioShoot) {
        const sound = audioShoot.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de disparo:", e));
    }
}

function playHitSound() {
    if (audioHit) {
        const sound = audioHit.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}
function playDamageSound() {
    if (audioDamage) {
        const sound = audioDamage.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}
function playHitasteroid() {
    if (audioHitasteroid) {
        const sound = audioHitasteroid.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}

function playHitasteroidfail() {
    if (audioHitasteroidfail) {
        const sound = audioHitasteroidfail.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}
function playSucesso() {
    if (audioSucesso) {
        const sound = audioSucesso.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}
function playgameover() {
    if (audioGameOver) {
        const sound = audioGameOver.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}
function playBosswin() {
    if (audioBosswin) {
        const sound = audioBosswin.cloneNode(); 
        sound.play().catch(e => console.log("Erro ao tocar áudio de acerto:", e));
    }
}

function endGame(isVictory = false) { 
    // Certifique-se de que 'gameArea' esteja definida (ex: const gameArea = document.getElementById('gameArea');)
    const gameArea = document.getElementById('gameArea'); 

    // 1. PARADA DE LOOPS E FLAGS
    isGameRunning = false;
    clearInterval(movementInterval);
    if (bossInterval) clearInterval(bossInterval); 
    if (infoTimer) clearTimeout(infoTimer);
    window.removeEventListener('resize', updateGameDimensions); // Limpa listener de redimensionamento
    
    // 2. TOCA SOM
    if (isVictory) {
        playBosswin(); 
    } else {
        playgameover(); 
    }

    // 3. LIMPEZA VISUAL (Boss e Fundo)
    if (boss && boss.element.parentElement) {
        // Remove o elemento do Boss
        createExplosion(GAME_WIDTH / 2, 125, 'var(--cor-erro)'); 
        boss.element.remove();
    }
    
    // ⭐ CORREÇÃO PRINCIPAL: Remove o background (imagem do Buraco Negro) da área de jogo ⭐
    if (gameArea) {
        gameArea.style.backgroundImage = 'none'; // Remove a imagem do fundo
        gameArea.style.backgroundColor = '#000000'; // Define cor de fundo preto
    }
    
    // GARANTIA DE RESET DO ESTADO DO BOSS
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
    
    // Altera o título dinamicamente (MISSÃO CUMPRIDA/FRACASSADA)
    const titleElement = gameOverScreen.querySelector('h2');
    if (titleElement) {
        titleElement.innerText = isVictory ? "MISSÃO CUMPRIDA!" : "MISSÃO FRACASSADA";
    } else {
        console.error("Elemento H2 não encontrado na tela de Game Over. Verifique seu HTML.");
    }
    
    document.getElementById('finalScore').innerText = score;
    gameOverScreen.style.display = 'flex';
    questionDisplay.style.display = 'none'; // Esconde o painel de perguntas
}

// A nova função para o Botão Exclusivo (Use esta)
function handleShootButtonTouch(event) {
    // 1. Previne o movimento (se for um touch) e o clique padrão
    event.preventDefault();
    event.stopPropagation(); // Impede que o toque suba para o gameArea e cause movimento
    
    // 2. Garante que o jogo está rodando
    if (!isGameRunning) return;
    
    // 3. Simula o pressionar de tecla para quem usa keysPressed
    // Se você usa o keysPressed para disparo (tecla Espaço), adicione isso:
    keysPressed[MOBILE_SHOOT] = true;
    
    // 4. Chama a função de disparo diretamente
    shoot();
    
    // Opcional: Feedback visual rápido no botão
    const button = event.currentTarget;
    button.classList.add('active');
    setTimeout(() => {
        button.classList.remove('active');
    }, SHOOT_DELAY / 2);
}

// O restante do seu código JavaScript, a partir de `document.addEventListener('DOMContentLoaded', ...`

// Listener principal (deve estar no final do script para garantir que todos os elementos existam)
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const gameAreaElement = document.getElementById('gameArea'); 
    // ⭐ NOVO: Referência ao botão de disparo exclusivo
    const shootButton = document.getElementById('shootButton'); 

    // Start button listeners are attached later with improved mobile handling.

    // ⭐ NOVO: Adiciona listener para o botão de disparo exclusivo
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
        // Se você não quer mais disparo ao tocar na gameArea, REMOVA o listener abaixo:
        // gameAreaElement.addEventListener('touchstart', handleGameAreaTouch); 
        
        // ⭐ Movimento Touch (Inalterado) ⭐
        gameAreaElement.addEventListener('touchstart', handleMoveTouch);
        gameAreaElement.addEventListener('touchmove', handleMoveTouch); 
        gameAreaElement.addEventListener('touchend', handleMoveEnd); 
        gameAreaElement.addEventListener('touchcancel', handleMoveEnd); 
    }
});

// --- FIM DO CÓDIGO DE SUPORTE TOUCH/CLICK ---

// Função para CAPTURAR a posição X/Y do toque
function handleMoveTouch(event) {
    // 1. Previne o comportamento padrão (ex: scroll, zoom)
    event.preventDefault();

    // 2. Garante que o jogo está rodando
    if (!isGameRunning) return;
    
    // Certifique-se de que 'gameArea' está definida globalmente
    const gameAreaElement = document.getElementById('gameArea'); 
    if (!gameAreaElement) return;
    
    const gameAreaRect = gameAreaElement.getBoundingClientRect();

    // 3. Pega a posição do primeiro toque (ou do toque que restou)
    const touch = event.touches[0];
    if (touch) {
        // Define o alvo no sistema de coordenadas do jogo
        touchTargetX = touch.clientX - gameAreaRect.left;
        touchTargetY = touch.clientY - gameAreaRect.top;
    }
}


// Função para PARAR o Movimento quando os dedos são levantados
function handleMoveEnd(event) {
    // 1. Garante que o jogo está rodando
    if (!isGameRunning) return;

    // 2. Se não houver toques remanescentes, reseta os alvos de movimento.
    if (event.touches.length === 0) {
        touchTargetX = null;
        touchTargetY = null;
    } 
    // 3. Se houver toques remanescentes (multitouch), atualiza o alvo com o que sobrou.
    else if (event.touches.length > 0) {
        handleMoveTouch(event); 
    }
}


function updateHUD() {
    scoreDisplay.innerText = score;
    
    // ... (Lógica de ícones de Vidas e Combo inalterada) ...
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

    if (isBossFight) {
        const bossMaxHealth = boss ? boss.info.maxHealth : 0; 

        // INÍCIO DA MUDANÇA NO BOSSHEALTH
        
        let healthBarContent = `BOSS HP: `; // O TEXTO agora fica fora da barra

        healthBarContent += `<div class="boss-hp-bar">`; // Abre o contêiner de corações
        for(let i = 1; i <= bossMaxHealth; i++) {
            if (i <= bossCurrentHealth) {
                healthBarContent += `<span style="color:red;">❤️</span>`; // Coração cheio
            } else {
                healthBarContent += `<span style="color:#555;">🤍</span>`; // Coração vazio
            }
        }
        healthBarContent += `</div>`; // Fecha o contêiner de corações

        bossHealthDisplay.innerHTML = healthBarContent; // Usa a nova string com o contêiner
        bossHealthDisplay.style.display = 'flex'; // Use flex para o alinhamento centralizado
        
        // FIM DA MUDANÇA NO BOSSHEALTH
        
    } else {
        bossHealthDisplay.style.display = 'none';
    }

        // --- LÓGICA DE VIDA BÔNUS A CADA 10 ACERTOS ---
        // Verifica se é um múltiplo de 10, está no modo normal, e se já passou do primeiro acerto
        if (!isBossFight && acertosDesdeUltimoBoss > 0 && acertosDesdeUltimoBoss % 10 === 0) {
            // Verifica se a vida já foi concedida para este múltiplo (e evita vidas infinitas acima de MAX_LIVES_DISPLAY)
            // Se o contador for 10, ele ganha. No 11, ele não ganha. No 20, ele ganha de novo.
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
    
// --- Lógica da Matemática e Geração de Asteroides ---

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

    // Limpa mensagens temporárias e volta ao estado normal
    if (infoTimer) clearTimeout(infoTimer);

    // 1. LIMPEZA IMEDIATA DOS ASTEROIDES ANTIGOS
    // Remove todos os elementos de asteroides que ainda estão no DOM.
    asteroids.forEach(a => {
        if (a.element && a.element.parentElement) {
            a.element.remove();
        }
    });
    // Zera o array de asteroides para uma tela limpa
    asteroids = [];
    
    // 2. LÓGICA DA PERGUNTA
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    question = generateQuestionData(currentDiff);
    
    // Exibe a nova pergunta imediatamente
    questionDisplay.innerText = question.text;

    // 3. Gera e coleta respostas
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

    // --- BLOCO CORRIGIDO (INÍCIO) ---
    // 4. Posicionamento horizontal (Lógica segura contra loop infinito)
    const posicoesX = [];
    
    // Define uma margem segura nas laterais (ex: 40px de cada lado)
    const safeMargin = 40;
    const availableWidth = GAME_WIDTH - (safeMargin * 2);

    if (availableWidth <= 0) {
        // Caso extremo: tela minúscula, joga tudo no meio
        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            posicoesX.push(GAME_WIDTH / 2);
        }
    } else {
        // Divide a largura disponível em "slots" para cada asteroide
        const slotWidth = availableWidth / MAX_ASTEROIDS;

        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            // Calcula o centro do slot
            let slotCenter = safeMargin + (slotWidth / 2) + (i * slotWidth);
            
            // Adiciona uma pequena variação aleatória (para não parecerem alinhados)
            let randomOffset = (Math.random() - 0.5) * (slotWidth * 0.2);
            
            posicoesX.push(slotCenter + randomOffset);
        }
    }
    // --- BLOCO CORRIGIDO (FIM) ---

    // 5. Cria os novos elementos dos asteroides (COM CORREÇÃO DO GIF)
    for(let i = 0; i < MAX_ASTEROIDS; i++) {
        const value = answerArray[i];
        const asteroidElement = document.createElement('div');
        asteroidElement.className = 'asteroid';
        
        // 🚀 CORREÇÃO 1: Define o GIF como a imagem de fundo
        const gifUrl = ASTEROID_GIFS[getRandomInt(0, ASTEROID_GIFS.length - 1)];
        asteroidElement.style.backgroundImage = `url('${gifUrl}')`; 
        
        // 🚀 CORREÇÃO 2: Cria o SPAN para o número e o anexa (para ficar por cima do GIF)
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
            oscillationOffset: Math.random() * 10
        });
    }
}
    // --- Lógica do Boss Aprimorada ---

function enterBossFight() {
    isBossFight = true;

    // Limpa a tela
    asteroids.forEach(a => { a.element.remove(); });
    asteroids = [];

    // Limpa mensagens temporárias e GARANTE A LIMPEZA IMEDIATA
    if (infoTimer) clearTimeout(infoTimer);
    questionDisplay.innerText = ""; 
    questionDisplay.style.display = 'none'; // ✅ GARANTE OCULTAMENTO
    
    // ... (restante da lógica do Boss) ...
    const bossIndex = (currentLevel - 1) % BOSS_CHARACTERS.length;
    const bossInfo = BOSS_CHARACTERS[bossIndex];

    // 🌟 CHAMA a função que lida com a animação e o estado final (oculto).
    showBossTitle(`${bossInfo.name.toUpperCase()} HAS APPEARED!`);
    
    const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
    question = generateQuestionData(currentDiff);

    // *** AQUI É USADA A PROPRIEDADE maxHealth DO CHEFE SELECIONADO ***
    bossCurrentHealth = bossInfo.maxHealth; 
    // ***************************************************************
    bossMovementTime = 0; // Inicializa a variável de tempo para o movimento de oscilação

    // Cria o elemento do Boss
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
}
    function toggleBossVulnerability() {
        const answerDisplay = boss.element.querySelector('.boss-answer-display');
        const questionDisplayBoss = boss.element.querySelector('.boss-question');

        const currentDiff = DIFFICULTY[currentLevel - 1] || DIFFICULTY[DIFFICULTY.length - 1];
        const answerRange = Math.max(5, Math.floor(currentDiff.maxNum * 0.3));

        if (boss.isVulnerable) {
            // Fica Invulnerável (esconde a resposta)
            boss.isVulnerable = false;
            boss.element.classList.remove('vulnerable');
            boss.element.classList.add('invulnerable');
            answerDisplay.innerText = '...';

        } else {
            // PASSO CHAVE: GERA UMA NOVA PERGUNTA A CADA NOVO CICLO
            question = generateQuestionData(currentDiff);
            questionDisplayBoss.innerText = `${question.text} = ?`; // Atualiza a pergunta no Boss
            
            // Determina se o Boss será VULNERÁVEL ou se será uma ISCA
            const isVulnerableWindow = Math.random() < 0.5; // 50% de chance de ser o correto
            
            // Prepara para a exibição no visor
            if (isVulnerableWindow) {
                // JANELA DE VULNERABILIDADE (Mostra a resposta correta)
                boss.isVulnerable = true;
                boss.currentAnswer = question.answer;
                boss.element.classList.remove('invulnerable');
                boss.element.classList.add('vulnerable');
                answerDisplay.innerText = question.answer;

                // Define o timer para voltar a ser invulnerável
                setTimeout(() => {
                    if(boss && boss.isVulnerable) { 
                        boss.isVulnerable = false;
                        boss.element.classList.remove('vulnerable');
                        boss.element.classList.add('invulnerable');
                        answerDisplay.innerText = '...';
                    }
                }, 3000 + getRandomInt(500, 1500)); 

            } else {
                // JANELA DE ISCA (Mostra uma resposta errada, continua invulnerável)
                boss.isVulnerable = false; // Garante que é falso
                boss.element.classList.remove('vulnerable');
                boss.element.classList.add('invulnerable');
                
                let fakeAnswer;
                do {
                    fakeAnswer = question.answer + getRandomInt(-answerRange, answerRange);
                } while (fakeAnswer <= 0 || fakeAnswer === question.answer || Math.abs(fakeAnswer - question.answer) < 3);

                boss.currentAnswer = fakeAnswer; // O Boss exibe o erro
                answerDisplay.innerText = fakeAnswer; 

                // Define o timer para limpar a isca
                setTimeout(() => {
                    if(boss && !boss.isVulnerable) { 
                        answerDisplay.innerText = '...';
                    }
                }, 1000 + getRandomInt(500, 1500)); 
            }
        }
    }

function generatePunishmentAsteroids() {
    // Limpa os asteroides atuais primeiro
    asteroids.forEach(a => { a.element.remove(); });
    asteroids = [];
    
    // Usa a nova função
    const repelMsg = getRandomMessage(NEGATIVE_FEEDBACK);
    showTemporaryMessage(repelMsg, 3000, 'error-msg');

    // ... (lógica de geração de asteroides de punição)
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

    // --- BLOCO CORRIGIDO (INÍCIO) ---
    // Posições X (Lógica segura contra loop infinito)
    const posicoesX = [];
    
    // Define uma margem segura nas laterais (ex: 40px de cada lado)
    const safeMargin = 40;
    const availableWidth = GAME_WIDTH - (safeMargin * 2);

    if (availableWidth <= 0) {
        // Caso extremo: tela minúscula, joga tudo no meio
        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            posicoesX.push(GAME_WIDTH / 2);
        }
    } else {
        // Divide a largura disponível em "slots" para cada asteroide
        const slotWidth = availableWidth / MAX_ASTEROIDS;

        for (let i = 0; i < MAX_ASTEROIDS; i++) {
            // Calcula o centro do slot
            let slotCenter = safeMargin + (slotWidth / 2) + (i * slotWidth);
            
            // Adiciona uma pequena variação aleatória (para não parecerem alinhados)
            let randomOffset = (Math.random() - 0.5) * (slotWidth * 0.2);
            
            posicoesX.push(slotCenter + randomOffset);
        }
    }
    // --- BLOCO CORRIGIDO (FIM) ---

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

        // Reinicia o ciclo do Boss
        boss.isVulnerable = false; 
        
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
// Logica após derrotar o ultimo
function exitBossFight(success) {
    // Certifique-se de que 'gameArea' esteja definida (Ex: const gameArea = document.getElementById('gameArea');)
    const gameArea = document.getElementById('gameArea'); 

    if (!isBossFight) return;

    isBossFight = false;
    if (bossInterval) clearInterval(bossInterval);

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
    // --- Lógica da Nave e Tiros ---

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

    function gameLoop(timestamp) {
        if (!isGameRunning) return;

        // Refresh measurements to stay in sync with CSS/layout changes
        updateGameDimensions();

        // 1. Movimentação dos Tiros
        const BULLET_SPEED = 10;
        bullets = bullets.filter(bullet => {
    bullet.y -= BULLET_SPEED;
    bullet.element.style.top = `${bullet.y}px`;
    
    // Colisão com o Boss
    if (isBossFight && handleBossHit(bullet)) {
        
        // ESSAS DUAS LINHAS GARANTEM A LIMPEZA
        bullet.element.remove(); // Limpa o elemento visual
        return false;           // Remove do array de dados
    }


    // Colisão com Asteroides
    if (!isBossFight || asteroids.length > 0) {
        const collidedIndex = asteroids.findIndex(asteroid => !asteroid.isDestroyed && checkCollision(bullet, asteroid));
        if (collidedIndex !== -1) {
            handleAsteroidHit(collidedIndex, bullet);
            
            // Garantia de limpeza para Asteroides também!
            bullet.element.remove(); 
            return false; 
        }
    }

    // Remove tiros que saíram da tela
    if (bullet.y < -20) {
        bullet.element.remove();
        return false;
    }
    return true;

 // Colisão com Asteroides
if (!isBossFight || asteroids.length > 0) {
    
    const collidedIndex = asteroids.findIndex(asteroid => !asteroid.isDestroyed && checkCollision(bullet, asteroid));
    if (collidedIndex !== -1) {
        
        // 1. Executa a lógica do jogo (vidas, pontuação)
        handleAsteroidHit(collidedIndex, bullet);
        
        // 2. CRÍTICO: Remove o elemento visual (fragmento)
        bullet.element.remove(); 
        
        // 3. CRÍTICO: Remove o objeto do array 'bullets'
        return false; // Destrói o tiro
        
    }
}

            // Remove tiros que saíram da tela
            if (bullet.y < -20) {
                bullet.element.remove();
                return false;
            }
            return true;
        });

        // 2. Movimentação de Asteroides e Tamanho
        const deltaTime = 16.666666 / 1700; // Aproximação de 60 FPS
        asteroids = asteroids.filter(asteroid => {
            if (asteroid.isDestroyed) {
                // Os asteroides destruídos são removidos daqui
                return false; 
            }

            // Oscilação Horizontal e movimento para baixo
            asteroid.x = asteroid.baseX + Math.sin(timestamp / 700 + asteroid.oscillationOffset) * 15;
            asteroid.y += asteroid.speed * deltaTime;
            
            asteroid.element.style.left = `${asteroid.x}px`;
            asteroid.element.style.top = `${asteroid.y}px`;

            // Aumenta a escala e opacidade ao se aproximar (efeito 3D)
            const ratio = (GAME_HEIGHT - asteroid.y) / GAME_HEIGHT;
            asteroid.scale = Math.min(1, 0.5 + (1 - ratio) * 0.3);
            asteroid.element.style.transform = `translate(-50%, -50%) scale(${asteroid.scale})`;
            asteroid.element.style.opacity = Math.min(1, 2.0 + (1 - ratio) * 0.5);

            // Colisão com o Jogador
            if (checkPlayerCollision(asteroid)) {
                 playHitasteroidfail();
                handlePlayerHit(asteroid);
               
                return false;
                
            }

            // Asteróide passou da tela (PERDEU UMA VIDA se for alvo atual)
            if (asteroid.y > GAME_HEIGHT + 50) {
                playHitasteroidfail();
                if (asteroid.isCurrentTarget) {
                    handleMiss(asteroid.isCorrectAnswer);
                }
                asteroid.element.remove();
                return false;
            }

            return true;
        });
        
       // 3. Movimentação do Boss (Novo e Aprimorado com Paradas)
if (isBossFight && boss) {
    // DeltaTime é crucial para movimento baseado em tempo
    // Assumindo que 'deltaTime' é o tempo (em segundos) que passou desde o último frame (ex: 0.02)
    const deltaTime = 0.02; // Use a sua taxa de atualização real ou calcule o delta

    bossMoveTimer += deltaTime; // Incrementa o tempo gasto no estado atual

    if (bossMovementState === 'moving') {
        // === Lógica de Movimento ===

        // Calcula a nova posição baseada no tempo, partindo de bossStartX em direção a bossTargetX
        let progress = bossMoveTimer / bossMoveDuration; // Progresso de 0 a 1

        if (progress < 1) {
            // Movimento suave (pode usar uma função de easing, mas 'linear' é bom por enquanto)
            const currentX = bossStartX + (bossTargetX - bossStartX) * progress;
            boss.element.style.left = `calc(50% + ${currentX}px)`;
        } else {
            // === Fim do Movimento: Transição para Parada ===
            
            // Garante que a posição final seja exata
            boss.element.style.left = `calc(50% + ${bossTargetX}px)`;

            // Transiciona o estado
            bossMovementState = 'resting';
            bossMoveTimer = 0; // Zera o timer para a parada
        }

    } else if (bossMovementState === 'resting') {
        // === Lógica de Parada ===

        if (bossMoveTimer >= bossRestDuration) {
            // === Fim da Parada: Transição para Novo Movimento ===

            // 1. Define o ponto de partida do novo movimento
            bossStartX = bossTargetX;
            
            // 2. Define um novo ponto alvo (entre -maxSwing e +maxSwing)
            const maxSwing = 450; // Amplitude máxima do movimento pela direta/esquerda
            
            // Gera um novo alvo aleatório que não seja muito perto do atual
            let newTargetX;
            do {
                newTargetX = Math.floor(Math.random() * maxSwing * 2) - maxSwing; // Valor entre -maxSwing e +maxSwing
            } while (Math.abs(newTargetX - bossStartX) < 50); // Garante um movimento mínimo de 50px

            bossTargetX = newTargetX;

            // 3. Calcula a duração do novo movimento
            const distance = Math.abs(bossTargetX - bossStartX);
            // Duração = Distância / Velocidade. Isso garante que a velocidade seja constante
            bossMoveDuration = distance / bossMoveSpeed; 
            
            // 4. Transiciona o estado
            bossMovementState = 'moving';
            bossMoveTimer = 0; // Zera o timer para o movimento
        }
    }
}


        // 4. Se não há mais alvos e não é Boss Fight, gera nova pergunta
        if (!isBossFight && asteroids.length === 0 && question.answer !== undefined) {
            
             // Isto significa que o tempo acabou e os asteroides desapareceram, ou foi um erro crítico
             handleMiss(false); // Trata como erro/falha
        }
        
        requestAnimationFrame(gameLoop);
    }

    // --- Funções de Colisão e Dano ---

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
    
    function checkPlayerCollision(asteroid) {
         if (asteroid.isDestroyed || asteroid.isCurrentTarget === false) return false;
        
        const playerRect = player.getBoundingClientRect();
        const asteroidRect = asteroid.element.getBoundingClientRect();
        
        // Colisão simplificada para o jogo
        return (
            playerRect.left < asteroidRect.right &&
            playerRect.right > asteroidRect.left &&
            playerRect.top < asteroidRect.bottom &&
            playerRect.bottom > asteroidRect.top
        );
    }

 function handleAsteroidHit(index, bullet) {
    const asteroid = asteroids[index];
    createExplosion(bullet.x, bullet.y, 'white'); // Explosão do tiro
    
    // REMOVIDA: bullet.element.remove();
    
    // LÓGICA DO ASTEROIDE: Marca para remoção (o gameLoop remove o DOM e o objeto)
    asteroid.isDestroyed = true; 
    if (asteroid.element && asteroid.element.parentElement) {
        // Remove o elemento visual do ASTEROIDE IMEDIATAMENTE
        asteroid.element.remove(); 
    }
    
    // Variável para rastrear se devemos gerar uma nova pergunta/retomar o Boss
    let shouldResumeGame = false;

    if (asteroid.isCorrectAnswer) {
       
        // ACERTOU!
        score += 10 + (combo > 1 ? combo * 5 : 0);
         playSucesso();
        // Verifica se é um acerto no asteroide de PUNIÇÃO durante a luta contra o Boss
        if (isBossFight) {
            // LÓGICA DE ACERTO NO ENXAME DE PUNIÇÃO
         
showTemporaryMessage("PUNIÇÃO CANCELADA! Batalha Retomada!", 2000, 'alert-msg');
            combo = 0; // Reinicia o combo após o desafio de punição
            
            // 1. Limpa TODOS os outros asteroides do enxame (marca para remoção no gameLoop)
            asteroids.forEach(a => {
                if (!a.isDestroyed && a.element) {
                    a.isDestroyed = true;
                    a.element.remove(); // Remove o DOM imediatamente para feedback
                }
            });
            
            // 2. REINICIA O CICLO DO BOSS
            if (bossInterval) clearInterval(bossInterval);
            
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
            
        } else {
            
            // LÓGICA DE ACERTO NO MODO NORMAL (Fora da Boss Fight)
            combo++;
            acertosDesdeUltimoBoss++;
            // Define que o jogo deve gerar a próxima pergunta após a limpeza do loop.
            shouldResumeGame = true; 
        }
        
    } else {
        playHitasteroidfail();
        // ERROU! (Tiro em asteroide errado)
        combo = 0;
        lives--;
        showTemporaryMessage("RESPOSTA INCORRETA! -1 Vida!", 1000);
        
        if (isBossFight) {
            
             // Se errou durante o Enxame de Punição, a punição falhou, reinicia o Boss
             asteroids.forEach(a => { 
                 if (!a.isDestroyed && a.element) {
                     a.isDestroyed = true; 
                     a.element.remove(); // Remove o DOM
                 }
             });
             if (bossInterval) clearInterval(bossInterval);
             bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
             
        } else {
             // Erro no modo normal também gera nova pergunta.
             shouldResumeGame = true;
        }
    }
    
    if (lives <= 0) {
        
        endGame();
        return;
    }
    
    updateHUD();

    // Chamada segura para a próxima pergunta/etapa no modo normal
    if (shouldResumeGame) {
        // Usa setTimeout para garantir que a remoção de elementos no gameLoop
        // termine antes de gerarmos novos elementos.
        setTimeout(() => generateNewQuestion(), 50); 
    }
}
   function handlePlayerHit(asteroid) {
    // 1. Penalidade de Colisão
    lives--;
    combo = 0;
    score = Math.max(0, score - 10);
    
    // Feedback de dano visual (e auditivo, se você tiver playDamageSound())
    createExplosion(playerX + 25, playerY + 25, 'var(--cor-erro)');
    player.style.opacity = '0.5';
    setTimeout(() => player.style.opacity = '1', 500); // Pisca
    showTemporaryMessage("COLISÃO! -1 Vida! Pergunta Reiniciada!", 1500);

    // 2. Limpeza Imediata de TODOS os Asteroides Ativos (Reset da Pergunta)
    asteroids.forEach(a => {
        // Marca e remove do DOM (o gameLoop remove do array)
        if (a.element && a.element.parentElement && !a.isDestroyed) {
            a.isDestroyed = true;
            a.element.remove();
        }
    });

    // Avoid stuck movement after collision: clear any touch-targets
    touchTargetX = null;
    touchTargetY = null;

    // Also clear any digital/mouse movement flags to avoid a stuck input state
    const movementKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Mouse0', MOBILE_MOVE_LEFT, MOBILE_MOVE_RIGHT, MOBILE_SHOOT];
    movementKeys.forEach(k => { if (keysPressed[k]) keysPressed[k] = false; });

    updateHUD();
    if (lives <= 0) {
        endGame();
        return;
    }

    // 3. Reinicia o Ciclo do Jogo (Gera uma Nova Pergunta/Ciclo do Boss)
    // Usa setTimeout para garantir que a limpeza (forEach) seja processada antes de criar novos elementos.
    setTimeout(() => {
        if (isBossFight) {
            // Reinicia o ciclo normal de vulnerabilidade do Boss
            showTemporaryMessage("Ciclo do Boss Resetado!", 1000);
            if (bossInterval) clearInterval(bossInterval);
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
        } else {
            // Modo Normal: Gera uma nova pergunta
            generateNewQuestion(); 
        }
    }, 50); 
}

function handleMiss(isCorrectAnswer) {
    let shouldResetBoss = false;

    if (isBossFight) {
        // Se a luta contra o Boss está ativa, qualquer alvo perdido
        // (incluindo asteroides de punição) reinicia o ciclo do Boss.
        shouldResetBoss = true;
        combo = 0;
        showTemporaryMessage("ALVO PERDIDO! Ciclo do Boss Resetado!", 2000);

    } else if (isCorrectAnswer) {
         // Modo Normal: A resposta correta passou - penalidade máxima
         lives--;
         combo = 0;
         score = Math.max(0, score - 10);
         showTemporaryMessage("ALVO CORRETO PERDIDO! -1 Vida", 2000);
    } else {
         // Modo Normal: Uma resposta errada passou ou alvos esgotados
         combo = 0;
         showTemporaryMessage("ALVO PERDIDO...", 2000);
    }
    
    updateHUD();
    if (lives <= 0) endGame();

    // 1. Limpeza de Asteroides (Se houver)
    // O gameLoop já trata a remoção do asteroide que passou, mas garantimos a limpeza.
    asteroids.forEach(a => {
        if (a.element && a.element.parentElement && !a.isDestroyed) {
            a.isDestroyed = true;
            a.element.remove();
        }
    });

    // 2. Reinicia o Ciclo Apropriado
    setTimeout(() => {
        if (shouldResetBoss) {
            // Reinicia o ciclo normal de vulnerabilidade do Boss
            if (bossInterval) clearInterval(bossInterval);
            bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
        } else {
            // Modo Normal: Gera a nova pergunta.
            generateNewQuestion(); 
        }
    }, 50);
}

    // --- Eventos de Input ---
    // Attach start/restart listeners safely (use pointerdown + touchstart for better mobile reliability)
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

// NOVO: Função para confirmar saída
function confirmExit() {
    // Para a música e o jogo se for sair
    if (isGameRunning) {
        isGameRunning = false;
        clearInterval(movementInterval);
        if (bossInterval) clearInterval(bossInterval);
        // Não remove o boss ou asteroides, apenas para o loop, permitindo ao usuário voltar.
        // Se o usuário clicar em SAIR, o jogo é interrompido.
    }

    // Confirma se o usuário quer sair
    return confirm("Tem certeza que deseja sair da missão e voltar para a tela anterior?");
}
