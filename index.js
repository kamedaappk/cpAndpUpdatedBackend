// server.js
const express = require('express');
const http = require('http'); // Add this line
const socketIo = require('socket.io'); // Add this line
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const checkDiskSpace = require('check-disk-space').default;
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

// Helper function to convert bytes to the most appropriate unit
function formatBytes(bytes) {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return { value: bytes.toFixed(2), unit: units[i] };
}

app.get('/getspaceinfo', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads'); // or try 'C:/'

  checkDiskSpace(directoryPath)
    .then((diskSpace) => {
      console.log('Disk space info:', diskSpace);

      // Use `size` for total space (not `total` since `check-disk-space` reports `size`)
      const totalSpace = diskSpace.size || 0;
      const freeSpace = diskSpace.free || 0;

      // Calculate used space as total - free
      const usedSpace = totalSpace - freeSpace;

      // Convert to human-readable units and extract the unit
      const totalSpaceFormatted = formatBytes(totalSpace);
      const usedSpaceFormatted = formatBytes(usedSpace);
      const freeSpaceFormatted = formatBytes(freeSpace);

      // Used percentage
      const usedPercentage = totalSpace > 0 ? ((usedSpace / totalSpace) * 100).toFixed(2) : 0;
      const freePercentage = totalSpace > 0 ? ((freeSpace / totalSpace) * 100).toFixed(2) : 0;

      // Send both numeric and human-readable values
      res.json({
        message: 'Disk space details',
        totalSpace: {
          value: parseFloat(totalSpaceFormatted.value),
          unit: totalSpaceFormatted.unit
        },
        usedSpace: {
          value: parseFloat(usedSpaceFormatted.value),
          unit: usedSpaceFormatted.unit
        },
        freeSpace: {
          value: parseFloat(freeSpaceFormatted.value),
          unit: freeSpaceFormatted.unit
        },
        usedPercentage: parseFloat(usedPercentage),  // Numeric value for used percentage
        freePercentage: parseFloat(freePercentage),  // Numeric value for free percentage
        totalSpaceReadable: `${totalSpaceFormatted.value} ${totalSpaceFormatted.unit}`,
        usedSpaceReadable: `${usedSpaceFormatted.value} ${usedSpaceFormatted.unit}`,
        freeSpaceReadable: `${freeSpaceFormatted.value} ${freeSpaceFormatted.unit}`,
        diskPath: directoryPath,
        unit: totalSpaceFormatted.unit // This is the unit used for all numeric values
      });
    })
    .catch((err) => {
      console.error('Error getting disk usage:', err);
      res.status(500).json({ message: 'Error getting disk space', error: err.message });
    });
});


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
  const moment = require('moment-timezone');

  if (!room) {
    return res.status(404).json({ message: 'Room not found for file upload' });
  }

  // Add the file info to the room's messages
  const fileMessage = {
    text: `File uploaded: ${req.file.filename}`,
    filename: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`,
    timestamp: Date.now()
  };

  room.messages.push(fileMessage);
  io.to(userId).emit('message', fileMessage);

  // // Emit the file details to the room
  // io.to(userId).emit('fileUploaded', fileMessage);
  
  res.status(201).json({ message: 'File uploaded successfully', file: req.file });
});

app.get('/deleteAllFilesAlone', deleteAllFilesAlone);

app.get('/resetAll', async (req, res) => {
  console.log("Reset triggered")
  try {
    // Reset the state of rooms and roomDetails
    rooms = [
      { id: '1', userId: 'USER1', duration:9725689998926, key: '1' },
  { id: '2', userId: 'USER2', duration:9725689998926, key: '2' },
  { id: '3', userId: 'USER3', duration:9725689998926, key: '3'  },
  { id: '4', userId: 'USER4', duration:9725689998926, key: '4'  },
    ];
    
    roomDetails = [
      { id: '1', userId: 'USER1', messages: [{ text: 'Hello from room 1!', timestamp: 1725689998926 }] },
  { id: '2', userId: 'USER2', messages: [{ text: 'Hi there from room 2!', timestamp: 1725689998926 }] },
  { id: '3', userId: 'USER3', messages: [{ text: 'Greetings from room 3!', timestamp: 1725689998926 }] }
    ];

    // Await the completion of deleteAllFiles
    const result = await deleteAllFiles();
    console.log(result.message);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting files:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to delete some or all files' });
    }
  }
});

function deleteAllFilesAlone(req, res) {
  console.log("Delete triggered")
  // In-memory data store

  const directoryPath = path.join(__dirname, 'uploads');
  
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).json({ message: 'Error reading directory' });
    }

    // If there are no files, send a response
    if (files.length === 0) {
      return res.status(200).json({ message: 'No files to delete' });
    }

    // Delete each file in the directory
    let deletionErrors = [];
    files.forEach(file => {
      fs.unlink(path.join(directoryPath, file), (err) => {
        if (err) {
          console.error(`Error deleting file ${file}:`, err);
          deletionErrors.push(file);
        }
      });
    });

    // Send response after all deletions are attempted
    setTimeout(() => {
      if (deletionErrors.length > 0) {
        res.status(500).json({ message: 'Some files could not be deleted', errors: deletionErrors });
      } else {
        res.status(200).json({ message: 'All files deleted successfully' });
      }
    }, 1000); // Adjust the timeout if needed based on the expected number of files
  });
}
  
// Function to delete all files in the 'uploads' directory
function deleteAllFiles() {
  return new Promise((resolve, reject) => {
    console.log("Delete triggered");

    const directoryPath = path.join(__dirname, 'uploads');

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return reject(new Error('Error reading directory'));
      }

      // If there are no files, resolve immediately
      if (files.length === 0) {
        return resolve({ message: 'No files to delete' });
      }

      let deletionErrors = [];
      let pendingDeletions = files.length;

      if (pendingDeletions === 0) {
        return resolve({ message: 'No files to delete' });
      }

      files.forEach(file => {
        fs.unlink(path.join(directoryPath, file), (err) => {
          if (err) {
            console.error(`Error deleting file ${file}:`, err);
            deletionErrors.push(file);
          }

          pendingDeletions -= 1;
          if (pendingDeletions === 0) {
            if (deletionErrors.length > 0) {
              reject(new Error('Some files could not be deleted'));
            } else {
              resolve({ message: 'All files deleted successfully' });
            }
          }
        });
      });
    });
  });
}

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log(`A user connected with socket id: ${socket.id}`);

  socket.on('joinRoom', ({ userId }) => {
    console.log(`${userId} joined the room`);
    socket.join(userId);
  });

  socket.on('leaveRoom', ({ userId }) => {
    console.log(`${userId} left the room`);
    socket.leave(userId);
  });

  socket.on('disconnect', () => {
    console.log(`A user with socket id: ${socket.id} disconnected`);
  });
});
// In-memory data store
let rooms = [
  { id: '1', userId: 'USER1', duration:9725689998926, key: '1' },
  { id: '2', userId: 'USER2', duration:9725689998926, key: '2' },
  { id: '3', userId: 'USER3', duration:9725689998926, key: '3'  },
  { id: '4', userId: 'USER4', duration:9725689998926, key: '4'  },
];

let roomDetails = [
  { id: '1', userId: 'USER1', messages: [{ text: 'Hello from room 1!', timestamp: 1725689998926 }] },
  { id: '2', userId: 'USER2', messages: [{ text: 'Hi there from room 2!', timestamp: 1725689998926 }] },
  { id: '3', userId: 'USER3', messages: [{ text: 'Greetings from room 3!', timestamp: 1725689998926 }] }
];


app.post('/getRoomDataById', (req, res) => {
  console.log('POST /getRoomDataById', req.body);
  const { key } = req.body;
  const room = rooms.find(room => room.id === key);
  if (room) {
    const roomData = roomDetails.find(roomData => roomData.userId === room.userId);
    const resp = {room, roomData}
    console.log("resp", resp)
    res.json(resp);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
})

app.post('/getRoomDataByKey', (req, res) => {
  console.log('POST /getRoomDataByKey', req.body);
  const { key } = req.body;
  const room = rooms.find(room => room.key === key);
  if (room) {
    const roomData = roomDetails.find(roomData => roomData.userId === room.userId);
    const resp = {room, roomData}
    console.log("resp", resp)
    res.json(resp);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
})

// Routes
app.get('/rooms', (req, res) => {
    console.log('GET /rooms');
  res.json(rooms);
});

// check if server is up
app.get('/ping', (req, res) => {
    console.log('GET /ping');
  res.json('Pong!');
});

// Set up the root route to display server stats
app.get('/', async (req, res) => {
  const version = "v2024.12.15.01";
  // Get current time in IST
  const currentTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Prepare the HTML response with the version and time
  const statsHtml = `
    <h1>Server Version: ${version}</h1>
    <p>Current Time (IST): ${currentTime}</p>
  `;

  // Send the HTML response
  res.send(statsHtml);
});

app.get('/roomDetails', (req, res) => {
    console.log('GET /roomDetails');
    const roomData = {roomDetails, rooms}
  res.json(roomData);
})

app.post('/createRoom', (req, res) => {
console.log('POST /rooms create rooms');
console.log('Request body:', req.body);
  const { userId, duration } = req.body;
  const existingRoom = rooms.find(room => room.userId === userId);
  if (existingRoom) {
    console.log('Room already exists for user:', userId);
    return res.status(400).json({ message: 'Room already exists' });
  }
  const newRoom = { id: generateId(), userId, duration, key: generateKey(userId) };
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
    return res.status(404).json({ message: 'Room not found for :'+ userId });
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
  return res.status(404).json({ message: 'Room not found for : ' + userId });
}
  room.messages.push(message);
  io.to(userId).emit('message', message);
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
// setInterval(() => {
//   const currentTime = new Date().getTime();
  
//   const currentTimeUTC = new Date().getTime();  // Current time in UTC (timestamp in milliseconds)

//   // IST is UTC + 5 hours 30 minutes
//   const IST_OFFSET = 5.5 * 60 * 60 * 1000;  // 5.5 hours in milliseconds
  
//   // Calculate the current time in IST
//   const currentTimeIST = new Date(currentTimeUTC + IST_OFFSET);  // Add IST offset to UTC time
  
//   // Get the timestamp for IST
//   const timestampInIST = currentTimeIST.getTime();  // Get the timestamp of the IST time
  
//   console.log('Current UTC Time (Timestamp):', currentTimeUTC);  // UTC timestamp
//   console.log('Current Time in IST (Timestamp):', timestampInIST);  // IST timestamp
//   console.log('Current UTC Time (Timestamp):', currentTime); // UTC timestamp
//   roomsAll = rooms
//   rooms = roomsAll.filter(room => {
//     const roomDuration = new Date(room.duration).getTime();
    
//     return roomDuration > timestampInIST;
//   });
//   // console.log('Updated rooms:', rooms);
//   // console the one that is in roomsAll but note in rooms
//   deletingRooms = roomsAll.filter(room => !rooms.includes(room));
//   console.log('Rooms removed:', deletingRooms);
//   // delete room details and files
//   deletingRooms.forEach(room => {
//     roomDetails = roomDetails.filter(roomDetail => roomDetail.userId !== room.userId);
//   });
// }, 10000);

// Helper function to generate unique IDs
function generateId() {
  return (Math.random() * 1000000).toFixed(0);
}

function generateKey(userId) {
  // Create a secure random string
  const randomBytes = crypto.getRandomValues(new Uint8Array(12));
  
  // Convert to a string of characters (base64 or hex)
  const randomStr = Array.from(randomBytes).map(byte => String.fromCharCode(byte)).join('');
  
  // Combine userId with randomStr to ensure uniqueness
  const uniqueKey = userId + randomStr;

  // Optionally, hash the combination to ensure length and uniqueness
  const hashedKey = btoa(uniqueKey).slice(0, 12); // Encode and slice to ensure it has 12 characters
  console.log('Generated Key:', hashedKey);
  return hashedKey;
}

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});

