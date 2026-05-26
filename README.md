# Playlist

Site de acompanhamento de playlists Spotify.

## Como usar

1. Abra o arquivo `index.html` no navegador ou use um servidor local (recomendado: Live Server no VS Code).
2. Abra `config.js` e preencha o valor de `CLIENT_ID` com o ID do seu app Spotify.
3. Crie um app no Spotify Developer Dashboard e adicione o redirect URI em `Redirect URIs`:
   - `http://localhost:5500/` (ou a URL onde sua página será hospedada)
4. Clique em `Conectar Spotify` para autorizar a conta.
5. Use o seletor para ordenar por `Ordem Alfabética`, `Recentes` ou `Personalizado`.

## O que está disponível

- Conexão com conta Spotify para carregar playlists reais.
- Duração total em minutos das faixas carregadas.
- Top 5 artistas, músicas e álbuns com base nos dados do Spotify.
- Modo `Personalizado` que permite reorganizar playlists manualmente com botões e drag-and-drop.

## Arquivos

- `index.html` — interface do site.
- `styles.css` — estilos visuais.
- `script.js` — autenticação Spotify, leitura de dados e lógica de ordenação.

## Login inteligente

O site agora oferece uma página de login dedicada (`login.html`) com opções de:

- email
- número de celular
- QR Code

O fluxo de autenticação usa `response_type=code` e PKCE, o que torna a conexão com o Spotify compatível com a forma correta de login.


Site de acompanhamento de playlists Spotify.

## Como usar

1. Abra o arquivo `index.html` no navegador.
2. Use o seletor para ordenar as playlists por `Ordem Alfabética`, `Recentes` ou `Personalizado`.
3. Veja a duração total das músicas e os top 5 de artistas, músicas e álbuns.

## Arquivos

- `index.html` — interface principal do site.
- `styles.css` — estilos visuais.
- `script.js` — lógica de classificação e estatísticas.

## Observações

Este é um exemplo estático com dados de amostra. Para conectar ao Spotify e exibir suas playlists reais, é necessário usar a API do Spotify com autenticação OAuth.
