console.log("OK");
const WebSocket = require('ws');
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ

let socket_id = {}
let user_data = {};

// WebSocketサーバーのポート設定
const port = process.env.PORT || 19131;
console.log("process.env.PORT:", __dirname + ":" + port);
console.log(`WebSocketデータ: ${port}`);

// Expressサーバー作成
const express = require("express");
const app = express();
const http = require("http");
const sv = http.createServer(app);

const path = require("path");

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// HTTPルーティング設定
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/posi_con/index.html");
});

// WebSocketサーバーをhttpサーバーに統合
const WebSocketServer = new WebSocket.Server({ server: sv }); // WebSocketサーバーをhttpサーバーに統合

// 接続処理
WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");

    socket_id[socket] = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

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

    // チャットメッセージイベントを購読
    const subscribeMessage_message = {
        header: {
            version: 1,
            requestId: uuidv4(),
            messageType: "commandRequest",
            messagePurpose: "subscribe",
        },
        body: {
            eventName: "PlayerMessage"
        },
    };
    socket.send(JSON.stringify(subscribeMessage_message));
    console.log("チャットメッセージ購読開始");

    // メッセージ受信処理
    socket.on("message", (rawData) => {
        try {
            const return_data = JSON.parse(rawData);
            // プレイヤー移動イベントの処理
            if (return_data.header.eventName === 'PlayerTravelled') {
                user_data[socket_id[socket]] = {exist:true, data: [return_data.body.player.name, return_data.body.player.position]}
                console.log("プレイヤー位置:", user_data);
            }
            // チャットメッセージの処理
            if (return_data.header.eventName === 'PlayerMessage') {
                if (return_data.body.message === 'require id') {
                    const Id_Send_Cmd = {
                        header: {
                            version: 1,
                            requestId: uuidv4(),
                            messageType: "commandRequest",
                            messagePurpose: "commandRequest",
                        },
                        body: {
                            commandLine: `say あなたのIDは、 §c${socket_id[socket]}`,
                            version: 1,
                            origin: {
                                type: "player"
                            }
                        }
                    };
                    socket.send(JSON.stringify(Id_Send_Cmd)); // Minecraftへ送信
                }
            }
        } catch (error) {
            console.error("メッセージ処理エラー:", error);
        }
    });

    // 一定期間、ポジションを集計し送信する
    setInterval(() => {
        const Node_data = JSON.stringify(user_data);
        socket.send(Node_data);
        user_data = {};
    }, 3000); // 3秒ごとに送信

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        user_data[socket_id[socket]][exist] = false
        console.log('接続が切断されました');
    });
});

// サーバーを指定ポートで起動
sv.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました`);
});
