// Conexão com o Supabase
let supabaseClient = null;
let rolagensSubscription = null;
let tokensSubscription = null;

// Dados do jogador
let jogador = {
  nome: "",
  personagem: "",
  ehNarrador: false
};

// Inicializar
async function inicializar() {
  if (typeof supabaseConfig !== 'undefined' && supabaseConfig.supabaseUrl) {
    const { createClient } = supabase;
    supabaseClient = createClient(
      supabaseConfig.supabaseUrl,
      supabaseConfig.supabaseKey
    );
    console.log("✅ Conectado ao Supabase!");
  } else {
    console.log("⚠️ Sem conexão — modo local apenas");
  }

  configurarEventos();
  carregarHistoricoLocal();
}

// Configurar botões e campos
function configurarEventos() {
  const btnEntrar = document.getElementById('btnEntrar');
  if (btnEntrar) btnEntrar.addEventListener('click', entrarSala);

  const botoesDado = document.querySelectorAll('.botao-dado');
  botoesDado.forEach(btn => {
    btn.addEventListener('click', () => rolarDado(parseInt(btn.dataset.lados)));
  });

  const btnRolar = document.getElementById('btnRolar');
  if (btnRolar) btnRolar.addEventListener('click', rolarDadoSelecionado);

  const btnLimpar = document.getElementById('btnLimparHistorico');
  if (btnLimpar) btnLimpar.addEventListener('click', limparHistorico);

  const btnLimparMapa = document.getElementById('btnLimparMapa');
  if (btnLimparMapa) btnLimparMapa.addEventListener('click', limparMapa);

  const botoesToken = document.querySelectorAll('.token-item');
  botoesToken.forEach(btn => {
    btn.addEventListener('click', () => selecionarToken(btn));
  });

  // Clique no mapa para colocar token
  const grade = document.getElementById('gradeHexagonal');
  if (grade) {
    grade.addEventListener('click', (e) => {
      if (e.target.classList.contains('celula')) {
        colocarTokenNaCelula(e.target);
      }
    });
  }
}

// Entrar na sala
function entrarSala() {
  const nomeInput = document.getElementById('nomeJogador');
  const nomePersInput = document.getElementById('nomePersonagem');
  
  jogador.nome = nomeInput.value.trim() || "Anônimo";
  jogador.personagem = nomePersInput.value.trim() || jogador.nome;
  jogador.ehNarrador = jogador.nome.toLowerCase() === 'narrador';

  if (supabaseClient) {
    assinarTempoReal();
  }

  // Esconder entrada, mostrar jogo
  const painelEntrada = document.getElementById('painelEntrada');
  const painelJogo = document.getElementById('painelJogo');
  if (painelEntrada) painelEntrada.style.display = 'none';
  if (painelJogo) painelJogo.style.display = 'block';

  adicionarHistorico({
    nome_jogador: "Sistema",
    personagem: "",
    tipo_dado: "",
    resultado: 0,
    modificador: 0,
    data_hora: new Date().toISOString()
  }, `${jogador.nome} entrou na sala! 🎮`);
}

// Assinar atualizações em tempo real
function assinarTempoReal() {
  if (!supabaseClient) return;

  // Escutar rolagens novas
  rolagensSubscription = supabaseClient
    .channel('rolagens-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'rolagens'
    }, (payload) => {
      adicionarHistorico(payload.new);
    })
    .subscribe();

  // Escutar mudanças nos tokens
  tokensSubscription = supabaseClient
    .channel('tokens-channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tokens'
    }, (payload) => {
      console.log("Token atualizado:", payload);
    })
    .subscribe();
}

// Rolagem de dado rápida
function rolarDado(lados) {
  const mod = parseInt(document.getElementById('modificador')?.value || 0);
  const resultado = Math.floor(Math.random() * lados) + 1;
  registrarRolagem(`d${lados}`, resultado, mod);
}

// Rolagem com dado selecionado
function rolarDadoSelecionado() {
  const select = document.getElementById('tipoDado');
  if (!select) return;
  const lados = parseInt(select.value);
  rolarDado(lados);
}

// Registrar rolagem
async function registrarRolagem(tipo, valor, mod) {
  const total = valor + mod;
  const textoMod = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
  
  const registro = {
    nome_jogador: jogador.nome,
    personagem: jogador.personagem,
    tipo_dado: tipo,
    resultado: valor,
    modificador: mod
  };

  // Salvar localmente
  adicionarHistorico(registro, 
    `${jogador.nome} rola ${tipo}: ${valor}${textoMod} = **${total}**`
  );

  // Enviar para o banco se conectado
  if (supabaseClient) {
    await supabaseClient.from('rolagens').insert([registro]);
  }
}

// Adicionar ao histórico
function adicionarHistorico(dados, textoPersonalizado) {
  const historico = document.getElementById('historicoRolagens');
  if (!historico) return;

  const item = document.createElement('div');
  item.className = 'item-historico';
  
  const data = new Date(dados.data_hora || new Date());
  const hora = data.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
  
  item.innerHTML = `
    <span class="hora">${hora}</span>
    <strong>${dados.nome_jogador}</strong>
    ${textoPersonalizado || `rolou ${dados.tipo_dado}: ${dados.resultado}`}
  `;

  historico.insertBefore(item, historico.firstChild);

  // Manter só as últimas 5
  while (historico.children.length > 5) {
    historico.removeChild(historico.lastChild);
  }

  salvarHistoricoLocal();
}

// Salvar/carregar histórico local
function salvarHistoricoLocal() {
  const historico = document.getElementById('historicoRolagens');
  if (historico) {
    localStorage.setItem('historico', historico.innerHTML);
  }
}

function carregarHistoricoLocal() {
  const salvo = localStorage.getItem('historico');
  const historico = document.getElementById('historicoRolagens');
  if (salvo && historico) {
    historico.innerHTML = salvo;
  }
}

function limparHistorico() {
  if (confirm('Limpar todo o histórico?')) {
    const historico = document.getElementById('historicoRolagens');
    if (historico) historico.innerHTML = '';
    localStorage.removeItem('historico');
  }
}

// Tokens e Mapa
let tokenSelecionado = null;

function selecionarToken(botao) {
  document.querySelectorAll('.token-item').forEach(b => b.classList.remove('selecionado'));
  botao.classList.add('selecionado');
  tokenSelecionado = {
    nome: botao.dataset.nome,
    icone: botao.dataset.icone,
    categoria: botao.dataset.categoria
  };
}

function colocarTokenNaCelula(celula) {
  if (!tokenSelecionado) {
    alert('Escolha um token primeiro!');
    return;
  }
  
  celula.innerHTML = `<span class="token-no-mapa">${tokenSelecionado.icone}</span>`;
  celula.dataset.nomeToken = tokenSelecionado.nome;
  celula.dataset.iconeToken = tokenSelecionado.icone;
}

function limparMapa() {
  if (confirm('Limpar todo o mapa?')) {
    document.querySelectorAll('.celula').forEach(c => {
      c.innerHTML = '';
      delete c.dataset.nomeToken;
      delete c.dataset.iconeToken;
    });
  }
}

// Iniciar quando carregar a página
document.addEventListener('DOMContentLoaded', inicializar);
    
