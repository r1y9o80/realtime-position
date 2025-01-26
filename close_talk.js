const express = require("express");
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ
const path = require("path");
const http = require("http");

const app = express();
const sv = http.createServer(app);

let user_data = {};

// WebSocketサーバーのポート設定
const port = process.env.PORT || 19131;
console.log("process.env.PORT:", __dirname + ":" + port);
console.log(`HTTPサーバーデータ: ${port}`);

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// HTTPルーティング設定
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/posi_con/index.html");
});

// プレイヤーデータを定期的にHTTPレスポンスで返すエンドポイント
app.get("/player-data", (req, res) => {
    const data = JSON.stringify(user_data);
    res.json(data);  // クライアントにデータを送信
    user_data = {};  // 送信後にデータをリセット
});

// プレイヤー移動イベントの模倣
app.post("/player-move", (req, res) => {
    const playerId = uuidv4();  // プレイヤーのIDを生成
    const playerName = "Player" + playerId.slice(0, 5);  // 仮の名前
    const playerPos = { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 };  // 仮の位置

    // プレイヤーデータを更新
    user_data[playerId] = { exist: true, Name: playerName, Posi: playerPos };
    console.log("プレイヤー移動データ:", user_data);

    res.status(200).send("プレイヤー移動データ更新完了");
});

// サーバーを指定ポートで起動
sv.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました`);
});
