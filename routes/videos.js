const express = require("express");
const multer = require("multer");

const {
    uploadVideo
} = require("../services/cloudinary");

const database = require("../services/firebase_admin");

const router = express.Router();
console.log("VIDEOS ROUTE CARREGADA");


const upload = multer({
    dest: "tmp_uploads/"
});


// LISTAR VIDEOS
router.get(
    "/videos",
    async (req, res) => {

        try {

            const snapshot =
                await database
                .ref("videos")
                .once("value");


            const videos =
                snapshot.val() || {};


            res.json(
                Object.values(videos)
            );


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

            if (!req.file) {

                return res.status(400).json({
                    erro: "Nenhum vídeo enviado"
                });

            }


            const resultado =
                await uploadVideo(
                    req.file.path
                );


            const id =
                Date.now().toString();


            await database
            .ref(`videos/${id}`)
            .set({

                titulo:
                    req.file.originalname,

                url:
                    resultado.secure_url,

                public_id:
                    resultado.public_id,

                data:
                    Date.now()

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


module.exports = router;
