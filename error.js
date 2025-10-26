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

    const MOBILE_SHOOT = 'MobileShoot';
    const MOBILE_MOVE_LEFT = 'MobileLeft';
    const MOBILE_MOVE_RIGHT = 'MobileRight';
    
    let touchTargetX = null;
    let touchTargetY = null;
    const TOUCH_MOVE_SPEED_FACTOR = 0.05;

    let movementInterval = null;
    let infoTimer = null;

    // --- Variáveis do Boss ---
    let isBossFight = false;
    let boss = null;
    let bossCurrentHealth = 0;
    let isBossVulnerable = false;
    let bossInterval = null;
    let bossMovementTime = 0;
    let audioShoot, audioHit, audioDamage, audioHitasteroid, audioHitasteroidfail;
    let audioGameOver, audioSucesso, audioBosswin;

    let bossMovementState = 'moving';
    let bossMoveTimer = 0;
    let bossMoveDuration = 2;
    let bossRestDuration = 1.5;
    let bossTargetX = 0;
    let bossStartX = 0;
    let bossMoveSpeed = 80;

    // 🎯 OTIMIZAÇÃO: Detecção de dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (window.innerWidth <= 768);
    
    // Controle de explosões simultâneas
    let activeExplosions = 0;
    const MAX_EXPLOSIONS = isMobile ? 3 : 8;

    // 🎯 NOVO: Controle de invencibilidade temporária
    let isInvulnerable = false;
    let invulnerabilityDuration = 1000;

    const ASTEROID_GIFS = [
        'asteroid2.gif',
        'asteroid.gif',
        'asteroid2.gif',
        'asteroid3.gif',
        'asteroid1.gif'
    ];

    const BOSS_CHARACTERS = [
        { name: 'Dr. nervoso', gifUrl: 'boss1.gif', maxHealth: 3 },
        { name: 'Cloud Mad', gifUrl: 'boss2.gif', maxHealth: 4 },
        { name: 'UFO', gifUrl: 'boss3.gif', maxHealth: 5 },
        { name: 'ghost', gifUrl: 'boss4.gif', maxHealth: 6 },  
        { name: 'Buraco negro', gifUrl: 'boss5.gif', maxHealth: 8 }
    ];

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

    // --- Funções Auxiliares ---
    function getRandomMessage(messageArray) {
        if (!messageArray || messageArray.length === 0) {
            return "Alerta de Foco!"; 
        }
        const randomIndex = getRandomInt(0, messageArray.length - 1);
        return messageArray[randomIndex];
    }

    function showTemporaryMessage(message, duration = 2000, className = '') {
        if (infoTimer) clearTimeout(infoTimer);

        questionDisplay.className = 'question-box'; 
        if (className) {
            questionDisplay.classList.add(className);
        }
        
        questionDisplay.innerText = message;
        
        infoTimer = setTimeout(() => {
            questionDisplay.className = 'question-box'; 
            
            if (isBossFight) {
                questionDisplay.innerText = "BOSS FIGHT!";
            } else if (question.text) {
                questionDisplay.innerText = question.text;
            } else {
                questionDisplay.innerText = "Preparando...";
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

    // 🎯 FUNÇÃO OTIMIZADA: Explosões de partículas
    function createExplosion(x, y, color) {
        if (activeExplosions >= MAX_EXPLOSIONS) {
            return;
        }
        
        activeExplosions++;
        
        const particleCount = isMobile ? 8 : 20;
        const duration = isMobile ? 600 : 1000;
        
        for (let i = 0; i < particleCount; i++) {
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
            let currentX = 0;
            let currentY = 0;
            
            function animateParticle(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = timestamp - startTime;
                
                if (progress < duration) {
                    currentX += vx;
                    currentY += vy;
                    
                    particle.style.transform = `translate(${currentX}px, ${currentY}px)`;
                    particle.style.opacity = 1 - (progress / duration); 
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                    activeExplosions--;
                }
            }
            requestAnimationFrame(animateParticle);
        }
    }

    function updateGameDimensions() {
        const oldWidth = GAME_WIDTH;
        const oldHeight = GAME_HEIGHT;
        
        GAME_WIDTH = gameArea.clientWidth;
        GAME_HEIGHT = gameArea.clientHeight;
        
        // 🎯 CORREÇÃO: Reposiciona elementos quando dimensões mudam
        if (isGameRunning && (oldWidth !== GAME_WIDTH || oldHeight !== GAME_HEIGHT)) {
            // Ajusta posição do jogador proporcionalmente
            if (oldWidth > 0 && oldHeight > 0) {
                const ratioX = GAME_WIDTH / oldWidth;
                const ratioY = GAME_HEIGHT / oldHeight;
                
                playerX = Math.max(0, Math.min(GAME_WIDTH - (player.offsetWidth || 63), playerX * ratioX));
                playerY = Math.max(0, Math.min(GAME_HEIGHT - (player.offsetHeight || 63) - 20, playerY * ratioY));
                
                player.style.left = `${playerX}px`;
                player.style.top = `${playerY}px`;
            }
            
            // Ajusta asteroides para caber na nova tela
            asteroids.forEach(asteroid => {
                if (asteroid.element && !asteroid.isDestroyed) {
                    if (oldWidth > 0) {
                        const ratioX = GAME_WIDTH / oldWidth;
                        asteroid.baseX = asteroid.baseX * ratioX;
                        asteroid.x = asteroid.baseX;
                        asteroid.element.style.left = `${asteroid.baseX}px`;
                    }
                    
                    // Remove asteroides que saíram da tela após redimensionar
                    if (asteroid.x < -100 || asteroid.x > GAME_WIDTH + 100) {
                        asteroid.isDestroyed = true;
                        asteroid.element.remove();
                    }
                }
            });
            
            // Limpa tiros que ficaram fora da tela
            bullets.forEach(bullet => {
                if (bullet.x < 0 || bullet.x > GAME_WIDTH) {
                    bullet.element.remove();
                }
            });
            bullets = bullets.filter(b => b.x >= 0 && b.x <= GAME_WIDTH);
            
            // Cancela movimento touch se ficou fora da tela
            if (touchTargetX !== null) {
                if (touchTargetX < 0 || touchTargetX > GAME_WIDTH || touchTargetY < 0 || touchTargetY > GAME_HEIGHT) {
                    touchTargetX = null;
                    touchTargetY = null;
                }
            }
        }
    }

    // 🎯 NOVO: Debounce para redimensionamento
    let resizeTimeout = null;
    let isResizing = false;
    const MIN_GAME_WIDTH = 280;
    const MIN_GAME_HEIGHT = 400;

    function handleResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        isResizing = true;
        
        resizeTimeout = setTimeout(() => {
            updateGameDimensions();
            
            // 🎯 PROTEÇÃO: Tela muito pequena
            if (GAME_WIDTH < MIN_GAME_WIDTH || GAME_HEIGHT < MIN_GAME_HEIGHT) {
                if (isGameRunning) {
                    showTemporaryMessage("⚠️ Tela muito pequena! Aumente o tamanho.", 2000, 'error-msg');
                }
            }
            
            isResizing = false;
        }, 100);
    }

    function startGame() {
        if (isGameRunning) return;
        
        const gameArea = document.getElementById('gameArea'); 

        loadAudio(); 
        updateGameDimensions();
        
        for (const key in keysPressed) {
            delete keysPressed[key];
        }
        
        score = 0;
        lives = 3;
        combo = 0;
        acertosDesdeUltimoBoss = 0;
        currentLevel = 1;
        BASE_ASTEROID_SPEED = 35;
        isGameRunning = true;
        
        isBossFight = false; 
        if (boss && boss.element.parentElement) {
            boss.element.remove();
        }
        boss = null;
        if (bossInterval) clearInterval(bossInterval);

        asteroids.forEach(a => { if (a.element) a.element.remove(); });
        bullets.forEach(b => b.element.remove());
        asteroids = [];
        bullets = [];
        
        if (infoTimer) clearTimeout(infoTimer);

        document.getElementById('overlay')?.classList.add('hidden');
        document.getElementById('gameOverScreen')?.classList.add('hidden');
        questionDisplay?.classList.remove('hidden');

        if (gameArea) {
            gameArea.classList.remove('no-background');
        }

        playerX = GAME_WIDTH / 2 - 25;
        playerY = GAME_HEIGHT - 70;
        player.style.left = `${playerX}px`;
        player.style.top = `${playerY}px`;
        player.style.transform = 'rotate(0deg)'; 

        updateHUD();
        generateNewQuestion(); 

        // 🎯 CORREÇÃO: Usa handleResize com debounce
        window.removeEventListener('resize', updateGameDimensions);
        window.addEventListener('resize', handleResize);

        movementInterval = setInterval(movePlayer, 1000 / 60);

        requestAnimationFrame(gameLoop);
    }

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
        const gameArea = document.getElementById('gameArea'); 

        isGameRunning = false;
        clearInterval(movementInterval);
        if (bossInterval) clearInterval(bossInterval); 
        if (infoTimer) clearTimeout(infoTimer);
        if (resizeTimeout) clearTimeout(resizeTimeout);
        
        // 🎯 CORREÇÃO: Remove listener correto
        window.removeEventListener('resize', handleResize);
        
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
            gameArea.classList.add('no-background');
        }
        
        isBossFight = false;
        boss = null;
        
        asteroids.forEach(a => {
            createExplosion(a.x, a.y, '#999'); 
            if (a.element) a.element.remove();
        });
        bullets.forEach(b => b.element.remove());
        asteroids = [];
        bullets = [];

        const gameOverScreen = document.getElementById('gameOverScreen');
        
        const titleElement = gameOverScreen.querySelector('h2');
        if (titleElement) {
            titleElement.innerText = isVictory ? "MISSÃO CUMPRIDA!" : "MISSÃO FRACASSADA";
        } else {
            console.error("Elemento H2 não encontrado na tela de Game Over. Verifique seu HTML.");
        }
        
        document.getElementById('finalScore').innerText = score;
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('gameover-visible');
        questionDisplay.classList.add('hidden');
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
        const shootButton = document.getElementById('shootButton'); 

        if (shootButton) {
            shootButton.addEventListener('click', handleShootButtonTouch);
            shootButton.addEventListener('touchstart', handleShootButtonTouch, { passive: false });
            shootButton.addEventListener('pointerdown', (ev) => { ev.preventDefault && ev.preventDefault(); handleShootButtonTouch(ev); }, { passive: false });
            shootButton.addEventListener('touchend', () => { delete keysPressed[MOBILE_SHOOT]; });
        }
        
        if (gameAreaElement) {
            gameAreaElement.addEventListener('touchstart', handleMoveTouch);
            gameAreaElement.addEventListener('touchmove', handleMoveTouch); 
            gameAreaElement.addEventListener('touchend', handleMoveEnd); 
            gameAreaElement.addEventListener('touchcancel', handleMoveEnd); 
        }
    });

    function handleMoveTouch(event) {
        event.preventDefault();

        if (!isGameRunning) return;
        
        const gameAreaElement = document.getElementById('gameArea'); 
        if (!gameAreaElement) return;
        
        const gameAreaRect = gameAreaElement.getBoundingClientRect();

        const touch = event.touches[0];
        if (touch) {
            touchTargetX = touch.clientX - gameAreaRect.left;
            touchTargetY = touch.clientY - gameAreaRect.top;
        }
    }

    function handleMoveEnd(event) {
        if (!isGameRunning) return;

        if (event.touches.length === 0) {
            touchTargetX = null;
            touchTargetY = null;
        } 
        else if (event.touches.length > 0) {
            handleMoveTouch(event); 
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

        if (isBossFight) {
            const bossMaxHealth = boss ? boss.info.maxHealth : 0; 

            let healthBarContent = `BOSS HP: `;

            healthBarContent += `<div class="boss-hp-bar">`;
            for(let i = 1; i <= bossMaxHealth; i++) {
                if (i <= bossCurrentHealth) {
                    healthBarContent += `<span style="color:red;">❤️</span>`;
                } else {
                    healthBarContent += `<span style="color:#555;">🤍</span>`;
                }
            }
            healthBarContent += `</div>`;

            bossHealthDisplay.innerHTML = healthBarContent;
            bossHealthDisplay.classList.add('show-boss');
        } else {
            bossHealthDisplay.classList.remove('show-boss');
        }

        if (!isBossFight && acertosDesdeUltimoBoss > 0 && acertosDesdeUltimoBoss % 10 === 0) {
            if (lives < MAX_LIVES_DISPLAY) { 
                lives++;
                playSucesso();
                showTemporaryMessage("VIDA EXTRA CONCEDIDA! (+1 vida)", 1500);
            }
        }
        
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
        const espacoMinimo = 80;
        while(posicoesX.length < MAX_ASTEROIDS) {
            let newX = getRandomInt(0, GAME_WIDTH - 80);
            let isValid = true;
            for(let existingX of posicoesX) {
                if (Math.abs(newX - existingX) < espacoMinimo) {
                    isValid = false;
                    break;
                }
            }
            if(isValid) posicoesX.push(newX);
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
                speed: BASE_ASTEROID_SPEED + getRandomInt(0, 15),
                scale: 0.5,
                vx: (Math.random() - 0.5) * 20,
                oscillationOffset: Math.random() * 10
            });
        }
    }

    function enterBossFight() {
        isBossFight = true;

        asteroids.forEach(a => { a.element.remove(); });
        asteroids = [];

        if (infoTimer) clearTimeout(infoTimer);
        questionDisplay.innerText = "BOSS FIGHT!";
        
        const bossIndex = (currentLevel - 1) % BOSS_CHARACTERS.length;
        const bossInfo = BOSS_CHARACTERS[bossIndex];

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
        
        boss.element.innerHTML = `
            <img class="boss-gif" src="${bossInfo.gifUrl}" alt="${bossInfo.name}">
            <span class="boss-question">${question.text} = ?</span>
            <div class="boss-answer-display">...</div>
        `;
        
        gameArea.appendChild(boss.element);
        boss.element.classList.add('invulnerable');

        updateHUD();

        if (bossInterval) clearInterval(bossInterval);
        bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
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
            
            const isVulnerableWindow = Math.random() < 0.5;
            
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
        const espacoMinimo = 60;
        while(posicoesX.length < MAX_ASTEROIDS) {
            let newX = getRandomInt(0, GAME_WIDTH - 60);
            let isValid = true;
            for(let existingX of posicoesX) {
                if (Math.abs(newX - existingX) < espacoMinimo) {
                    isValid = false;
                    break;
                }
            }
            if(isValid) posicoesX.push(newX);
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

        const collided = (
            bulletRect.left < bossRect.right &&
            bulletRect.right > bossRect.left &&
            bulletRect.top < bossRect.bottom &&
            bulletRect.bottom > bossRect.top
        );
        
        if (!collided) return false;

        if (isMobile) {
            createExplosion(bullet.x, bullet.y, 'white'); 
        } else {
            createExplosion(bullet.x, bullet.y, 'white');
        }

        const isCorrectHit = boss.isVulnerable && bullet.value === question.answer; 
        
        if (isCorrectHit) { 
            bossCurrentHealth--;
            score += 50; 
            combo++;
            playDamageSound(); 
            
            if (isMobile) {
                createExplosion(bullet.x, bullet.y, 'var(--cor-acerto)');
            } else {
                createExplosion(bullet.x, bullet.y, 'var(--cor-acerto)');
            }
            
            boss.element.classList.add('hit');
            setTimeout(() => boss.element.classList.remove('hit'), 400);

            boss.isVulnerable = false; 
            
            if (bossInterval) clearInterval(bossInterval); 
            
            if (bossCurrentHealth <= 0) {
                bossInterval = null;
                exitBossFight(true);
            } else {
                bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
            }
            
        } else {
            playHitSound(); 
            combo = 0;
            
            createExplosion(bullet.x, bullet.y, 'var(--cor-erro)');
            boss.element.style.boxShadow = '0 0 50px var(--cor-erro)';
            setTimeout(() => {
                boss.element.style.boxShadow = '0 0 25px #ff00ff, 0 0 50px rgba(255, 0, 255, 0.5)';
            }, 200);
            
            const repelMsg = getRandomMessage(NEGATIVE_FEEDBACK);
            showTemporaryMessage(repelMsg + " Enxame de Asteroides!", 1500, 'error-msg');

            if (bossInterval) clearInterval(bossInterval);
            boss.isVulnerable = false;
            boss.element.classList.remove('vulnerable');
            boss.element.classList.add('invulnerable');
            generatePunishmentAsteroids();
        }
        
        updateHUD();
        return true; 
    }

    function exitBossFight(success) {
        const gameArea = document.getElementById('gameArea'); 

        if (!isBossFight) return;

        isBossFight = false;
        if (bossInterval) clearInterval(bossInterval);

        if (boss && boss.element.parentElement) {
            if (success) {
                createExplosion(GAME_WIDTH / 2, 125, '#ffcc00'); 
            }
            boss.element.remove();
            boss = null; 
        }

        if (success) {
            score += 100;
            acertosDesdeUltimoBoss = 0;
            
            const totalBosses = BOSS_CHARACTERS.length;
            
            if (currentLevel === totalBosses) {
                playBosswin(); 
                
                showTemporaryMessage("PARABÉNS! VOCÊ VENCEU O JOGO!", 500);
                
                endGame(true); 

                if (gameArea) {
                    gameArea.classList.add('no-background');
                }

                return; 
            }

            currentLevel = Math.min(DIFFICULTY.length, currentLevel + 1);
            playBosswin(); 
            showTemporaryMessage(`BOSS DERROTADO! NÍVEL ${currentLevel} INICIADO!`, 2500);

        } else {
            showTemporaryMessage(`VOCÊ ESCAPOU...`, 1500);
        }
        
        asteroids.forEach(a => { a.element.remove(); });
        asteroids = [];

        const delay = success ? 2500 : 1500;
        
        setTimeout(() => {
            if (isGameRunning) { 
                generateNewQuestion();
            }
        }, delay);
        
        updateHUD();
    }

    function movePlayer() {
        if (!isGameRunning || isResizing) return;

        // 🎯 CORREÇÃO: Validação extra de dimensões
        if (GAME_WIDTH <= 0 || GAME_HEIGHT <= 0) {
            updateGameDimensions();
            return;
        }

        if (!isFinite(playerX) || playerX === null) playerX = (GAME_WIDTH || 320) / 2;
        if (!isFinite(playerY) || playerY === null) playerY = (GAME_HEIGHT || 240) - 70;

        let dx = 0;
        let dy = 0;
        let rotation = 0;
        
        const playerWidth = player.offsetWidth || 63; 
        const playerHeight = player.offsetHeight || 63; 
        const marginBottom = 20;

        if (touchTargetX === null) {
            if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
                dx = -PLAYER_SPEED;
                rotation = -10;
            }
            if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
                if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) { 
                    dx = 0;
                    rotation = 0;
                } else {
                    dx = PLAYER_SPEED;
                    rotation = 10;
                }
            }
            if (keysPressed['ArrowUp'] || keysPressed['KeyW']) dy = -PLAYER_SPEED;
            if (keysPressed['ArrowDown'] || keysPressed['KeyS']) dy = PLAYER_SPEED;
            
            if (dx !== 0 && dy !== 0) {
                const diagFactor = Math.sqrt(2);
                dx /= diagFactor;
                dy /= diagFactor;
            }

        } else {
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

        playerX = Math.max(0, Math.min(GAME_WIDTH - playerWidth, playerX + dx));
        
        playerY = Math.max(0, Math.min(GAME_HEIGHT - playerHeight - marginBottom, playerY + dy)); 

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
        
        if (!isGameRunning || currentTime - lastShootTime < SHOOT_DELAY) {
            return; 
        }
        lastShootTime = currentTime;

        const bulletElement = document.createElement('div');
        bulletElement.className = 'bullet';

        const playerWidth = player.offsetWidth || 63;
        const bulletWidth = 4;

        const bulletX = playerX + (playerWidth / 2) - (bulletWidth / 2); 
        const bulletY = playerY;

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

    // 🎯 OTIMIZAÇÃO: FPS variável para mobile
    let lastFrameTime = 0;
    const targetFPS = isMobile ? 45 : 60;
    const frameInterval = 1000 / targetFPS;

    function gameLoop(timestamp) {
        if (!isGameRunning) return;
        
        // 🎯 CORREÇÃO: Pausa o loop durante redimensionamento
        if (isResizing) {
            requestAnimationFrame(gameLoop);
            return;
        }
        
        if (isMobile) {
            const elapsed = timestamp - lastFrameTime;
            if (elapsed < frameInterval) {
                requestAnimationFrame(gameLoop);
                return;
            }
            lastFrameTime = timestamp - (elapsed % frameInterval);
        }

        updateGameDimensions();

        const BULLET_SPEED = 10;
        bullets = bullets.filter(bullet => {
            bullet.y -= BULLET_SPEED;
            bullet.element.style.top = `${bullet.y}px`;
            
            if (isBossFight && handleBossHit(bullet)) {
                bullet.element.remove();
                return false;
            }

            if (!isBossFight || asteroids.length > 0) {
                const collidedIndex = asteroids.findIndex(asteroid => !asteroid.isDestroyed && checkCollision(bullet, asteroid));
                if (collidedIndex !== -1) {
                    handleAsteroidHit(collidedIndex, bullet);
                    
                    bullet.element.remove(); 
                    return false; 
                }
            }

            if (bullet.y < -20) {
                bullet.element.remove();
                return false;
            }
            return true;
        });

        const deltaTime = 16.666666 / 1700;
        asteroids = asteroids.filter(asteroid => {
            if (asteroid.isDestroyed) {
                return false; 
            }

            asteroid.x = asteroid.baseX + Math.sin(timestamp / 700 + asteroid.oscillationOffset) * 15;
            asteroid.y += asteroid.speed * deltaTime;
            
            asteroid.element.style.left = `${asteroid.x}px`;
            asteroid.element.style.top = `${asteroid.y}px`;

            // 🎯 OTIMIZAÇÃO: Simplifica cálculos em mobile
            const ratio = (GAME_HEIGHT - asteroid.y) / GAME_HEIGHT;
            
            if (isMobile) {
                if (timestamp % 2 === 0) {
                    asteroid.scale = Math.min(1, 0.5 + (1 - ratio) * 0.3);
                    asteroid.element.style.transform = `translate(-50%, -50%) scale(${asteroid.scale})`;
                }
                asteroid.element.style.opacity = '1';
            } else {
                asteroid.scale = Math.min(1, 0.5 + (1 - ratio) * 0.3);
                asteroid.element.style.transform = `translate(-50%, -50%) scale(${asteroid.scale})`;
                asteroid.element.style.opacity = Math.min(1, 2.0 + (1 - ratio) * 0.5);
            }

            // 🎯 OTIMIZAÇÃO: Só verifica colisão se próximo
            const distanceToPlayer = Math.abs(asteroid.y - playerY);
            
            if (distanceToPlayer < 100 && checkPlayerCollision(asteroid)) {
                playHitasteroidfail();
                handlePlayerHit(asteroid);
                
                return false;
            }

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
        
        if (isBossFight && boss) {
            const deltaTime = 0.02;

            bossMoveTimer += deltaTime;

            if (bossMovementState === 'moving') {
                let progress = bossMoveTimer / bossMoveDuration;

                if (progress < 1) {
                    const currentX = bossStartX + (bossTargetX - bossStartX) * progress;
                    boss.element.style.left = `calc(50% + ${currentX}px)`;
                } else {
                    boss.element.style.left = `calc(50% + ${bossTargetX}px)`;

                    bossMovementState = 'resting';
                    bossMoveTimer = 0;
                }

            } else if (bossMovementState === 'resting') {
                if (bossMoveTimer >= bossRestDuration) {
                    bossStartX = bossTargetX;
                    
                    const maxSwing = 450;
                    
                    let newTargetX;
                    do {
                        newTargetX = Math.floor(Math.random() * maxSwing * 2) - maxSwing;
                    } while (Math.abs(newTargetX - bossStartX) < 50);

                    bossTargetX = newTargetX;

                    const distance = Math.abs(bossTargetX - bossStartX);
                    bossMoveDuration = distance / bossMoveSpeed; 
                    
                    bossMovementState = 'moving';
                    bossMoveTimer = 0;
                }
            }
        }

        if (!isBossFight && asteroids.length === 0 && question.answer !== undefined) {
            handleMiss(false);
        }
        
        requestAnimationFrame(gameLoop);
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
    
    function checkPlayerCollision(asteroid) {
        if (asteroid.isDestroyed || asteroid.isCurrentTarget === false) return false;
        
        const playerRect = player.getBoundingClientRect();
        const asteroidRect = asteroid.element.getBoundingClientRect();
        
        return (
            playerRect.left < asteroidRect.right &&
            playerRect.right > asteroidRect.left &&
            playerRect.top < asteroidRect.bottom &&
            playerRect.bottom > asteroidRect.top
        );
    }

    function handleAsteroidHit(index, bullet) {
        const asteroid = asteroids[index];
        
        createExplosion(bullet.x, bullet.y, 'white');
        
        asteroid.isDestroyed = true; 
        if (asteroid.element && asteroid.element.parentElement) {
            asteroid.element.remove(); 
        }
        
        let shouldResumeGame = false;

        if (asteroid.isCorrectAnswer) {
            
            score += 10 + (combo > 1 ? combo * 5 : 0);
            playSucesso();
            
            if (isBossFight) {
                showTemporaryMessage("PUNIÇÃO CANCELADA! Batalha Retomada!", 2000, 'alert-msg');
                combo = 0;
                
                asteroids.forEach(a => {
                    if (!a.isDestroyed && a.element) {
                        a.isDestroyed = true;
                        a.element.remove();
                    }
                });
                
                if (bossInterval) clearInterval(bossInterval);
                
                bossInterval = setInterval(toggleBossVulnerability, 1000 + getRandomInt(500, 1500));
                
            } else {
                combo++;
                acertosDesdeUltimoBoss++;
                shouldResumeGame = true; 
            }
            
        } else {
            playHitasteroidfail();
            combo = 0;
            lives--;
            showTemporaryMessage("RESPOSTA INCORRETA! -1 Vida!", 1000);
            
            if (isBossFight) {
                asteroids.forEach(a => { 
                    if (!a.isDestroyed && a.element) {
                        a.isDestroyed = true; 
                        a.element.remove();
                    }
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
            setTimeout(() => generateNewQuestion(), 50); 
        }
    }

    function handlePlayerHit(asteroid) {
        if (isInvulnerable) return;
        
        isInvulnerable = true;
        setTimeout(() => { isInvulnerable = false; }, invulnerabilityDuration);
        
        lives--;
        combo = 0;
        score = Math.max(0, score - 10);
        
        createExplosion(playerX + 25, playerY + 25, 'var(--cor-erro)');
        
        player.style.opacity = '0.5';
        setTimeout(() => player.style.opacity = '1', 500);
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
