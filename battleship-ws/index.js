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

// 最大2人
let players = [];

wss.on("connection", (ws) => {
  console.log("Client connected");

  // 2人以上は入れない
  if (players.length >= 2) {
    ws.send(JSON.stringify({ type: "full" }));
    ws.close();
    return;
  }

  players.push(ws);

  // 現在の人数を通知（クライアント側の接続判定に使う）
  players.forEach((p) => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify({ type: "count", count: players.length }));
    }
  });

  ws.on("message", (msg) => {
    players.forEach((p) => {
      if (p !== ws && p.readyState === WebSocket.OPEN) {
        p.send(msg);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    players = players.filter((p) => p !== ws);

    // 人数更新を通知
    players.forEach((p) => {
      if (p.readyState === WebSocket.OPEN) {
        p.send(JSON.stringify({ type: "count", count: players.length }));
      }
    });
  });
});

// Render / Codesandbox 用ポート
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on " + PORT));
