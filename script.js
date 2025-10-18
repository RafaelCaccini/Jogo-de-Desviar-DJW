  const canvas = document.getElementById("jogoCanvas");
  const ctx = canvas.getContext("2d");
  const menu = document.getElementById("menu");
  const gameOver = document.getElementById("game-over");
  const pontuacaoDiv = document.getElementById("pontuacao");
  const finalScore = document.getElementById("final-score");
  const canvasContainer = document.getElementById("canvas-container");

  // Ajusta o tamanho do canvas para o container
  function ajustarTamanhoCanvas() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
  }
  ajustarTamanhoCanvas();
  window.addEventListener("resize", ajustarTamanhoCanvas);

  let jogoAtivo = false;
  let velocidadeObstaculos;
  let pontuacao;
  let carro;
  let obstaculos;
  let intervaloObstaculos;
  let teclado;
  let pontosParaAumentoVelocidade;
  let dificuldadeConfig;

  // Sons simples usando Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function tocarSom(frequencia, duracao = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "square";
    oscillator.frequency.value = frequencia;
    oscillator.start();
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duracao);
  }

  // Configurações de dificuldade
  const dificuldades = {
    facil: { velocidadeInicial: 3, intervaloObstaculos: 120, aumentoVelocidade: 0.3 },
    medio: { velocidadeInicial: 5, intervaloObstaculos: 90, aumentoVelocidade: 0.5 },
    dificil: { velocidadeInicial: 7, intervaloObstaculos: 60, aumentoVelocidade: 0.7 }
  };

  function iniciarJogo(dificuldade) {
    dificuldadeConfig = dificuldades[dificuldade];
    velocidadeObstaculos = dificuldadeConfig.velocidadeInicial;
    pontuacao = 0;
    pontosParaAumentoVelocidade = 20;
    intervaloObstaculos = 0;
    obstaculos = [];
    teclado = {};
    jogoAtivo = true;

    carro = {
      x: canvas.width / 2 - 25,
      y: canvas.height - 120,
      largura: 50,
      altura: 90,
      velocidade: 6,
      cor: "#00aaff"
    };

    menu.style.display = "none";
    gameOver.style.display = "none";
    pontuacaoDiv.style.display = "block";
    document.body.classList.remove("menu-fundo");
    document.body.classList.add("jogo-fundo");
    atualizarPontuacao();
    requestAnimationFrame(atualizarJogo);
  }

  function desenharCarro() {
    ctx.fillStyle = carro.cor;
    ctx.fillRect(carro.x, carro.y, carro.largura, carro.altura);
  }

  function moverCarro() {
    if (teclado["ArrowLeft"] && carro.x > 0) {
      carro.x -= carro.velocidade;
      if (carro.x < 0) carro.x = 0;
    }
    if (teclado["ArrowRight"] && carro.x < canvas.width - carro.largura) {
      carro.x += carro.velocidade;
      if (carro.x > canvas.width - carro.largura) carro.x = canvas.width - carro.largura;
    }
  }

  function gerarObstaculo() {
    const larguraObstaculo = Math.random() * (canvas.width / 3) + 30;
    const xPosicaoObstaculo = Math.random() * (canvas.width - larguraObstaculo);
    obstaculos.push({ x: xPosicaoObstaculo, y: -30, largura: larguraObstaculo, altura: 30 });
  }

  function desenharObstaculos() {
    ctx.fillStyle = "#ff5555";
    obstaculos.forEach(obstaculo => {
      ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.largura, obstaculo.altura);
    });
  }

  function moverObstaculos() {
    obstaculos.forEach((obstaculo, index) => {
      obstaculo.y += velocidadeObstaculos;
      if (obstaculo.y > canvas.height) {
        obstaculos.splice(index, 1);
        pontuacao += 10;
        tocarSom(880, 0.05); // som pontuação
        atualizarPontuacao();
      }
    });
  }

  function detectarColisao() {
    for (let obstaculo of obstaculos) {
      // Margem pequena para evitar falsos positivos (ex: 2px)
      const margem = 2;
      if (
        carro.x + margem < obstaculo.x + obstaculo.largura &&
        carro.x + carro.largura - margem > obstaculo.x &&
        carro.y + margem < obstaculo.y + obstaculo.altura &&
        carro.y + carro.altura - margem > obstaculo.y
      ) {
        tocarSom(150, 0.3); // som colisão
        jogoAtivo = false; // Para o jogo imediatamente
        pontuacaoDiv.style.display = "none";
        finalScore.textContent = "Pontuação Final: " + pontuacao;
        gameOver.style.display = "block";
        document.body.classList.remove("jogo-fundo");
        document.body.classList.add("menu-fundo");
        break;
      }
    }
  }

  function atualizarPontuacao() {
    pontuacaoDiv.textContent = "Pontuação: " + pontuacao;
  }

  function atualizarJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo pista minimalista: linhas verticais simulando pista
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    desenharCarro();
    moverCarro();
    desenharObstaculos();
    moverObstaculos();
    detectarColisao();

    // Gerar obstáculos conforme dificuldade
    if (intervaloObstaculos % dificuldadeConfig.intervaloObstaculos === 0) {
      gerarObstaculo();
    }
    intervaloObstaculos++;

    // Aumentar velocidade a cada 20 pontos
    if (pontuacao >= pontosParaAumentoVelocidade) {
      velocidadeObstaculos += dificuldadeConfig.aumentoVelocidade;
      pontosParaAumentoVelocidade += 20;
    }

    if (jogoAtivo) {
      requestAnimationFrame(atualizarJogo);
    }
  }

  function reiniciarJogo() {
    jogoAtivo = false;
    pontuacaoDiv.style.display = "none";
    gameOver.style.display = "none";
    menu.style.display = "block";
    document.body.classList.remove("jogo-fundo");
    document.body.classList.add("menu-fundo");
  }

  // Event listeners para os botões (mais robusto que onclick inline)
  document.getElementById("btn-facil").addEventListener("click", () => iniciarJogo("facil"));
  document.getElementById("btn-medio").addEventListener("click", () => iniciarJogo("medio"));
  document.getElementById("btn-dificil").addEventListener("click", () => iniciarJogo("dificil"));
  document.getElementById("btn-reiniciar").addEventListener("click", reiniciarJogo);

  // Controlar teclas
  window.addEventListener("keydown", e => {
    teclado[e.key] = true;
  });
  window.addEventListener("keyup", e => {
    teclado[e.key] = false;
  });

  reiniciarJogo();