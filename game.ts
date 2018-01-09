declare const io: SocketIOStatic;

const socket = io();
//add player to list
socket.on('addPlayer', function(msg, color){
    $('#players').append($(`<li id='${msg}' style='color:${color}'>`).text(msg));
});
//remove player from list
socket.on('removePlayer', function(msg){
    $(`#${msg}`).remove();
});
//ready player
socket.on('readyPlayer', function(msg){
    $(`#${msg}`).css('background-color', 'limegreen');
});
//unready player
socket.on('unreadyPlayer', function(msg){
    $(`#${msg}`).css('background-color', 'white');
});
//start game
socket.on('startGame', function(msg: string[]){
    for (let i = 0; i < msg.length; i++) {
        $(`#${msg[i]}`).css('background-color', 'antiquewhite');
    }
});
//server response on login
socket.on('enable', function(){
    $('#ready').removeAttr('disabled');
});
socket.on('gameFull', function(){
   alert('Sorry the game is full.');
   $('#login').show();
});
//server response on login removes login form
$('#login').submit(function(){
    socket.emit('login', $('#nick').val());
    $(this).hide();
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