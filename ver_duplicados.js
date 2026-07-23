
const database = require("./services/firebase_admin");

async function main(){
    const snap = await database.ref("videos").once("value");
    const videos = snap.val() || {};

    const grupos = {};

    for (const [id, video] of Object.entries(videos)){
        const nome = video.titulo || "sem_titulo";

        if(!grupos[nome]){
            grupos[nome] = [];
        }

        grupos[nome].push({
            id,
            url: video.url
        });
    }

    for(const [nome, lista] of Object.entries(grupos)){
        if(lista.length > 1){
            console.log("\nDUPLICADO:", nome);
            console.log("Quantidade:", lista.length);
            console.log(lista);
        }
    }

    process.exit();
}

main();
