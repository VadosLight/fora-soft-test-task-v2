const moment = require("moment");

//возвращаем подготовленное сообщение с датой, логином и сообщением
function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format("HH:mm"),
  };
}

module.exports = formatMessage;
