const express = require("express");
const multer = require("multer");
const {
    uploadVideo,
    deleteVideo
} = require("../services/cloudinary");
const { database, auth } = require("../services/firebase_admin");

const router = express.Router();

console.log("VIDEOS ROUTE CARREGADA");

async function obterUsuario(req) {
    const cabecalho = req.headers.authorization || "";

    if (!cabecalho.startsWith("Bearer ")) {
        return null;
    }

    const token = cabecalho.substring(7);

    try {
        return await auth.verifyIdToken(token);
    } catch (erro) {
        return null;
    }
}

const upload = multer({
    dest: "tmp_uploads/"
});


// LISTAR VIDEOS
router.get(
    "/videos",
    async (req, res) => {
        try {
            const usuario = await obterUsuario(req);

            const snapshot = await database
                .ref("videos")
                .once("value");

            const videos = snapshot.val() || {};

            const resultado = Object.entries(videos)
                .filter(([id, video]) => {
                    const visibilidade = video.visibilidade || "publico";

                    if (visibilidade === "publico") {
                        return true;
                    }

                    return usuario && video.uid === usuario.uid;
                })
                .map(
                    ([id, video]) => ({
                        id,
                        ...video,
                        curtidas: video.curtidas || 0,
                        comentarios_count: video.comentarios
                            ? Object.keys(video.comentarios).length
                            : 0
                    })
                );

            res.json(resultado);

        } catch (erro) {
            res.status(500).json({
                erro: erro.message
            });
        }
    }
);


// UPLOAD VIDEO

router.post(
    "/videos/upload",
    upload.single("video"),
    async (req, res) => {
        try {
            const usuario = await obterUsuario(req);

            if (!usuario) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    erro: "Nenhum vídeo enviado"
                });
            }

            const visibilidade = req.body?.visibilidade === "privado"
                ? "privado"
                : "publico";

            const listaVideos = await database
                .ref("videos")
                .once("value");

            const videosExistentes = listaVideos.val() || {};

            const duplicado = Object.values(videosExistentes)
                .some(
                    video =>
                        video.titulo === req.file.originalname
                );

            if (duplicado) {
                return res.status(409).json({
                    erro: "Vídeo já existe"
                });
            }

            const resultado = await uploadVideo(
                req.file.path
            );

            const id = Date.now().toString();

            await database
                .ref(`videos/${id}`)
                .set({
                    titulo: req.file.originalname,
                    url: resultado.url,
                    public_id: resultado.public_id,
                    data: Date.now(),
                    curtidas: 0,
                    uid: usuario.uid,
                    visibilidade
                });

            res.json({
                sucesso: true,
                video: resultado
            });

        } catch (erro) {
            console.error(
                "Erro upload vídeo:",
                erro
            );

            res.status(500).json({
                erro: "Falha no upload"
            });
        }
    }
);


// CURTIR / DESCURTIR VIDEO
router.post(
    "/videos/:id/curtir",
    async (req, res) => {
        try {
            const id = req.params.id;
            const acao = req.body?.acao;

            if (
                acao !== "curtir" &&
                acao !== "descurtir"
            ) {
                return res.status(400).json({
                    erro: "Ação inválida"
                });
            }

            const referencia = database.ref(
                `videos/${id}/curtidas`
            );

            const snapshot = await database
                .ref(`videos/${id}`)
                .once("value");

            if (!snapshot.exists()) {
                return res.status(404).json({
                    erro: "Vídeo não encontrado"
                });
            }

            const resultado = await referencia.transaction(
                atual => {
                    const valor = Number(atual) || 0;

                    if (acao === "curtir") {
                        return valor + 1;
                    }

                    return Math.max(0, valor - 1);
                }
            );

            res.json({
                sucesso: true,
                curtidas: resultado.snapshot.val() || 0
            });

        } catch (erro) {
            console.error(
                "Erro ao alterar curtida:",
                erro
            );

            res.status(500).json({
                erro: "Falha ao alterar curtida"
            });
        }
    }
);


// LISTAR COMENTÁRIOS
router.get(
    "/videos/:id/comentarios",
    async (req, res) => {
        try {
            const snapshot = await database
                .ref(`videos/${req.params.id}/comentarios`)
                .once("value");

            const comentarios = snapshot.val() || {};

            res.json(
                Object.entries(comentarios).map(
                    ([id, comentario]) => ({
                        id,
                        ...comentario
                    })
                )
            );

        } catch (erro) {
            res.status(500).json({
                erro: erro.message
            });
        }
    }
);


// ADICIONAR COMENTÁRIO
router.post(
    "/videos/:id/comentarios",
    async (req, res) => {
        try {
            const id = req.params.id;
            const texto = String(
                req.body?.texto || ""
            ).trim();

            if (!texto) {
                return res.status(400).json({
                    erro: "Digite um comentário"
                });
            }

            if (texto.length > 1000) {
                return res.status(400).json({
                    erro: "Comentário muito longo"
                });
            }

            const videoSnapshot = await database
                .ref(`videos/${id}`)
                .once("value");

            if (!videoSnapshot.exists()) {
                return res.status(404).json({
                    erro: "Vídeo não encontrado"
                });
            }

            const referencia = database
                .ref(`videos/${id}/comentarios`)
                .push();

            const comentario = {
                texto,
                data: Date.now()
            };

            await referencia.set(comentario);

            res.json({
                sucesso: true,
                id: referencia.key,
                comentario
            });

        } catch (erro) {
            console.error(
                "Erro ao adicionar comentário:",
                erro
            );

            res.status(500).json({
                erro: "Falha ao adicionar comentário"
            });
        }
    }
);


// ALTERAR VISIBILIDADE DO VIDEO
router.patch(
    "/videos/:id/visibilidade",
    async (req, res) => {
        try {
            const usuario = await obterUsuario(req);

            if (!usuario) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                });
            }

            const visibilidade = req.body?.visibilidade;

            if (
                visibilidade !== "publico" &&
                visibilidade !== "privado"
            ) {
                return res.status(400).json({
                    erro: "Visibilidade inválida"
                });
            }

            const referencia = database.ref(
                `videos/${req.params.id}`
            );

            const snapshot = await referencia.once("value");

            if (!snapshot.exists()) {
                return res.status(404).json({
                    erro: "Vídeo não encontrado"
                });
            }

            const video = snapshot.val();

            if (video.uid !== usuario.uid) {
                return res.status(403).json({
                    erro: "Você não é o proprietário deste vídeo"
                });
            }

            await referencia.update({
                visibilidade
            });

            res.json({
                sucesso: true,
                visibilidade
            });

        } catch (erro) {
            console.error(
                "Erro ao alterar visibilidade:",
                erro
            );

            res.status(500).json({
                erro: "Falha ao alterar visibilidade"
            });
        }
    }
);


// DELETE VIDEO CLOUDINARY + FIREBASE
router.delete(
    "/videos/:id",
    async (req, res) => {
        try {
            const usuario = await obterUsuario(req);

            if (!usuario) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                });
            }

            const id = req.params.id;

            const snap = await database
                .ref(`videos/${id}`)
                .once("value");

            const video = snap.val();

            if (!video) {
                return res.status(404).json({
                    erro: "Vídeo não encontrado"
                });
            }

            if (video.uid !== usuario.uid) {
                return res.status(403).json({
                    erro: "Você não é o proprietário deste vídeo"
                });
            }

            if (video.public_id) {
                await deleteVideo(video.public_id);
            }

            await database
                .ref(`videos/${id}`)
                .remove();

            res.json({
                sucesso: true
            });

        } catch (erro) {
            console.error(erro);

            res.status(500).json({
                erro: erro.message
            });
        }
    }
);

module.exports = router;
