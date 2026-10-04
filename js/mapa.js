function criarGradeHex(container, largura, altura) {
  container.innerHTML = "";
  const tamanho = 50;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const celula = document.createElement("div");
      celula.className = "token";
      celula.style.left = (x * tamanho) + "px";
      celula.style.top = (y * tamanho) + "px";
      celula.innerHTML = `<span class="icone">⬡</span>`;
      container.appendChild(celula);
    }
  }
}

