module.exports = (io, socket) => {
  // Handle drawing events
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  // Handle cursor movement — broadcast to everyone except sender
  socket.on("cursor-move", ({ x, y, userId, name, color }) => {
    socket.broadcast.emit("cursor-update", { x, y, userId, name, color });
  });

  // Handle clear board events
  socket.on("clearBoard", () => {
    socket.broadcast.emit("clearBoard");
  });

  // Handle user joining
  socket.on("userJoined", (userData) => {
    socket.broadcast.emit("userJoined", userData);
  });

  // Handle user leaving
  socket.on("userLeft", (userData) => {
    socket.broadcast.emit("userLeft", { userId: userData.id || userData.userId });
  });

  // Handle text input
  socket.on("addText", (data) => {
    socket.broadcast.emit("addText", data);
  });

  // Handle shape drawing
  socket.on("addShape", (data) => {
    socket.broadcast.emit("addShape", data);
  });

  // Handle image upload
  socket.on("addImage", (data) => {
    socket.broadcast.emit("addImage", data);
  });
};