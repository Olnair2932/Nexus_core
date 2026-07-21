const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    uploadVideo
} = require("../services/cloudinary");


const router = express.Router();


const upload = multer({
    dest: "tmp_uploads/"
});



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
