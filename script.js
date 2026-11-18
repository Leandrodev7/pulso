/**
 * ==========================================================================
 * PULSO — O Mercado em Movimento
 * Lógica Principal da Aplicação (100% Vanilla JS, Zero Dados Fictícios)
 * Integração com AwesomeAPI, Renderização SVG e Conversor Client-Side
 * ==========================================================================
 */

// ===== Configurações Globais =====
const API = "https://economia.awesomeapi.com.br/json";
const INTERVALO_ATUALIZACAO = 60 * 1000; // 60 segundos
const IDADE_MAXIMA_COTACAO = 60 * 60 * 1000; // 1 hora

const MOEDAS = {
  USD: {
    nome: "Dólar americano",
    par: "USD-BRL",
    chave: "USDBRL",
    apelido: "dólar",
    flag: "🇺🇸",
  },
  EUR: {
    nome: "Euro",
    par: "EUR-BRL",
    chave: "EURBRL",
    apelido: "euro",
    flag: "🇪🇺",
  },
  BTC: {
    nome: "Bitcoin",
    par: "BTC-BRL",
    chave: "BTCBRL",
    apelido: "bitcoin",
    flag: "🪙",
  },
};

// ===== Estado da Aplicação =====
const estado = {
  cotacoes: {},
  moedaGrafico: "USD",
  dias: 30,
  idCotacoes: 0,
  idHistorico: 0,
};

// ===== Elementos da Interface =====
const el = {
  cardsContainer: document.getElementById("cards-container"),
  statusSyncTime: document.getElementById("status-sync-time"),
  btnSync: document.getElementById("btn-sync"),
  iconSync: document.getElementById("icon-sync"),
  erroBanner: document.getElementById("erro-banner"),
  erroMsg: document.getElementById("erro-msg"),
  btnReintentar: document.getElementById("btn-reintentar"),
  liveClock: document.getElementById("live-clock"),
  chartTitle: document.getElementById("chart-title"),
  chartSubtitle: document.getElementById("chart-subtitle"),
  chartPctBadge: document.getElementById("chart-pct-badge"),
  metricMin: document.getElementById("metric-min"),
  metricMax: document.getElementById("metric-max"),
  metricAvg: document.getElementById("metric-avg"),
  metricPoints: document.getElementById("metric-points"),
  chartWrapper: document.getElementById("chart-wrapper"),
  chartSvg: document.getElementById("chart-svg"),
  chartLine: document.getElementById("chart-line"),
  chartArea: document.getElementById("chart-area"),
  chartGrid: document.getElementById("chart-grid"),
  chartCrosshair: document.getElementById("chart-crosshair"),
  crosshairX: document.getElementById("crosshair-x"),
  crosshairDot: document.getElementById("crosshair-dot"),
  chartTooltip: document.getElementById("chart-tooltip"),
  tooltipDate: document.getElementById("tooltip-date"),
  tooltipVal: document.getElementById("tooltip-val"),
  tooltipDiff: document.getElementById("tooltip-diff"),
  chartLoading: document.getElementById("chart-loading"),
  chartErrorState: document.getElementById("chart-error-state"),
  btnRetryChart: document.getElementById("btn-retry-chart"),
  chartResumoTexto: document.getElementById("chart-resumo-texto"),
  tableContainer: document.getElementById("table-container"),
  tableBody: document.getElementById("table-body"),
  toggleTableBtn: document.getElementById("toggle-table-btn"),
  tableArrow: document.getElementById("table-arrow"),
  form: document.getElementById("form-conversor"),
  convAmount: document.getElementById("conv-amount"),
  convFrom: document.getElementById("conv-from"),
  convTo: document.getElementById("conv-to"),
  convResultBox: document.getElementById("conv-result-box"),
  rateDirect: document.getElementById("rate-direct"),
  rateInverse: document.getElementById("rate-inverse"),
  btnSwap: document.getElementById("btn-swap"),
  iconSwapSvg: document.getElementById("icon-swap-svg"),
  statusCotacaoVelha: document.getElementById("status-cotacao-velha"),
  periodBtns: document.querySelectorAll(".btn-periodo"),
  quickResetUsd: document.getElementById("quick-reset-usd"),
};

// Prevenção de envio de formulário padrão sem depender de handlers inline (compatibilidade CSP)
if (el.form) {
  el.form.addEventListener("submit", (e) => e.preventDefault());
}

// ===== Formatadores Numéricos =====
const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const fmtBRLCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

function formatarMoeda(numero, moeda) {
  if (moeda === "BTC") {
    return (
      numero.toLocaleString("pt-BR", { maximumFractionDigits: 6 }) + " BTC"
    );
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(numero);
}

// ===== Relógio Oficial de Brasília (Sem especulação sobre feriados) =====
function atualizarRelogioBrasilia() {
  if (!el.liveClock) return;
  const agora = new Date();
  el.liveClock.textContent = agora.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}
setInterval(atualizarRelogioBrasilia, 1000);
atualizarRelogioBrasilia();

// ===== Validações e Tratamento de Resposta =====
function precoValido(n) {
  return Number.isFinite(n) && n > 0;
}

function lerCotacao(item) {
  if (!item || typeof item !== "object") return null;

  const valor = Number(item.bid);
  const variacao = Number(item.pctChange);
  const max = Number(item.high);
  const min = Number(item.low);

  if (!precoValido(valor) || !precoValido(max) || !precoValido(min)) return null;
  if (!Number.isFinite(variacao)) return null;

  const timestamp = Number(item.timestamp);
  const dataCotacao =
    Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp * 1000)
      : null;
  const idade = dataCotacao ? Date.now() - dataCotacao.getTime() : Infinity;

  return {
    valor,
    variacao,
    max,
    min,
    dataCotacao,
    desatualizada: idade < -5 * 60 * 1000 || idade > IDADE_MAXIMA_COTACAO,
  };
}

async function buscarJSON(url, tempoLimite = 10000) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), tempoLimite);
  try {
    const resposta = await fetch(url, { signal: controle.signal });
    if (!resposta.ok) {
      throw new Error(`A API respondeu com status ${resposta.status}`);
    }
    return await resposta.json();
  } finally {
    clearTimeout(timer);
  }
}

// ===== Skeletons de Inicialização =====
function renderizarSkeletons() {
  if (!el.cardsContainer) return;
  el.cardsContainer.innerHTML = Object.entries(MOEDAS)
    .map(
      ([code, moeda]) => `
      <li class="card-item">
        <div class="skeleton-card">
          <div class="card-cabecalho">
            <div class="card-identificacao">
              <span class="card-bandeira">${moeda.flag}</span>
              <div>
                <span class="card-sigla">${code} / BRL</span>
                <span class="card-nome">${moeda.nome}</span>
              </div>
            </div>
            <div class="skeleton-linha" style="width: 3.5rem; height: 1.25rem;"></div>
          </div>
          <div class="card-valor-bloco">
            <div class="skeleton-linha" style="width: 7.5rem; height: 1.75rem;"></div>
          </div>
          <div class="skeleton-linha" style="width: 100%; height: 0.375rem; margin-top: 0.5rem;"></div>
        </div>
      </li>
    `
    )
    .join("");
}

// ===== Consulta de Cotações em Tempo Real =====
async function carregarCotacoes() {
  const id = ++estado.idCotacoes;
  if (el.btnSync) el.btnSync.disabled = true;
  if (el.iconSync) el.iconSync.classList.add("girando");
  if (el.erroBanner) el.erroBanner.classList.add("escondido");

  try {
    const pares = Object.values(MOEDAS)
      .map((m) => m.par)
      .join(",");
    const dados = await buscarJSON(`${API}/last/${pares}`);

    if (id !== estado.idCotacoes) return;

    let sucessoCount = 0;
    for (const [sigla, moeda] of Object.entries(MOEDAS)) {
      const lida = lerCotacao(dados && dados[moeda.chave]);
      if (lida) {
        estado.cotacoes[sigla] = lida;
        sucessoCount++;
      } else if (estado.cotacoes[sigla]) {
        estado.cotacoes[sigla].desatualizada = true;
      }
    }

    if (sucessoCount === 0) {
      throw new Error("Nenhuma cotação válida retornada pela API");
    }

    renderizarCards();
    converter();
    const agora = new Date();
    if (el.statusSyncTime) {
      el.statusSyncTime.textContent = `Última consulta às ${agora.toLocaleTimeString("pt-BR")}`;
    }
  } catch (erro) {
    if (id !== estado.idCotacoes) return;
    console.error("Falha ao carregar cotações:", erro);
    if (el.erroBanner) el.erroBanner.classList.remove("escondido");
    if (el.erroMsg) {
      el.erroMsg.textContent =
        "Não foi possível sincronizar com a AwesomeAPI. Verifique sua conexão.";
    }
    if (el.statusSyncTime) {
      el.statusSyncTime.textContent = "Falha na sincronização recente";
    }
  } finally {
    if (id === estado.idCotacoes) {
      if (el.btnSync) el.btnSync.disabled = false;
      if (el.iconSync) el.iconSync.classList.remove("girando");
    }
  }
}

// ===== Renderização de Cards Acessíveis (<button>) =====
function renderizarCards() {
  if (!el.cardsContainer) return;
  el.cardsContainer.innerHTML = "";

  Object.entries(MOEDAS).forEach(([code, moeda]) => {
    const c = estado.cotacoes[code];
    if (!c) return;

    const isSelected = code === estado.moedaGrafico;
    const isUp = c.variacao >= 0;

    const span = c.max - c.min;
    const rangePercent =
      span > 0
        ? Math.min(Math.max(((c.valor - c.min) / span) * 100, 2), 98)
        : 50;

    const li = document.createElement("li");
    li.className = "card-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-btn";
    btn.setAttribute("aria-pressed", String(isSelected));
    btn.setAttribute(
      "aria-label",
      `${moeda.nome}: ${formatarMoeda(c.valor, "BRL")}, variação de ${isUp ? "+" : ""}${c.variacao.toFixed(2)}%. Toque para ver histórico.`
    );

    btn.innerHTML = `
      <div class="card-cabecalho">
        <div class="card-identificacao">
          <span class="card-bandeira">${moeda.flag}</span>
          <div>
            <span class="card-sigla">${code} / BRL</span>
            <span class="card-nome">${moeda.nome}</span>
          </div>
        </div>
        <span class="badge-variacao font-mono-num ${isUp ? "badge-alta" : "badge-baixa"}">
          ${isUp ? "▲ +" : "▼ "}${c.variacao.toFixed(2)}%
        </span>
      </div>

      <div class="card-valor-bloco">
        <div class="card-valor font-mono-num">
          ${code === "BTC" ? fmtBRLCompact.format(c.valor) : fmtBRL.format(c.valor)}
        </div>
      </div>

      <div>
        <div class="card-minmax font-mono-num">
          <span>Mín: ${code === "BTC" ? fmtBRLCompact.format(c.min) : c.min.toFixed(4)}</span>
          <span>Máx: ${code === "BTC" ? fmtBRLCompact.format(c.max) : c.max.toFixed(4)}</span>
        </div>
        <div class="barra-faixa-wrap">
          <div class="barra-faixa-progresso ${isUp ? "barra-alta" : "barra-baixa"}" style="width: ${rangePercent}%;"></div>
        </div>
      </div>
    `;

    btn.addEventListener("click", () => {
      estado.moedaGrafico = code;
      renderizarCards();
      carregarHistorico();
    });

    li.appendChild(btn);
    el.cardsContainer.appendChild(li);
  });
}

// ===== Limpeza de Estado do Gráfico (Prevenção de Dados Antigos em Falha) =====
function limparGraficoETabela() {
  if (el.chartLine) el.chartLine.setAttribute("d", "");
  if (el.chartArea) el.chartArea.setAttribute("d", "");
  if (el.chartGrid) el.chartGrid.innerHTML = "";
  if (el.tableBody) el.tableBody.innerHTML = "";
  if (el.metricMin) el.metricMin.textContent = "R$ --";
  if (el.metricMax) el.metricMax.textContent = "R$ --";
  if (el.metricAvg) el.metricAvg.textContent = "R$ --";
  if (el.metricPoints) el.metricPoints.textContent = "-- dias";
  if (el.chartPctBadge) {
    el.chartPctBadge.textContent = "Sem dados";
    el.chartPctBadge.className = "badge-periodo-pct font-mono-num";
  }
  if (el.chartResumoTexto) {
    el.chartResumoTexto.textContent =
      "Não foi possível carregar os dados deste histórico";
  }
}

// ===== Carregamento de Histórico Oficial =====
async function carregarHistorico() {
  const id = ++estado.idHistorico;
  const moeda = MOEDAS[estado.moedaGrafico];
  const dias = estado.dias;

  if (el.chartErrorState) el.chartErrorState.classList.add("escondido");
  if (el.chartLoading) el.chartLoading.classList.remove("escondido");
  if (el.chartTitle) {
    el.chartTitle.textContent = `${moeda.nome} (${estado.moedaGrafico} / BRL)`;
  }
  if (el.chartSubtitle) {
    el.chartSubtitle.textContent = `Histórico diário nos últimos ${dias} dias via AwesomeAPI`;
  }

  try {
    const dados = await buscarJSON(`${API}/daily/${moeda.par}/${dias}`);

    if (id !== estado.idHistorico) return;

    if (!Array.isArray(dados)) {
      throw new Error("Formato inválido retornado para o histórico");
    }

    const pontos = dados
      .map((d) => ({
        data: new Date(Number(d.timestamp) * 1000),
        valor: Number(d.bid),
      }))
      .filter((p) => Number.isFinite(p.data.getTime()) && precoValido(p.valor))
      .reverse();

    if (pontos.length < 2) {
      throw new Error("Poucos dados históricos disponíveis para exibição");
    }

    desenharGraficoSVG(pontos);
  } catch (erro) {
    if (id !== estado.idHistorico) return;
    console.error("Falha ao carregar histórico diário:", erro);
    limparGraficoETabela();
    if (el.chartErrorState) el.chartErrorState.classList.remove("escondido");
  } finally {
    if (id === estado.idHistorico && el.chartLoading) {
      el.chartLoading.classList.add("escondido");
    }
  }
}

// ===== Renderizador de Gráfico SVG Nativo e Interativo =====
function desenharGraficoSVG(pontos) {
  const svg = el.chartSvg;
  if (!svg) return;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const valores = pontos.map((p) => p.valor);
  const minVal = Math.min(...valores);
  const maxVal = Math.max(...valores);
  const valRange = maxVal - minVal || 1;

  const avgVal = valores.reduce((a, b) => a + b, 0) / valores.length;
  const primeiro = pontos[0].valor;
  const ultimo = pontos[pontos.length - 1].valor;
  const periodDiff = ((ultimo - primeiro) / primeiro) * 100;
  const isUp = periodDiff >= 0;

  // Atualização das Métricas
  const formatador =
    estado.moedaGrafico === "BTC" ? fmtBRLCompact : fmtBRL;
  if (el.metricMin) el.metricMin.textContent = formatador.format(minVal);
  if (el.metricMax) el.metricMax.textContent = formatador.format(maxVal);
  if (el.metricAvg) el.metricAvg.textContent = formatador.format(avgVal);
  if (el.metricPoints) el.metricPoints.textContent = `${pontos.length} dias`;

  if (el.chartPctBadge) {
    el.chartPctBadge.textContent = `${isUp ? "+" : ""}${periodDiff.toFixed(2)}% no período`;
    el.chartPctBadge.className = `badge-periodo-pct font-mono-num ${isUp ? "badge-alta" : "badge-baixa"}`;
  }

  if (el.chartResumoTexto) {
    el.chartResumoTexto.textContent = `Em ${estado.dias} dias: de ${formatador.format(primeiro)} para ${formatador.format(ultimo)}`;
  }

  const getX = (i) =>
    padding.left +
    (i / (pontos.length - 1)) * (width - padding.left - padding.right);
  const getY = (val) =>
    height -
    padding.bottom -
    ((val - minVal) / valRange) * (height - padding.top - padding.bottom);

  // Grade SVG
  let gridHtml = "";
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y =
      padding.top + (i / steps) * (height - padding.top - padding.bottom);
    const refVal = maxVal - (i / steps) * valRange;
    gridHtml += `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(51, 65, 85, 0.4)" stroke-dasharray="3 3" />
      <text x="${padding.left - 8}" y="${y + 4}" fill="#64748b" font-size="10" font-family="ui-monospace, monospace" text-anchor="end">${refVal.toFixed(estado.moedaGrafico === "BTC" ? 0 : 2)}</text>
    `;
  }
  if (el.chartGrid) el.chartGrid.innerHTML = gridHtml;

  // Curva Suave (Cubic Bezier)
  let pathD = `M ${getX(0)} ${getY(pontos[0].valor)}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const x0 = getX(i);
    const y0 = getY(pontos[i].valor);
    const x1 = getX(i + 1);
    const y1 = getY(pontos[i + 1].valor);
    const cpX = x0 + (x1 - x0) / 2;
    pathD += ` C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`;
  }

  if (el.chartLine) {
    el.chartLine.setAttribute("d", pathD);
    el.chartLine.setAttribute("stroke", isUp ? "#f28c28" : "#f87171");
  }

  const areaD = `${pathD} L ${getX(pontos.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`;
  if (el.chartArea) el.chartArea.setAttribute("d", areaD);

  // Tabela Acessível
  if (el.tableBody) {
    el.tableBody.innerHTML = pontos
      .slice()
      .reverse()
      .map((p, idx, arr) => {
        const prev = arr[idx + 1] ? arr[idx + 1].valor : p.valor;
        const dayPct = ((p.valor - prev) / prev) * 100;
        const dayUp = dayPct >= 0;
        return `
          <tr>
            <td>${p.data.toLocaleDateString("pt-BR")}</td>
            <td class="font-mono-num font-semibold">${formatador.format(p.valor)}</td>
            <td class="font-mono-num ${dayUp ? "badge-alta" : "badge-baixa"}" style="display: table-cell; border: none; padding: 0.5rem 0.75rem;">
              ${dayUp ? "+" : ""}${dayPct.toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Interatividade do Tooltip e Mira
  if (el.chartWrapper) {
    el.chartWrapper.onmousemove = (e) => {
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * width;

      if (mouseX < padding.left || mouseX > width - padding.right) {
        if (el.chartCrosshair) el.chartCrosshair.classList.add("escondido");
        if (el.chartTooltip) el.chartTooltip.style.opacity = "0";
        return;
      }

      const rawIndex =
        ((mouseX - padding.left) / (width - padding.left - padding.right)) *
        (pontos.length - 1);
      const index = Math.min(
        Math.max(Math.round(rawIndex), 0),
        pontos.length - 1
      );
      const p = pontos[index];

      const px = getX(index);
      const py = getY(p.valor);

      if (el.chartCrosshair) {
        el.chartCrosshair.classList.remove("escondido");
        if (el.crosshairX) {
          el.crosshairX.setAttribute("x1", px);
          el.crosshairX.setAttribute("x2", px);
          el.crosshairX.setAttribute("y1", padding.top);
          el.crosshairX.setAttribute("y2", height - padding.bottom);
        }
        if (el.crosshairDot) {
          el.crosshairDot.setAttribute("cx", px);
          el.crosshairDot.setAttribute("cy", py);
        }
      }

      if (el.chartTooltip) {
        el.chartTooltip.style.opacity = "1";
        el.chartTooltip.style.left = `${(px / width) * 100}%`;
        el.chartTooltip.style.top = `${(py / height) * 100}%`;

        if (el.tooltipDate) {
          el.tooltipDate.textContent = p.data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
        if (el.tooltipVal) {
          el.tooltipVal.textContent = formatador.format(p.valor);
        }
        if (el.tooltipDiff) {
          const diffFromStart = ((p.valor - primeiro) / primeiro) * 100;
          el.tooltipDiff.textContent = `${diffFromStart >= 0 ? "+" : ""}${diffFromStart.toFixed(2)}% no período`;
          el.tooltipDiff.className = `tooltip-variacao ${diffFromStart >= 0 ? "badge-alta" : "badge-baixa"}`;
        }
      }
    };

    el.chartWrapper.onmouseleave = () => {
      if (el.chartCrosshair) el.chartCrosshair.classList.add("escondido");
      if (el.chartTooltip) el.chartTooltip.style.opacity = "0";
    };
  }
}

// ===== Conversor de Moedas =====
function taxaEmReais(sigla) {
  if (sigla === "BRL") return 1;
  return estado.cotacoes[sigla]?.valor;
}

function converter() {
  if (!el.convAmount || !el.convFrom || !el.convTo || !el.convResultBox) return;

  const quantidade = parseFloat(el.convAmount.value);
  const de = el.convFrom.value;
  const para = el.convTo.value;

  if (!Number.isFinite(quantidade) || quantidade < 0) {
    el.convResultBox.textContent = "Digite um valor válido";
    return;
  }

  const taxaDe = taxaEmReais(de);
  const taxaPara = taxaEmReais(para);

  if (!taxaDe || !taxaPara) {
    el.convResultBox.textContent = "Aguardando cotações...";
    return;
  }

  const resultado = (quantidade * taxaDe) / taxaPara;
  el.convResultBox.textContent = formatarMoeda(resultado, para);

  const taxaDireta = taxaDe / taxaPara;
  const taxaInversa = 1 / taxaDireta;

  if (el.rateDirect) {
    el.rateDirect.textContent = `1 ${de} = ${taxaDireta < 0.01 ? taxaDireta.toFixed(6) : taxaDireta.toFixed(4)} ${para}`;
  }
  if (el.rateInverse) {
    el.rateInverse.textContent = `1 ${para} = ${taxaInversa < 0.01 ? taxaInversa.toFixed(6) : taxaInversa.toFixed(4)} ${de}`;
  }

  const velha = [de, para].some(
    (s) => s !== "BRL" && estado.cotacoes[s]?.desatualizada
  );
  if (el.statusCotacaoVelha) {
    if (velha) {
      el.statusCotacaoVelha.textContent = "Atenção: cotação desatualizada";
      el.statusCotacaoVelha.className = "status-cotacao-alerta";
    } else {
      el.statusCotacaoVelha.textContent = "Cotação ativa e verificada";
      el.statusCotacaoVelha.className = "status-cotacao-ativa";
    }
  }
}

// ===== Event Listeners =====
if (el.convAmount) el.convAmount.addEventListener("input", converter);
if (el.convFrom) el.convFrom.addEventListener("change", converter);
if (el.convTo) el.convTo.addEventListener("change", converter);

if (el.btnSwap) {
  el.btnSwap.addEventListener("click", () => {
    const temp = el.convFrom.value;
    el.convFrom.value = el.convTo.value;
    el.convTo.value = temp;

    if (el.iconSwapSvg) {
      el.iconSwapSvg.classList.add("girar-180");
      setTimeout(() => el.iconSwapSvg.classList.remove("girar-180"), 300);
    }
    converter();
  });
}

document.querySelectorAll(".btn-preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (el.convAmount) {
      el.convAmount.value = btn.dataset.val;
      converter();
    }
  });
});

if (el.periodBtns) {
  el.periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      el.periodBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      estado.dias = parseInt(btn.dataset.dias, 10);
      carregarHistorico();
    });
  });
}

if (el.toggleTableBtn && el.tableContainer) {
  el.toggleTableBtn.addEventListener("click", () => {
    const hidden = el.tableContainer.classList.toggle("escondido");
    el.toggleTableBtn.setAttribute("aria-expanded", String(!hidden));
    if (el.tableArrow) {
      el.tableArrow.classList.toggle("girar-180", !hidden);
    }
  });
}

if (el.quickResetUsd) {
  el.quickResetUsd.addEventListener("click", () => {
    estado.moedaGrafico = "USD";
    renderizarCards();
    carregarHistorico();
  });
}

if (el.btnSync) {
  el.btnSync.addEventListener("click", () => {
    carregarCotacoes();
    carregarHistorico();
  });
}

if (el.btnReintentar) {
  el.btnReintentar.addEventListener("click", () => {
    carregarCotacoes();
    carregarHistorico();
  });
}

if (el.btnRetryChart) {
  el.btnRetryChart.addEventListener("click", () => {
    carregarHistorico();
  });
}

// ===== Inicialização =====
renderizarSkeletons();
carregarCotacoes();
carregarHistorico();
setInterval(carregarCotacoes, INTERVALO_ATUALIZACAO);
