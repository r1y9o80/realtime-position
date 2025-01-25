
// Expressサーバーの設定const express = require("express");
const express = require("express")
const app = express();
const http = require("http");
const SV = http.createServer(app);

const Port = process.env.PORT || 8000;
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

SV.listen(Port, () => {
    console.log(`HTTPサーバーがポート ${httpPort} で起動しました`);
});

// HTTPサーバーエラーハンドリング
SV.on('error', (error) => {
    console.error('HTTPサーバーエラー:', error);
});
