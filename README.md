# Guess the Gibberish - Party Mode

A multiplayer game where players try to guess the meaning of gibberish phrases. Perfect for parties and group gatherings!

## Features

- Create and join game rooms with unique codes
- Real-time multiplayer gameplay
- Score tracking and leaderboard
- Timer-based rounds
- Mobile-friendly interface

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## How to Play

1. **Create a Room**
   - Click "Create Room" to start a new game
   - Share the 4-digit room code with your friends

2. **Join a Room**
   - Enter your name and the room code
   - Wait for the host to start the game

3. **Gameplay**
   - Each round shows a gibberish phrase
   - Players race to guess the correct meaning
   - Points are awarded based on speed
   - Game continues for 5 rounds
   - Player with most points wins!

## Game Rules

- Each round lasts 30 seconds
- Points are awarded based on how quickly you guess correctly
- The faster you guess, the more points you get
- If no one guesses correctly, the round ends automatically
- After 5 rounds, the game ends and the winner is announced

## Technical Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Real-time Communication: Socket.io

## Contributing

Feel free to submit issues and enhancement requests! 