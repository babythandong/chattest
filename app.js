var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');
mongoose.connection;
var connections = [];
var users = [];
server.listen(3000);
console.log('Server is starting....');
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
var Schema = mongoose.Schema;
var chatSchema = new Schema({
    user: String,
    msg: String,
    date: String
});
var Chat = mongoose.model('chat', chatSchema);
var msgSchema = new Schema({
    msg: String,
    date: String
});
var Msg = mongoose.model('msg', msgSchema);
io.on('connection', function(socket) {
    connections.push(socket);
    console.log("Connected: %s socket connected", connections.length);
    socket.on('disconnect', function() {
        connections.splice(connections.indexOf(socket), 1);
    });
    socket.on('new_user', function(data, callback) {
        if (users.indexOf(data) >= 0) {
            socket.emit('error_message', data);
        } else {
            callback(true);
            socket.username = data;
            users.push(socket.username);
            var chat = new Chat({ user: socket.username, date: new Date() });
            chat.save(function(err) {
                if (err) {
                    return err;
                } else {
                    console.log(socket.username + ' add successful!');
                }
            });
            updateListUser();
        }
    });
    socket.on('send_message', function(data) {
        var msg_content = '<strong>' + socket.username + '</strong>: ' + data + '<br>';
        var msg = new Msg({ msg: msg_content, date: new Date() });
        msg.save(function(err) {
            if (err) {
                return err;
            } else {
                console.log("Add successful");
            }
        });
        io.sockets.emit('new_message', { msg: data, nick: socket.username });
    });

    function updateListUser() {
        io.sockets.emit('list_user', users);
    }
});