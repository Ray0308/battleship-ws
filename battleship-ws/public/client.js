let ws;

function connectWS() {
  ws = new WebSocket(`wss://${location.host}`);

  ws.addEventListener("open", () => {
    console.log("接続成功");
    document.getElementById("status").innerText = "接続完了";
  });

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "full") {
      alert("部屋が満員です。他の人が抜けるまで待ってください。");
      return;
    }

    if (data.type === "count") {
      document.getElementById("count").innerText =
        `現在の人数：${data.count}/2`;
      return;
    }

    // ゲーム用の普通の通信
    console.log("相手から:", data);
  });

  ws.addEventListener("close", () => {
    console.log("切断されました");
    document.getElementById("status").innerText = "切断";
  });
}

window.onload = connectWS;
