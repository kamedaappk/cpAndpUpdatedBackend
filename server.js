// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory data store
let rooms = [
  { id: '1', userId: 'user1' },
  { id: '2', userId: 'user2' },
  { id: '3', userId: 'user3' },
  { id: '4', userId: 'user4' },
];

let roomDetails = [
  { id: '1', userId: 'user1', messages: [{ text: 'Hello from room 1!', timestamp: new Date().toISOString() }] },
  { id: '2', userId: 'user2', messages: [{ text: 'Hi there from room 2!', timestamp: new Date().toISOString() }] },
  { id: '3', userId: 'user3', messages: [{ text: 'Greetings from room 3!', timestamp: new Date().toISOString() }] }
];

// Routes
app.get('/rooms', (req, res) => {
    console.log('GET /rooms');
  res.json(rooms);
});

app.post('/createRoom', (req, res) => {
console.log('POST /rooms');
console.log('Request body:', req.body);
  const { userId } = req.body;
  const existingRoom = rooms.find(room => room.userId === userId);
  if (existingRoom) {
    console.log('Room already exists for user:', userId);
    return res.status(400).json({ message: 'Room already exists' });
  }
  const newRoom = { id: generateId(), userId };
  rooms.push(newRoom);
  roomDetails.push({ id: newRoom.id, userId, messages: [] });
  res.status(201).json(newRoom);
  console.log('New room created:', newRoom);
});


app.post('/show', (req, res) => {
    console.log('POST /show');
    console.log('Request body:', req.body);
  
    // Respond with a simple success message
    res.status(200).json({ message: 'Request received', receivedData: req.body });
  });

app.get('/room-details/:userId', (req, res) => {
    console.log('GET /room-details/:userId');
  const { userId } = req.params;
  const room = roomDetails.find(room => room.userId === userId);
  if (!room) {
    console.log('Room not found for user:', userId);
    return res.status(404).json({ message: 'Room not found' });
  }
  res.json(room);
});

app.post('/getMessages', (req, res) => {
    console.log('POST /getMessages');
    console.log('Request body:', req.body);
  const { userId } = req.body;
  const room = roomDetails.find(room => room.userId === userId);
  if (!room) {  
    console.log('Room not found for user:', userId);
    return res.status(404).json({ message: 'Room not found for getMessage' });
  }
//   room.messages.push(message);
console.log('Room found:', room);
  res.status(201).json(room);
});

app.post('/saveMessage', (req, res) => {
  console.log('POST /saveMessage');
  console.log('Request body:', req.body);
const { userId, message } = req.body;
const room = roomDetails.find(room => room.userId === userId);
if (!room) {  
  console.log('Room not found for user:', userId);
  return res.status(404).json({ message: 'Room not found for getMessage' });
}
  room.messages.push(message);
console.log('Room found:', room);
res.status(201).json(room);
});

app.post('/enterRoom',(req, res)=>{
    console.log('POST /enterRoom');
    const { userId } = req.body;
    const room = rooms.find(room => room.userId === userId);
    if (!room) {
      console.log('Room not found:', userId);
      return res.status(404).json({ message: 'Room not found' });
    }
    console.log('Room found:', room);
    room.userId = userId;
    res.json(room);
})

// Helper function to generate unique IDs
function generateId() {
  return (Math.random() * 1000000).toFixed(0);
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

