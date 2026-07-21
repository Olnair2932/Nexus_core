const fs = require("fs");
const path = require("path");

const LOG = path.join(
    __dirname,
    "../public/nexus_brain.log"
);

function lerPreferencias() {
    try {
        if (!fs.existsSync(LOG)) {
            return {};
        }

        const linhas = fs
            .readFileSync(LOG, "utf-8")
            .split("\n")
            .slice(-100);

        const musicas = [];

        for (const linha of linhas) {
            const match = linha.match(
                /USER:(.*?) RESULT/
            );

            if (match) {
                const pedido = match[1];

                if (
                    pedido.toLowerCase().includes("tocar") ||
                    pedido.toLowerCase().includes("toca")
                ) {
                    musicas.push(pedido);
                }
            }
        }

        return {
            musicas_recentes: musicas.slice(-10),
            total_analisadas: musicas.length
        };

    } catch (erro) {
        return {};
    }
}

module.exports = {
    lerPreferencias
};
