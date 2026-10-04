function salvarJogador(nome, personagem) {
  jogadorAtual = { nome, personagem };
  localStorage.setItem("jogador", JSON.stringify(jogadorAtual));
}

function carregarJogador() {
  const salvo = localStorage.getItem("jogador");
  if (salvo) jogadorAtual = JSON.parse(salvo);
  return jogadorAtual;
}

