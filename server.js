// server.js
const express = require('express');
const http = require('http'); // Add this line
const socketIo = require('socket.io'); // Add this line
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();

const server = http.createServer(app); // Modify this line
const port = process.env.PORT || 3000;
const io = socketIo(server, { // Add this block
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middleware
app.use(bodyParser.json());
app.use(cors());




// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure you have a folder called 'uploads' in your project directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const upload = multer({ storage: storage });

// Create a new route for file uploads
app.post('/uploadFile', upload.single('file'), (req, res) => {
  console.log('File uploaded:', req.file);
  const { userId } = req.body;
  console.log('userId:', userId);
  const room = roomDetails.find(room => room.userId === userId);

  if (!room) {
    return res.status(404).json({ message: 'Room not found for file upload' });
  }

  // Add the file info to the room's messages
  const fileMessage = {
    text: `File uploaded: ${req.file.filename}`,
    filePath: `/uploads/${req.file.filename}`,
    timestamp: Date.now()
  };

  room.messages.push(fileMessage);

  // // Emit the file details to the room
  // io.to(userId).emit('fileUploaded', fileMessage);

  res.status(201).json({ message: 'File uploaded successfully', file: req.file });
});


// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining a room
  socket.on('joinRoom', ({ userId }) => {
    console.log(`${userId} joined the room`);
    socket.join(userId); // User joins a room based on userId
  });

  // Handle receiving a new message
  socket.on('newMessage', ({ userId, message }) => {
    const room = roomDetails.find(room => room.userId === userId);
    if (room) {
      room.messages.push(message);
      console.log(`New message for room ${userId}:`, message);
      // Emit the message to all clients in the room
      io.to(userId).emit('message', message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// In-memory data store
let rooms = [
  { id: '1', userId: 'user1', duration:9725689998926 },
  { id: '2', userId: 'user2', duration:9725689998926 },
  { id: '3', userId: 'user3', duration:9725689998926  },
  { id: '4', userId: 'user4', duration:9725689998926  },
];

let roomDetails = [
  { id: '1', userId: 'user1', messages: [{ text: 'Hello from room 1!', timestamp: 1725689998926 }] },
  { id: '2', userId: 'user2', messages: [{ text: 'Hi there from room 2!', timestamp: 1725689998926 }] },
  { id: '3', userId: 'user3', messages: [{ text: 'Greetings from room 3!', timestamp: 1725689998926 }] }
];

// Routes
app.get('/rooms', (req, res) => {
    console.log('GET /rooms');
  res.json(rooms);
});

app.post('/createRoom', (req, res) => {
console.log('POST /rooms');
console.log('Request body:', req.body);
  const { userId, duration } = req.body;
  const existingRoom = rooms.find(room => room.userId === userId);
  if (existingRoom) {
    console.log('Room already exists for user:', userId);
    return res.status(400).json({ message: 'Room already exists' });
  }
  const newRoom = { id: generateId(), userId, duration };
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

// If room duration is past remove the room from list
setInterval(() => {
  const currentTime = new Date().getTime();
  console.log('Current time:', currentTime);
  roomsAll = rooms
  rooms = roomsAll.filter(room => {
    const roomDuration = new Date(room.duration).getTime();
    
    return roomDuration > currentTime;
  });
  // console.log('Updated rooms:', rooms);
  // console the one that is in roomsAll but note in rooms
  deletingRooms = roomsAll.filter(room => !rooms.includes(room));
  console.log('Rooms removed:', deletingRooms);
  // delete room details and files
  deletingRooms.forEach(room => {
    roomDetails = roomDetails.filter(roomDetail => roomDetail.userId !== room.userId);
  });
}, 5000);

// Helper function to generate unique IDs
function generateId() {
  return (Math.random() * 1000000).toFixed(0);
}

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});

