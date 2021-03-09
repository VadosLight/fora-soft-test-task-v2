const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db/db.db");

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
      formatMessage(botName, `${user.username}, добро пожаловать в комнату "${user.room}"`)
    );

    //оповещаем комнату, что к ним присоединились
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

    const msgInfo = formatMessage(user.username, msg);
    
    io.to(user.room).emit("message", msgInfo);

    //пишем в БД
    db.run(`INSERT INTO messages(text, time, username, room) VALUES(?,?,?,?)`, [
      msg,
      msgInfo.time,
      user.username,
      user.room
    ]);
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
