const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const server = createServer(app);

app.use(cors({
  origin: "https://velvety-flan-e5fe23.netlify.app", // Netlify frontend को allow करो
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(bodyParser.json());

const io = new Server(server, {
  cors: {
    origin: "https://velvety-flan-e5fe23.netlify.app", // Netlify frontend को allow करो
    methods: ["GET", "POST"]
  }
});

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("New User Connected:", socket.id);

  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    console.log("User", emailId, "Joined Room", roomId);
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    }
  });

  socket.on("call-accept", (data) => {
    console.log("Call accepted on server", data);
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("call-accept", { ans });
    }
  });

  socket.on("end-call", (data) => {
    const { emailId } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("end-call", { endedBy: fromEmail });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const emailId = socketToEmailMapping.get(socket.id);
    emailToSocketMapping.delete(emailId);
    socketToEmailMapping.delete(socket.id);
  });
});

// Single port for both Express & Socket.io
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
