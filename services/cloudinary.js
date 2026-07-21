const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


function uploadVideo(arquivo) {

    return new Promise((resolve, reject) => {

        cloudinary.uploader.upload(
            arquivo,
            {
                resource_type: "video",
                folder: "nexus/videos"
            },
            (erro, resultado) => {

                if (erro) {
                    reject(erro);
                    return;
                }

                resolve({
                    url: resultado.secure_url,
                    public_id: resultado.public_id
                });

            }
        );

    });

}


module.exports = {
    uploadVideo
};
