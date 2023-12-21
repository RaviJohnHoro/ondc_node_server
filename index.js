import { app, server, io, size, searchMap } from './global.js';

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle joining a custom room
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
    if (!searchMap.get(room)) {
      searchMap.set(room, []);
    }
  });

  // Handle messages
  socket.on("message", (data) => {
    // Broadcast the message to all users in the same room
    io.to(data.room).emit("message", data);
  });

  socket.on("leaveRoom", (data) => {
    const roomId = data.roomId;
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
    searchMap.delete(roomId);
  });

  socket.on("loadMore", (data) => {
    var messageId = data.messageId;

    var index = data.index;
    if (
      messageId !== undefined &&
      messageId !== null &&
      index !== undefined &&
      index !== null
    ) {
      var list = searchMap.get(messageId);
      var maxLength = index + size < list.length ? index + size : list.length;
      if (index < maxLength) {
        for (let i = index; i < maxLength; i += 1) {
          io.to(messageId).emit("message", list[i]);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
