function handlePlayerDamage() {
    // Certifique-se de que todas as variáveis usadas aqui
    // (lives, isGameRunning, updateHUD, endGame, isBossFight, bossInterval, etc.)
    // foram definidas como globais no seu arquivo principal (ou seja, fora de qualquer função
    // ou no escopo global do módulo).
    
    if (!isGameRunning) return;

    lives--; 
    playDamageSound(); 
    
    updateHUD(); 
    
    showTemporaryMessage("Colisão! -1 Vida! Pergunta Reiniciada!", 2500);
    
    if (isBossFight) {
        if (bossInterval) clearInterval(bossInterval);
        if (boss && boss.element) {
            boss.element.classList.remove('vulnerable');
            boss.element.classList.add('invulnerable');
            boss.isVulnerable = false;
            boss.element.querySelector('.boss-answer-display').innerText = '...';
        }
        // *Necessita de getRandomInt e toggleBossVulnerability, que devem ser globais.*
        bossInterval = setInterval(toggleBossVulnerability, 2000 + getRandomInt(500, 1500)); 
        
    } else {
        // *Necessita de generateNewQuestion, que deve ser global.*
        generateNewQuestion(true);
    }
    
    if (lives <= 0) {
        endGame();
        return;
    }
    
    player.style.opacity = '0.5';
    setTimeout(() => {
        player.style.opacity = '1';
    }, 500);
}