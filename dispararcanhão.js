// Função para gerar canhão e disparar confetes
function dispararCanhaoConfete() {
  const cores = ["#f44336","#e91e63","#9c27b0","#3f51b5","#03a9f4","#4caf50","#ffeb3b","#ff9800"];
  const total = 100;

  const telaFim = document.getElementById("telaFim");
  telaFim.style.position = "relative"; 
  telaFim.style.overflow = "hidden";

  const centroX = window.innerWidth / 2;     // horizontal: centro da tela
  const centroY = window.innerHeight - 50;   // vertical: base da tela (embaixo do app)

  // Criar canhão visual (boca para cima)
  const canhao = document.createElement("div");
  canhao.style.position = "absolute";
  canhao.style.width = "60px";
  canhao.style.height = "30px";
  canhao.style.backgroundColor = "#333";
  canhao.style.borderRadius = "15px 15px 0 0";
  canhao.style.left = (centroX - 30) + "px";
  canhao.style.top = centroY + "px";        // aqui fica no final da tela
  canhao.style.transformOrigin = "bottom center";
  canhao.style.transform = "rotate(0deg)";
  canhao.style.zIndex = 9999;
  document.body.appendChild(canhao);         // ainda no body para não cortar pelo overflow

  // Pavio
  const pavio = document.createElement("div");
  pavio.style.width = "20px";
  pavio.style.height = "20px";
  pavio.style.left = (centroX - 10) + "px";
  pavio.style.top = (centroY - 20) + "px";
  pavio.style.background = "radial-gradient(circle, #ffeb3b 0%, #ff5722 70%, transparent 100%)";
  pavio.style.borderRadius = "50%";
  pavio.style.position = "absolute";
  pavio.style.zIndex = 9998;
  document.body.appendChild(pavio);

  setTimeout(() => {
    pavio.remove();

    // Gerar confetes
    for (let i = 0; i < total; i++) {
      const confete = document.createElement("div");
      confete.className = "confete";
      confete.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
      confete.style.width = confete.style.height = Math.random() * 8 + 5 + "px";
      confete.style.left = centroX + "px";
      confete.style.top = centroY + "px";
      confete.style.position = "absolute";
      confete.style.animation = `confeteAnimation ${Math.random() * 2 + 3}s ease-in forwards`;
      document.body.appendChild(confete);

      const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
      const speed = Math.random() * 10 + 5;
      let posX = centroX;
      let posY = centroY;
      let gravity = 0.2;

      const anim = setInterval(() => {
        posX += Math.sin(angle) * speed;
        posY -= Math.cos(angle) * speed;
        gravity += 0.05;
        posY += gravity;

        confete.style.left = posX + "px";
        confete.style.top = posY + "px";
        confete.style.transform = `rotate(${Math.random() * 360}deg)`;

        if (posY > window.innerHeight) {
          clearInterval(anim);
          confete.remove();
        }
      }, 30);
    }

    setTimeout(() => canhao.remove(), 5000);
  }, 1000);

  // Adicionar animação pulsante no texto do resultado
  const resultadoFinal = document.getElementById("resultadoFinal");
  resultadoFinal.style.animation = "pulsar 1s infinite alternate";
}

// CSS Adicional para animações de confetes
const style = document.createElement("style");
style.innerHTML = `
  @keyframes confeteAnimation {
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    50% { transform: scale(1.5) rotate(180deg); opacity: 0.7; }
    100% { transform: scale(0.5) rotate(360deg); opacity: 0; }
  }

  .confete {
    position: absolute;
    background-color: #ffeb3b;
    border-radius: 50%;
    opacity: 0;
    pointer-events: none;
    animation: confeteAnimation 3s ease-in-out forwards;
  }

  @keyframes pulsar {
    0% { transform: scale(1); color: #4caf50; }
    50% { transform: scale(1.2); color: #ffeb3b; }
    100% { transform: scale(1); color: #4caf50; }
  }

  #resultadoFinal {
    text-align: center;
    font-size: 30px;
    font-weight: bold;
    animation: pulsar 1s infinite alternate;
  }
`;
document.head.appendChild(style);
