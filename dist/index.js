import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import SocketsEvents from './utils/socket-events';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;
const io = new Server(server, {
    cors: {
        origin: '*', // TODO: restrict in production
        methods: ['GET', 'POST'],
    },
});
app.get('/', (req, res) => {
    res.send('Welcome to the Call App Backend!');
});
io.on('connection', (socket) => {
    // Handle chat messages
    socket.on(SocketsEvents.CHAT_MESSAGE, (msg) => {
        if (typeof msg !== 'string' || !msg.trim()) {
            socket.emit('error', { error: 'Invalid chat message' });
            return;
        }
        io.emit('chat message', msg);
    });
    // Handle user joining
    socket.on(SocketsEvents.CALL_REQUEST, (data) => {
        if (!data || typeof data.to !== 'string' || !data.offer) {
            socket.emit('error', { error: 'Invalid call request' });
            return;
        }
        console.log(`User ${data.to} has requested a call`);
        io.to(data.to).emit(SocketsEvents.CALL_REQUEST, {
            from: socket.id,
            offer: data.offer,
        });
    });
    // Handle user accepting a call
    socket.on(SocketsEvents.CALL_ACCEPT, (data) => {
        if (!data || typeof data.to !== 'string' || !data.offer) {
            socket.emit('error', { error: 'Invalid call accept' });
            return;
        }
        console.log(`User ${data.to} has accepted the call`);
        io.to(data.to).emit(SocketsEvents.CALL_ACCEPT, {
            from: socket.id,
            offer: data.offer,
        });
    });
    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
//# sourceMappingURL=index.js.map