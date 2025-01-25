const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const uuid = require('uuid'); // 一意のIDを作成するためのライブラリ
const path = require('path');

const app = express();
const server = http.createServer(app); // Expressとhttpサーバーを統合

// WebSocketサーバーを作成
const wss = new WebSocket.Server({ server });

// 静的ファイルを提供するための設定
app.use(express.static(path.join(__dirname, 'public'))); // 'public'ディレクトリに静的ファイルを格納

// ログ表示用
let IdData_FromName = {};
let PosiData_FromId = {};

// WebSocketサーバー接続時の処理
wss.on('connection', (socket) => {
    console.log("接続されました");

    // プレイヤー移動イベントの購読
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

    // チャットメッセージの購読
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

    // メッセージ受信処理
    socket.on("message", async (rawData) => {
        const return_data = JSON.parse(rawData);

        if (return_data.header.eventName == 'PlayerTravelled') {
            IdData_FromName[return_data.body.name] = return_data.body.player.id;
            PosiData_FromId[return_data.body.player.id] = return_data.body.player.position;
            console.log("プレイヤー位置:", PosiData_FromId[return_data.body.player.id]);
        }

        if (return_data.header.eventName == 'PlayerMessage') {
            if(return_data.body.message == 'require id'){
                const Id_Send_Cmd = {
                    header: {
                        version: 1,
                        requestId: uuid.v4(),
                        messageType: "commandRequest",
                        messagePurpose: "commandRequest",
                    },
                    body: {
                        commandLine: `say あなたのIDは、 §c${IdData_FromName[return_data.body.sender.name]}`,
                        version: 1,
                        origin: {
                            type: "player"
                        }
                    }
                };
                socket.send(JSON.stringify(Id_Send_Cmd));
            }
        }
    });
});

// Heroku用のポート設定
const port = process.env.PORT || 19131;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
