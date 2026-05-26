// URL para onde o Spotify redireciona após o login. Normalmente retorna para esta mesma página.
const REDIRECT_URI = `${window.location.origin}${window.location.pathname}`;

// Escopos necessários para acessar playlists privadas, top items e dados do usuário.
const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
  "user-read-private",
].join(" ");

// Endpoint de autorização do Spotify para iniciar o login.
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

// Chaves usadas para armazenar o token e a data de expiração no localStorage.
const TOKEN_KEY = "spotify_access_token";
const EXPIRES_AT_KEY = "spotify_token_expires_at";
const CUSTOM_ORDER_KEY = "spotify_playlist_custom_order";

const samplePlaylists = [
  {
    id: "1",
    name: "Paz e Estudo",
    owner: "Erick",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    duration_ms: 778,
    trackCount: 3,
    recentAt: new Date("2026-05-10").getTime(),
    tracks: [
      { title: "Lost in the Light", artist: "Allen Stone", album: "Radius", duration_ms: 233000, popularity: 45 },
      { title: "Porcelain", artist: "Moby", album: "Play", duration_ms: 275000, popularity: 50 },
      { title: "House of Cards", artist: "Radiohead", album: "In Rainbows", duration_ms: 270000, popularity: 60 },
    ],
  },
  {
    id: "2",
    name: "Beats para Academia",
    owner: "Erick",
    cover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    duration_ms: 920,
    trackCount: 4,
    recentAt: new Date("2026-05-24").getTime(),
    tracks: [
      { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration_ms: 200000, popularity: 95 },
      { title: "One More Time", artist: "Daft Punk", album: "Discovery", duration_ms: 320000, popularity: 90 },
      { title: "Physical", artist: "Dua Lipa", album: "Future Nostalgia", duration_ms: 183000, popularity: 92 },
      { title: "Higher Love", artist: "Kygo", album: "Stargazing", duration_ms: 217000, popularity: 80 },
    ],
  },
  {
    id: "3",
    name: "Viagem na Estrada",
    owner: "Erick",
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    duration_ms: 753,
    trackCount: 3,
    recentAt: new Date("2026-05-18").getTime(),
    tracks: [
      { title: "Adventure of a Lifetime", artist: "Coldplay", album: "A Head Full of Dreams", duration_ms: 258000, popularity: 85 },
      { title: "Dreams", artist: "Fleetwood Mac", album: "Rumours", duration_ms: 257000, popularity: 88 },
      { title: "Electric Feel", artist: "MGMT", album: "Oracular Spectacular", duration_ms: 238000, popularity: 86 },
    ],
  },
  {
    id: "4",
    name: "Clássicos do Rock",
    owner: "Erick",
    cover: "https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=800&q=80",
    duration_ms: 908,
    trackCount: 3,
    recentAt: new Date("2026-04-29").getTime(),
    tracks: [
      { title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", duration_ms: 354000, popularity: 97 },
      { title: "Paint It, Black", artist: "The Rolling Stones", album: "Aftermath", duration_ms: 198000, popularity: 90 },
      { title: "Sweet Child O' Mine", artist: "Guns N' Roses", album: "Appetite for Destruction", duration_ms: 356000, popularity: 95 },
    ],
  },
  {
    id: "5",
    name: "Chillout Noturno",
    owner: "Erick",
    cover: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=800&q=80",
    duration_ms: 751,
    trackCount: 3,
    recentAt: new Date("2026-05-21").getTime(),
    tracks: [
      { title: "Night Owl", artist: "Galimatias", album: "Renaissance", duration_ms: 244000, popularity: 82 },
      { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration_ms: 250000, popularity: 89 },
      { title: "Get You", artist: "Daniel Caesar", album: "Freudian", duration_ms: 257000, popularity: 84 },
    ],
  },
];

const connectButton = document.getElementById("connectButton");
const sortSelect = document.getElementById("sortSelect");
const playlistContainer = document.getElementById("playlistContainer");
const totalMinutesElement = document.getElementById("totalMinutes");
const topArtistsElement = document.getElementById("topArtists");
const topSongsElement = document.getElementById("topSongs");
const topAlbumsElement = document.getElementById("topAlbums");
const statusMessage = document.getElementById("statusMessage");
const statsSection = document.getElementById("statsSection");
const playlistSection = document.getElementById("playlistSection");
const customHint = document.getElementById("customHint");
const loginEmailButton = document.getElementById("loginEmailButton");
const loginPhoneButton = document.getElementById("loginPhoneButton");
const loginQrButton = document.getElementById("loginQrButton");
const loginPanel = document.getElementById("loginPanel");

const CODE_VERIFIER_KEY = "spotify_code_verifier";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";

let playlists = [...samplePlaylists];
let currentSortMode = "alphabetical";

function formatMinutes(milliseconds) {
  return Math.round(milliseconds / 60000);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.type = type;
}

function getHashParams() {
  return window.location.hash
    .substring(1)
    .split("&")
    .filter(Boolean)
    .reduce((acc, pair) => {
      const [key, value] = pair.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(value);
      return acc;
    }, {});
}

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

async function exchangeCodeForToken(code) {
  const verifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!verifier) throw new Error("O código de verificação do PKCE não foi encontrado.");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Falha na troca de código.");

  saveAccessToken(data.access_token, data.expires_in);
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }
  localStorage.removeItem(CODE_VERIFIER_KEY);
  return data;
}

// Processa o retorno do Spotify após o usuário autorizar o app.
// O Spotify retorna um código de autorização, que aqui é trocado por um token.
async function processAuthorizationCode() {
  const params = getQueryParams();
  const code = params.get("code");
  const error = params.get("error");
  if (error) {
    setStatus(`Falha no login Spotify: ${error}`, "error");
    window.history.replaceState({}, document.title, REDIRECT_URI);
    return;
  }
  if (!code) return;

  try {
    setStatus("Finalizando autenticação do Spotify...", "info");
    await exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, REDIRECT_URI);
    setStatus("Autenticação concluída. Carregando dados do Spotify...", "info");
  } catch (err) {
    console.error(err);
    setStatus("Erro na autenticação do Spotify. Tente novamente.", "error");
    window.history.replaceState({}, document.title, REDIRECT_URI);
  }
}

async function fetchCurrentUser(token) {
  const response = await spotifyFetch(token, "https://api.spotify.com/v1/me");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Não foi possível obter o perfil do usuário");
  return data;
}

function saveAccessToken(token, expiresIn) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresIn * 1000));
}

function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}

function getStoredAccessToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY));
  if (!token || !expiresAt || Date.now() > expiresAt) {
    clearAccessToken();
    return null;
  }
  return token;
}

async function spotifyFetch(token, url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

async function fetchAllPlaylists(token) {
  let items = [];
  let url = "https://api.spotify.com/v1/me/playlists?limit=50";
  while (url) {
    const response = await spotifyFetch(token, url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Falha ao carregar playlists");
    items.push(...data.items);
    url = data.next;
  }
  return items;
}

async function fetchPlaylistTracks(token, url) {
  let items = [];
  while (url) {
    const response = await spotifyFetch(token, url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Falha ao carregar faixas");
    items.push(...(data.items || []));
    url = data.next;
  }
  return items.filter(Boolean);
}

function applyCustomOrder(list) {
  const stored = JSON.parse(localStorage.getItem(CUSTOM_ORDER_KEY) || "[]");
  if (!stored.length) return [...list];
  const ordered = stored.map((id) => list.find((item) => item.id === id)).filter(Boolean);
  const remaining = list.filter((item) => !stored.includes(item.id));
  return [...ordered, ...remaining];
}

function saveCustomOrder(order) {
  localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(order));
}

function getPlaylistDuration(playlist) {
  return playlist.tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
}

function computeTopItems(items, limit = 5) {
  return Object.entries(items)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, limit);
}

function getCustomPlaylistOrder() {
  const stored = JSON.parse(localStorage.getItem(CUSTOM_ORDER_KEY) || "[]");
  if (stored.length) return stored;
  return playlists.map((playlist) => playlist.id);
}

function movePlaylist(playlistId, direction) {
  const order = getCustomPlaylistOrder();
  const index = order.indexOf(playlistId);
  if (index < 0) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= order.length) return;
  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  saveCustomOrder(order);
  renderPlaylists(sortPlaylists(currentSortMode));
}

function sortPlaylists(mode) {
  currentSortMode = mode;
  let sorted = [...playlists];
  if (mode === "alphabetical") {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  } else if (mode === "recent") {
    sorted.sort((a, b) => b.recentAt - a.recentAt);
  } else if (mode === "custom") {
    sorted = applyCustomOrder(sorted);
  }
  return sorted;
}

function renderPlaylists(sortedPlaylists) {
  playlistContainer.innerHTML = "";
  const isCustom = currentSortMode === "custom";
  customHint.classList.toggle("hidden", !isCustom);

  sortedPlaylists.forEach((playlist, index) => {
    const totalMinutes = formatMinutes(getPlaylistDuration(playlist));
    const card = document.createElement("article");
    card.className = "playlist-card";
    card.draggable = isCustom;
    card.dataset.playlistId = playlist.id;

    card.innerHTML = `
      ${isCustom ? '<div class="card-drag-handle">⇅ Arraste</div>' : ""}
      <img class="card-cover" src="${playlist.cover || "https://via.placeholder.com/600x400?text=Playlist"}" alt="Capa da playlist ${playlist.name}" />
      <div class="card-content">
        <h3 class="card-title">${playlist.name}</h3>
        <p class="card-description">${playlist.owner} • ${playlist.trackCount || playlist.tracks.length} faixas • ${totalMinutes} min</p>
        <div class="card-badges">
          <span class="badge">${playlist.trackCount || playlist.tracks.length} faixas</span>
          <span class="badge">${playlist.tracks[0]?.artist || "Spotify"}</span>
        </div>
        ${isCustom ? `
          <div class="card-actions">
            <button class="small-button" data-action="up" data-id="${playlist.id}" ${index === 0 ? "disabled" : ""}>Mover cima</button>
            <button class="small-button" data-action="down" data-id="${playlist.id}" ${index === sortedPlaylists.length - 1 ? "disabled" : ""}>Mover baixo</button>
          </div>
        ` : ""}
      </div>
    `;

    playlistContainer.appendChild(card);
  });
}

function updateStatistics() {
  const allTracks = playlists.flatMap((playlist) => playlist.tracks || []);
  const durationSum = allTracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0);
  totalMinutesElement.textContent = `${formatMinutes(durationSum)} min`;

  const artistCounts = {};
  const songCounts = {};
  const albumCounts = {};

  allTracks.forEach((track) => {
    const artistName = track.artist || track.artists || "Desconhecido";
    const songName = track.title || track.name || "Desconhecido";
    const albumName = track.album || "Desconhecido";

    artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
    songCounts[songName] = (songCounts[songName] || 0) + 1;
    albumCounts[albumName] = (albumCounts[albumName] || 0) + 1;
  });

  topArtistsElement.innerHTML = computeTopItems(artistCounts)
    .map(([artist]) => `<li>${artist}</li>`)
    .join("");
  topSongsElement.innerHTML = computeTopItems(songCounts)
    .map(([song]) => `<li>${song}</li>`)
    .join("");
  topAlbumsElement.innerHTML = computeTopItems(albumCounts)
    .map(([album]) => `<li>${album}</li>`)
    .join("");
}

async function loadTopSpotifyItems(token) {
  const [artistsResp, tracksResp] = await Promise.all([
    spotifyFetch(token, "https://api.spotify.com/v1/me/top/artists?limit=5"),
    spotifyFetch(token, "https://api.spotify.com/v1/me/top/tracks?limit=10"),
  ]);

  const artistsData = await artistsResp.json();
  const tracksData = await tracksResp.json();

  if (!artistsResp.ok || !tracksResp.ok) {
    throw new Error("Falha ao carregar top artists/tracks");
  }

  topArtistsElement.innerHTML = artistsData.items
    .map((artist) => `<li>${artist.name}</li>`)
    .join("");
  topSongsElement.innerHTML = tracksData.items
    .slice(0, 5)
    .map((track) => `<li>${track.name} — ${track.artists.map((item) => item.name).join(", ")}</li>`)
    .join("");

  const albumCounts = tracksData.items.reduce((counts, track) => {
    const name = track.album.name;
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});

  topAlbumsElement.innerHTML = computeTopItems(albumCounts)
    .map(([album, count]) => `<li>${album}${count > 1 ? ` (${count}x)` : ""}</li>`)
    .join("");
}

async function loadSpotifyPlaylists(token) {
  const profile = await fetchCurrentUser(token);
  setStatus(`Conectado como ${profile.display_name || profile.id}. Carregando playlists do Spotify...`, "info");
  const spotifyPlaylists = await fetchAllPlaylists(token);
  const transformed = [];

  for (const playlist of spotifyPlaylists) {
    const tracks = await fetchPlaylistTracks(token, playlist.tracks.href);
    const validTracks = tracks
      .map((item) => item.track)
      .filter((track) => track && track.duration_ms);

    const durationMs = validTracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const recentAt = tracks.reduce((max, item) => {
      const addedAt = item.added_at ? new Date(item.added_at).getTime() : max;
      return Math.max(max, addedAt);
    }, 0);

    transformed.push({
      id: playlist.id,
      name: playlist.name,
      owner: playlist.owner.display_name || playlist.owner.id || "Spotify",
      cover: playlist.images[0]?.url || "https://via.placeholder.com/600x400?text=Playlist",
      duration_ms: durationMs,
      trackCount: playlist.tracks.total,
      recentAt: recentAt || Date.now(),
      tracks: validTracks.map((track) => ({
        title: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        duration_ms: track.duration_ms,
      })),
    });
  }

  playlists = transformed;
  renderPlaylists(sortPlaylists(currentSortMode));
  updateStatistics();
  await loadTopSpotifyItems(token);
  setStatus("Dados reais carregados. No modo Personalizado, reorganize playlists com drag-and-drop ou botões.", "success");
}

function updateUiState() {
  const token = getStoredAccessToken();
  const canUseSpotify = Boolean(CLIENT_ID);

  if (!canUseSpotify) {
    setStatus("Defina seu Client ID Spotify em script.js e abra o site via servidor local ou hospedagem.", "warning");
    connectButton.textContent = "Conectar Spotify";
    connectButton.disabled = true;
    sortSelect.disabled = true;
    loginPanel.classList.add("hidden");
    renderPlaylists(sortPlaylists(currentSortMode));
    updateStatistics();
    return;
  }

  loginPanel.classList.remove("hidden");

  if (!token) {
    setStatus("Conecte sua conta Spotify para carregar dados reais. Use email, celular ou QR Code.", "warning");
    connectButton.textContent = "Conectar Spotify";
    sortSelect.disabled = false;
    renderPlaylists(sortPlaylists(currentSortMode));
    updateStatistics();
    return;
  }

  connectButton.textContent = "Desconectar Spotify";
  sortSelect.disabled = false;
}

connectButton.addEventListener("click", () => {
  const token = getStoredAccessToken();
  if (token) {
    clearAccessToken();
    setStatus("Sessão desconectada. Clique em Conectar Spotify para carregar dados reais novamente.", "info");
    playlists = [...samplePlaylists];
    renderPlaylists(sortPlaylists(currentSortMode));
    updateStatistics();
    connectButton.textContent = "Conectar Spotify";
    return;
  }

  window.location.href = "login.html";
});

if (loginEmailButton) {
  loginEmailButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}
if (loginPhoneButton) {
  loginPhoneButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}
if (loginQrButton) {
  loginQrButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}

sortSelect.addEventListener("change", (event) => {
  currentSortMode = event.target.value;
  renderPlaylists(sortPlaylists(currentSortMode));
});

playlistContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const playlistId = button.dataset.id;
  const action = button.dataset.action;
  if (action === "up") movePlaylist(playlistId, -1);
  if (action === "down") movePlaylist(playlistId, 1);
});

playlistContainer.addEventListener("dragstart", (event) => {
  if (currentSortMode !== "custom") return;
  const card = event.target.closest(".playlist-card");
  if (!card) return;
  event.dataTransfer.setData("text/plain", card.dataset.playlistId);
  card.classList.add("dragging");
});

playlistContainer.addEventListener("dragend", () => {
  playlistContainer.querySelectorAll(".playlist-card").forEach((card) => card.classList.remove("dragging", "drag-over"));
});

playlistContainer.addEventListener("dragover", (event) => {
  if (currentSortMode !== "custom") return;
  event.preventDefault();
  const card = event.target.closest(".playlist-card");
  if (card) card.classList.add("drag-over");
});

playlistContainer.addEventListener("dragleave", (event) => {
  const card = event.target.closest(".playlist-card");
  if (card) card.classList.remove("drag-over");
});

playlistContainer.addEventListener("drop", (event) => {
  if (currentSortMode !== "custom") return;
  event.preventDefault();
  const targetCard = event.target.closest(".playlist-card");
  if (!targetCard) return;
  const sourceId = event.dataTransfer.getData("text/plain");
  const targetId = targetCard.dataset.playlistId;
  if (!sourceId || sourceId === targetId) return;

  const order = getCustomPlaylistOrder();
  const sourceIndex = order.indexOf(sourceId);
  const targetIndex = order.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;

  order.splice(sourceIndex, 1);
  order.splice(targetIndex, 0, sourceId);
  saveCustomOrder(order);
  renderPlaylists(sortPlaylists(currentSortMode));
});

async function initialize() {
  await processAuthorizationCode();

  updateUiState();
  const token = getStoredAccessToken();
  if (token) {
    try {
      await loadSpotifyPlaylists(token);
    } catch (error) {
      console.error(error);
      setStatus("Não foi possível carregar os dados do Spotify. Tente conectar novamente.", "error");
      clearAccessToken();
      updateUiState();
    }
  } else {
    renderPlaylists(sortPlaylists(currentSortMode));
    updateStatistics();
  }
}

initialize();
