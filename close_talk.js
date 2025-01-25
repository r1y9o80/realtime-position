let logs = document.querySelector('.log')

const WebSocket = require('ws');
const uuid = require("uuid"); // 一意のIDを作成するためのライブラリ

let Id_Name= {};
let Posi_Id = {}

console.log(WebSocket);

// ローカルサーバーを立ち上げる
const WebSocketServer = new WebSocket.Server({ port: process.env.PORT || 19131 }); // WebSocketサーバーをポート19131で開始

console.log(`port: ${process.env.PORT || 19131}`)

logs.textContent = process.env.PORT || 19131

// マイクラとサーバーの接続を検知
WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");
    const subscribeMessage_travel = {
        header: {
            version: 1,
            requestId: uuid.v4(), // 一意のリクエストIDを生成
            messageType: "commandRequest", // 不動。決まり文句
            messagePurpose: "subscribe", // 購読する
        },
        body: {
            eventName: "PlayerTravelled" // 購読内容（プレイヤー移動のイベント）
        },
    };
    socket.send(JSON.stringify(subscribeMessage_travel)); // JSON形式に変換して送信

    // チャットメッセージを購読
    const subscribeMessage_message = {
        header: {
            version: 1,
            requestId: uuid.v4(), // 一意のリクエストIDを生成
            messageType: "commandRequest", // 不動。決まり文句
            messagePurpose: "subscribe", // 購読する
        },
        body: {
            eventName: "PlayerMessage" // 購読内容（チャットメッセージの受信）
        },
    };
    socket.send(JSON.stringify(subscribeMessage_message)); // JSON形式に変換して送信
    console.log("チャットメッセージ購読開始");

    // メッセージの受信処理をまとめる
    socket.on("message", async (rawData) => {
        const return_data = JSON.parse(rawData); // 購読されたデータを受け取る
        //console.log("受け取ったデータ:", return_data);
        // プレイヤー移動のデータ処理
        if (return_data.header.eventName == 'PlayerTravelled') {
            Id_Name[return_data.body.name] = return_data.body.player.id
            Posi_Id[return_data.body.player.id] = return_data.body.player.position;
            console.log("プレイヤー位置:", Posi_Id[return_data.body.player.id]);
        }
        // チャットメッセージのデータ処理
        if (return_data.header.eventName == 'PlayerMessage') {
            if(return_data.body.message == 'require id'){
                const Id_Send_Cmd = {
                    header: {
                        version: 1,
                        requestId: uuid.v4(), // 一意のリクエストIDを生成
                        messageType: "commandRequest", // コマンド実行
                        messagePurpose: "commandRequest", // コマンド実行
                    },
                    body: {
                        commandLine: `say あなたのIDは、 §c${Id_Name[return_data.body.sender.name]}`, // APIの応答をsayコマンドで送信
                        version: 1,
                        origin: {
                            type: "player" // 発信元はプレイヤー
                        }
                    }
                };
                socket.send(JSON.stringify(Id_Send_Cmd)); // データをマイクラへ送信
            }
        }
    });
});
