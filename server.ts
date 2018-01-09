import * as express from 'express';
import * as http from 'http';
import * as sio from 'socket.io'

const app = express();
app.use(express.static(__dirname + '/public'));
const server = http.createServer(app);
server.listen(3000);

//client connect
sio(server).on('connection', function(socket) {
  let nickname: string;
  socket.on('login', function(nick) {
    nickname = nick;
    socket.broadcast.emit('message', nickname + ' joined');
    socket.emit('enable');
  });
  //client disconnect
  socket.on('disconnect', function(){
    if (nickname != null) {
      socket.broadcast.emit('message', nickname + ' left');
    }
  });
  //client message send
  socket.on('message', function(message) {
    socket.broadcast.emit('message', nickname + ': ' + message);
    socket.emit('message', nickname + ': ' + message);
  });
  socket.emit('greet', 'Welcome!');
});