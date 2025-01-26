let socket_id = {};  // 各ソケットに一意なIDを管理
let user_data = {};  // プレイヤーのデータ

WebSocketServer.on("connection", (socket) => {
    console.log("接続されました");

    // ソケットIDがすでに設定されていない場合、IDを生成
    if (!socket_id[socket]) {
        socket_id[socket] = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    const playerId = socket_id[socket];  // プレイヤーごとにIDを維持

    // プレイヤーデータを初期化
    user_data[playerId] = { exist: true, Name: "", Posi: {} };

    // プレイヤー移動イベントの購読やその他の処理
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

    // チャットメッセージイベントの購読
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

    socket.on("message", (rawData) => {
        try {
            const return_data = JSON.parse(rawData);

            if (return_data.header.eventName === 'PlayerTravelled') {
                user_data[playerId] = { exist: true, Name: return_data.body.player.name, Posi: return_data.body.player.position };
                console.log("プレイヤー位置:", user_data);
            }
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
                            commandLine: `say あなたのIDは、 §c${playerId}`,
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

    // 一定期間ごとにデータ送信
    setInterval(() => {
        const Node_data = JSON.stringify(user_data);
        socket.send(Node_data);
        user_data = {};  // 送信後、データをリセット
    }, 3000);

    socket.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });

    socket.on('close', () => {
        if (user_data[playerId]) {
            user_data[playerId]["exist"] = false;
        }
        console.log('接続が切断されました');
    });
});
