function rolarDados(expressao) {
  const match = expressao.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) return { total: 0, rolagens: [] };
  
  const qtde = parseInt(match[1]);
  const lados = parseInt(match[2]);
  const bonus = match[3] ? parseInt(match[3]) : 0;
  
  const rolagens = [];
  let soma = 0;
  for (let i = 0; i < qtde; i++) {
    const valor = Math.floor(Math.random() * lados) + 1;
    rolagens.push(valor);
    soma += valor;
  }
  return { total: soma + bonus, rolagens, bonus };
}

