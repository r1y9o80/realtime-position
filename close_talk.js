const express = require("express");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const WebSocketServer = new WebSocket.Server({ server });

const port = process.env.PORT || 19131;
const socketId = {};
const userData = {};

// 静的ファイル提供とルーティング設定
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(__dirname + "/posi_con/index.html"));

// WebSocket接続時の処理
WebSocketServer.on("connection", (socket) => {
  console.log("接続されました");


  socketId[socket] = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  


  // プレイヤー移動とメッセージイベントを購読
  subscribeToEvents(socket);

  // メッセージ受信処理
  socket.on("message", (rawData) => handleMessage(socket, rawData));

  // 定期的に位置情報を送信
  setInterval(() => sendUserData(socket), 3000);
  
  // エラー処理
  socket.on("error", console.error);

  // 接続終了処理
  socket.on("close", () => handleClose(socket));
});

// イベント購読処理
function subscribeToEvents(socket) {
  const events = ["PlayerTravelled", "PlayerMessage"];
  events.forEach(event => {
    const message = {
      header: { version: 1, requestId: uuidv4(), messageType: "commandRequest", messagePurpose: "subscribe" },
      body: { eventName: event }
    };
    socket.send(JSON.stringify(message));
  });
  console.log("イベント購読開始");
}

// メッセージ処理
function handleMessage(socket, rawData) {
  try {
    const data = JSON.parse(rawData);
    if (data.header.eventName === "PlayerTravelled") {
      userData[socketId[socket]] = { exist: true, Name: data.body.player.name, Posi: data.body.player.position };
      console.log("プレイヤー位置:", userData);
    }

    if (data.header.eventName === "PlayerMessage" && data.body.message === "require id") {
      const idMessage = {
        header: { version: 1, requestId: uuidv4(), messageType: "commandRequest", messagePurpose: "commandRequest" },
        body: { commandLine: `say あなたのIDは、 §c${socketId[socket]}`, version: 1, origin: { type: "player" } }
      };
      socket.send(JSON.stringify(idMessage));
    }
  } catch (error) {
    console.error("メッセージ処理エラー:", error);
  }
}

// 定期的にユーザーデータを送信
function sendUserData(socket) {
  socket.send(JSON.stringify(userData));
  userData = {}
}

// 接続終了処理
function handleClose(socket) {
  if (userData[socketId[socket]]) {
    userData[socketId[socket]].exist = false;
    console.log("dellllllllll")
  }
  socket.send(JSON.stringify(userData));
  console.log("接続が切断されました");
}

// サーバーを指定ポートで起動
server.listen(port, () => console.log(`サーバーがポート${port}で起動しました`));
