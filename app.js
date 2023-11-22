const uuid = require('uuid');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const { Server: WebSocketServer } = require('ws');
const { error } = require('console');
const fs = require('fs').promises;

const app = express();
const port = 4000;
const wsServer = new WebSocketServer({ port: 9000 });
const filePath = 'users.txt';
const chatFilePath = 'chat.txt';
let registeredUsers = [];
let chatMessages = [];
const connectedClients = [];

mongoose.connect(process.env.DB, { useUnifiedTopology: true, useNewUrlParser: true });

const connection = mongoose.connection;

connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
  
//   connection.createCollection("Messages", {
//     validator: {
//       $jsonSchema: {
//         bsonType: "object",
//         required: ["senderId", "receiverId", "message", "timeStamp"],
//         properties: {
//           senderId: {
//             bsonType: "string",
//             description: "must be a string and is required",
//           },
//           receiverId: {
//             bsonType: "string",
//             description: "must be a string and is required",
//           },
//           message: {
//             bsonType: "string",
//             description: "must be a string and is required",
//           },
//           timeStamp: {
//             bsonType: "string",
//             description: "must be a string and is required",
//           },
//         },
//       },
//     },
//   })
  
});

wsServer.on('connection', onConnect);


function onConnect(wsClient) {
    console.log('New user connected');

    connectedClients.push(wsClient);

    wsClient.on('message', (message) => {
        const data = JSON.parse(message.toString());

        switch (data.type) {
            case 'message':
                const newMessage = { sender: data.sender, text: data.text };
                chatMessages.push(newMessage);
                connection.collection("Messages").insertOne({
                    senderId: data.sender,
                    receiverId: data.receiver,
                    message: data.text,
                    timeStamp: new Date().toLocaleString()
                  })
                // Broadcast the message to all connected clients
                connectedClients.forEach(client => {
                    console.log("client")
                    client.send(message);
                });
                break;
        }
    });
    wsClient.on('close', () => {
        const index = connectedClients.indexOf(wsClient);
        if (index !== -1) {
            connectedClients.splice(index, 1);
        }

        console.log('User disconnected');
    });
}




app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/register', (req, res) => {
    const newUser = {
        id: uuid.v4(),
        ...req.body
    };

    registeredUsers.push(newUser);

    writeUsersToTextFile(registeredUsers);

    res.send(registeredUsers);
});

app.get('/messages?senderId=sender&receiverId=receiver', (req, res) => {
    console.log(req.params)
    //const data = connection.collection("Messages").find({ senderId: req.params.senderId, receiverId: req.params.receiverId } )
    //axiosov frontic request get /messages u body tes avelacnum en erkys
    res.send([])})

async function writeUsersToTextFile(users) {
    const usersText = JSON.stringify(users, null, 2);

    try {
        await fs.writeFile('registeredUsers.txt', usersText);
        console.log('Users information written to file successfully');
    } catch (err) {
        console.error('Error writing to file:', err);
    }
}

async function readUsersFromTextFile() {
    try {
        const data = await fs.readFile('registeredUsers.txt', 'utf8');
        registeredUsers = JSON.parse(data);
        console.log('Users information read from file successfully');
    } catch (err) {
        console.error('Error reading file:', err);
    }
}

readUsersFromTextFile();

app.post('/login', (req, res) => {
    const { login, password } = req.body;

    const user = registeredUsers.find(u => u.login === login && u.password === password);

    if (user) {
        logLoginAttempt({ success: true, user });
        res.json({ success: true, user });
    } else {
        logLoginAttempt({ success: false, message: 'User not found. Check login and password.', login });
        res.json({ success: false, message: 'User not found. Check login and password.' });
    }
});

function logLoginAttempt(attempt) {
    const attemptString = JSON.stringify(attempt, null, 2);
    fs.appendFile(filePath, `${attemptString}\n`)
        .then(() => console.log('Login attempt information written to text file'))
        .catch(err => console.error('Error writing to login attempts text file:', err));
}

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
    chatMessages.push(messageData)
    writeChatMessagesToTextFile()
    res.sendStatus(200);
});

function writeChatMessagesToTextFile() {
    const messagesJSON = JSON.stringify(chatMessages, null, 2);

    try {
        fs.writeFile('chat.txt', messagesJSON);
        console.log('Chat messages written to file successfully');
    } catch (err) {
        console.error('Error writing chat messages to file:', err.message);
        console.error(err.stack);
    }
}
async function readChatMessagesToTextFile() {
    try {
        const data = await fs.readFile('chat.txt', 'utf8');
        chatMessages = JSON.parse(data);
        console.log('Users Chat information read from file successfully');
    } catch (err) {
        console.error('Error reading file:', err);
    }
}

readChatMessagesToTextFile()

// app.get('/messages', async(req, res) =>{
//     try{
//         console.log(res.JSON(chatMessages))
//         return await res.JSON(chatMessages)
//     }catch(err){
//         console.log(err)
//     }
// })
/*
app.post('/register', async (req, res) => {
  const newUser = {
    id: uuid.v4(),
    ...req.body,
  };

  try {
    const result = await client.db('your-database-name').collection('users').insertOne(newUser);
    console.log('User registered:', newUser);

    // Опционально, можно также вывести информацию о результате в консоль
    console.log('MongoDB Insert Result:', result);

    broadcastRegistration(newUser);
    res.send(result.ops[0]); // Отправить зарегистрированного пользователя обратно
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Error registering user.' });
  }
});
app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const user = await client.db('your-database-name').collection('users').findOne({ login, password });

    // Опционально, можно вывести информацию о найденном пользователе в консоль
    console.log('User found during login:', user);

    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'User not found. Check login and password.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Error during login.' });
  }
});

*/