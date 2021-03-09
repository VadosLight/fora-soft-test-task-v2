// const sqlite3 = require("sqlite3").verbose();
// const db = new sqlite3.Database(
//   "C:/Users/it-va/Documents/GitHub/test-server/db.db"
// );
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// чтобы работало на одном порту
app.use(express.static(path.join(__dirname, "../client-vanilla")));

const botName = "info";

//Действия при подключении
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit(
      "message",
      formatMessage(botName, `Добро пожаловать в комнату "${user.room}"`)
    );

    //Трансляция, когда пользователь подключается
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} присоединился к беседе`)
      );

    //информация о пользователе и комнате
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //обработчик сообщений
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // действия при отсоединении пользователя
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} вышел из чата`)
      );

      // отправляем инфу о пользователях и комнатах
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Запускаем сервер на порту ${PORT}`));
