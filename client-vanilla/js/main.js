const chatMessages = document.querySelector(".chat-messages");
const chatForm = document.getElementById("chat-form");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

const videoBtn = document.getElementById("join-video-btn");
const videoList = document.getElementById("video-list");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const photo = document.getElementById("photo");
const startbutton = document.getElementById("startbutton");

// Получаем логин и комнату из урла
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

//видео
videoBtn.addEventListener("click", () => {
  //navigator.getusermedia - устарел и не хочет работать
});

// подключение к комнате
socket.emit("joinRoom", { username, room });

// получаем пользователей и комнаты
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

//получаем сообщения с сервера
socket.on("message", (message) => {
  // console.log(message);
  outputMessage(message);

  //скролл
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// отправка сообщения
chatForm.addEventListener("submit", (e) => {
  //чтобы не обновлять страницу
  e.preventDefault();

  // получить тест сообщения
  let msg = e.target.elements.msg.value;

  msg = msg.trim();
  //не пустое ли сообщение
  if (!msg) {
    return false;
  }

  //Отправка сообщения на сервер
  socket.emit("chatMessage", msg);

  //Очистка ввода
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// формируем и добавляем сообщение в беседу
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += ` <span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

//Добавить название комнаты
function outputRoomName(room) {
  roomName.innerText = room;
}

//Добавить пользователя в DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//покинуть комнату
document.getElementById("leave-btn").addEventListener("click", () => {
  window.location = "../index.html";
});
