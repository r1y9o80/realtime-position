console.log("OK");
const WebSocket = require('ws');
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ

let user_data = {};
let data_No_empty = 0

// WebSocketサーバーのポート設定
const rawPort = process.env.PORT || "8080";
const portMatch = rawPort.match(/\d+/);
const port = portMatch ? Number(portMatch[0]) : 8080;
console.log("process.env.PORT:", port);

console.log("process.env.PORT:", __dirname + ":" + port);
console.log(`WebSocketデータ: ${port}`);

// Expressサーバー作成
const express = require("express");
const app = express();
const http = require("http");
const sv = http.createServer(app);
const path = require("path");
const pako = require("pako")

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

    //移動をリクエストトリガーに設定
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
    //chatをリクエストトリガーに設定
    const subscribeMessage_chat = {
        header: {
            version: 1,
            requestId: uuidv4(), // 一意のリクエストIDを生成
            messageType: "commandRequest", // 不動。決まり文句
            messagePurpose: "subscribe", // 購読する
        },
        body: {
            eventName: "PlayerMessage" // 購読内容（チャットメッセージの受信）
        },
    };

    //設定したものを送信
    socket.send(JSON.stringify(subscribeMessage_travel));
    socket.send(JSON.stringify(subscribeMessage_chat));

    // メッセージ受信処理
    socket.on("message", (rawData) => {
        try {
            const return_data = JSON.parse(rawData);
            // プレイヤー移動イベントの処理
            if (return_data.header.eventName === 'PlayerTravelled') {
                socket.id = return_data.body.player.id
                user_data[socket.id] = { Name: return_data.body.player.name, Posi: return_data.body.player.position };
                console.log("プレイヤー位置:", user_data);
            }
            if (return_data.header.eventName === 'PlayerMessage') {
                if(return_data.body.message == "require id"){
                    const SendCom_Info = {
                        header: {
                            version: 1,
                            requestId: uuidv4(), // 一意のリクエストIDを生成
                            messageType: "commandRequest", // コマンド実行
                            messagePurpose: "commandRequest", // コマンド実行
                        },
                        body: {
                            commandLine: `say IDは §c${socket.id}`, // APIの応答をsayコマンドで送信
                            version: 1,
                            origin: {
                                type: "player" // 発信元はプレイヤー
                            }
                        }
                    };
                    socket.send(JSON.stringify(SendCom_Info)); // データをマイクラへ送信
                }
            }
        }
        catch (error) {
            console.log("エラー: " + error)
        }
    });

    // 一定期間、ポジションを集計し送信する
    
    setInterval(() => {
        //data_No_emptyについて、trueからtrueやfalseからfalseにする必要はないのでフラグが切り替わる可能性のある条件内にセット
        //空の状態でも１度は送信したいので、フラグ切替を処理の後にセット
        if(data_No_empty <= 2){ //空じゃないとき(なんでか分からんけど、右辺2以上で正常に動く)
            if(Object.keys(user_data).length <= 0) data_No_empty += 1 //空だったら1足す
            socket.send(pako.gzip(JSON.stringify(user_data)));
            console.log("送りました: "+user_data)
            console.log(data_No_empty)
        }
        else{ //空の時
            if(Object.keys(user_data).length > 0) data_No_empty = 0 //空じゃなかったらリセット
            console.log(data_No_empty)
        }
    }, 1000); // 1秒ごとに送信

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        // 接続が切断されたユーザーのデータを更新
        if(socket.id){ 
            delete user_data[socket.id]
        }
        else{
            console.log("存在しないよ")
        }
        console.log('接続が切断されました');
    });
});

// サーバーを指定ポートで起動
sv.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました`);
});
