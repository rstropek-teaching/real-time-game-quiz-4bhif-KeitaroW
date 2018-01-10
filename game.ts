declare const io: SocketIOStatic;

let nickname: string;
const socket = io();

//when game is already running
socket.on('noLogin', function(name: string){
    $('#login').hide();
    $('#ready').hide();
    $(`#${name}`).css('background-color', 'lightgrey');
    $('#turn').text(`${name}'s turn.`);
});
//effectMsg
socket.on('effectMsg', function(effect: string){
    $('#action').append($('<li>').text(effect));
});
//edit Position of player
socket.on('editPos', function(name: string, position: number){
    $(`#${name}`).text(`${name}: ${position}`);
});
//execute game win with restart
socket.on('gameWin', function(text: string){
    alert(text);
    setTimeout(function() {
        location.reload();
    }, 10000);
    
});
//add player to list
socket.on('addPlayer', function(player: string, color: string, setNick: boolean){
    $('#players').append($(`<li id='${player}' style='color:${color}'>`).text(player));
    if (setNick) {
        nickname = player;
    }
});
//remove player from list
socket.on('removePlayer', function(player: string){
    $(`#${player}`).remove();
});
//ready player
socket.on('readyPlayer', function(player: string){
    $(`#${player}`).css('background-color', 'limegreen');
});
//unready player
socket.on('unreadyPlayer', function(player: string){
    $(`#${player}`).css('background-color', 'white');
});
//start game
socket.on('nextTurn', function(players: string[]){
    for (let i = 0; i < players.length; i++) {
        $(`#${players[i]}`).css('background-color', 'antiquewhite');
    }
    $('#rollDice').hide();
    $('#unready').hide();
    socket.emit('askTurn', nickname);
});
//server response on login
socket.on('enable', function(){
    $('#ready').removeAttr('disabled');
});
//message if name already exists
socket.on('nameAlreadyExists', function(){
   alert('Sorry this name is already in use.');
   $('#login').show();
});
//message if game is full
socket.on('gameFull', function(){
    alert('Sorry the game is full.');
    $('#login').show();
 });
//enable the dice for the players turn
socket.on('yourTurn', function(){
    $('#turn').text('Your turn.');
    $(`#${nickname}`).css('background-color', 'lightgrey');
    $('#rollDice').show();
});
//show message to enemies who's turn it is
socket.on('enemyTurn', function(enemy: string){
    $('#turn').text(`${enemy}'s turn.`)
    $(`#${enemy}`).css('background-color', 'lightgrey');
});
//server response on login removes login form
$('#login').submit(function(){
    socket.emit('login', $('#nick').val());
    $(this).hide();
    return false;
});
$('#roll').submit(function(){
    socket.emit('roll', Math.round(Math.random()*5+1));
    return false;
});
$('#ready').click(function(){
    socket.emit('ready');
    $('#ready').hide();
    $('#unready').show();
    return false;
});
$('#unready').click(function(){
    socket.emit('unready');
    $('#ready').show();
    $('#unready').hide();
    return false;
});