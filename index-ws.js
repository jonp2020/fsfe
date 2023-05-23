const express = require("express");
const server = require("http").createServer();
const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("server started on port 3000");
});

/** catch when server is being closed and shutdown db */
process.on("SIGINT", () => {
  wss.clients.forEach(function each(client) {
    client.close();
  });
  server.close(() => {
    shutdownDB();
  });
});

/** Begin Websocket */

const WebsocketServer = require("ws").Server;

const wss = new WebsocketServer({ server: server });

wss.on("connection", function connection(ws) {
  const numClients = wss.clients.size;
  console.log("Clients connection", numClients);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (wss.readyState === wss.OPEN) {
    ws.send("Welcome to my server");
  }

  db.run(`INSERT INTO visitors(count, time) 
		VALUES (${numClients}, datetime('now'))
	`);

  ws.on("close", function close() {
    wss.broadcast(`Current visitors: ${numClients}`);
    console.log("A client has disconnected");
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

/** end web sockets */

/** begin database */

const sqlite = require("sqlite3");
const db = new sqlite.Database(":memory:");

/** set up db */
db.serialize(() => {
  db.run(`
			CREATE TABLE visitors (
				count INTEGER,
				time TEXT
			)
	`);
});

function getCounts() {
  db.each("SELECT * FROM visitors", (err, row) => {
    console.log("row", row);
  });
}

function shutdownDB() {
  getCounts();
  console.log("Shutting down db");
  db.close();
}
