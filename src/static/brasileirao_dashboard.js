const boardContainer = document.getElementById("brasileirao-board");
const statusPill = document.getElementById("br-status-pill");
const lastSync = document.getElementById("br-last-sync");
const liveCount = document.getElementById("live-count");
const upcomingCount = document.getElementById("upcoming-count");
const endedCount = document.getElementById("ended-count");
const refreshButton = document.getElementById("refresh-board");

function safeText(value, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function statusLabel(status) {
  if (status === "live") return "Ao vivo";
  if (status === "upcoming") return "Joga hoje";
  if (status === "ended") return "Ultimo jogo";
  return "Sem dados";
}

function statusTone(status) {
  if (status === "live") return "tone-safe";
  if (status === "upcoming") return "tone-warn";
  if (status === "ended") return "tone-warn";
  return "tone-danger";
}

function setMeta(data) {
  const teams = data?.teams || [];
  liveCount.textContent = String(teams.filter((team) => team.status === "live").length);
  upcomingCount.textContent = String(teams.filter((team) => team.status === "upcoming").length);
  endedCount.textContent = String(teams.filter((team) => team.status === "ended").length);
  statusPill.textContent = `API ${safeText(data?.api_status, "indisponivel")}`;
  lastSync.textContent = `Atualizado em ${new Date().toLocaleString("pt-BR")}`;
}

function buildActionUrl(team) {
  const prompt = encodeURIComponent(`quero analise do jogo do ${team.team_name}`);
  const eventParam = team.event_id ? `&event_id=${encodeURIComponent(team.event_id)}` : "";
  return `/dashboard?message=${prompt}${eventParam}`;
}

function renderBoard(data) {
  const teams = data?.teams || [];
  if (!teams.length) {
    boardContainer.innerHTML = '<p class="empty-state">Nenhum time encontrado no painel.</p>';
    return;
  }

  boardContainer.innerHTML = teams.map((team) => `
    <article class="board-tile ${statusTone(team.status)}">
      <h3>${safeText(team.team_name)}</h3>
      <div class="board-row"><span>Status</span><strong>${statusLabel(team.status)}</strong></div>
      <div class="board-row"><span>Posicao</span><strong>${safeText(team.position)}</strong></div>
      <div class="board-row"><span>Pontos</span><strong>${safeText(team.points)}</strong></div>
      <div class="board-row"><span>Jogo</span><strong>${safeText(team.match_label)}</strong></div>
      <div class="board-row"><span>Proximo</span><strong>${safeText(team.next_match_label)}</strong></div>
      <div class="board-row"><span>Placar</span><strong>${safeText(team.score)}</strong></div>
      <div class="board-row"><span>Minuto</span><strong>${safeText(team.minute)}</strong></div>
      <div class="tile-meta">Event ID ${safeText(team.event_id)} | Fonte ${safeText(team.provider, "local")}</div>
      <div class="quick-prompts" style="margin-top: 12px;">
        <a class="ghost-button" href="${buildActionUrl(team)}">Abrir analise</a>
        <button class="ghost-button js-team-chat" data-team="${safeText(team.team_name, "")}" data-event-id="${safeText(team.event_id, "")}" type="button">Copiar prompt</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".js-team-chat").forEach((button) => {
    button.addEventListener("click", async () => {
      const teamName = button.dataset.team;
      const eventId = button.dataset.eventId;
      const message = eventId
        ? `quero analise do jogo do ${teamName} no event_id ${eventId}`
        : `quero analise do jogo do ${teamName}`;
      try {
        await navigator.clipboard.writeText(message);
        button.textContent = "Prompt copiado";
        window.setTimeout(() => {
          button.textContent = "Copiar prompt";
        }, 1500);
      } catch (error) {
        button.textContent = "Nao copiou";
      }
    });
  });
}

async function loadBoard() {
  refreshButton.disabled = true;
  statusPill.textContent = "Carregando...";
  try {
    const response = await fetch("/brasileirao/teams");
    if (!response.ok) {
      throw new Error(`Falha ${response.status}`);
    }
    const data = await response.json();
    setMeta(data);
    renderBoard(data);
  } catch (error) {
    statusPill.textContent = "Erro";
    lastSync.textContent = "Nao foi possivel carregar o painel";
    boardContainer.innerHTML = `<p class="empty-state">Falha ao carregar os times: ${error.message}</p>`;
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadBoard);

document.querySelectorAll(".team-shortcut").forEach((button) => {
  button.addEventListener("click", () => {
    const teamName = button.dataset.team;
    window.location.href = `/dashboard?message=${encodeURIComponent(`quero analise do jogo do ${teamName}`)}`;
  });
});

loadBoard();
