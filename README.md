# 🚀 Nexus Core

**Nexus Core** é a base do ecossistema Nexus, uma plataforma web que reúne música, vídeos, playlists, feed social e inteligência artificial.

## ✨ Recursos

### 🎵 Música

- Busca de músicas por linguagem natural.
- Integração com YouTube.
- Reprodução de conteúdos encontrados.
- Memória de pesquisas musicais.
- Histórico por usuário.
- Integração com biblioteca e playlists.

Exemplos:

toca Roberto Carlos Detalhes

tocar Marília Mendonça

Demétrius - Ritmo de Chuva

### ▶️ YouTube

- Busca através da YouTube Data API.
- Identificação automática de vídeos.
- Exibição de título e canal.
- Reprodução através de cartão integrado.
- Adição à playlist.
- Memória dos resultados.
- Consulta do título original dos vídeos.

### 📱 Nexus Feed

- 🎥 Upload de vídeos.
- ❤️ Curtidas.
- 💬 Comentários.
- 🔗 Compartilhamento.
- 👤 Identificação do proprietário.
- 🔒 Conteúdo público ou privado.
- 🗑️ Exclusão protegida pelo proprietário.
- Alteração da visibilidade dos vídeos.

### 🎬 Biblioteca

- Playlists individuais.
- Armazenamento no Firebase.
- Links do YouTube.
- Reprodução dos conteúdos.
- Cópia do nome das músicas.

### ☁️ Cloudinary

Utilizado para armazenamento e gerenciamento de mídia.

### 🤖 Inteligência Artificial

Integração com serviços de IA para interpretar solicitações do usuário e auxiliar na execução de comandos.

---

## 🛠️ Tecnologias

- Node.js
- Express
- JavaScript
- Firebase
- Firebase Realtime Database
- YouTube Data API
- Cloudinary
- Google Gemini / IA
- HTML5
- CSS3
- Git / GitHub
- Render

---

## 🏗️ Estrutura

Nexus_core/
├── public/
├── providers/
├── routes/
├── services/
├── storage/
├── server_tuti.js
├── package.json
├── package-lock.json
└── README.md

---

## 🔐 Configuração

O Nexus utiliza variáveis de ambiente para informações sensíveis.

Exemplos:

YOUTUBE_API_KEY
FIREBASE_ADMIN_KEY
CLOUDINARY_URL
GEMINI_API_KEY

⚠️ Nunca publique chaves de API, credenciais Firebase ou arquivos .env em um repositório público.

---

## ▶️ Executando localmente

Clone o projeto:

git clone https://github.com/Olnair2932/Nexus_core.git

Entre na pasta:

cd Nexus_core

Instale as dependências:

npm install

Configure as variáveis de ambiente necessárias.

Execute:

npm run start

---

## ☁️ Deploy

O projeto pode ser executado em serviços como Render.

Comando de inicialização:

npm run start

---

## 🧠 Arquitetura

O projeto possui uma arquitetura modular:

routes/
providers/
services/
public/

Essa organização facilita a evolução do Nexus e a integração de novos serviços.

---

## 🔒 Segurança

Nunca envie para o GitHub:

- senhas;
- chaves de API;
- credenciais Firebase;
- tokens;
- arquivos .env;
- informações privadas de usuários.

---

## 📌 Status

**Em desenvolvimento ativo.**

O Nexus Core continua evoluindo com novos recursos de:

🎵 Música  
🎬 Vídeos  
▶️ YouTube  
☁️ Cloudinary  
🔥 Firebase  
🤖 Inteligência Artificial  
👥 Nexus Feed

---

## 👨‍💻 Autor

**Olnair Gonzaga Pereira**

Projeto integrante do ecossistema **Nexus**.

---

## 🚀 Nexus

> Uma plataforma em evolução, conectando música, vídeo, inteligência artificial e interação social em um único ecossistema.
