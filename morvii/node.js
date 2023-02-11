const http = require("http");
const WebSocket = require("ws");
const server = http.createServer((request, response) => {
  if (request.method == "POST") {
    var body = "";
    request.on("data", function (data) {
      body += data;
    });
    request.on("end", function () {
      try {
        const parsedData = JSON.parse(body);
        sendToClient(parsedData);
      } catch (e) {}
    });
    response.writeHead(200, { "Content-Type": "text/html" });
  } else {
    response.writeHead(404, { "Content-Type": "text/html" });
  }
  response.end();
});
const wss = new WebSocket.Server({ noServer: true });
const users = {};
function sendToClient(data) {
  try {
    var user = data.user;
    data = data.data;
    user.forEach((u) => {
      users[u].send(JSON.stringify(data));
    });
  } catch (e) {}
}
wss.on("connection", function connection(ws, request, client) {
  users[client.username] = ws;
  ws.on("message", (msgs) => {
    try {
      const msg = JSON.parse(msgs);
      if (msg.type === "typing") {
        sendToClient({
          user: [msg.receiver],
          data: { type: "typing", value: msg.value, user: client.username },
        });
      } else if (msg.type === "viewer") {
        sendToClient({
          user: [msg.user],
          data: { type: "viewer", value: msg.value, user: client.username },
        });
      } else if (msg.type === "viewer_request") {
        sendToClient({
          user: [msg.user],
          data: { type: "viewer_request", user: client.username },
        });
      } else if (msg.type === "ice_candidate") {
        sendToClient({
          user: [msg.user],
          data: { type: msg.type, user: client.username, ...msg },
        });
      } else if (msg.type === "ice_description") {
        sendToClient({
          user: [msg.user],
          data: { type: msg.type, user: client.username, ...msg },
        });
      }
    } catch (e) {}
  });
  ws.on("close", function close() {
    const token = request.url.slice(1, request.url.length);
    http
      .get(
        "http://192.168.43.94:8000/accounts/server/" + token + "/disconnect/",
        {
          method: "POST",
          headers: { token, user: client.username },
        }
      )
      .on("error", (e) => {})
      .on("error", (err) => {});
  });
});
function authenticate(request, auth) {
  const token = request.url.slice(1, request.url.length);
  http
    .get(
      "http://192.168.43.94:8000/accounts/server/" + token + "/connect/",
      { method: "POST", headers: { token } },
      (res) => {
        const { statusCode } = res;

        let error;
        if (statusCode !== 200) {
          error = new Error(`Status Code: ${statusCode}`);
        }
        if (error) {
          auth(false, null);
          res.resume();
          return;
        }
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            auth(true, { ...request.client, username: parsedData.user });
          } catch (e) {
            auth(false, null);
          }
        });
      }
    )
    .on("error", (e) => {
      auth(false, null);
    })
    .on("error", (err) => {
      auth(false, null);
    });
}
server.on("upgrade", function upgrade(request, socket, head) {
  authenticate(request, (auth, client) => {
    if (!auth) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request, client);
    });
  });
});

server.listen(8080);
