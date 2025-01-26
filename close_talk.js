console.log("OK");
const WebSocket = require('ws');
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ

let Name_Id = {};
let Id_Posi = {};

// WebSocketサーバーのポート設定
const port = process.env.PORT || 19131;
console.log("process.env.PORT:", __dirname + ":" + port);
console.log(`WebSocketデータ: ${port}`);

// WebSocketサーバーを起動
const WebSocketServer = new WebSocket.Server({ port: port });

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
                Name_Id[return_data.body.name] = return_data.body.player.id;
                Id_Posi[return_data.body.player.id] = return_data.body.player.position;
                console.log("プレイヤー位置:", Id_Posi);
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
                            commandLine: `say あなたのIDは、 §c${Name_Id[return_data.body.sender.name]}`,
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

    // 定期的にクライアントに Id_Posi を送信
    setInterval(() => {
        const Node_data = JSON.stringify(Id_Posi)
        socket.send(Node_data);
        Id_Posi = {}
    }, 3000); // 3秒ごとに送信

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        console.log('接続が切断されました');
    });
});


const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})
