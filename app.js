const uuid = require('uuid');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 4000;
const WebSocket = require('ws');

const registeredUsers = [];
const chatMessages = []; // Store chat messages in memory

const wsServer = new WebSocket.Server({ port: 9000 });
wsServer.on('connection', onConnect);

const connectedClients = [];

function onConnect(wsClient) {
    console.log('Новый пользователь');

    // Add the new client to the array
    connectedClients.push(wsClient);

    wsClient.on('message', function (message) {
        const data = JSON.parse(message.toString());
        switch (data.type) {
            case "message":
                // Store the message in memory
                chatMessages.push({ sender: data.sender, text: data.text });
                
                // Broadcast the message to all connected clients
                connectedClients.forEach(client => {
                    client.send(message);
                });
                break;
        }
    });

    wsClient.on('close', function () {
        // Remove the disconnected client from the array
        const index = connectedClients.indexOf(wsClient);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }

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
        { id: 1, name: "Vzgo", lastName: "Vzgoyan", logo: "logo" },
        { id: 2, name: "Jumanji", lastName: "Vzgoyan", logo: "logo" },
        { id: 3, name: "Erik", lastName: "Babajanyan", logo: "logo" },
        { id: 4, name: "Hrant", lastName: "Mkrtchyan", logo: "logo" }
    ]);
});
app.use(express.json());

app.post('/register', (req, res) => {
    const newUser = {
        id: uuid.v4(), // Generate a new UUID for each user
        ...req.body
    };

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

app.get('/chat', (req, res) => {
  res.send(chatMessages);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
app.post('/messages', (req, res) => {
    const messageData = req.body;
    console.log('Received message:', messageData);
    res.sendStatus(200);
});
