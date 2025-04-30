const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Root route handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/lobby.html'));
});

// Store active rooms and their states
const rooms = new Map();

// Sample gibberish phrases and their answers
const phrases = [
    { gibberish: "WTF", answer: "What the Fudge" },
    { gibberish: "LOL", answer: "Laugh Out Loud" },
    { gibberish: "BRB", answer: "Be Right Back" },
    { gibberish: "IMO", answer: "In My Opinion" },
    { gibberish: "TMI", answer: "Too Much Information" },
    { gibberish: "IDK", answer: "I Don't Know" },
    { gibberish: "TTYL", answer: "Talk To You Later" },
    { gibberish: "OMG", answer: "Oh My Goodness" },
    { gibberish: "BTW", answer: "By The Way" },
    { gibberish: "FYI", answer: "For Your Information" }
];

// Generate a random room code
function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Create a new room
    socket.on('createRoom', (data) => {
        const playerName = data?.playerName || 'Player';
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            host: socket.id,
            players: [{ id: socket.id, name: playerName, correct: false }],
            currentPhrase: null,
            usedPhrases: new Set(),
            gameStarted: false
        });

        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode });
        io.to(roomCode).emit('updatePlayers', rooms.get(roomCode).players);
    });

    // Join an existing room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        socket.join(roomCode);
        room.players.push({ id: socket.id, name: playerName, correct: false });
        io.to(roomCode).emit('updatePlayers', room.players);

        // If the game has already started, send the current phrase to the new player
        if (room.gameStarted && room.currentPhrase) {
            socket.emit('newPhrase', { phrase: room.currentPhrase.gibberish });
        }
    });

    // Start the game
    socket.on('startGame', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;

        room.gameStarted = true;
        
        // Start the first round immediately
        const unusedPhrases = phrases.filter(p => !room.usedPhrases.has(p.gibberish));
        if (unusedPhrases.length === 0) {
            room.usedPhrases.clear();
            room.currentPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        } else {
            room.currentPhrase = unusedPhrases[Math.floor(Math.random() * unusedPhrases.length)];
        }

        room.usedPhrases.add(room.currentPhrase.gibberish);
        
        // Send the first phrase to all players
        io.to(roomCode).emit('newPhrase', { phrase: room.currentPhrase.gibberish });
        
        // Start timer for 15 seconds
        setTimeout(() => {
            endRound(roomCode);
        }, 15000);
    });

    // Handle answer submission
    socket.on('submitAnswer', ({ roomCode, playerName, answer }) => {
        const room = rooms.get(roomCode);
        if (!room || !room.currentPhrase) return;

        const player = room.players.find(p => p.name === playerName);
        if (!player) return;

        // Convert both to lowercase for case-insensitive comparison
        const playerAnswer = answer.toLowerCase().trim();
        const correctAnswer = room.currentPhrase.answer.toLowerCase().trim();

        if (playerAnswer === correctAnswer) {
            player.correct = true;
            io.to(roomCode).emit('playerCorrect', playerName);
            io.to(roomCode).emit('updatePlayers', room.players);
            
            // End the round immediately if someone gets it right
            endRound(roomCode);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        for (const [roomCode, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomCode).emit('updatePlayers', room.players);

                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                }
            }
        }
    });
});

// End the current round
function endRound(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    io.to(roomCode).emit('roundEnd', { 
        correctAnswer: room.currentPhrase.answer,
        players: room.players
    });

    // Start next round after a short delay
    setTimeout(() => {
        startNewRound(roomCode);
    }, 3000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 