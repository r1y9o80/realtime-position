console.log("OK");
const WebSocket = require('ws');
const { v4: uuidv4 } = require("uuid"); // 一意のIDを作成するためのライブラリ

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

// WebSocketサーバーをhttpサーバーに統合
const WebSocketServer = new WebSocket.Server({ server: sv }); // WebSocketサーバーをhttpサーバーに統合

// 接続処理
WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");
    socket.id = Date.now().toString(36) + Math.random().toString(36).substring(2);

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

    // メッセージ受信処理
    socket.on("message", (rawData) => {
        try {
            const return_data = JSON.parse(rawData);
            // プレイヤー移動イベントの処理
            if (return_data.header.eventName === 'PlayerTravelled') {
                user_data[socket.id] = { exist: true, Name: return_data.body.player.name, Posi: return_data.body.player.position };
                console.log("プレイヤー位置:", user_data);
            }
        }
        catch (error) {
            console.log("エラー: " + error)
        }
    });

    // 一定期間、ポジションを集計し送信する
    setInterval(() => {
        const Node_data = JSON.stringify(user_data);
        socket.send(Node_data);
        user_data = {};
        console.log("送りました")
    }, 3000); // 3秒ごとに送信

    // 接続エラー処理
    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    // 接続終了処理
    socket.on('close', () => {
        // 接続が切断されたユーザーのデータを更新
        //socket.idがある＝HTMLじゃなくてマイクラとの断接
        if(socket.id){ 
            user_data[socket.id] = {exist: false}
            socket.send(JSON.stringify(user_data));
            console.log(socket.id)
            console.log(user_data)
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
