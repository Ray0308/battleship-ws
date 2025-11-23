// 必要モジュール
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

// サーバ基盤
const app = express();
const server = http.createServer(app);

// WebSocketサーバ
const wss = new WebSocket.Server({ server });

// public 配信
app.use(express.static(path.join(__dirname, "public")));

let players = {};       // id: ws
let playerOrder = [];   // 接続順（最大2名）

wss.on("connection", (ws) => {
  const id = uuidv4();   // ★固有ID付与
  ws.id = id;

  players[id] = ws;
  playerOrder.push(id);

  console.log("Client connected:", id);

  // ★1人目 or 2人目の状態を通知
  ws.send(JSON.stringify({
    type: "connected",
    playerId: id,
    index: playerOrder.length   // 1 or 2
  }));

  // ★2人揃ったら開始
  if (playerOrder.length === 2) {
    broadcast({
      type: "start",
      msg: "双方接続完了。ゲーム開始！"
    });
  }

  // 受信処理
  ws.on("message", (msg) => {
    broadcastExcept(ws.id, msg);
  });

  // 切断処理
  ws.on("close", () => {
    console.log("Client disconnected:", id);

    delete players[id];
    playerOrder = playerOrder.filter(x => x !== id);

    broadcast({
      type: "end",
      msg: "相手が切断しました"
    });
  });
});

// 全員に送信
function broadcast(obj) {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj);
  playerOrder.forEach(id => {
    const ws = players[id];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(str);
    }
  });
}

// 送信元以外に送信
function broadcastExcept(senderId, msg) {
  playerOrder.forEach(id => {
    if (id !== senderId) {
      const ws = players[id];
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  });
}

// Render 用ポート
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on " + PORT));
