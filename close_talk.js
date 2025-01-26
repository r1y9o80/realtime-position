console.log("OK");
const WebSocket = require('ws');
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ

let Name_Posi = {};
let socketId_Name = {}; // WebSocket接続とプレイヤー名を紐づける

// Expressサーバー作成
const express = require("express");
const app = express();
const http = require("http");
const sv = http.createServer(app);
const path = require("path");

// 静的ファイルの提供(読み込めるファイル指定)
app.use(express.static(path.join(__dirname, 'public')));

// HTTPルーティング設定(初めに表示するファイル指定)
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/posi_con/index.html");
});

// WebSocketサーバーをhttpサーバーに統合
const WebSocketServer = new WebSocket.Server({ server: sv }); // WebSocketサーバーをhttpサーバーに統合

// 接続処理
WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");

    // プレイヤー移動イベントを購読
    const subscribeMessage_travel = {
        header: {
            version: 1,
            requestId: uuidv4(),
            messageType: "commandRequest",
            messagePurpose: "subscribe",
        },
        body: {
            eventName: "PlayerTravelled"
        },
    };
    socket.send(JSON.stringify(subscribeMessage_travel));

    socket.on("message", (rawData) => {
        try {
            const return_data = JSON.parse(rawData);
            // プレイヤー移動イベントの処理
            if (return_data.header.eventName === 'PlayerTravelled') {
                Name_Posi[return_data.body.player.name] = return_data.body.player.position;
                // WebSocket接続とプレイヤー名を紐づける
                socketId_Name[socket] = return_data.body.player.name;
                console.log(socketId_Name)
                console.log("プレイヤー位置:", Name_Posi);
            }
        } catch (error) {
            console.error("メッセージ処理エラー:", error);
        }
    });

    // 一定期間、ポジションを集計し送信する
    setInterval(() => {
        const Node_data = JSON.stringify(Name_Posi);
        socket.send(Node_data);
        Name_Posi = {};
    }, 3000); // 3秒ごとに送信

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        // 接続が切断されたときの処理
        const playerName = socketId_Name[socket]; // 切断された接続に対応するプレイヤー名を取得
        if (playerName) {
            console.log(`${playerName}さんが切断されました`);
            // 必要ならここでデータからそのプレイヤーの情報を削除するなど
            delete socketId_Name[socket]; // WebSocketとプレイヤー名の紐づけを削除
        }
    });
});

// サーバーを指定ポートで起動
const port = process.env.PORT || 19131;
sv.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました`);
});
