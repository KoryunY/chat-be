const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 4000;
const WebSocket = require('ws');


const registeredUsers = [];

const wsServer = new WebSocket.Server({ port: 9000 });
wsServer.on('connection', onConnect);

function onConnect(wsClient) {
    console.log('Новый пользователь');

    wsClient.on('message', function (message) {
        const data = JSON.parse(message.toString());
        switch (data.type) {
            case "message":
                wsClient.send(message);
                break;
        }
    });

    wsClient.on('close', function () {

        console.log('Пользователь отключился');
    });
}

function broadcastRegistration(newUser) {

    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "registration", newUser }));
        }
    });
}

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/contact', (req, res) => {
    res.send([
        { id: 1, name: "Vzgo", lastName: "Vzgoyan" },
        { id: 2, name: "Jumanji", lastName: "Vzgoyan" },
        { id: 3, name: "Erik", lastName: "Babajanyan" }
    ]);
});

app.post('/register', (req, res) => {
    const newUser = req.body;

    registeredUsers.push(newUser);

    broadcastRegistration(newUser);

    res.send(registeredUsers);
});

app.post('/login', (req, res) => {
  const { login, password } = req.body;

  const user = registeredUsers.find(u => u.login === login && u.password === password);

  if (user) {
      res.json({ success: true, user });
  } else {
      res.json({ success: false, message: 'User not found. Check login and password.' });
  }
});

app.get('/MyUsers', (req, res) => {
  res.send(registeredUsers);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
