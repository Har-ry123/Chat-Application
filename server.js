
// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 9000;

// Serve static files from the 'public' directory
// For this example, we'll serve from the root directory
app.use(express.static(__dirname));

// Track online users
let onlineUsers = {};

io.on('connection', (socket) => {
    console.log('A user connected ✅');

    // Listen for user info (username, avatar)
    socket.on('user info', (data) => {
        onlineUsers[socket.id] = { user: data.user, avatar: data.avatar };
        io.emit('online users', Object.values(onlineUsers));
    });

    // Broadcast a message when a user joins
    socket.broadcast.emit('chat message', {
        user: 'System',
        message: 'A new user has joined the chat.'
    });

    // Listen for chat messages from a client
    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    // Listen for typing events
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('stop typing', (data) => {
        socket.broadcast.emit('stop typing', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected ❌');
        io.emit('chat message', {
            user: 'System',
            message: 'A user has left the chat.'
        });
        delete onlineUsers[socket.id];
        io.emit('online users', Object.values(onlineUsers));
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});