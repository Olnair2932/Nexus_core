
function ativarNexa(texto = "") {

    const comando = texto
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    return (
        comando === "nexus nexa" ||
        comando.startsWith("nexus nexa ")
    );

}

module.exports = {
    ativarNexa
};
