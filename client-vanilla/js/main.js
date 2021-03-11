const chatMessages = document.querySelector(".chat-messages");
const popInput = document.getElementById("pop__input");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const popup = document.getElementById("pop-up");

const CURR_URL = window.location.protocol + "//" + window.location.host + "/";

const videoBtn = document.getElementById("join-video-btn");
const videoList = document.getElementById("video-list");

// Получаем логин и комнату из урла
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//если пользователь пришел без логина (по приглашению),
//то открываем попап
if (!username) {
  popup.style.display = "block";
} else {
  popup.style.display = "none";
}

const socket = io();

const constraints = (window.constraints = {
  audio: false,
  video: true,
});

function handleSuccess(stream) {
  const video = document.querySelector("video");
  const videoTracks = stream.getVideoTracks();
  console.log("Got stream with constraints:", constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream;
  video.srcObject = stream;
}

async function init(e) {


  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    console.log("Что-то пошло не так " + e);
    // TypeError: Cannot read property 'getUserMedia' of undefined
    //нужно получить SSL сертификат
  }
}

//видео инит
videoBtn.addEventListener("click", (e) => {
  init(e);
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
document.getElementById("chat-form").addEventListener("submit", (e) => {
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

  //разбиваем текст на слова для поиска ссылок
  const splitStr = message.text.split(" ");
  //пословно формируем сообщение, чтобы ссылки были кликабельными
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

//является ли слово ссылкой
function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
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

//покинуть комнату / переходим на главный экран
document.getElementById("leave-btn").addEventListener("click", () => {
  window.location = "../index.html";
});

//слушаем кнопку на попапе, ожидаем, что пользователь ввел свой логин
document.getElementById("pop__btn").addEventListener("click", (e) => {
  if (popInput.value) {
    e.preventDefault();
    window.location.href = `${CURR_URL}chat.html?room=${room}&username=${popInput.value}`;
  }
});

//кнопка для копирования ссылки в комнату в буфер обмена
document.getElementById("copy-btn").addEventListener("click", (e) => {
  const inputField = document.getElementById("msg");
  const tmp = inputField.value;
  inputField.value = `${CURR_URL}chat.html?room=${room}`;
  inputField.select();
  document.execCommand("copy");
  alert("Ссылка скопирована: " + inputField.value);
  inputField.value = tmp;
});
