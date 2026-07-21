NEXUS CORE
==========

Sistema Node.js de inteligência musical com busca multifonte,
reprodução Web, memória persistente e interação conversacional.

O NEXUS CORE combina biblioteca local, fontes online, memória
de preferências e interpretação inteligente para oferecer uma
experiência personalizada.


RECURSOS
========

- Biblioteca local de músicas.
- Player Web integrado.
- Busca automática em múltiplas fontes.
- Memória persistente de músicas reproduzidas.
- Recuperação inteligente da biblioteca.
- Sistema de preferências musicais.
- Modo conversa com respostas inteligentes.
- Integração Gemini para interpretação de comandos.
- Integração com Internet Archive.
- Suporte a podcasts.
- Playlist sincronizada com Firebase.
- Login Google.
- API REST.
- Deploy compatível com Render.


FLUXO DO NEXUS
==============

O usuário envia um comando:

Exemplo:

"Nexus, toca Evidências"

O sistema interpreta a intenção:

- conversa
- música
- sugestão
- vídeo


Para músicas, a busca segue a ordem:

1. Memória persistente.
2. Biblioteca local.
3. Provedores externos.
4. Internet Archive.
5. Podcasts.


Quando uma música local é encontrada,
ela pode ser registrada na memória para
recuperação futura.


ESTRUTURA DO PROJETO
====================

providers/

- archive.js
- local.js
- podcast.js


routes/

- chat.js


services/

- firebase_admin.js
- music.js
- music_memory.js
- nexus_context.js
- nexus_preferencias.js
- gemini.js


public/

- index.html
- music_memory.json
- nexus_brain.log


FUNCIONAMENTO
=============

O NEXUS mantém histórico das interações e utiliza
essas informações para melhorar respostas futuras.

Exemplos:

Usuário:
"Toca Roberto Carlos Detalhes"

Resposta:
Música encontrada e salva na memória.


Usuário:
"Nexus, sugira uma música"

Resposta baseada no contexto e preferências.


TECNOLOGIAS
============

- Node.js 20+
- Express
- Axios
- Firebase Authentication
- Firebase Realtime Database
- Firebase Admin SDK
- Google APIs
- Gemini API
- yt-search
- Fluent FFmpeg


CONFIGURAÇÃO
============

Variáveis necessárias:

FIREBASE_ADMIN_KEY

Chave JSON da conta de serviço Firebase.


Execução local:

npm install

npm start


DEPLOY
======

Ambiente utilizado:

Render Web Service

Comando de inicialização:

npm start


STATUS
======

NEXUS MULTIFONTE ONLINE

Sistema operacional com:

- Biblioteca musical
- Memória
- Preferências
- Conversação
- Busca inteligente


PROJETO
=======

NEXUS CORE

Desenvolvido por Olnair.
