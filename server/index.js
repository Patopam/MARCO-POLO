const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*',
	},
});

const db = {
	players: [],
};

function resetGame() {
	db.players = [];
	io.emit('gameReset');
}

io.on('connection', (socket) => {
	socket.on('joinGame', (user) => {
		db.players.push({ id: socket.id, nickname: user.nickname, role: null });
		console.log(`${user.nickname} joined the game`);
		io.emit('userJoined', db.players);
	});

	socket.on('startGame', () => {
		if (db.players.length >= 3) {
			const marcoIndex = Math.floor(Math.random() * db.players.length);
			let poloEspecialIndex;
			do {
				poloEspecialIndex = Math.floor(Math.random() * db.players.length);
			} while (poloEspecialIndex === marcoIndex);

			db.players.forEach((player, index) => {
				if (index === marcoIndex) {
					player.role = 'Marco';
				} else if (index === poloEspecialIndex) {
					player.role = 'Polo especial';
				} else {
					player.role = 'Polo';
				}
			});

			db.players.forEach((player) => {
				io.to(player.id).emit('assignRole', {
					role: player.role,
					players: db.players.filter((p) => p.id !== player.id),
				});
			});
		} else {
			socket.emit('error', { message: 'Se necesitan al menos 3 jugadores para empezar el juego.' });
		}
	});

	socket.on('marcoCalls', () => {
		io.emit('marcoCalled');
	});

	socket.on('poloReplies', () => {
		const polo = db.players.find((player) => player.id === socket.id);
		io.emit('poloReplied', { nickname: polo.nickname });
	});

	socket.on('selectPolo', (selectedPoloId) => {
		const marco = db.players.find((player) => player.role === 'Marco');
		const selectedPolo = db.players.find((player) => player.id === selectedPoloId);

		if (selectedPolo.role === 'Polo especial') {
			io.emit('gameEnded', { winner: marco.nickname });
		} else {
			selectedPolo.role = 'Marco';
			marco.role = 'Polo';
			io.emit('playerRolesUpdated', db.players);
		}
	});

	socket.on('endGame', () => {
		resetGame();
	});

	socket.on('disconnect', () => {
		db.players = db.players.filter((player) => player.id !== socket.id);
		io.emit('userLeft', db.players);
	});
});

httpServer.listen(5050, () => {
	console.log(`Server is running on http://localhost:5050`);
});
