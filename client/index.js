let socket = io('http://localhost:5050', { path: '/real-time' });

document.getElementById('join-button').addEventListener('click', fetchData);
document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('end-button').addEventListener('click', endGame);

let role = null;

async function fetchData() {
	const nickname = document.getElementById('nickname-input').value;
	if (nickname.trim()) {
		socket.emit('joinGame', { nickname: nickname });
		document.getElementById('nickname-form').style.display = 'none';
		document.getElementById('game-controls').style.display = 'block';
	} else {
		alert('Please enter a nickname.');
	}
}

async function startGame() {
	socket.emit('startGame');
}

async function endGame() {
	socket.emit('endGame');
}

// Grita "Marco"
function marcoCall() {
	if (role === 'Marco') {
		socket.emit('marcoCalls');
	}
}

//"Polo"
function poloReply() {
	if (role === 'Polo' || role === 'Polo especial') {
		socket.emit('poloReplies');
	}
}

socket.on('userJoined', (data) => {
	console.log('Players in the game:', data);
	displayPlayers(data);
});

socket.on('assignRole', (data) => {
	role = data.role;
	displayPlayers(data.players);

	//botones
	if (role === 'Marco') {
		document.getElementById('action-button').innerHTML = '<button onclick="marcoCall()">Gritar Marco</button>';
	} else {
		document.getElementById('action-button').innerHTML = '<button onclick="poloReply()">Gritar Polo</button>';
	}
});

socket.on('marcoCalled', () => {
	if (role === 'Polo' || role === 'Polo especial') {
		document.getElementById('marco-message').innerHTML = 'Marco ha gritado. ¡Presiona Polo!';
	}
});

socket.on('poloReplied', (data) => {
	if (role === 'Marco') {
		document.getElementById('polo-list').innerHTML += `<li>${data.nickname} ha gritado Polo</li>`;
	}
});

socket.on('gameEnded', (data) => {
	alert(`¡El ganador es ${data.winner}!`);
	resetGame();
});

socket.on('gameReset', () => {
	document.getElementById('data-container').innerHTML = '';
	document.getElementById('action-button').innerHTML = '';
	document.getElementById('marco-message').innerHTML = '';
	document.getElementById('polo-list').innerHTML = '';
	document.getElementById('nickname-form').style.display = 'block';
	document.getElementById('game-controls').style.display = 'none';
});

function displayPlayers(players) {
	const container = document.getElementById('data-container');
	container.innerHTML = '';
	players.forEach((player) => {
		const playerDiv = document.createElement('div');
		playerDiv.classList.add('item');
		playerDiv.innerHTML = `
      <span>${player.nickname} ${role === 'Marco' ? '' : `(${player.role || 'Esperando rol'})`}</span>
      ${
				role === 'Marco' && player.role !== 'Marco'
					? '<button onclick="selectPolo(\'' + player.id + '\')">Select</button>'
					: ''
			}
    `;
		container.appendChild(playerDiv);
	});
}

function selectPolo(playerId) {
	socket.emit('selectPolo', playerId);
}

function resetGame() {
	document.getElementById('data-container').innerHTML = '';
	document.getElementById('action-button').innerHTML = '';
	document.getElementById('marco-message').innerHTML = '';
	document.getElementById('polo-list').innerHTML = '';
	document.getElementById('nickname-form').style.display = 'block';
	document.getElementById('game-controls').style.display = 'none';
}
