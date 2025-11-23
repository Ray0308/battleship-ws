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

let players = []; // 最大2人だけ

wss.on("connection", (ws) => {
  console.log("Client connected");
  players.push(ws);

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
  });
});

// CodeSandbox のポート仕様
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on " + PORT));
