const messageInput = document.getElementById("message-input");
const eventIdInput = document.getElementById("event-id-input");
const profileSelect = document.getElementById("profile-select");
const analyzeButton = document.getElementById("analyze-button");
const loadBoardButton = document.getElementById("load-board-button");
const compareProfilesButton = document.getElementById("compare-profiles-button");
const autoRefreshToggle = document.getElementById("auto-refresh-toggle");
const refreshIntervalInput = document.getElementById("refresh-interval-input");
const autoRefreshStatus = document.getElementById("auto-refresh-status");
const replyOutput = document.getElementById("reply-output");
const apiStatusPill = document.getElementById("api-status-pill");
const lastSyncLabel = document.getElementById("last-sync-label");
const quickActionsContainer = document.getElementById("quick-actions");
const summaryHeadline = document.getElementById("summary-headline");
const summaryDetail = document.getElementById("summary-detail");
const summaryRisk = document.getElementById("summary-risk");
const summaryRiskDetail = document.getElementById("summary-risk-detail");
const summaryEdge = document.getElementById("summary-edge");
const summaryEdgeDetail = document.getElementById("summary-edge-detail");
const summaryRefresh = document.getElementById("summary-refresh");
const summaryRefreshDetail = document.getElementById("summary-refresh-detail");

const marketProbability = document.getElementById("market-probability");
const marketLabel = document.getElementById("market-label");
const marketDecision = document.getElementById("market-decision");
const scoreBadge = document.getElementById("score-badge");
const gameTitle = document.getElementById("game-title");
const gameContext = document.getElementById("game-context");
const zenStatus = document.getElementById("zen-status");
const zenAction = document.getElementById("zen-action");
const zenReason = document.getElementById("zen-reason");
const tiltLevel = document.getElementById("tilt-level");
const crowdMood = document.getElementById("crowd-mood");
const tiltText = document.getElementById("tilt-text");
const xaiList = document.getElementById("xai-list");
const narrativeText = document.getElementById("narrative-text");
const marketsGrid = document.getElementById("markets-grid");
const opportunityBoard = document.getElementById("opportunity-board");
const boardSummary = document.getElementById("board-summary");
const profileComparison = document.getElementById("profile-comparison");
const analysisHistory = document.getElementById("analysis-history");
const structuredReport = document.getElementById("structured-report");
const reportHideUnavailable = document.getElementById("report-hide-unavailable");

const promptButtons = document.querySelectorAll(".prompt-chip");
let autoRefreshTimer = null;
let autoRefreshBusy = false;
let lastAnalyzePayload = null;
let shouldRefreshComparison = false;
let activeBoardEventId = null;
let analysisHistoryItems = [];
let lastRenderedSnapshot = null;

function safeText(value, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function formatPercent(value) {
  if (typeof value !== "number") return "-";
  return `${Math.round(value * 100)}%`;
}

function formatEdge(value) {
  if (typeof value !== "number") return "-";
  return value.toFixed(3);
}

function formatClock(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return safeText(value);
  return date.toLocaleString("pt-BR");
}

function edgeTone(value) {
  if (typeof value !== "number") return "tone-warn";
  if (value > 0.05) return "tone-safe";
  if (value >= 0) return "tone-warn";
  return "tone-danger";
}

function confidenceBar(value, toneClass = "tone-warn") {
  const width = typeof value === "number" ? Math.max(4, Math.min(100, Math.round(value * 100))) : 8;
  return `
    <div class="confidence-track">
      <div class="confidence-fill ${toneClass}" style="width:${width}%"></div>
    </div>
  `;
}

function setStatusPill(text) {
  apiStatusPill.textContent = text;
}

function setLastSyncLabel(text) {
  if (!lastSyncLabel) return;
  lastSyncLabel.textContent = text;
}

function setAutoRefreshStatus(text, isLive = false) {
  if (!autoRefreshStatus) return;
  autoRefreshStatus.textContent = text;
  autoRefreshStatus.classList.toggle("is-live", isLive);
  if (summaryRefresh) {
    summaryRefresh.textContent = isLive ? "Ligado" : "Desligado";
  }
  if (summaryRefreshDetail) {
    summaryRefreshDetail.textContent = text;
  }
}

function getRefreshIntervalMs() {
  const rawValue = Number.parseInt(refreshIntervalInput?.value || "20", 10);
  const seconds = Number.isFinite(rawValue) ? Math.min(Math.max(rawValue, 5), 300) : 20;
  if (refreshIntervalInput) {
    refreshIntervalInput.value = String(seconds);
  }
  return seconds * 1000;
}

function renderQuickActions(actions = []) {
  quickActionsContainer.innerHTML = "";
  if (!actions.length) return;

  actions.slice(0, 4).forEach((action) => {
    const button = document.createElement("button");
    button.className = "ghost-button";
    button.textContent = action;
    button.addEventListener("click", () => {
      messageInput.value = action;
      handleAnalyze();
    });
    quickActionsContainer.appendChild(button);
  });
}

function escapeHtml(value) {
  return safeText(value, "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function parseStructuredReport(reportText) {
  if (!reportText) return [];

  const sections = [];
  let current = null;

  reportText.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { title: headingMatch[2], items: [] };
      return;
    }

    if (current) {
      current.items.push(trimmed.replace(/^- /, ""));
    }
  });

  if (current) sections.push(current);
  return sections;
}

function isUnavailableLine(item) {
  const normalized = safeText(item, "").toLowerCase();
  return normalized.includes("nao disponivel");
}

function reportSectionPriority(title) {
  const normalized = safeText(title, "").toLowerCase();
  if (
    normalized.includes("analise de odds") ||
    normalized.includes("score inteligente") ||
    normalized.includes("previsao final") ||
    normalized.includes("sugestoes de aposta") ||
    normalized.includes("gestao de banca")
  ) {
    return "is-priority";
  }
  if (
    normalized.includes("fatores sociais") ||
    normalized.includes("fatores externos") ||
    normalized.includes("condicao do elenco")
  ) {
    return "is-muted";
  }
  return "";
}

function renderStructuredReport(snapshot) {
  if (!structuredReport) return;
  lastRenderedSnapshot = snapshot || null;

  const reportText = snapshot?.analysis?.structured_report || "";
  const sections = parseStructuredReport(reportText);
  const hideUnavailable = Boolean(reportHideUnavailable?.checked);

  if (!sections.length) {
    structuredReport.innerHTML = `
      <article class="report-card">
        <h3>Aguardando analise</h3>
        <ul class="report-list">
          <li>Os 12 blocos da leitura profissional aparecem aqui depois da consulta.</li>
        </ul>
      </article>
    `;
    return;
  }

  structuredReport.innerHTML = sections.map((section) => {
    const visibleItems = hideUnavailable
      ? section.items.filter((item) => !isUnavailableLine(item))
      : section.items;
    const hiddenCount = section.items.length - visibleItems.length;
    const toneClass = reportSectionPriority(section.title);

    return `
    <article class="report-card ${toneClass}">
      <h3>${escapeHtml(section.title)}</h3>
      <ul class="report-list">
        ${visibleItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Sem itens visiveis com o filtro atual.</li>"}
      </ul>
      ${hiddenCount > 0 ? `<div class="report-meta">${hiddenCount} item(ns) ocultado(s) por indisponibilidade.</div>` : ""}
    </article>
  `;
  }).join("");
}

function renderSummaryFromResponse(response = {}) {
  const snapshot = response.snapshot || null;
  const analysis = snapshot?.analysis || {};
  const primaryMarket = analysis.primary_market || {};
  const guidance = analysis.betting_guidance || {};
  const mainOpportunity = analysis.market_value?.[primaryMarket.market] || analysis.opportunities?.[0] || {};
  const bestEdge = typeof mainOpportunity.edge === "number" ? mainOpportunity.edge : null;

  summaryHeadline.textContent = guidance.best_bet || safeText(primaryMarket.label, "Sem analise no momento");
  summaryDetail.textContent = guidance.headline || response.reply || "Use um prompt ou informe um confronto para iniciar.";
  summaryRisk.textContent = safeText(analysis.zen_guard?.status, "Aguardando");
  summaryRiskDetail.textContent = safeText(guidance.risk || analysis.zen_guard?.action, "Zen-Guard e contexto de cautela aparecem aqui.");
  summaryEdge.textContent = bestEdge === null ? "-" : formatEdge(bestEdge);
  summaryEdgeDetail.textContent = bestEdge === null
    ? "A maior vantagem identificada no snapshot ou na mesa."
    : `Mercado monitorado: ${safeText(primaryMarket.label)} com tom ${edgeTone(bestEdge).replace("tone-", "")}.`;
}

function renderMarkets(snapshot) {
  const markets = snapshot?.analysis?.markets || [];
  const marketOdds = snapshot?.analysis?.market_odds || {};
  const valueMap = snapshot?.analysis?.market_value || {};

  if (!markets.length) {
    marketsGrid.innerHTML = '<p class="empty-state">Nenhuma probabilidade calculada ainda.</p>';
    return;
  }

  marketsGrid.innerHTML = "";
  markets.forEach((market) => {
    const tile = document.createElement("article");
    const valueInfo = valueMap[market.market] || {};
    tile.className = `market-tile ${edgeTone(valueInfo.edge)}`;

    tile.innerHTML = `
      <h3>${safeText(market.label, market.market)}</h3>
      <div class="market-row"><span>Probabilidade</span><strong>${formatPercent(market.probability)}</strong></div>
      ${confidenceBar(market.probability, edgeTone(valueInfo.edge))}
      <div class="market-row"><span>Odd</span><strong>${safeText(marketOdds[market.market], "-")}</strong></div>
      <div class="market-row"><span>Edge</span><strong class="${edgeTone(valueInfo.edge)}">${formatEdge(valueInfo.edge)}</strong></div>
      <div class="market-row"><span>Valor</span><strong>${valueInfo.value ? "Sim" : "Nao"}</strong></div>
    `;
    marketsGrid.appendChild(tile);
  });
}

function renderBoard(board) {
  const rows = board?.top_opportunities || [];
  if (!rows.length) {
    opportunityBoard.innerHTML = '<p class="empty-state">Nenhuma oportunidade carregada.</p>';
    return;
  }

  opportunityBoard.innerHTML = "";
  rows.forEach((row) => {
    const tile = document.createElement("article");
    tile.className = `board-tile ${edgeTone(row.edge)}`;
    tile.dataset.eventId = safeText(row.event_id, "");
    if (activeBoardEventId && activeBoardEventId === row.event_id) {
      tile.classList.add("is-active");
    }
    tile.innerHTML = `
      <h3>${safeText(row.home_team)} x ${safeText(row.away_team)}</h3>
      <div class="board-row"><span>Mercado</span><strong>${safeText(row.market_label)}</strong></div>
      <div class="board-row"><span>Score</span><strong>${safeText(row.score)}</strong></div>
      <div class="board-row"><span>Minuto</span><strong>${safeText(row.minute)}</strong></div>
      <div class="board-row"><span>Odd</span><strong>${safeText(row.odd)}</strong></div>
      <div class="board-row"><span>Edge</span><strong class="${edgeTone(row.edge)}">${formatEdge(row.edge)}</strong></div>
      <div class="tile-meta">Event ID ${safeText(row.event_id)} | Zen-Guard ${safeText(row.zen_guard)}</div>
    `;
    tile.addEventListener("click", () => {
      activeBoardEventId = row.event_id;
      eventIdInput.value = safeText(row.event_id, "");
      messageInput.value = `analisar ${safeText(row.home_team)} x ${safeText(row.away_team)}`;
      renderBoard(board);
      handleAnalyze();
    });
    opportunityBoard.appendChild(tile);
  });
}

function renderBoardSummary(board) {
  if (!boardSummary) return;

  const rows = board?.top_opportunities || [];
  if (!rows.length) {
    boardSummary.innerHTML = `
      <article class="summary-inline-card"><span>Jogos monitorados</span><strong>-</strong></article>
      <article class="summary-inline-card"><span>Valor positivo</span><strong>-</strong></article>
      <article class="summary-inline-card"><span>Edge medio</span><strong>-</strong></article>
      <article class="summary-inline-card"><span>Zen-Guard dominante</span><strong>-</strong></article>
    `;
    return;
  }

  const positiveValue = rows.filter((row) => row.value).length;
  const averageEdge = rows.reduce((sum, row) => sum + (typeof row.edge === "number" ? row.edge : 0), 0) / rows.length;
  const zenCounts = rows.reduce((acc, row) => {
    const key = row.zen_guard || "sem leitura";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dominantZen = Object.entries(zenCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  boardSummary.innerHTML = `
    <article class="summary-inline-card"><span>Jogos monitorados</span><strong>${safeText(board.games_analyzed, rows.length)}</strong></article>
    <article class="summary-inline-card"><span>Valor positivo</span><strong>${positiveValue}/${rows.length}</strong></article>
    <article class="summary-inline-card"><span>Edge medio</span><strong>${formatEdge(averageEdge)}</strong></article>
    <article class="summary-inline-card"><span>Zen-Guard dominante</span><strong>${safeText(dominantZen)}</strong></article>
  `;
}

function pushHistoryEntry(response = {}, payload = {}) {
  const snapshot = response.snapshot || {};
  const analysis = snapshot.analysis || {};
  const game = snapshot.game || {};
  const primaryMarket = analysis.primary_market || {};
  const edge = analysis.market_value?.[primaryMarket.market]?.edge ?? analysis.opportunities?.[0]?.edge;

  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    matchup: game.home_team && game.away_team
      ? `${game.home_team} x ${game.away_team}`
      : payload.message || "Consulta sem jogo definido",
    market: primaryMarket.label || "Sem mercado principal",
    edge,
    risk: analysis.zen_guard?.status || "sem leitura",
    score: game.score || "-",
  };

  analysisHistoryItems = [item, ...analysisHistoryItems].slice(0, 5);
  renderAnalysisHistory();
}

function renderAnalysisHistory() {
  if (!analysisHistory) return;
  if (!analysisHistoryItems.length) {
    analysisHistory.innerHTML = '<p class="empty-state">As ultimas leituras ficam registradas aqui para comparacao rapida.</p>';
    return;
  }

  analysisHistory.innerHTML = analysisHistoryItems.map((item) => `
    <article class="history-item ${edgeTone(item.edge)}">
      <strong>${safeText(item.matchup)}</strong>
      <span>${safeText(item.market)} | score ${safeText(item.score)} | risco ${safeText(item.risk)}</span>
      <span>Edge ${formatEdge(item.edge)} | ${formatClock(item.timestamp)}</span>
    </article>
  `).join("");
}

function renderProfileComparison(results = []) {
  if (!profileComparison) return;
  if (!results.length) {
    profileComparison.innerHTML = '<article class="compare-tile"><h3>Comparador</h3><p class="empty-state">Nenhuma comparacao carregada.</p></article>';
    return;
  }

  profileComparison.innerHTML = "";
  results.forEach((result) => {
    const tile = document.createElement("article");
    tile.className = `compare-tile ${edgeTone(result.edge)}`;
    tile.innerHTML = `
      <h3>${safeText(result.profile_label)}</h3>
      <p class="metric-text"><strong>Aposta:</strong> ${safeText(result.best_bet)}</p>
      <p class="metric-text"><strong>Probabilidade:</strong> ${typeof result.probability === "number" ? formatPercent(result.probability) : "-"}</p>
      ${confidenceBar(result.probability, edgeTone(result.edge))}
      <p class="metric-text"><strong>Edge:</strong> <span class="${edgeTone(result.edge)}">${formatEdge(result.edge)}</span></p>
      <p class="metric-text"><strong>Leitura:</strong> ${safeText(result.headline)}</p>
      <p class="metric-text"><strong>Odd atual:</strong> ${safeText(result.decision)}</p>
      <p class="metric-text"><strong>Risco:</strong> ${safeText(result.risk)}</p>
      <p class="metric-text"><strong>Tom:</strong> ${safeText(result.conservative_option)}</p>
    `;
    profileComparison.appendChild(tile);
  });
}

function renderSnapshot(snapshot) {
  if (!snapshot) {
    marketProbability.textContent = "-";
    marketLabel.textContent = "Aguardando analise";
    marketDecision.textContent = "O mercado principal e a decisao aparecem aqui.";
    scoreBadge.textContent = "-";
    gameTitle.textContent = "Nenhum jogo carregado";
    gameContext.textContent = "Placar, minuto e status da API.";
    zenStatus.textContent = "-";
    zenAction.textContent = "Sem leitura de risco";
    zenReason.textContent = "A recomendacao de cautela aparece aqui.";
    tiltLevel.textContent = "-";
    crowdMood.textContent = "Sem sentimento calculado";
    tiltText.textContent = "Analise emocional do momento do jogo.";
    xaiList.innerHTML = "<li>Aguardando sinais do modelo.</li>";
    narrativeText.textContent = "A narrativa estilo comentarista aparece aqui.";
    renderStructuredReport(null);
    renderMarkets(null);
    return;
  }

  const game = snapshot.game || {};
  const analysis = snapshot.analysis || {};
  const primaryMarket = analysis.primary_market || {};
  const zenGuard = analysis.zen_guard || {};
  const tilt = analysis.tilt || {};
  const crowd = analysis.crowd_sentiment || {};
  const contextFactors = analysis.context_factors || [];
  const primaryMarketValue = analysis.market_value?.[primaryMarket.market] || analysis.opportunities?.[0] || {};
  const mainTone = edgeTone(primaryMarketValue.edge);

  marketProbability.textContent = formatPercent(primaryMarket.probability);
  marketLabel.textContent = safeText(primaryMarket.label, "Mercado sem destaque");
  marketDecision.textContent = safeText(analysis.bet, "Odd indisponivel para este evento.");
  const decisionBar = document.getElementById("market-confidence-bar");
  if (decisionBar) {
    decisionBar.innerHTML = confidenceBar(primaryMarket.probability, mainTone);
  }
  const spotlightCard = marketLabel.closest(".metric-card");
  if (spotlightCard) {
    spotlightCard.classList.remove("tone-safe", "tone-warn", "tone-danger");
    spotlightCard.classList.add(mainTone);
  }

  scoreBadge.textContent = safeText(game.score);
  gameTitle.textContent = `${safeText(game.home_team)} x ${safeText(game.away_team)}`;
  gameContext.textContent = `Minuto ${safeText(game.minute)} | API ${safeText(snapshot.api_status)} | Perfil ${safeText(snapshot.user_profile, "iniciante")}`;

  zenStatus.textContent = safeText(zenGuard.status);
  zenAction.textContent = safeText(zenGuard.action, "Sem acao sugerida");
  zenReason.textContent = safeText(zenGuard.reason, safeText(analysis.analysis));

  tiltLevel.textContent = safeText(tilt.level);
  crowdMood.textContent = safeText(crowd.mood, "Humor nao calculado");
  tiltText.textContent = safeText(analysis.analysis);

  const xai = analysis.xai_insights || [];
  const combinedInsights = [
    ...xai,
    ...contextFactors.map((item) => `Contexto: ${item}`),
  ];
  xaiList.innerHTML = combinedInsights.length
    ? combinedInsights.map((item) => `<li>${item}</li>`).join("")
    : "<li>Nenhum insight explicavel disponivel.</li>";

  narrativeText.textContent = safeText(analysis.narrative, "Narrativa indisponivel.");
  setLastSyncLabel(`Ultima analise em ${formatClock(snapshot.timestamp_utc || new Date().toISOString())}`);
  renderStructuredReport(snapshot);
  renderMarkets(snapshot);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Falha na requisicao: ${response.status}`);
  }
  return response.json();
}

async function handleAnalyze(options = {}) {
  const { silent = false, payloadOverride = null } = options;
  const message = payloadOverride?.message ?? messageInput.value.trim();
  const eventId = payloadOverride?.event_id ?? eventIdInput.value.trim();
  const selectedProfile = payloadOverride?.user_profile ?? profileSelect?.value;

  if (!message) {
    if (!silent) {
      replyOutput.textContent = "Digite uma pergunta ou escolha um prompt rapido.";
    }
    return;
  }

  if (!silent) {
    analyzeButton.disabled = true;
    setStatusPill("Consultando modelo...");
    setLastSyncLabel("Consultando dados...");
  }

  try {
    const payload = { message };
    if (eventId) payload.event_id = eventId;
    if (selectedProfile) payload.user_profile = selectedProfile;
    lastAnalyzePayload = { ...payload };

    const response = await fetchJson("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    replyOutput.textContent = safeText(response.reply);
    renderQuickActions(response.quick_actions || response.suggested_actions || []);
    renderSummaryFromResponse(response);
    renderSnapshot(response.snapshot || null);
    pushHistoryEntry(response, payload);
    setStatusPill(`Intent: ${safeText(response.intent, "general")} | Perfil: ${safeText(response.user_profile || response.snapshot?.user_profile, "iniciante")}`);
  } catch (error) {
    if (!silent) {
      replyOutput.textContent = `Falha ao consultar a API: ${error.message}`;
      setStatusPill("Erro na consulta");
      setLastSyncLabel("Falha na ultima consulta");
    } else {
      setStatusPill("Erro no auto refresh");
    }
  } finally {
    if (!silent) {
      analyzeButton.disabled = false;
    }
  }
}

async function handleCompareProfiles() {
  const message = messageInput.value.trim();
  const eventId = eventIdInput.value.trim();

  if (!message) {
    replyOutput.textContent = "Digite uma pergunta antes de comparar os perfis.";
    return;
  }

  compareProfilesButton.disabled = true;
  setStatusPill("Comparando perfis...");
  shouldRefreshComparison = true;

  try {
    const profiles = [
      { value: "iniciante", label: "Iniciante" },
      { value: "conservador", label: "Conservador" },
      { value: "agressivo", label: "Agressivo" },
    ];

    const results = await Promise.all(
      profiles.map(async (profile) => {
        const payload = { message, user_profile: profile.value };
        if (eventId) payload.event_id = eventId;
        const response = await fetchJson("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const guidance = response.snapshot?.analysis?.betting_guidance || {};
        const primaryMarket = response.snapshot?.analysis?.primary_market || {};
        const marketKey = primaryMarket.market;
        const marketValue = response.snapshot?.analysis?.market_value?.[marketKey] || {};
        const bestOpportunity = response.snapshot?.analysis?.opportunities?.[0] || {};
        const effectiveEdge =
          typeof marketValue.edge === "number" ? marketValue.edge : bestOpportunity.edge;
        const effectiveDecision =
          response.snapshot?.analysis?.bet ||
          (bestOpportunity.label
            ? `Sem odd no mercado principal. Melhor oportunidade disponivel: ${bestOpportunity.label}.`
            : "Odd indisponivel para este evento.");
        return {
          profile_label: profile.label,
          best_bet: guidance.best_bet || response.snapshot?.analysis?.primary_market?.label,
          probability: primaryMarket.probability,
          edge: effectiveEdge,
          headline: guidance.headline || response.reply,
          decision: effectiveDecision,
          risk: guidance.risk || "-",
          conservative_option: guidance.conservative_option || "-",
        };
      })
    );

    renderProfileComparison(results);
    setStatusPill("Perfis comparados");
  } catch (error) {
    profileComparison.innerHTML = `<article class="compare-tile"><h3>Erro</h3><p class="empty-state">${error.message}</p></article>`;
    setStatusPill("Erro na comparacao");
  } finally {
    compareProfilesButton.disabled = false;
  }
}

async function loadOpportunityBoard(options = {}) {
  const { silent = false } = options;
  if (!silent) {
    loadBoardButton.disabled = true;
  }
  try {
    const board = await fetchJson("/opportunities?max_games=6");
    setLastSyncLabel(`Mesa atualizada em ${formatClock(board.timestamp_utc || new Date().toISOString())}`);
    const topEdge = board.top_opportunities?.[0]?.edge;
    if (typeof topEdge === "number") {
      summaryEdge.textContent = formatEdge(topEdge);
      summaryEdgeDetail.textContent = `Melhor oportunidade da mesa: ${safeText(board.top_opportunities?.[0]?.market_label)} em ${safeText(board.top_opportunities?.[0]?.home_team)} x ${safeText(board.top_opportunities?.[0]?.away_team)}.`;
    }
    renderBoardSummary(board);
    renderBoard(board);
    if (!silent) {
      setStatusPill("Mesa atualizada");
    }
  } catch (error) {
    opportunityBoard.innerHTML = `<p class="empty-state">Falha ao carregar oportunidades: ${error.message}</p>`;
    renderBoardSummary(null);
    if (!silent) {
      setStatusPill("Erro na mesa");
    }
  } finally {
    if (!silent) {
      loadBoardButton.disabled = false;
    }
  }
}

async function runAutoRefreshCycle() {
  if (autoRefreshBusy || !autoRefreshToggle?.checked) return;
  if (!lastAnalyzePayload && !messageInput.value.trim()) return;

  autoRefreshBusy = true;
  setAutoRefreshStatus(`Atualizando a cada ${Math.round(getRefreshIntervalMs() / 1000)}s`, true);

  try {
    if (lastAnalyzePayload || messageInput.value.trim()) {
      await handleAnalyze({ silent: true, payloadOverride: lastAnalyzePayload });
    }
    await loadOpportunityBoard({ silent: true });
    if (shouldRefreshComparison && messageInput.value.trim()) {
      await handleCompareProfiles();
    }
  } finally {
    autoRefreshBusy = false;
  }
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  setAutoRefreshStatus("Auto refresh desligado", false);
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (!autoRefreshToggle?.checked) return;
  const intervalMs = getRefreshIntervalMs();
  setAutoRefreshStatus(`Atualizando a cada ${Math.round(intervalMs / 1000)}s`, true);
  autoRefreshTimer = window.setInterval(runAutoRefreshCycle, intervalMs);
}

function handleAutoRefreshToggle() {
  if (autoRefreshToggle?.checked) {
    startAutoRefresh();
    runAutoRefreshCycle();
    return;
  }
  stopAutoRefresh();
}

async function bootstrapDashboard() {
  try {
    const health = await fetchJson("/health");
    setStatusPill(`API ${safeText(health.status)}`);
  } catch (error) {
    setStatusPill("API indisponivel");
    setLastSyncLabel("Nao foi possivel validar /health");
  }
}

analyzeButton.addEventListener("click", handleAnalyze);
loadBoardButton.addEventListener("click", loadOpportunityBoard);
compareProfilesButton?.addEventListener("click", handleCompareProfiles);
autoRefreshToggle?.addEventListener("change", handleAutoRefreshToggle);
refreshIntervalInput?.addEventListener("change", () => {
  if (autoRefreshToggle?.checked) {
    startAutoRefresh();
  } else {
    setAutoRefreshStatus(`Pronto para atualizar a cada ${Math.round(getRefreshIntervalMs() / 1000)}s`, false);
  }
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.prompt || "";
    handleAnalyze();
  });
});

messageInput?.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    handleAnalyze();
  }
});

reportHideUnavailable?.addEventListener("change", () => {
  renderStructuredReport(lastRenderedSnapshot);
});

messageInput.value = "quais sao as melhores oportunidades ao vivo?";
const searchParams = new URLSearchParams(window.location.search);
const initialMessage = searchParams.get("message");
const initialEventId = searchParams.get("event_id");

if (initialMessage) {
  messageInput.value = initialMessage;
}

if (initialEventId) {
  eventIdInput.value = initialEventId;
}

setAutoRefreshStatus(`Pronto para atualizar a cada ${Math.round(getRefreshIntervalMs() / 1000)}s`, false);
bootstrapDashboard();
loadOpportunityBoard();

if (initialMessage) {
  handleAnalyze();
}
