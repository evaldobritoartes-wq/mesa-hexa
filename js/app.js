let meuNome = "";
let tokenSelecionado = null;
let arrastando = null;
let offsetX = 0, offsetY = 0;

document.addEventListener("DOMContentLoaded", function () {
  const grade = document.getElementById("grade-hexa");
  const listaHist = document.getElementById("lista-historico");

  criarGrade();

  // Selecionar token
  document.querySelectorAll(".token").forEach(botao => {
    botao.addEventListener("click", function (e) {
      e.stopPropagation();
      const nome = this.dataset.nome;
      
      if (tokenSelecionado && tokenSelecionado.nome === nome) {
        tokenSelecionado = null;
        document.querySelectorAll(".token").forEach(t => t.classList.remove("selecionado"));
        return;
      }
      
      document.querySelectorAll(".token").forEach(t => t.classList.remove("selecionado"));
      this.classList.add("selecionado");
      tokenSelecionado = {
        nome: nome,
        classe: this.className.split(" ")[1],
        icone: this.dataset.icone
      };
    });
  });

  // Desmarcar ao clicar fora
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".token") && !e.target.closest(".hexagono") && !e.target.closest(".token-no-mapa")) {
      if (tokenSelecionado) {
        tokenSelecionado = null;
        document.querySelectorAll(".token").forEach(t => t.classList.remove("selecionado"));
      }
    }
  });

  // Colocar token no mapa
  document.addEventListener("click", function (e) {
    if (!tokenSelecionado) return;
    if (e.target.closest(".token-no-mapa")) return;
    
    const hex = e.target.closest(".hexagono");
    if (!hex) return;
    if (hex.querySelector(".token-no-mapa")) return;

    const tok = document.createElement("div");
    tok.className = "token-no-mapa " + tokenSelecionado.classe;
    tok.innerHTML = tokenSelecionado.icone;
    tok.title = tokenSelecionado.nome;

    tok.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!arrastando) {
        tok.remove();
        adicionarHist("🗑️ Token removido");
      }
    });

    tok.addEventListener("mousedown", e => iniciarArrasto(e, tok));
    tok.addEventListener("touchstart", e => iniciarArrasto(e, tok), {passive: false});

    hex.appendChild(tok);
    adicionarHist("📍 " + tokenSelecionado.nome + " posicionado");
  });

  // Arrastar livremente
  function iniciarArrasto(e, tok) {
    e.preventDefault();
    e.stopPropagation();
    arrastando = tok;
    
    const toque = e.touches ? e.touches[0] : e;
    const rect = tok.getBoundingClientRect();
    const mapaRect = grade.getBoundingClientRect();
    
    offsetX = toque.clientX - rect.left - 20;
    offsetY = toque.clientY - rect.top - 20;
    
    tok.style.position = "absolute";
    tok.style.left = (toque.clientX - mapaRect.left - offsetX) + "px";
    tok.style.top = (toque.clientY - mapaRect.top - offsetY) + "px";
    tok.style.zIndex = "100";
    if (tok.parentElement !== grade) grade.appendChild(tok);
    
    document.addEventListener("mousemove", mover);
    document.addEventListener("touchmove", mover, {passive: false});
    document.addEventListener("mouseup", parar);
    document.addEventListener("touchend", parar);
  }

  function mover(e) {
    if (!arrastando) return;
    e.preventDefault();
    const toque = e.touches ? e.touches[0] : e;
    const mapaRect = grade.getBoundingClientRect();
    arrastando.style.left = (toque.clientX - mapaRect.left - offsetX) + "px";
    arrastando.style.top = (toque.clientY - mapaRect.top - offsetY) + "px";
  }

  function parar() {
    arrastando = null;
    document.removeEventListener("mousemove", mover);
    document.removeEventListener("touchmove", mover);
    document.removeEventListener("mouseup", parar);
    document.removeEventListener("touchend", parar);
  }

  // Entrar
  document.getElementById("btn-entrar")?.addEventListener("click", function () {
    const nome = document.getElementById("nome-jogador").value.trim();
    if (!nome) { alert("Digite seu nome!"); return; }
    meuNome = nome;
    document.getElementById("nome-jogador").disabled = true;
    this.disabled = true;
    const status = document.getElementById("status-mesa");
    status.textContent = "✅ Bem-vindo, " + nome + "!";
    status.className = "status-pronto";
    adicionarHist("✅ " + nome + " entrou");
  });

  // Dados rápidos
  document.querySelectorAll(".btn-dado").forEach(botao => {
    botao.addEventListener("click", function () {
      if (!meuNome) { alert("Entre primeiro!"); return; }
      const lados = parseInt(this.dataset.tipo.replace("d", ""));
      const valor = Math.floor(Math.random() * lados) + 1;
      document.getElementById("resultado").textContent = "Resultado: " + valor;
      adicionarHist("🎲 " + meuNome + " rolou " + this.dataset.tipo + " → " + valor);
    });
  });

  // Expressão com rolagens individuais
  document.getElementById("btn-rolar")?.addEventListener("click", function () {
    if (!meuNome) { alert("Entre primeiro!"); return; }
    const texto = document.getElementById("expressao").value.trim();
    if (!texto) return;
    const m = texto.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!m) { adicionarHist("❌ Use: 2d6+3"); return; }
    
    const qtd = parseInt(m[1]);
    const lados = parseInt(m[2]);
    const bonus = m[3] ? parseInt(m[3]) : 0;
    
    let total = bonus;
    let vals = [];
    
    for (let i = 0; i < qtd; i++) {
      const v = Math.floor(Math.random() * lados) + 1;
      vals.push(v);
      total += v;
    }
    
    const detalhes = vals.join(" + ") + (bonus ? ` ${m[3]} ${Math.abs(bonus)}` : "");
    document.getElementById("resultado").textContent = `${detalhes} = ${total}`;
    adicionarHist(`🎲 ${meuNome} rolou ${texto}: (${detalhes}) = ${total}`);
    document.getElementById("expressao").value = "";
  });

  // Limpar mapa
  document.getElementById("btn-limpar-mapa")?.addEventListener("click", function () {
    if (confirm("Apagar todos os tokens?")) {
      grade.querySelectorAll(".token-no-mapa").forEach(t => t.remove());
      adicionarHist("🗑️ Mapa limpo");
    }
  });

  function adicionarHist(texto) {
    if (!listaHist) return;
    const item = document.createElement("div");
    item.className = "hist-item";
    item.textContent = texto;
    listaHist.insertBefore(item, listaHist.firstChild);
    while (listaHist.children.length > 5) listaHist.removeChild(listaHist.lastChild);
  }

  function criarGrade() {
    if (!grade) return;
    grade.innerHTML = "";
    const linhas = 10, colunas = 8, passoX = 48, altura = 52;
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < colunas; c++) {
        const hex = document.createElement("div");
        hex.className = "hexagono";
        hex.style.left = (c * passoX + (l % 2 ? passoX/2 : 0)) + "px";
        hex.style.top = (l * altura * 0.75) + "px";
        grade.appendChild(hex);
      }
    }
    grade.style.width = (colunas * passoX + 40) + "px";
    grade.style.height = (linhas * altura * 0.75 + 40) + "px";
  }
});
                            
