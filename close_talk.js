
// Expressサーバーの設定const express = require("express");
const express = require("express")
const app = express();
const http = require("http");
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

server.listen(PORT, () => {
    console.log(`HTTPサーバーがポート ${Port} で起動しました`);
});

// HTTPサーバーエラーハンドリング
server.on('error', (error) => {
    console.error('HTTPサーバーエラー:', error);
});
