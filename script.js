// referências DOM
const canvas = document.getElementById("jogoCanvas");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const gameOver = document.getElementById("game-over");
const pontuacaoDiv = document.getElementById("pontuacao");
const finalScore = document.getElementById("final-score");
const canvasContainer = document.getElementById("canvas-container");

// inicializações seguras
let jogoAtivo = false;
let velocidadeObstaculos = 0;
let pontuacao = 0;
let carro = null;
let obstaculos = [];
let intervaloObstaculos = 0;
let teclado = {}; // <-- importante: inicializar aqui para evitar erros
let pontosParaAumentoVelocidade = 20;
let dificuldadeConfig = null;

// Web Audio (alguns browsers bloqueiam até interação do usuário)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioLiberado = false;
function tocarSom(frequencia, duracao = 0.1) {
  if (!audioLiberado) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = "square";
  oscillator.frequency.value = frequencia;
  gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duracao);
}

// Ajusta o tamanho do canvas (resolução real + CSS)
function ajustarTamanhoCanvas() {
  const w = canvasContainer.clientWidth;
  const h = canvasContainer.clientHeight;
  canvas.width = Math.max(300, Math.floor(w * devicePixelRatio));
  canvas.height = Math.max(300, Math.floor(h * devicePixelRatio));
  // Ajuste do estilo para manter o visual
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  // escala do contexto para devicePixelRatio
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener("resize", ajustarTamanhoCanvas);
ajustarTamanhoCanvas();

// Dificuldades
const dificuldades = {
  facil: { velocidadeInicial: 3, intervaloObstaculos: 120, aumentoVelocidade: 0.3 },
  medio: { velocidadeInicial: 5, intervaloObstaculos: 90, aumentoVelocidade: 0.5 },
  dificil: { velocidadeInicial: 7, intervaloObstaculos: 60, aumentoVelocidade: 0.7 }
};

// inicia o jogo
function iniciarJogo(dificuldade) {
  // libera audio ao primeiro clique se estiver suspenso
  if (!audioLiberado) {
    audioCtx.resume().then(() => { audioLiberado = true; }).catch(()=>{ audioLiberado = false; });
  }

  dificuldadeConfig = dificuldades[dificuldade] || dificuldades.medio;
  velocidadeObstaculos = dificuldadeConfig.velocidadeInicial;
  pontuacao = 0;
  pontosParaAumentoVelocidade = 20;
  intervaloObstaculos = 0;
  obstaculos = [];
  teclado = teclado || {}; // garante objeto
  jogoAtivo = true;

  // define carro com base nas dimensões atuais do canvas (em CSS px)
  const cssWidth = canvasContainer.clientWidth;
  const cssHeight = canvasContainer.clientHeight;

  carro = {
    x: cssWidth / 2 - 25,
    y: cssHeight - 120,
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

  // garante que o loop seja iniciado
  requestAnimationFrame(atualizarJogo);
}

function desenharCarro() {
  if (!carro) return;
  ctx.fillStyle = carro.cor;
  ctx.fillRect(carro.x, carro.y, carro.largura, carro.altura);
}

function moverCarro() {
  if (!carro) return;
  if (teclado["ArrowLeft"] || teclado["a"]) {
    carro.x -= carro.velocidade;
    if (carro.x < 0) carro.x = 0;
  }
  if (teclado["ArrowRight"] || teclado["d"]) {
    const maxX = canvasContainer.clientWidth - carro.largura;
    if (carro.x > maxX) carro.x = maxX;
    carro.x += carro.velocidade;
    if (carro.x > maxX) carro.x = maxX;
  }
}

function gerarObstaculo() {
  const cssWidth = canvasContainer.clientWidth;
  const larguraObstaculo = Math.random() * (cssWidth / 3) + 30;
  const xPosicaoObstaculo = Math.random() * (cssWidth - larguraObstaculo);
  obstaculos.push({ x: xPosicaoObstaculo, y: -30, largura: larguraObstaculo, altura: 30 });
}

function desenharObstaculos() {
  ctx.fillStyle = "#ff5555";
  obstaculos.forEach(obstaculo => {
    ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.largura, obstaculo.altura);
  });
}

function moverObstaculos() {
  const cssHeight = canvasContainer.clientHeight;
  for (let i = obstaculos.length - 1; i >= 0; i--) {
    const obst = obstaculos[i];
    obst.y += velocidadeObstaculos;
    if (obst.y > cssHeight) {
      obstaculos.splice(i, 1);
      pontuacao += 10;
      tocarSom(880, 0.05);
      atualizarPontuacao();
    }
  }
}

function detectarColisao() {
  if (!carro) return;
  for (let obstaculo of obstaculos) {
    const margem = 2;
    if (
      carro.x + margem < obstaculo.x + obstaculo.largura &&
      carro.x + carro.largura - margem > obstaculo.x &&
      carro.y + margem < obstaculo.y + obstaculo.altura &&
      carro.y + carro.altura - margem > obstaculo.y
    ) {
      tocarSom(150, 0.25);
      jogoAtivo = false;
      pontuacaoDiv.style.display = "none";
      finalScore.textContent = "Pontuação Final: " + pontuacao;
      gameOver.style.display = "block";
      document.body.classList.remove("jogo-fundo");
      document.body.classList.add("menu-fundo");
      return;
    }
  }
}

function atualizarPontuacao() {
  pontuacaoDiv.textContent = "Pontuação: " + pontuacao;
}

function atualizarJogo() {
  // desenha background usando CSS dimensões (não as dimensões do canvas em device pixels)
  const cssW = canvasContainer.clientWidth;
  const cssH = canvasContainer.clientHeight;

  // limpa usando dimensões CSS porque desenhamos na escala do contexto
  ctx.clearRect(0, 0, cssW, cssH);

  // fundo pista
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  for (let i = 0; i < cssW; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, cssH);
    ctx.stroke();
  }

  desenharCarro();
  moverCarro();
  desenharObstaculos();
  moverObstaculos();
  detectarColisao();

  // gerar obstaculos
  if (dificuldadeConfig) {
    if (intervaloObstaculos % dificuldadeConfig.intervaloObstaculos === 0) {
      gerarObstaculo();
    }
    intervaloObstaculos++;
  }

  // aumentar velocidade
  if (pontuacao >= pontosParaAumentoVelocidade && dificuldadeConfig) {
    velocidadeObstaculos += dificuldadeConfig.aumentoVelocidade;
    pontosParaAumentoVelocidade += 20;
  }

  if (jogoAtivo) requestAnimationFrame(atualizarJogo);
}

function reiniciarJogo() {
  jogoAtivo = false;
  pontuacaoDiv.style.display = "none";
  gameOver.style.display = "none";
  menu.style.display = "block";
  document.body.classList.remove("jogo-fundo");
  document.body.classList.add("menu-fundo");
  // limpa estado
  obstaculos = [];
  ponto = 0;
}

// listeners dos botões
document.getElementById("btn-facil").addEventListener("click", () => iniciarJogo("facil"));
document.getElementById("btn-medio").addEventListener("click", () => iniciarJogo("medio"));
document.getElementById("btn-dificil").addEventListener("click", () => iniciarJogo("dificil"));
document.getElementById("btn-reiniciar").addEventListener("click", reiniciarJogo);

// teclas: usa o objeto teclado já inicializado
window.addEventListener("keydown", e => {
  // primeira interação do usuário libera audio nos browsers
  if (!audioLiberado) {
    audioCtx.resume().then(()=>{ audioLiberado = true; }).catch(()=>{});
  }
  teclado[e.key] = true;
});
window.addEventListener("keyup", e => {
  teclado[e.key] = false;
});

// inicializa visual (garante menu visível e gameover escondido)
reiniciarJogo();
