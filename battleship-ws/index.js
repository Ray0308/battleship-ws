// 必要モジュール
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

// サーバ基盤
const app = express();
const server = http.createServer(app);

// WebSocketサーバ
const wss = new WebSocket.Server({ server });

// public 配信
app.use(express.static(path.join(__dirname, "public")));

// 接続中プレイヤー
let players = [];

// 接続時
wss.on("connection", (ws) => {
  console.log("Client connected");

  // 新規プレイヤー登録（最大2人）
  if (players.length < 2) {
    ws.playerId = players.length + 1; 
    players.push(ws);

    // クライアントへ自分のIDを送る
    ws.send(JSON.stringify({ type: "playerId", playerId: ws.playerId }));
  } else {
    // 3人目以降は切断
    ws.send(JSON.stringify({ type: "full" }));
    ws.close();
    return;
  }

  // プレイヤーが2人揃ったら開始通知
  if (players.length === 2) {
    players.forEach((p) => {
      if (p.readyState === WebSocket.OPEN) {
        p.send(JSON.stringify({ type: "start" }));
      }
    });
  }

  // メッセージ転送
  ws.on("message", (msg) => {
    players.forEach((p) => {
      if (p !== ws && p.readyState === WebSocket.OPEN) {
        p.send(msg);
      }
    });
  });

  // 切断時
  ws.on("close", () => {
    players = players.filter((p) => p !== ws);
  });
});

// Port設定
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on " + PORT));
