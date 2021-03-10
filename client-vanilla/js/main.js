const chatMessages = document.querySelector(".chat-messages");
const chatForm = document.getElementById("chat-form");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const popup = document.getElementById("pop-up");
const popInput = document.getElementById("pop__input");
const popBtn = document.getElementById("pop__btn");
const copyBtn = document.getElementById("copy-btn");

const videoBtn = document.getElementById("join-video-btn");
const videoList = document.getElementById("video-list");

// Получаем логин и комнату из урла
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

if (!username) {
  popup.style.display = "block";
} else {
  popup.style.display = "none";
}

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

  const splitStr = message.text.split(" ");
  splitStr.forEach((subStr) => {
    if (validURL(subStr)) {
      para.innerHTML += `<a href="${subStr}">${subStr}</a> `;
    } else {
      para.innerHTML += `<span>${subStr}</span> `;
    }
  });

  div.appendChild(para);

  document.querySelector(".chat-messages").appendChild(div);
}

//проверка строк на ссылки
function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
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

popBtn.addEventListener("click", (e) => {
  if (popInput.value) {
    e.preventDefault();
    window.location.href = `http://188.134.69.199:3000/chat.html?room=${room}&username=${popInput.value}`;
  }
});

copyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const inputField = document.getElementById("msg");
  const tmp = inputField.value;
  inputField.value = `http://188.134.69.199:3000/chat.html?room=${room}`;
  inputField.select();
  document.execCommand("copy");
  alert("Ссылка скопирована: " + inputField.value);
  inputField.value = tmp;
});
