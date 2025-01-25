console.log("OK")
const WebSocket = require('ws');
const uuid = require("uuid"); // 一意のIDを作成するためのライブラリ

let Id_Name = {};
let Posi_Id = {};

// WebSocketサーバーのポート設定
const port = process.env.port || 19131;
console.log(`WebSocketデータ: ${__dirname+port}`);

// WebSocketサーバーを起動
const WebSocketServer = new WebSocket.Server({ host:__dirname, port:port }); 

// 接続処理
WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");

    // プレイヤー移動イベントを購読
    const subscribeMessage_travel = {
        header: {
            version: 1,
            requestId: uuid.v4(),
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
            requestId: uuid.v4(),
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
    socket.on("message", async (rawData) => {
        try {
            const return_data = JSON.parse(rawData);
            // プレイヤー移動イベントの処理
            if (return_data.header.eventName === 'PlayerTravelled') {
                Id_Name[return_data.body.name] = return_data.body.player.id;
                Posi_Id[return_data.body.player.id] = return_data.body.player.position;
                console.log("プレイヤー位置:", Posi_Id[return_data.body.player.id]);
            }
            // チャットメッセージの処理
            if (return_data.header.eventName === 'PlayerMessage') {
                if (return_data.body.message === 'require id') {
                    const Id_Send_Cmd = {
                        header: {
                            version: 1,
                            requestId: uuid.v4(),
                            messageType: "commandRequest",
                            messagePurpose: "commandRequest",
                        },
                        body: {
                            commandLine: `say あなたのIDは、 §c${Id_Name[return_data.body.sender.name]}`,
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

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        console.log('接続が切断されました');
    });
});

// // Expressサーバーの設定const express = require("express");
// console.log("Hello")
// const express = require("express")
// const app = express();
// const http = require("http");
// const http_server = http.createServer(app);
// const http_PORT = process.env.PORT || 8000;

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
// });

// http_server.listen(http_PORT, () => {
//     console.log(`HTTPサーバーがポート ${http_PORT} で起動しました`);
// });

// // HTTPサーバーエラーハンドリング
// http_server.on('error', (error) => {
//     console.error('HTTPサーバーエラー:', error);
// });
