const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        rooms: rooms.size,
        connections: io.engine.clientsCount
    });
});

// API endpoint to get client-safe config
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.STREAM_API_KEY,
        appId: process.env.STREAM_APP_ID
        // Note: Never send secret key to frontend
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store room participants
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
    
    // Join room
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        socket.userId = userId;
        socket.userName = userName;
        socket.roomId = roomId;
        
        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }
        
        const room = rooms.get(roomId);
        room.set(userId, {
            socketId: socket.id,
            userName: userName,
            userId: userId
        });
        
        // Notify other users in the room
        socket.to(roomId).emit('user-connected', userId, userName);
        
        // Send existing users to the new user
        const existingUsers = Array.from(room.entries())
            .filter(([id]) => id !== userId)
            .map(([id, user]) => ({ userId: id, userName: user.userName }));
        
        socket.emit('existing-users', existingUsers);
        
        console.log(`User ${userName} (${userId}) joined room ${roomId}`);
    });
    
    // Handle WebRTC signaling
    socket.on('offer', (offer, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocket = room.get(targetUserId).socketId;
            io.to(targetSocket).emit('offer', offer, socket.userId);
        }
    });
    
    socket.on('answer', (answer, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocket = room.get(targetUserId).socketId;
            io.to(targetSocket).emit('answer', answer, socket.userId);
        }
    });
    
    socket.on('ice-candidate', (candidate, targetUserId) => {
        const room = rooms.get(socket.roomId);
        if (room && room.has(targetUserId)) {
            const targetSocket = room.get(targetUserId).socketId;
            io.to(targetSocket).emit('ice-candidate', candidate, socket.userId);
        }
    });
    
    // Handle user mute/unmute
    socket.on('toggle-audio', (isMuted) => {
        socket.to(socket.roomId).emit('user-toggle-audio', socket.userId, isMuted);
    });
    
    socket.on('toggle-video', (isVideoOff) => {
        socket.to(socket.roomId).emit('user-toggle-video', socket.userId, isVideoOff);
    });
    
    // Handle screen sharing events
    socket.on('screen-share-started', (userId) => {
        socket.to(socket.roomId).emit('screen-share-started', userId);
        console.log(`User ${socket.userName} (${userId}) started screen sharing`);
    });
    
    socket.on('screen-share-stopped', (userId) => {
        socket.to(socket.roomId).emit('screen-share-stopped', userId);
        console.log(`User ${socket.userName} (${userId}) stopped screen sharing`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.roomId && socket.userId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.delete(socket.userId);
                
                // Clean up empty rooms
                if (room.size === 0) {
                    rooms.delete(socket.roomId);
                }
                
                // Notify other users
                socket.to(socket.roomId).emit('user-disconnected', socket.userId);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Video chat app running on http://localhost:${PORT}`);
    console.log('Socket.IO server is ready for WebRTC signaling');
});
