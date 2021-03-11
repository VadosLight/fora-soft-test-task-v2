const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
//для ssl
const https = require("https");
const fs = require("fs");

const formatMessage = require("./utils/messages");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("db/db.db");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

//создаем сервер HTTP или HTTPS
const app = express();

//если нет сертификата, то запускаем без него
//без сертификата не работает WebRTC - видеозвонки
let server;
try {
  server = https.createServer(
    {
      key: fs.readFileSync("./ssl/key.pem"),
      cert: fs.readFileSync("./ssl/cert.pem"),
    },
    app
  );
  console.log("используем HTTPS");
} catch {
  server = http.createServer(app);
  console.log("используем HTTP");
}

const io = socketio(server);

// чтобы работало на одном порту
app.use(express.static(path.join(__dirname, "../client-vanilla")));

const botName = "info";

//Действия при подключении
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    //присоединяем пользователя к сокету по названию комнаты
    socket.join(user.room);

    //запрос на получение последних 30 сообщений в комнате.
    const SQL_ALL = `Select * FROM messages WHERE room="${user.room}" ORDER BY id DESC LIMIT 30`;
    db.all(SQL_ALL, (err, rows) => {
      //обратно сортируем последние полученные сообщения
      rows = rows.sort((a, b) => {
        return a.id - b.id;
      });

      //по очереди отсылаем их подключившемуся
      rows.forEach((row) => {
        socket.emit("message", {
          username: row.username,
          time: row.time,
          text: row.text,
        });
      });

      //отправляем приветственное сообщение вошедшему
      socket.emit(
        "message",
        formatMessage(
          botName,
          `${user.username}, добро пожаловать в комнату "${user.room}"`
        )
      );
    });

    //видео
    // socket.on("call-user", (data) => {
    //   socket.to(data.to).emit("call-made", {
    //     offer: data.offer,
    //     socket: socket.id,
    //   });
    // });

    // async function callUser(socketId) {
    //   const offer = await peerConnection.createOffer();
    //   await peerConnection.setLocalDescription(
    //     new RTCSessionDescription(offer)
    //   );

    //   socket.emit("call-user", {
    //     offer,
    //     to: socketId,
    //   });
    // }

    socket.on("make-answer", data => {
      socket.to(data.to).emit("answer-made", {
        socket: socket.id,
        answer: data.answer
      });
    });

    //оповещаем комнату, что к ним присоединились
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} присоединился к беседе`)
      );

    //обновляем информацию о списке пользователей и название комнаты
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //обрабатываем сообщение
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    const msgInfo = formatMessage(user.username, msg);

    io.to(user.room).emit("message", msgInfo);

    //записываем полученное сообщение в БД
    db.run(`INSERT INTO messages(text, time, username, room) VALUES(?,?,?,?)`, [
      msg,
      msgInfo.time,
      user.username,
      user.room,
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
