require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const chatRoute = require("./routes/chat");
const filesRoute = require("./routes/files");
const statusRoute = require("./routes/status");
const videosRoute = require("./routes/videos");

process.on("uncaughtException", (err) => {
    console.error("ERRO FATAL:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("PROMISE NÃO TRATADA:", err);
});

const app = express();

const PORT = process.env.PORT || 10000;
const BASE_DIR = path.join(__dirname, "public");

if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static(BASE_DIR));

// ROTAS API
app.use("/api", chatRoute);
app.use("/api", filesRoute);
app.use("/api", statusRoute);
app.use("/api", videosRoute);

// Rota inexistente
app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`
🚀 NEXUS CORE ONLINE
PORTA: ${PORT}
`);
});
