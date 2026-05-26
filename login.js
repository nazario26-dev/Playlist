// Quando o login usar Authorization Code, o retorno deve ir para o app principal.
const REDIRECT_URI = `${window.location.origin}${window.location.pathname.replace("login.html", "index.html")}`;

// Permissões que o app solicita ao Spotify.
const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
  "user-read-private",
].join(" ");

// Endereço para iniciar o login no Spotify.
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";

// Chave local para armazenar o PKCE code verifier temporariamente.
const CODE_VERIFIER_KEY = "spotify_code_verifier";

// Serviço externo para gerar o QR Code de forma simples.
const QR_API = "https://api.qrserver.com/v1/create-qr-code?size=260x260&data=";

const loginEmailButton = document.getElementById("loginEmailButton");
const loginPhoneButton = document.getElementById("loginPhoneButton");
const loginQrButton = document.getElementById("loginQrButton");
const qrPanel = document.getElementById("qrPanel");
const loginQrImage = document.getElementById("loginQrImage");
const loginActionInfo = document.getElementById("loginActionInfo");
const loginDirectLink = document.getElementById("loginDirectLink");
const statusMessage = document.getElementById("statusMessage");

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.type = type;
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let string = "";
  bytes.forEach((byte) => {
    string += String.fromCharCode(byte);
  });
  return btoa(string).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateCodeVerifier() {
  const array = new Uint8Array(64);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

function buildAuthUrl(codeChallenge) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

function showDirectLoginLink(authUrl) {
  loginDirectLink.href = authUrl;
  loginActionInfo.classList.remove("hidden");
}

function showQrLogin(authUrl) {
  const qrUrl = `${QR_API}${encodeURIComponent(authUrl)}`;
  loginQrImage.src = qrUrl;
  qrPanel.classList.remove("hidden");
  showDirectLoginLink(authUrl);
  setStatus("Escaneie o QR Code ou use o link direto para entrar com sua conta Spotify.", "info");
}

// Inicia o fluxo de autenticação do Spotify com PKCE.
// O método QR apenas exibe o código de login, enquanto email/celular redireciona diretamente.
async function startSpotifyAuth(method) {
  if (!CLIENT_ID) {
    setStatus("Defina seu Client ID em login.js antes de tentar conectar.", "error");
    return;
  }

  // Cria o verifier e challenge PKCE para tornar a troca de código segura.
  const verifier = generateCodeVerifier();
  localStorage.setItem(CODE_VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);
  const authUrl = buildAuthUrl(challenge);

  qrPanel.classList.add("hidden");
  loginActionInfo.classList.add("hidden");
  loginQrImage.src = "";

  if (method === "qr") {
    showQrLogin(authUrl);
    return;
  }

  setStatus("Redirecionando para Spotify...", "info");
  window.location.href = authUrl;
}

loginEmailButton.addEventListener("click", () => startSpotifyAuth("email"));
loginPhoneButton.addEventListener("click", () => startSpotifyAuth("phone"));
loginQrButton.addEventListener("click", () => startSpotifyAuth("qr"));

setStatus("Escolha um método de login para conectar sua conta Spotify.", "info");
