/* =====================================================================
   MEU TREINO — Etapa 3 (JavaScript)
   Parte 1 (base): cadastro, listagem dinâmica, localStorage e exclusão.
   ===================================================================== */

/* ===== 1. ESTADO: a lista de treinos que a aplicação mantém em memória ===== */
let treinos = [];                                 // array de objetos "treino"
const CHAVE_STORAGE = "meu-treino:treinos";       // nome da "gaveta" no localStorage

/* Mapas para transformar o valor do formulário em um rótulo bonito na tela.
   Ex.: no formulário o objetivo vale "forca", mas mostramos "Força". */
const rotulos = {
  objetivo: { hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento", forca: "Força", resistencia: "Resistência" },
  grupo:    { peito: "Peito", costas: "Costas", pernas: "Pernas", ombros: "Ombros", bracos: "Braços", abdomen: "Abdômen", "corpo-inteiro": "Corpo inteiro" },
  status:   { ativo: "Ativo", pausado: "Pausado", concluido: "Concluído" },
  nivel:    { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" }
};

/* ===== 2. ELEMENTOS DA PÁGINA (DOM) ===== */
const form      = document.getElementById("form-treino");
const lista      = document.getElementById("lista-treinos");   // <tbody> da tabela
const mensagem  = document.getElementById("mensagem");         // feedback de sucesso

/* ===== 3. LOCALSTORAGE (persistência) ===== */
// Guarda a lista inteira como texto (JSON) na "gaveta" do navegador.
function salvarNoStorage() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(treinos));
}
// Recupera a lista salva (ou começa vazia se não houver nada).
function carregarDoStorage() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  treinos = dados ? JSON.parse(dados) : [];
}

/* ===== 4. AUXILIARES DE EXIBIÇÃO ===== */
// Converte "2026-11-08" (do input date) para "08/11/2026".
function formatarData(iso) {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.split("-");
  return dia + "/" + mes + "/" + ano;
}
// Escolhe a cor da etiqueta de status.
function classeBadge(status) {
  return status === "ativo" ? "badge--ativo" : "badge--concluido";
}

/* ===== 5. RENDERIZAÇÃO: desenha a tabela a partir do array ===== */
function renderizarLista() {
  lista.innerHTML = "";                            // limpa o que estava na tabela

  // Estado vazio: nenhum treino cadastrado ainda.
  if (treinos.length === 0) {
    lista.innerHTML = '<tr><td colspan="7">Nenhum treino cadastrado ainda.</td></tr>';
    atualizarResumo();
    return;
  }

  // Para cada treino do array, cria uma linha <tr> na tabela.
  treinos.forEach(function (t) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + t.nome + "</td>" +
      "<td>" + (rotulos.objetivo[t.objetivo] || t.objetivo) + "</td>" +
      "<td>" + (rotulos.grupo[t.grupo] || t.grupo) + "</td>" +
      "<td>" + t.duracao + " min</td>" +
      "<td>" + formatarData(t.dataInicio) + "</td>" +
      '<td><span class="badge ' + classeBadge(t.status) + '">' + (rotulos.status[t.status] || t.status) + "</span></td>" +
      '<td class="row-actions">' +
        '<button class="btn btn--sm" type="button" data-acao="detalhes" data-id="' + t.id + '">Detalhes</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-acao="editar" data-id="' + t.id + '">Editar</button>' +
        '<button class="btn btn--sm btn--danger" type="button" data-acao="excluir" data-id="' + t.id + '">Excluir</button>' +
      "</td>";
    lista.appendChild(tr);
  });

  atualizarResumo();
}

/* ===== 6. RESUMO: conta os treinos por status ===== */
function atualizarResumo() {
  const total      = treinos.length;
  const ativos      = treinos.filter(function (t) { return t.status === "ativo"; }).length;
  const concluidos = treinos.filter(function (t) { return t.status === "concluido"; }).length;

  document.getElementById("resumo-total").textContent      = total;
  document.getElementById("resumo-ativos").textContent      = ativos;
  document.getElementById("resumo-concluidos").textContent = concluidos;
}

/* ===== 7. FEEDBACK: mostra a mensagem por alguns segundos ===== */
function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = false;
  setTimeout(function () { mensagem.hidden = true; }, 3000);
}

/* ===== 8. CADASTRO: lê o formulário e adiciona um treino ===== */
form.addEventListener("submit", function (evento) {
  evento.preventDefault();                         // impede a página de recarregar

  // Monta o objeto "treino" com o que foi digitado.
  const novo = {
    id: Date.now().toString(),                     // identificador único
    nome:            document.getElementById("nome").value.trim(),
    objetivo:        document.getElementById("objetivo").value,
    grupo:            document.getElementById("grupo").value,
    duracao:          document.getElementById("duracao").value,
    dataInicio:      document.getElementById("data-inicio").value,
    dataAtualizacao: document.getElementById("data-atualizacao").value,
    nivel:            (document.querySelector('input[name="nivel"]:checked') || {}).value || "",
    status:          document.getElementById("status").value,
    observacoes:      document.getElementById("observacoes").value.trim(),
    exercicio: {
      nome:        document.getElementById("exercicio").value.trim(),
      series:      document.getElementById("series").value,
      repeticoes:  document.getElementById("repeticoes").value,
      carga:        document.getElementById("carga").value,
      descanso:    document.getElementById("descanso").value
    }
  };

  treinos.push(novo);                              // 1. adiciona na lista
  salvarNoStorage();                               // 2. salva no navegador
  renderizarLista();                               // 3. redesenha a tabela
  form.reset();                                    // 4. limpa o formulário
  mostrarMensagem("Treino salvo com sucesso!");    // 5. avisa o usuário
});

/* ===== 9. EXCLUIR: remove um treino (delegação de eventos) =====
   Em vez de um "ouvinte" por botão, colocamos UM só na tabela e
   descobrimos qual botão foi clicado. Assim funciona até para as
   linhas criadas depois. */
lista.addEventListener("click", function (evento) {
  const botao = evento.target.closest('button[data-acao="excluir"]');
  if (!botao) return;                              // clicou em outra coisa

  const id = botao.dataset.id;
  treinos = treinos.filter(function (t) { return t.id !== id; });
  salvarNoStorage();
  renderizarLista();
  mostrarMensagem("Treino excluído.");
});

/* ===== 10. INÍCIO: ao abrir a página, carrega o que estava salvo ===== */
carregarDoStorage();
renderizarLista();
