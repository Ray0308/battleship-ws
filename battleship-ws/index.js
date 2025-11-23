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

// プレイヤー管理
let players = []; // { id: "xxx", ws: WebSocket }

// ランダムID生成
function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // 最大2人まで
  if (players.length >= 2) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "満員のため接続できません。",
      })
    );
    ws.close();
    return;
  }

  // プレイヤーID発行
  const id = createId();
  players.push({ id, ws });

  // 自分にIDを送る
  ws.send(JSON.stringify({ type: "connected", id }));

  // 他のプレイヤーにも「誰が来たか」を通知
  players.forEach((p) => {
    if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: "join", id }));
    }
  });

  // メッセージ受信
  ws.on("message", (msg) => {
    // 自分以外に送信
    players.forEach((p) => {
      if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(msg);
      }
    });
  });

  // 切断時
  ws.on("close", () => {
    console.log("Client disconnected");

    // 削除
    players = players.filter((p) => p.ws !== ws);

    // 相手へ「切断」を通知
    players.forEach((p) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(JSON.stringify({ type: "leave", id }));
      }
    });
  });
});

// Render のポート仕様
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log("Server running on " + PORT));
