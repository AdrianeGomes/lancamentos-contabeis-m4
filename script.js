// =============================================
//  MÓDULO 4 — RESULTADO DO EXERCÍCIO  |  Logos Concursos
// =============================================

const SENHA_ACESSO     = "logoscontabil26";
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbwVdqrdavJvJgaLW-0d0xypUjy-MwJHDcl79zTGrxiYNyYLBs7NvNVsmVLfUG2weAD5YA/exec";

let alunoNome  = "";
let alunoEmail = "";
let score      = 0;
let currentLancamento = 0;
let placedCards       = new Set();
let wrongAttempts     = {};
let visibleRazonetes  = [];
let razoneteSaldos    = {};
let selectedCardId    = null;

// =============================================
//  DEFINIÇÕES DOS RAZONETES
// =============================================
const razoneteDefs = {
  banco:               { label: "Banco Conta Movimento",    tipo: "ativo"             },
  emprestimos:         { label: "Empréstimos a Pagar",      tipo: "passivo"           },
  despesaJuros:        { label: "Despesa de Juros",         tipo: "resultado-despesa" },
  receitaServicos:     { label: "Receita de Serviços",      tipo: "resultado-receita" },
  estoques:            { label: "Estoques",                 tipo: "ativo"             },
  maquinas:            { label: "Máquinas e Equipamentos",  tipo: "ativo"             },
  fornecedores:        { label: "Fornecedores",             tipo: "passivo"           },
  clientes:            { label: "Clientes a Receber",       tipo: "ativo"             },
  receitaJuros:        { label: "Receita de Juros Ativos",  tipo: "resultado-receita" },
  despesaAluguel:      { label: "Despesa de Aluguel",       tipo: "resultado-despesa" },
  despesaDepreciacao:  { label: "Despesa de Depreciação",   tipo: "resultado-despesa" },
  depreciacaoAcum:     { label: "Depreciação Acumulada",    tipo: "ativo-redutora"    },
};

const tipoLabel = {
  "ativo":             "ATIVO",
  "passivo":           "PASSIVO",
  "pl":                "PL",
  "pl-redutora":       "PL — Redutora",
  "ativo-redutora":    "Ativo — Redutora",
  "resultado-receita": "RESULTADO — Receita",
  "resultado-despesa": "RESULTADO — Despesa",
};

// =============================================
//  LANÇAMENTOS — MÓDULO 4
// =============================================
const lancamentos = [
  {
    id: 1,
    descricao: "A empresa obteve um <strong>empréstimo bancário de R$&nbsp;50.000</strong>. O valor foi creditado na conta bancária.",
    cards: [
      { id: "c1a", label: "Banco Conta Movimento", value: 50000, conta: "banco",       lado: "debito"  },
      { id: "c1b", label: "Empréstimos a Pagar",   value: 50000, conta: "emprestimos", lado: "credito" }
    ],
    novosRazonetes: ["banco", "emprestimos"],
    explicacao: "O <strong>Banco Conta Movimento</strong> é debitado — o dinheiro entrou no Ativo. <strong>Empréstimos a Pagar</strong> é creditado — surge uma obrigação financeira (Passivo)."
  },
  {
    id: 2,
    descricao: "A empresa <strong>pagou R$&nbsp;500 de juros</strong> sobre o empréstimo bancário. O valor saiu do Banco.",
    cards: [
      { id: "c2a", label: "Despesa de Juros",      value: 500, conta: "despesaJuros", lado: "debito"  },
      { id: "c2b", label: "Banco Conta Movimento", value: 500, conta: "banco",        lado: "credito" }
    ],
    novosRazonetes: ["despesaJuros"],
    explicacao: "<strong>Despesa de Juros</strong> é debitada — custo financeiro que reduz o Resultado (afeta o PL). <strong>Banco</strong> é creditado — saída de dinheiro reduz o Ativo."
  },
  {
    id: 3,
    descricao: "A empresa <strong>prestou serviços e recebeu R$&nbsp;3.000</strong> diretamente no Banco.",
    cards: [
      { id: "c3a", label: "Banco Conta Movimento", value: 3000, conta: "banco",           lado: "debito"  },
      { id: "c3b", label: "Receita de Serviços",   value: 3000, conta: "receitaServicos", lado: "credito" }
    ],
    novosRazonetes: ["receitaServicos"],
    explicacao: "<strong>Banco</strong> é debitado — entrada de dinheiro aumenta o Ativo. <strong>Receita de Serviços</strong> é creditada — aumenta o Resultado, que aumenta o PL."
  },
  {
    id: 4,
    descricao: "A empresa <strong>adquiriu R$&nbsp;1.000 em mercadorias à vista</strong>, pagando pelo Banco.",
    cards: [
      { id: "c4a", label: "Estoques",              value: 1000, conta: "estoques", lado: "debito"  },
      { id: "c4b", label: "Banco Conta Movimento", value: 1000, conta: "banco",    lado: "credito" }
    ],
    novosRazonetes: ["estoques"],
    explicacao: "<strong>Estoques</strong> são debitados — as mercadorias entram no Ativo. <strong>Banco</strong> é creditado — saída de dinheiro reduz o Ativo."
  },
  {
    id: 5,
    descricao: "A empresa <strong>adquiriu uma máquina de R$&nbsp;10.000</strong> para pagamento em 45 dias.",
    cards: [
      { id: "c5a", label: "Máquinas e Equipamentos", value: 10000, conta: "maquinas",     lado: "debito"  },
      { id: "c5b", label: "Fornecedores",             value: 10000, conta: "fornecedores", lado: "credito" }
    ],
    novosRazonetes: ["maquinas", "fornecedores"],
    explicacao: "<strong>Máquinas e Equipamentos</strong> são debitados — bem do Ativo Imobilizado. <strong>Fornecedores</strong> é creditado — surge uma obrigação de pagamento (Passivo)."
  },
  {
    id: 6,
    descricao: "A empresa <strong>recebeu R$&nbsp;2.000 de clientes</strong> referentes a vendas realizadas anteriormente.",
    cards: [
      { id: "c6a", label: "Banco Conta Movimento", value: 2000, conta: "banco",    lado: "debito"  },
      { id: "c6b", label: "Clientes a Receber",    value: 2000, conta: "clientes", lado: "credito" }
    ],
    novosRazonetes: ["clientes"],
    explicacao: "<strong>Banco</strong> é debitado — entrada de dinheiro aumenta o Ativo. <strong>Clientes a Receber</strong> é creditado — o direito de receber é baixado com o recebimento."
  },
  {
    id: 7,
    descricao: "A empresa <strong>recebeu R$&nbsp;100 de juros ativos</strong> em sua conta bancária.",
    cards: [
      { id: "c7a", label: "Banco Conta Movimento",   value: 100, conta: "banco",        lado: "debito"  },
      { id: "c7b", label: "Receita de Juros Ativos", value: 100, conta: "receitaJuros", lado: "credito" }
    ],
    novosRazonetes: ["receitaJuros"],
    explicacao: "<strong>Banco</strong> é debitado — entrada de dinheiro. <strong>Receita de Juros Ativos</strong> é creditada — receita financeira que aumenta o Resultado."
  },
  {
    id: 8,
    descricao: "A empresa <strong>pagou R$&nbsp;8.000 a fornecedores</strong> pelo Banco (quitação de duplicata).",
    cards: [
      { id: "c8a", label: "Fornecedores",          value: 8000, conta: "fornecedores", lado: "debito"  },
      { id: "c8b", label: "Banco Conta Movimento", value: 8000, conta: "banco",        lado: "credito" }
    ],
    novosRazonetes: [],
    explicacao: "<strong>Fornecedores</strong> é debitado — quitação da obrigação reduz o Passivo. <strong>Banco</strong> é creditado — saída de dinheiro reduz o Ativo."
  },
  {
    id: 9,
    descricao: "A empresa <strong>pagou R$&nbsp;1.200 de aluguel</strong> do mês pelo Banco.",
    cards: [
      { id: "c9a", label: "Despesa de Aluguel",    value: 1200, conta: "despesaAluguel", lado: "debito"  },
      { id: "c9b", label: "Banco Conta Movimento", value: 1200, conta: "banco",          lado: "credito" }
    ],
    novosRazonetes: ["despesaAluguel"],
    explicacao: "<strong>Despesa de Aluguel</strong> é debitada — custo operacional que reduz o Resultado (afeta o PL). <strong>Banco</strong> é creditado — saída de dinheiro reduz o Ativo."
  },
  {
    id: 10,
    descricao: "Reconhecimento da <strong>depreciação mensal das máquinas</strong> no valor de R$&nbsp;500.",
    cards: [
      { id: "c10a", label: "Despesa de Depreciação", value: 500, conta: "despesaDepreciacao", lado: "debito"  },
      { id: "c10b", label: "Depreciação Acumulada",  value: 500, conta: "depreciacaoAcum",    lado: "credito" }
    ],
    novosRazonetes: ["despesaDepreciacao", "depreciacaoAcum"],
    explicacao: "<strong>Despesa de Depreciação</strong> é debitada — reconhece o desgaste do bem (reduz o Resultado). <strong>Depreciação Acumulada</strong> é creditada — conta redutora do Ativo Imobilizado."
  },
  {
    id: 11,
    descricao: "A empresa comprou <strong>mercadorias por R$&nbsp;500 com desconto incondicional de 10%</strong> (R$&nbsp;50). Valor líquido: R$&nbsp;450 a prazo.",
    cards: [
      { id: "c11a", label: "Estoques",     value: 450, conta: "estoques",     lado: "debito"  },
      { id: "c11b", label: "Fornecedores", value: 450, conta: "fornecedores", lado: "credito" }
    ],
    novosRazonetes: [],
    explicacao: "<strong>Estoques</strong> são debitados pelo valor líquido (R$&nbsp;450) — o desconto incondicional reduz diretamente o custo de aquisição. <strong>Fornecedores</strong> é creditado — obrigação a pagar."
  }
];

// =============================================
//  AUTENTICAÇÃO
// =============================================
function verificarSenha() {
  const senha = document.getElementById("inputSenha").value.trim();
  const erro  = document.getElementById("senhaErro");
  if (senha === SENHA_ACESSO) {
    document.getElementById("senha").style.display  = "none";
    document.getElementById("intro").style.display  = "block";
  } else {
    erro.innerText = "Senha incorreta. Tente novamente.";
    document.getElementById("inputSenha").value = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const inp = document.getElementById("inputSenha");
  if (inp) inp.addEventListener("keydown", e => { if (e.key === "Enter") verificarSenha(); });
});

// =============================================
//  TOUCH DRAG — arrastar no celular
// =============================================
let touchDragId = null;
let touchClone  = null;
let touchStartX = 0;
let touchStartY = 0;

function getRazColAt(cx, cy) {
  let found = null;
  document.querySelectorAll(".raz-col").forEach(col => {
    const r = col.getBoundingClientRect();
    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) found = col;
  });
  return found;
}

document.addEventListener("touchstart", e => {
  const card = e.target.closest(".card");
  if (!card || placedCards.has(card.id)) return;
  e.preventDefault();
  touchDragId = card.id;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  selectCard(card.id);
}, { passive: false });

document.addEventListener("touchmove", e => {
  if (!touchDragId) return;
  const t  = e.touches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  if (!touchClone && Math.sqrt(dx * dx + dy * dy) > 20) {
    const card = document.getElementById(touchDragId);
    if (card) {
      const cloneWidth = Math.min(card.offsetWidth, 120);
      touchClone = card.cloneNode(true);
      touchClone.style.cssText = `
        position:fixed; pointer-events:none; opacity:0.9;
        z-index:9999; width:${cloneWidth}px;
        transform:rotate(2deg); transition:none; border-radius:8px;
        box-shadow:0 6px 20px rgba(0,0,0,0.3); font-size:11px;
      `;
      document.body.appendChild(touchClone);
    }
  }

  if (touchClone) {
    e.preventDefault();
    moveTouchClone(t);
    autoScroll(t.clientY);
    document.querySelectorAll(".raz-col").forEach(col => {
      const r = col.getBoundingClientRect();
      col.classList.toggle("dragover",
        t.clientX >= r.left && t.clientX <= r.right &&
        t.clientY >= r.top  && t.clientY <= r.bottom);
    });
  }
}, { passive: false });

document.addEventListener("touchend", e => {
  const t = e.changedTouches[0];
  document.querySelectorAll(".raz-col").forEach(col => col.classList.remove("dragover"));

  if (touchClone) {
    touchClone.remove(); touchClone = null;
    const col   = getRazColAt(t.clientX, t.clientY);
    const match = col ? col.id.match(/^raz-(.+)-(debito|credito)$/) : null;
    if (match && touchDragId) {
      dropRaz({ preventDefault: () => {}, dataTransfer: { getData: () => touchDragId } }, match[1], match[2]);
    }
    touchDragId = null;

  } else if (selectedCardId) {
    const col   = getRazColAt(t.clientX, t.clientY);
    const match = col ? col.id.match(/^raz-(.+)-(debito|credito)$/) : null;
    if (match) tapRaz(match[1], match[2]);
    touchDragId = null;

  } else {
    touchDragId = null;
  }
}, { passive: true });

// =============================================
//  CADASTRO / INÍCIO
// =============================================
function mostrarCadastro() {
  document.getElementById("intro").style.display    = "none";
  document.getElementById("registro").style.display = "block";
}

function iniciarComCadastro() {
  const nome  = document.getElementById("inputNome").value.trim();
  const email = document.getElementById("inputEmail").value.trim();
  const erro  = document.getElementById("cadastroErro");
  if (!nome)                          { erro.innerText = "Por favor, informe seu nome.";         return; }
  if (!email || !email.includes("@")) { erro.innerText = "Por favor, informe um e-mail válido."; return; }
  erro.innerText = "";
  alunoNome  = nome;
  alunoEmail = email;
  document.getElementById("registro").style.display = "none";
  document.getElementById("game").style.display     = "block";
  initGame();
}

// =============================================
//  INICIALIZAÇÃO
// =============================================
function initGame() {
  currentLancamento = 0;
  placedCards       = new Set();
  wrongAttempts     = {};
  visibleRazonetes  = [];
  razoneteSaldos    = {};
  score             = 0;
  selectedCardId    = null;
  document.getElementById("razonetesGrid").innerHTML = "";
  updateScoreDisplay();
  loadLancamento();
}

function resetGame() {
  document.getElementById("game").style.display      = "none";
  document.getElementById("resultado").style.display = "none";
  document.getElementById("intro").style.display     = "block";
}

// =============================================
//  CARREGAR LANÇAMENTO
// =============================================
function loadLancamento() {
  const lan = lancamentos[currentLancamento];

  document.getElementById("missionBox").innerHTML = `
    <h2>📖 Lançamento ${lan.id} de ${lancamentos.length}</h2>
    <p>${lan.descricao}</p>
    <p style="font-size:13px;color:#555;margin-top:6px;">
      Toque (ou arraste) cada conta para o lado correto (D ou C) do razonete correspondente.
    </p>
  `;

  lan.novosRazonetes.forEach(conta => {
    if (!visibleRazonetes.includes(conta)) {
      visibleRazonetes.push(conta);
      addRazonete(conta);
    }
  });

  document.getElementById("cards").innerHTML = lan.cards.map(c => `
    <div class="card" draggable="true"
      id="${c.id}"
      data-conta="${c.conta}"
      data-lado="${c.lado}"
      data-value="${c.value}"
      data-label="${c.label}"
      onclick="selectCard('${c.id}')"
      ondragstart="drag(event)">
      <div class="card-nome">${c.label}</div>
      <div class="card-valor">R$&nbsp;${format(c.value)}</div>
    </div>
  `).join("");

  document.getElementById("feedback").innerHTML =
    "💡 Toque em uma conta e depois toque no lado <strong>D</strong> ou <strong>C</strong> do razonete correto.";
  document.getElementById("nextBtn").disabled  = true;
  document.getElementById("nextBtn").innerText =
    currentLancamento < lancamentos.length - 1 ? "➡ Próximo Lançamento" : "🏆 Ver Resultado Final";
  document.getElementById("explanation").style.display = "none";
  document.getElementById("explanation").innerHTML     = "";
}

// =============================================
//  RAZONETE
// =============================================
function addRazonete(conta) {
  const def  = razoneteDefs[conta];
  const grid = document.getElementById("razonetesGrid");
  const div  = document.createElement("div");
  div.className = "razonete razonete-new";
  div.id        = `raz-${conta}`;
  div.innerHTML = `
    <div class="raz-titulo">${def.label}</div>
    <div class="raz-tipo ${def.tipo}">${tipoLabel[def.tipo]}</div>
    <div class="raz-tabela">
      <div class="raz-header">
        <div>Débito</div>
        <div>Crédito</div>
      </div>
      <div class="raz-body">
        <div class="raz-col raz-debito" id="raz-${conta}-debito"
          ondragover="allowDrop(event)"
          ondrop="dropRaz(event,'${conta}','debito')"
          onclick="tapRaz('${conta}','debito')"
          ontouchend="razTouchEnd(event,'${conta}','debito')">
          <div class="raz-drop-hint">D</div>
        </div>
        <div class="raz-col raz-credito" id="raz-${conta}-credito"
          ondragover="allowDrop(event)"
          ondrop="dropRaz(event,'${conta}','credito')"
          onclick="tapRaz('${conta}','credito')"
          ontouchend="razTouchEnd(event,'${conta}','credito')">
          <div class="raz-drop-hint">C</div>
        </div>
      </div>
    </div>
    <div class="raz-saldo" id="raz-${conta}-saldo">Saldo: —</div>
  `;
  grid.appendChild(div);
  requestAnimationFrame(() => div.classList.remove("razonete-new"));
}

// =============================================
//  DRAG & DROP + TAP
// =============================================
function allowDrop(e) { e.preventDefault(); }
function drag(e)      { e.dataTransfer.setData("id", e.currentTarget.id); }

function selectCard(id) {
  selectedCardId = id;
  document.querySelectorAll(".card").forEach(c => c.classList.remove("card-selected"));
  const c = document.getElementById(id);
  if (c) c.classList.add("card-selected");
  document.getElementById("feedback").innerHTML =
    "👆 Agora toque no lado <strong>D</strong> ou <strong>C</strong> do razonete correto.";
}

function tapRaz(conta, lado) {
  if (!selectedCardId) return;
  dropRaz({ preventDefault: () => {}, dataTransfer: { getData: () => selectedCardId } }, conta, lado);
  selectedCardId = null;
}

function razTouchEnd(e, conta, lado) {
  if (touchClone) return;
  e.stopPropagation();
  if (selectedCardId) tapRaz(conta, lado);
}

function dropRaz(event, contaAlvo, ladoAlvo) {
  event.preventDefault();
  const id   = event.dataTransfer.getData("id");
  const card = document.getElementById(id);
  if (!card || placedCards.has(id)) return;

  const contaCard = card.dataset.conta;
  const ladoCard  = card.dataset.lado;
  const value     = Number(card.dataset.value);

  if (contaCard !== contaAlvo || ladoCard !== ladoAlvo) {
    wrongAttempts[id] = (wrongAttempts[id] || 0) + 1;
    const col = document.getElementById(`raz-${contaAlvo}-${ladoAlvo}`);
    if (col) { col.classList.add("raz-erro"); setTimeout(() => col.classList.remove("raz-erro"), 700); }
    document.getElementById("feedback").innerHTML = "❌ Não é aqui. Verifique a conta e o lado (D ou C)!";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    return;
  }

  // ✅ CORRETO
  const erros  = wrongAttempts[id] || 0;
  const pontos = erros === 0 ? 10 : erros === 1 ? 7 : 5;
  score += pontos;
  updateScoreDisplay();
  showPontos(pontos);
  placedCards.add(id);
  card.remove();

  if (!razoneteSaldos[contaCard]) razoneteSaldos[contaCard] = { debito: 0, credito: 0 };
  razoneteSaldos[contaCard][ladoAlvo] += value;

  const col = document.getElementById(`raz-${contaCard}-${ladoAlvo}`);
  if (col) {
    const entry = document.createElement("div");
    entry.className = "raz-entry raz-entry-new";
    entry.innerHTML = `<span class="raz-val">R$&nbsp;${format(value)}</span>`;
    col.appendChild(entry);
    setTimeout(() => entry.classList.remove("raz-entry-new"), 700);
  }

  updateSaldo(contaCard);
  document.getElementById("feedback").innerHTML = "✅ Correto! Continue.";
  checkLancamentoComplete();
}

// =============================================
//  SALDO DO RAZONETE
// =============================================
function updateSaldo(conta) {
  const saldoEl = document.getElementById(`raz-${conta}-saldo`);
  if (!saldoEl) return;
  const s   = razoneteSaldos[conta] || { debito: 0, credito: 0 };
  const def = razoneteDefs[conta];
  let saldo, lado;

  if (def.tipo === "ativo" || def.tipo === "ativo-redutora" ||
      def.tipo === "pl-redutora" || def.tipo === "resultado-despesa") {
    saldo = s.debito - s.credito; lado = "D";
  } else {
    // passivo, pl, resultado-receita
    saldo = s.credito - s.debito; lado = "C";
  }
  saldoEl.innerHTML = `Saldo ${lado}: R$&nbsp;${format(Math.abs(saldo))}`;
}

// =============================================
//  VERIFICAR CONCLUSÃO DO LANÇAMENTO
// =============================================
function checkLancamentoComplete() {
  const lan       = lancamentos[currentLancamento];
  const allPlaced = lan.cards.every(c => placedCards.has(c.id));
  if (!allPlaced) return;

  document.getElementById("explanation").style.display = "block";
  document.getElementById("explanation").innerHTML     = "💡 " + lan.explicacao;
  document.getElementById("nextBtn").disabled          = false;

  if (currentLancamento >= lancamentos.length - 1) {
    document.getElementById("feedback").innerHTML = "🎉 Todos os lançamentos concluídos!";
    document.getElementById("nextBtn").innerText  = "🏆 Ver Resultado Final";
  } else {
    document.getElementById("feedback").innerHTML = "✅ Lançamento correto! Veja a explicação abaixo.";
    document.getElementById("nextBtn").innerText  = "➡ Próximo Lançamento";
  }
}

function nextLancamento() {
  currentLancamento++;
  if (currentLancamento >= lancamentos.length) { showResult(); return; }
  loadLancamento();
}

// =============================================
//  RESULTADO FINAL + DRE
// =============================================
function showResult() {
  document.getElementById("game").style.display = "none";
  const maxScore = lancamentos.length * 2 * 10;
  const pct      = Math.round((score / maxScore) * 100);
  const stars    = pct >= 90 ? "⭐⭐⭐" : pct >= 70 ? "⭐⭐" : "⭐";

  // — Calcular DRE —
  let totalReceitas = 0;
  let totalDespesas = 0;
  let dreLinhasReceita = "";
  let dreLinhasDespesa = "";

  visibleRazonetes.forEach(conta => {
    const def = razoneteDefs[conta];
    const s   = razoneteSaldos[conta] || { debito: 0, credito: 0 };
    if (def.tipo === "resultado-receita") {
      const v = s.credito - s.debito;
      totalReceitas += v;
      dreLinhasReceita += `
        <div class="dre-linha dre-receita">
          <span>${def.label}</span>
          <span>R$&nbsp;${format(v)}</span>
        </div>`;
    }
    if (def.tipo === "resultado-despesa") {
      const v = s.debito - s.credito;
      totalDespesas += v;
      dreLinhasDespesa += `
        <div class="dre-linha dre-despesa">
          <span>${def.label}</span>
          <span>(R$&nbsp;${format(v)})</span>
        </div>`;
    }
  });

  const resultado    = totalReceitas - totalDespesas;
  const lucro        = resultado >= 0;
  const dreResultado = `
    <div class="dre-linha ${lucro ? 'dre-resultado-lucro' : 'dre-resultado-prejuizo'}">
      <span>${lucro ? "✅ Lucro do Exercício" : "❌ Prejuízo do Exercício"}</span>
      <span>R$&nbsp;${format(Math.abs(resultado))}</span>
    </div>`;

  // — Balancete —
  const balanceteRows = visibleRazonetes.map(conta => {
    const def = razoneteDefs[conta];
    const s   = razoneteSaldos[conta] || { debito: 0, credito: 0 };
    let saldo, lado;
    if (def.tipo === "ativo" || def.tipo === "ativo-redutora" ||
        def.tipo === "pl-redutora" || def.tipo === "resultado-despesa") {
      saldo = s.debito - s.credito; lado = "D";
    } else {
      saldo = s.credito - s.debito; lado = "C";
    }
    return `
      <tr class="tipo-${def.tipo}">
        <td>${def.label}</td>
        <td class="num">${s.debito  > 0 ? "R$&nbsp;" + format(s.debito)  : "—"}</td>
        <td class="num">${s.credito > 0 ? "R$&nbsp;" + format(s.credito) : "—"}</td>
        <td class="num saldo-${lado.toLowerCase()}">R$&nbsp;${format(Math.abs(saldo))} (${lado})</td>
      </tr>`;
  }).join("");

  const resultDiv = document.getElementById("resultado");
  resultDiv.style.display = "block";
  resultDiv.innerHTML = `
    <div class="result-container">
      <h1>🏆 Resultado Final — Módulo 4</h1>
      <h2>${stars}</h2>
      <p class="result-score">Pontuação: <strong>${score} / ${maxScore} pts</strong> (${pct}%)</p>
      <p>Parabéns, <strong>${alunoNome}</strong>! Você completou o Módulo 4 — Resultado do Exercício! 🎉</p>

      <h3>📋 Demonstração do Resultado do Exercício (DRE)</h3>
      <div class="dre-box">
        ${dreLinhasReceita}
        <div class="dre-linha dre-total-receitas">
          <span>Total de Receitas</span>
          <span>R$&nbsp;${format(totalReceitas)}</span>
        </div>
        ${dreLinhasDespesa}
        <div class="dre-linha dre-total-despesas">
          <span>Total de Despesas</span>
          <span>(R$&nbsp;${format(totalDespesas)})</span>
        </div>
        ${dreResultado}
      </div>

      <h3>📊 Balancete de Verificação</h3>
      <div class="balancete-wrap">
        <table class="balancete">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Total Débito</th>
              <th>Total Crédito</th>
              <th>Saldo Final</th>
            </tr>
          </thead>
          <tbody>${balanceteRows}</tbody>
        </table>
      </div>

      <div class="actions" style="margin-top:24px;">
        <button onclick="resetGame()">↺ Jogar Novamente</button>
      </div>
    </div>
  `;

  enviarParaSheet();
}

// =============================================
//  GOOGLE SHEETS
// =============================================
function enviarParaSheet() {
  const maxScore = lancamentos.length * 2 * 10;
  const payload  = {
    nome:   alunoNome,
    email:  alunoEmail,
    modulo: "Módulo 4",
    pontos: score + " / " + maxScore,
    data:   new Date().toLocaleString("pt-BR")
  };
  fetch(GOOGLE_SHEET_URL, {
    method: "POST", mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// =============================================
//  UTILITÁRIOS
// =============================================
function format(v) { return v.toLocaleString("pt-BR"); }

function showPontos(pontos) {
  const el = document.createElement("div");
  el.className = "pontos-ganhos";
  el.innerText = "+" + pontos + " pts";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function updateScoreDisplay() {
  const el = document.getElementById("scoreDisplay");
  if (el) el.innerText = score;
}

function moveTouchClone(touch) {
  if (!touchClone) return;
  touchClone.style.left = (touch.clientX - touchClone.offsetWidth  / 2) + "px";
  touchClone.style.top  = (touch.clientY - touchClone.offsetHeight / 2 - 10) + "px";
}

function autoScroll(touchY) {
  const zona = 90;
  const vel  = 10;
  if (touchY > window.innerHeight - zona) window.scrollBy(0,  vel);
  else if (touchY < zona)                 window.scrollBy(0, -vel);
}
