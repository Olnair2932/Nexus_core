NEXUS CORE

Sistema Node.js para busca, reprodução e organização de músicas usando múltiplas fontes.

RECURSOS

- Biblioteca local de músicas.
- Busca automática em múltiplos provedores.
- Integração com Internet Archive.
- Suporte a podcasts.
- Memória persistente.
- Playlist sincronizada com Firebase.
- Login Google.
- Player Web integrado.
- API REST.


ESTRUTURA

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

public/
- index.html
- music_memory.json


FUNCIONAMENTO

O NEXUS procura músicas na seguinte ordem:

1. Memória persistente.
2. Biblioteca local.
3. Internet Archive.
4. Podcasts.

Resultados encontrados são enviados ao player Web.

Músicas locais podem ser salvas na memória.
Streams e podcasts podem ser reproduzidos sem serem armazenados na memória local.


TECNOLOGIAS

- Node.js
- Express
- Axios
- Firebase Authentication
- Firebase Realtime Database
- Firebase Admin SDK


CONFIGURAÇÃO

Variável necessária:

FIREBASE_ADMIN_KEY

Contém o JSON da conta de serviço Firebase.


EXECUÇÃO

npm install

npm start


PROJETO

NEXUS CORE

Desenvolvido por Olnair.
