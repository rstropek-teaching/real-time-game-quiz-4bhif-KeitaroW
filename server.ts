import * as express from 'express';
import * as http from 'http';
import * as sio from 'socket.io'

const app = express();
app.use(express.static(__dirname + '/public'));
const server = http.createServer(app);
server.listen(3000);
let players: [string, string][] = [];
let readyPlayers: string[] = [];
let colors: string[] = ['blue','red', 'green', 'goldenrod'];
//client connect
sio(server).on('connection', function(socket) {
  let nickname: string;
  let color: string;
  for (let i = 0; i < players.length; i++) {
    socket.emit('addPlayer', players[i][0], players[i][1]);
  }
  //client login
  socket.on('login', function(nick) {
    if (players.length < 4) {
      nickname = nick;
      color = colors.pop() as string;
      players.push([nickname, color]);
      socket.broadcast.emit('addPlayer', nickname, color);
      socket.emit('addPlayer', nickname, color);
      socket.emit('enable');
    } else {
      socket.emit('gameFull');
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
    if (readyPlayers.length == players.length) {
      socket.broadcast.emit('startGame', readyPlayers);
      socket.emit('startGame', readyPlayers);
    }
  });
  //player ready
  socket.on('unready', function(){
    readyPlayers.splice(readyPlayers.indexOf(nickname), 1);
    socket.broadcast.emit('unreadyPlayer', nickname);
    socket.emit('unreadyPlayer', nickname);
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