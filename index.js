const express = require('express')
const {Server } = require('socket.io')
const bodyParser = require('body-parser')

const io = new Server({
    cors:true,
});
const app = express();

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();
io.on("connection", (socket)=>{


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

    socket.on("call-accept", (data) => {
        console.log("call-accept event triggered on server", data);
        const { emailId, ans } = data;
        const socketId = emailToSocketMapping.get(emailId);
        console.log("Socket ID found:", socketId);  // ✅ Debugging line
    
        if (socketId) {
            socket.to(socketId).emit("call-accept", { ans });
            console.log("Sent call-accept event to client"); // ✅ Debugging line
        } else {
            console.log("No socket found for email:", emailId); // ✅ Debugging line
        }
    });
    
    
});

app.listen(8000, ()=> {
    console.log("Server is listening");
});

io.listen(8001);