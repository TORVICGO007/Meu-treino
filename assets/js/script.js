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

/* ===== 10. TREINOS DE EXEMPLO (só na primeira vez que a página abre) ===== */
const TREINOS_EXEMPLO = [
  { id: "ex1", nome: "Treino A - Peito e Tríceps", objetivo: "hipertrofia", grupo: "peito",
    duracao: "60", dataInicio: "2026-09-01", dataAtualizacao: "2026-09-28", nivel: "intermediario",
    status: "ativo", observacoes: "Aumentar a carga do supino na próxima semana.",
    exercicio: { nome: "Supino reto", series: "4", repeticoes: "10", carga: "40", descanso: "90" } },

  { id: "ex2", nome: "Treino B - Costas e Bíceps", objetivo: "hipertrofia", grupo: "costas",
    duracao: "55", dataInicio: "2026-09-01", dataAtualizacao: "", nivel: "intermediario",
    status: "ativo", observacoes: "",
    exercicio: { nome: "Puxada frontal", series: "4", repeticoes: "12", carga: "50", descanso: "60" } },

  { id: "ex3", nome: "Treino C - Pernas", objetivo: "forca", grupo: "pernas",
    duracao: "70", dataInicio: "2026-08-15", dataAtualizacao: "", nivel: "avancado",
    status: "concluido", observacoes: "Progressão de carga no agachamento.",
    exercicio: { nome: "Agachamento livre", series: "4", repeticoes: "8", carga: "80", descanso: "120" } },

  { id: "ex4", nome: "Treino D - Ombros", objetivo: "resistencia", grupo: "ombros",
    duracao: "45", dataInicio: "2026-10-05", dataAtualizacao: "", nivel: "iniciante",
    status: "pausado", observacoes: "",
    exercicio: { nome: "Desenvolvimento militar", series: "3", repeticoes: "15", carga: "20", descanso: "45" } }
];

// Preenche a lista com os exemplos APENAS na primeira visita (nunca repete).
function semearExemplos() {
  const jaSemeou = localStorage.getItem("meu-treino:semeado");
  if (!jaSemeou && treinos.length === 0) {
    treinos = TREINOS_EXEMPLO.slice();   // cria uma cópia dos exemplos
    salvarNoStorage();
  }
  localStorage.setItem("meu-treino:semeado", "sim"); // marca que já semeou uma vez
}

/* ===== 11. INÍCIO: ao abrir a página, carrega os dados e desenha a tela ===== */
carregarDoStorage();
semearExemplos();   // na primeira vez, insere os treinos de exemplo
renderizarLista();
