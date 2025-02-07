const express = require('express')
const {Server } = require('socket.io')
const bodyParser = require('body-parser')

const io = new Server({
    cors:true,
});
const app = express();

app.use(bodyParser.json());

io.on("connection", (socket)=>{

    const emailToSocketMapping = new Map();
    const socketToEmailMapping = new Map();

    socket.on('join-room', data => {
        const { roomId, emailId } = data; 
        console.log("User", emailId, "Joined-Room", roomId);
        emailToSocketMapping.set(emailId, socket.id);
        socketToEmailMapping.set(socket.id, emailId);
        socket.join(roomId);
        socket.emit('joined-room', {roomId});
        socket.broadcast.to(roomId).emit('user-joined', {emailId}); 
    });

    socket.on('call-user', data => {
        const { emailId, offer } = data;
        const fromEmail = socketToEmailMapping.get(socket.id);
        const socketId = emailToSocketMapping.get(emailId);
        socket.to(socketId).emit('incoming-call', { from: fromEmail, offer })
    });
});

app.listen(8000, ()=> {
    console.log("Server is listening");
});

io.listen(8001);