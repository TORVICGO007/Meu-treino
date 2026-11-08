/* =====================================================================
   MEU TREINO — Etapa 3 (JavaScript)
   Funcionalidades até aqui: cadastro, listagem dinâmica, localStorage,
   exclusão, treinos de exemplo, DETALHES e EDIÇÃO.
   ===================================================================== */

/* ===== 1. ESTADO ===== */
let treinos = [];                                 // a lista de treinos (fonte da verdade)
let idEmEdicao = null;                            // guarda o id do treino sendo editado
const CHAVE_STORAGE = "meu-treino:treinos";       // "gaveta" dos treinos no localStorage

/* Mapas valor -> rótulo bonito (ex.: "forca" vira "Força"). */
const rotulos = {
  objetivo: { hipertrofia: "Hipertrofia", emagrecimento: "Emagrecimento", forca: "Força", resistencia: "Resistência" },
  grupo:    { peito: "Peito", costas: "Costas", pernas: "Pernas", ombros: "Ombros", bracos: "Braços", abdomen: "Abdômen", "corpo-inteiro": "Corpo inteiro" },
  status:   { ativo: "Ativo", pausado: "Pausado", concluido: "Concluído" },
  nivel:    { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" }
};

/* ===== 2. ELEMENTOS DA PÁGINA (DOM) ===== */
const form              = document.getElementById("form-treino");
const lista              = document.getElementById("lista-treinos");       // <tbody>
const mensagem          = document.getElementById("mensagem");             // feedback
const painelDetalhes    = document.getElementById("detalhes-conteudo");    // área de detalhes
const botaoSalvar        = document.querySelector('#form-treino button[type="submit"]');

/* ===== 3. LOCALSTORAGE ===== */
function salvarNoStorage() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(treinos));
}
function carregarDoStorage() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  treinos = dados ? JSON.parse(dados) : [];
}

/* ===== 4. AUXILIARES ===== */
function formatarData(iso) {
  if (!iso) return "-";
  const [ano, mes, dia] = iso.split("-");
  return dia + "/" + mes + "/" + ano;
}
function classeBadge(status) {
  return status === "ativo" ? "badge--ativo" : "badge--concluido";
}
// Data de hoje no formato "AAAA-MM-DD" (usada ao editar).
function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mes + "-" + dia;
}

/* ===== 5A. PESQUISA + FILTROS + ORDENAÇÃO =====
   Monta a lista que vai aparecer na tabela aplicando o que está nos
   campos de pesquisa, filtro e ordenação — SEM alterar o array
   original "treinos" (que continua sendo a fonte da verdade). */
function obterListaVisivel() {
  const termo  = document.getElementById("pesquisa").value.trim().toLowerCase();
  const grupo  = document.getElementById("filtro-grupo").value;
  const status = document.getElementById("filtro-status").value;
  const ordem  = document.getElementById("ordenar").value;

  // 1) PESQUISA e FILTROS: mantém só os treinos que casam com TUDO.
  let visiveis = treinos.filter(function (t) {
    const casaPesquisa = t.nome.toLowerCase().includes(termo);     // nome contém o texto
    const casaGrupo    = grupo === ""  || t.grupo === grupo;        // grupo escolhido
    const casaStatus   = status === "" || t.status === status;      // status escolhido
    return casaPesquisa && casaGrupo && casaStatus;
  });

  // 2) ORDENAÇÃO: reordena conforme o campo escolhido.
  visiveis.sort(function (a, b) {
    if (ordem === "nome")        return a.nome.localeCompare(b.nome, "pt-BR");   // A -> Z
    if (ordem === "data-inicio") return a.dataInicio.localeCompare(b.dataInicio); // mais antigo -> recente
    if (ordem === "duracao")     return Number(a.duracao) - Number(b.duracao);   // menor -> maior
    return 0;
  });

  return visiveis;
}

/* ===== 5B. RENDERIZAÇÃO DA LISTAGEM ===== */
function renderizarLista() {
  const visiveis = obterListaVisivel();
  lista.innerHTML = "";

  if (treinos.length === 0) {
    lista.innerHTML = '<tr><td colspan="7">Nenhum treino cadastrado ainda.</td></tr>';
    atualizarResumo();
    return;
  }
  if (visiveis.length === 0) {
    lista.innerHTML = '<tr><td colspan="7">Nenhum treino encontrado com esses critérios.</td></tr>';
    atualizarResumo();
    return;
  }

  visiveis.forEach(function (t) {
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

/* ===== 6. RESUMO ===== */
function atualizarResumo() {
  document.getElementById("resumo-total").textContent      = treinos.length;
  document.getElementById("resumo-ativos").textContent      = treinos.filter(function (t) { return t.status === "ativo"; }).length;
  document.getElementById("resumo-concluidos").textContent = treinos.filter(function (t) { return t.status === "concluido"; }).length;
}

/* ===== 7. FEEDBACK ===== */
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  // escolhe a cor: verde para sucesso, vermelho para erro
  mensagem.className = "message " + (tipo === "erro" ? "message--erro" : "message--success");
  mensagem.hidden = false;
  // sucesso some sozinho; erro fica até a próxima ação (para o usuário ler)
  if (tipo !== "erro") {
    setTimeout(function () { mensagem.hidden = true; }, 3500);
  }
}

/* ===== 8. LER O FORMULÁRIO (monta um objeto treino, sem id) ===== */
function lerFormulario() {
  return {
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
}

/* ===== 8B. VALIDAÇÃO DO FORMULÁRIO (em JavaScript) =====
   Retorna uma lista com os rótulos dos campos obrigatórios que ficaram
   vazios (lista vazia = tudo certo) e marca esses campos em vermelho. */
function validarFormulario(dados) {
  const erros = [];
  // limpa as marcações da tentativa anterior
  document.querySelectorAll(".campo-invalido").forEach(function (el) { el.classList.remove("campo-invalido"); });

  function exigir(valor, idCampo, rotulo) {
    if (!valor) {
      erros.push(rotulo);
      if (idCampo) {
        const el = document.getElementById(idCampo);
        if (el) el.classList.add("campo-invalido");
      }
    }
  }

  exigir(dados.nome,                 "nome",        "nome do treino");
  exigir(dados.objetivo,             "objetivo",    "objetivo");
  exigir(dados.grupo,                "grupo",        "grupo muscular");
  exigir(dados.duracao,              "duracao",      "duração");
  exigir(dados.dataInicio,            "data-inicio", "data de início");
  exigir(dados.nivel,                null,          "nível de dificuldade");
  exigir(dados.exercicio.nome,        "exercicio",  "nome do exercício");
  exigir(dados.exercicio.series,      "series",      "séries");
  exigir(dados.exercicio.repeticoes,  "repeticoes",  "repetições");

  return erros;
}

/* ===== 9. CADASTRAR ou ATUALIZAR (um mesmo formulário faz os dois) ===== */
form.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const dados = lerFormulario();

  // Valida antes de salvar. Se houver erro, avisa e para aqui.
  const erros = validarFormulario(dados);
  if (erros.length > 0) {
    mostrarMensagem("Preencha os campos obrigatórios: " + erros.join(", ") + ".", "erro");
    return;
  }

  if (idEmEdicao) {
    // --- modo edição: atualiza o treino existente ---
    const i = treinos.findIndex(function (t) { return t.id === idEmEdicao; });
    if (i >= 0) {
      dados.id = idEmEdicao;                       // mantém o mesmo id
      dados.dataAtualizacao = hojeISO();            // marca a data de atualização
      treinos[i] = dados;                           // substitui no lugar
    }
    mostrarMensagem("Treino atualizado com sucesso!");
    sairDoModoEdicao();
  } else {
    // --- modo cadastro: cria um novo treino ---
    dados.id = Date.now().toString();
    treinos.push(dados);
    mostrarMensagem("Treino salvo com sucesso!");
  }

  salvarNoStorage();
  renderizarLista();
  form.reset();
});

// Clicar em "Limpar" durante a edição também cancela o modo edição.
form.addEventListener("reset", function () { sairDoModoEdicao(); });

/* ===== 10. AÇÕES: excluir, editar e ver detalhes ===== */
function excluirTreino(id) {
  treinos = treinos.filter(function (t) { return t.id !== id; });
  salvarNoStorage();
  renderizarLista();
  painelDetalhes.innerHTML = '<p class="note">Selecione um treino na listagem para ver os detalhes.</p>';
  mostrarMensagem("Treino excluído.");
}

function editarTreino(id) {
  const t = treinos.find(function (x) { return x.id === id; });
  if (!t) return;

  // Preenche o formulário com os dados do treino.
  document.getElementById("nome").value            = t.nome;
  document.getElementById("objetivo").value        = t.objetivo;
  document.getElementById("grupo").value            = t.grupo;
  document.getElementById("duracao").value          = t.duracao;
  document.getElementById("data-inicio").value      = t.dataInicio;
  document.getElementById("data-atualizacao").value = t.dataAtualizacao;
  document.getElementById("status").value          = t.status;
  document.getElementById("observacoes").value      = t.observacoes;
  const radio = document.querySelector('input[name="nivel"][value="' + t.nivel + '"]');
  if (radio) radio.checked = true;

  const ex = t.exercicio || {};
  document.getElementById("exercicio").value  = ex.nome || "";
  document.getElementById("series").value      = ex.series || "";
  document.getElementById("repeticoes").value  = ex.repeticoes || "";
  document.getElementById("carga").value      = ex.carga || "";
  document.getElementById("descanso").value    = ex.descanso || "";

  // Entra no "modo edição".
  idEmEdicao = id;
  botaoSalvar.textContent = "Salvar alterações";
  document.getElementById("cadastro").scrollIntoView({ behavior: "smooth" });
  mostrarMensagem('Editando "' + t.nome + '". Altere os campos e clique em Salvar alterações.');
}

function sairDoModoEdicao() {
  idEmEdicao = null;
  botaoSalvar.textContent = "Salvar treino";
}

// monta um par rótulo/valor para o painel de detalhes
function itemDetalhe(rotulo, valor) {
  return '<div class="details__item"><dt>' + rotulo + "</dt><dd>" + valor + "</dd></div>";
}

function mostrarDetalhes(id) {
  const t = treinos.find(function (x) { return x.id === id; });
  if (!t) return;
  const ex = t.exercicio || {};

  painelDetalhes.innerHTML =
    '<div class="details__head">' +
      '<h3 class="details__title">' + t.nome + "</h3>" +
      '<span class="badge ' + classeBadge(t.status) + '">' + (rotulos.status[t.status] || t.status) + "</span>" +
    "</div>" +
    '<dl class="details__grid">' +
      itemDetalhe("Objetivo", rotulos.objetivo[t.objetivo] || t.objetivo) +
      itemDetalhe("Grupo muscular", rotulos.grupo[t.grupo] || t.grupo) +
      itemDetalhe("Duração", t.duracao + " minutos") +
      itemDetalhe("Data de início", formatarData(t.dataInicio)) +
      itemDetalhe("Data de atualização", formatarData(t.dataAtualizacao)) +
      itemDetalhe("Nível", rotulos.nivel[t.nivel] || t.nivel || "-") +
    "</dl>" +
    (t.observacoes ? '<p class="note"><strong>Observações:</strong> ' + t.observacoes + "</p>" : "") +
    '<h4 class="details__subtitle">Exercício</h4>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
      "<th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga</th><th>Descanso</th>" +
    "</tr></thead><tbody><tr>" +
      "<td>" + (ex.nome || "-") + "</td>" +
      "<td>" + (ex.series || "-") + "</td>" +
      "<td>" + (ex.repeticoes || "-") + "</td>" +
      "<td>" + (ex.carga ? ex.carga + " kg" : "-") + "</td>" +
      "<td>" + (ex.descanso ? ex.descanso + " s" : "-") + "</td>" +
    "</tr></tbody></table></div>" +
    '<div class="actions">' +
      '<button class="btn btn--ghost" type="button" data-acao="editar" data-id="' + t.id + '">Editar</button>' +
      '<button class="btn btn--danger" type="button" data-acao="excluir" data-id="' + t.id + '">Excluir</button>' +
    "</div>";

  document.getElementById("detalhes").scrollIntoView({ behavior: "smooth" });
}

/* ===== 11. DELEGAÇÃO DE EVENTOS =====
   Um só "ouvinte" para cada área descobre qual botão foi clicado
   (pelo data-acao) e chama a função certa. Funciona até para as
   linhas criadas depois pelo JavaScript. */
function tratarCliqueAcao(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;
  const id = botao.dataset.id;
  switch (botao.dataset.acao) {
    case "detalhes": mostrarDetalhes(id); break;
    case "editar":    editarTreino(id);    break;
    case "excluir":  excluirTreino(id);  break;
  }
}
lista.addEventListener("click", tratarCliqueAcao);
painelDetalhes.addEventListener("click", tratarCliqueAcao);

/* ===== 11B. EVENTOS DA BARRA DE FERRAMENTAS (pesquisa, filtros, ordenação) =====
   Qualquer mudança nesses campos manda redesenhar a tabela. */
document.getElementById("pesquisa").addEventListener("input", renderizarLista);
document.getElementById("filtro-grupo").addEventListener("change", renderizarLista);
document.getElementById("filtro-status").addEventListener("change", renderizarLista);
document.getElementById("ordenar").addEventListener("change", renderizarLista);
// Os botões "Buscar"/"Aplicar" e a tecla Enter também atualizam a lista.
document.getElementById("toolbar").addEventListener("submit", function (e) { e.preventDefault(); renderizarLista(); });
document.getElementById("toolbar").addEventListener("click", function (e) {
  if (e.target.tagName === "BUTTON") { e.preventDefault(); renderizarLista(); }
});

/* ===== 11C. CONSUMO DE API (Wger) — busca de exercícios =====
   O campo "Nome do exercício" ganha um botão que consulta a API pública
   da Wger. Os exercícios retornados (dados EXTERNOS) viram opções; ao
   escolher um, o nome preenche o campo e é salvo junto do treino no
   localStorage (dados DO SISTEMA). */
const campoExercicio    = document.getElementById("exercicio");
const painelResultados  = document.getElementById("resultados-exercicio");

function mostrarResultadosApi(html) {
  painelResultados.innerHTML = html;
  painelResultados.hidden = false;
}

async function buscarExerciciosApi() {
  const termo = campoExercicio.value.trim();
  if (termo.length < 2) {
    mostrarResultadosApi('<p class="api-aviso">Digite ao menos 2 letras para buscar.</p>');
    return;
  }
  mostrarResultadosApi('<p class="api-aviso">Buscando exercícios na Wger...</p>');

  try {
    const url = "https://wger.de/api/v2/exercise/search/?language=english&format=json&term=" + encodeURIComponent(termo);
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error("Status " + resposta.status);

    const dados = await resposta.json();
    const sugestoes = dados.suggestions || [];

    if (sugestoes.length === 0) {
      mostrarResultadosApi('<p class="api-aviso">Nenhum exercício encontrado. Você pode digitar o nome manualmente.</p>');
      return;
    }

    let html = "";
    sugestoes.slice(0, 8).forEach(function (s) {
      const nome = s.value;
      const categoria = (s.data && s.data.category) ? " — " + s.data.category : "";
      html += '<button type="button" class="api-item" data-nome="' + nome.replace(/"/g, "&quot;") + '">' +
              nome + categoria + "</button>";
    });
    mostrarResultadosApi(html);
  } catch (erro) {
    mostrarResultadosApi('<p class="api-aviso">Não foi possível buscar agora. Digite o nome do exercício manualmente.</p>');
  }
}

document.getElementById("btn-buscar-exercicio").addEventListener("click", buscarExerciciosApi);

// Escolher um exercício da lista preenche o campo e fecha os resultados.
painelResultados.addEventListener("click", function (evento) {
  const item = evento.target.closest(".api-item");
  if (!item) return;
  campoExercicio.value = item.dataset.nome;
  painelResultados.hidden = true;
  painelResultados.innerHTML = "";
});

/* ===== 12. TREINOS DE EXEMPLO (só na primeira vez que a página abre) ===== */
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

function semearExemplos() {
  const jaSemeou = localStorage.getItem("meu-treino:semeado-v2");
  if (!jaSemeou && treinos.length === 0) {
    treinos = TREINOS_EXEMPLO.slice();
    salvarNoStorage();
  }
  localStorage.setItem("meu-treino:semeado-v2", "sim");
}

/* ===== 13. INÍCIO ===== */
carregarDoStorage();
semearExemplos();
renderizarLista();
