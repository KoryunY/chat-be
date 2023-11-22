//UsersDatabase

const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb://localhost:3000/UsersDatabase';

// Create a new MongoClient
const client = new MongoClient(uri);

// Connect to the MongoDB server
async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } finally {
    // Ensure the client closes when you finish using it
    // await client.close();
    console.log("eli lava")
  }
}

// Call the connect function
connect();
