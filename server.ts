import * as express from 'express';
import * as http from 'http';
import * as sio from 'socket.io'

const app = express();
app.use(express.static(__dirname + '/public'));
const server = http.createServer(app);
server.listen(3000);
let players: [string, string][] = [];
let positions: number[] = [];
let punishment: number[] = [0, 0, 0, 0];
let readyPlayers: string[] = [];
let colors: string[] = ['blue','red', 'green', 'goldenrod'];
let gameRunning: boolean;
let actTurn: number = 0;
//client connect
sio(server).on('connection', function(socket) {
  let nickname: string;
  let color: string;
  for (let i = 0; i < players.length; i++) {
    socket.emit('addPlayer', players[i][0], players[i][1], false);
  }
  if (gameRunning) {
    socket.emit('nextTurn', readyPlayers);
    socket.emit('noLogin', players[actTurn%players.length][0]);
  }
  //client login
  socket.on('login', function(nick) {
    if (players.length < 4 && getIndex(nick) == players.length) {
      nickname = nick;
      color = colors.pop() as string;
      players.push([nickname, color]);
      positions.push(1);
      socket.broadcast.emit('addPlayer', nickname, color, false);
      socket.emit('addPlayer', nickname, color, true);
      socket.emit('enable');
    } else if (players.length == 4){
      socket.emit('gameFull');
    } else if (getIndex(nick) != players.length) {
      socket.emit('nameAlreadyExists');
    }
  });
  //client disconnect
  socket.on('disconnect', function(){
    if (nickname != null) {
      players.splice(getIndex(nickname), 1);
      colors.push(color);
      readyPlayers.splice(readyPlayers.indexOf(nickname), 1);
      socket.broadcast.emit('removePlayer', nickname);
    }
  });
  //player ready
  socket.on('ready', function(){
    readyPlayers.push(nickname);
    socket.broadcast.emit('readyPlayer', nickname);
    socket.emit('readyPlayer', nickname);
    if (readyPlayers.length == players.length && players.length >= 2) {
      gameRunning = true;
      socket.broadcast.emit('noLogin', players[actTurn%players.length][0]);
      socket.broadcast.emit('nextTurn', readyPlayers);
      socket.emit('nextTurn', readyPlayers);
    }
  });
  //player unready
  socket.on('unready', function(){
    readyPlayers.splice(readyPlayers.indexOf(nickname), 1);
    socket.broadcast.emit('unreadyPlayer', nickname);
    socket.emit('unreadyPlayer', nickname);
  });
  //start the game finally
  socket.on('askTurn', function(nick){
    if (getIndex(nick) == actTurn%players.length) {
      socket.emit('yourTurn');
      socket.broadcast.emit('enemyTurn', nick);
    }
  });
  //when a player rolled
  socket.on('roll', function(roll: number){
    if (punishment[actTurn%players.length] >= 1) {
      if (punishment[actTurn%players.length] == 1) {
        socket.emit('effectMsg', `After this invalid roll your next roll will count.`);
        socket.broadcast.emit('effectMsg',`After ${nickname}'s invalid roll the next roll will count.`);
      } else {
        socket.emit('effectMsg', `After ${punishment[actTurn%players.length]-1} more invalid rolls your next roll count.`);
        socket.broadcast.emit('effectMsg',`After ${punishment[actTurn%players.length]-1} more invalid rolls ${nickname}'s rolls will count.`);
      }
      punishment[actTurn%players.length]--;
    } else {
      positions[actTurn%players.length] += roll;
      switch (positions[actTurn%players.length]) {
        case 3:  socket.emit('effectMsg', `You may move to the field in front of the next player.`);
                 socket.broadcast.emit('effectMsg',`${nickname} may moves to the field in front of the next player.`);
                 positions[actTurn%players.length] = getNextPos(positions[actTurn%players.length]);
                 break;
        case 6:  socket.emit('effectMsg', `You can cross the river over the bridge. Move to field 12.`);
                 socket.broadcast.emit('effectMsg',`${nickname} can cross the river over the bridge. ${nickname} moves to field 12.`); 
                 positions[actTurn%players.length] = 12; break;
        case 15: socket.emit('effectMsg', `The bird, you had in the cage with you, flew away. To catch it, you have to return to field 10.`);
                 socket.broadcast.emit('effectMsg',`Tired of the strenous journey ${nickname} lays themselves to bed in the hotel. ${nickname} has to miss out one turn.`); 
                 positions[actTurn%players.length] = 10; break;
        case 19: socket.emit('effectMsg', `Tired of the strenous journey you lay yourself to bed in the hotel. You have to miss out one turn.`);
                 socket.broadcast.emit('effectMsg',`Tired of the strenous journey ${nickname} lays himself/herself to bed in the hotel. ${nickname} has to miss out one turn.`); 
                 punishment[actTurn%players.length] = 1; break;
        case 26: if (roll == 6 || roll == 3) { 
                    socket.emit('yourTurn'); 
                    socket.broadcast.emit('enemyTurn', nickname); 
                    socket.emit('effectMsg', 'You are allowed to roll again because you landed on the dice field with a ' + roll + '.');
                    socket.broadcast.emit('effectMsg', nickname + ' is allowed to roll again because ' + nickname + ' landed on the dice field with a ' + roll + '.');
                 } break;
        case 31: if (roll != 6) {
                    positions[actTurn%players.length] -= roll;
                    socket.emit('effectMsg', 'You have to roll a 6 to move further.');
                    socket.broadcast.emit('effectMsg', nickname + ' has to roll a 6 to move further.');
                 } break;
        case 39: socket.emit('effectMsg', `You clumsy podophyllum! You fell down the stairway and have to go back to field 33.`);
                 socket.broadcast.emit('effectMsg',`${nickname} the clumsy podophyllum! ${nickname} fell down the stairway and has to go back to field 33.`); 
                 positions[actTurn%players.length] = 33; break;
        case 42: socket.emit('effectMsg', `And now you even got lost in the maze. Go back to field 30.`);
                 socket.broadcast.emit('effectMsg',`And now ${nickname} even got lost in the maze. ${nickname} has to go back to field 30.`); 
                 positions[actTurn%players.length] = 30; break;
        case 52: socket.emit('effectMsg', `Now you even land in jail. You have to miss out two turns.`);
                 socket.broadcast.emit('effectMsg',`Now ${nickname} even lands in jail. ${nickname} has to miss out two turns.`); 
                 punishment[actTurn%players.length] = 2; break;
        case 58: socket.emit('effectMsg', `Normally your life would've ended. But as the game once wants, you may return begin again at field 1.`);
                 socket.broadcast.emit('effectMsg',`Normally ${nickname}'s ife would've ended. But as the game once wants, ${nickname} may return begin again at field 1.`); 
                 positions[actTurn%players.length] = 1; break;
        case 63: socket.emit('effectMsg', `Congratulations! You've made it. You've got a real goose life behind you - with all its ups and downs. If you landed here first you won the game.`);
                 socket.broadcast.emit('effectMsg',`Congratulations! ${nickname} has made it. ${nickname} has got a real goose life behind you - with all its ups and downs.`); 
                 break;
      }
      socket.emit('effectMsg', `You rolled ${roll}.`);
      socket.broadcast.emit('effectMsg',`${nickname} rolled ${roll}.`);
    }
    actTurn++;
    socket.broadcast.emit('nextTurn', readyPlayers);
    socket.emit('nextTurn', readyPlayers);
  });
});

function getIndex(nick: string) {
  let i = 0;
  while (i < players.length) {
    if (players[i][0] == nick) {
      break;
    }
    i++;
  }
  return i;
}

function getNextPos(position: number) {
  let nextPos: number = position;
  let furtherPos: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] > position) {
      furtherPos.push(positions[i]);
    }
    if (positions[i] > nextPos) {
      nextPos = positions[i];
    }
  }
  for (let i = 0; i < furtherPos.length; i++) {
    if (furtherPos[i] < nextPos) {
      nextPos = furtherPos[i];
    }
  }
  return nextPos+1;
}