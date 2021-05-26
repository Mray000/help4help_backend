import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import todos from "./src/todos.js";
import messages from "./src/messages.js";
import signup from "./src/signup.js";
import signin from "./src/signin.js";
import profile from "./src/profile.js";
import me from "./src/me.js";
import users from "./src/users.js";
import User from "./src/models/User.js";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import ChatRoom from "./src/models/ChatRoom.js";
import moment from "moment";
import keys from "./src/config/keys.js";
import fs from "fs";
import { loadavg } from "os";

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "http://localhost:3000" } });
const PORT = process.env.PORT || 3010;

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

let connections = {};

//конект пользователя
io.sockets.on("connection", async (socket) => {
  //получение id
  let id = socket.request._query["id"];

  //добавление в коннекты
  if (!connections[id]) connections[id] = socket;

  //получение юзера по id
  let user = await User.findById(id);

  //получние массива юзеров
  let c_r_ids = user.chat_rooms.map((c_r) => c_r.user_id);
  let users_to = await User.find({ _id: { $in: c_r_ids } });

  //создание фильтра
  const filter = (f_t, r_id) => ({
    _id: mongoose.Types.ObjectId(f_t),
    "chat_rooms.id": r_id,
  });

  //сетаю self диалогов
  let chat_rooms_for_connect = [];
  [...user.chat_rooms].forEach((c_r, i) => {
    let user_to = users_to.find((u) => u._id.toString() == c_r.user_id);
    chat_rooms_for_connect.push({
      user_id: c_r.user_id,
      id: c_r.id,
      self: {
        id: user_to._id,
        name_surname: user_to.name + " " + user_to.surname,
        ava: user_to.ava,
        online: user_to.online,
      },
      new_messages: c_r.new_messages,
      unread_messages: c_r.unread_messages,
      last_message: c_r.last_message,
    });
  });

  //отправка даилоговых рум
  socket.emit("connection", chat_rooms_for_connect);

  //отправка коннекта собеседникам
  for (let c_r of user.chat_rooms) {
    let to = c_r.user_id;
    if (connections[to]) connections[to].emit("online_connect", { from: id });
  }

  //сетаем онлайн пользователя
  user.online = "online";
  await user.save();

  //дисконект пользователя
  socket.on("disconnect", () => console.log("Disconnect"));

  socket.on("message", async ({ from, to, message }) => {
    if (connections[to]) connections[to].emit("message", message);
    let user_from = await User.findById(from);
    let user_to = await User.findById(to);
    let room;
    user_from.chat_rooms.forEach((r_f) => {
      user_to.chat_rooms.forEach((r_t) => {
        if (r_t.id === r_f.id) room = r_t.id;
      });
    });
    if (!room) {
      let chat_room = new ChatRoom({
        whom: [from, to],
        messages: [message],
      });
      user_from.chat_rooms.push({
        id: chat_room._id.toString(),
        user_id: to,
        last_message: message,
        unread_messages: 1,
        new_messages: 0,
      });
      user_to.chat_rooms.push({
        id: chat_room._id.toString(),
        user_id: from,
        last_message: message,
        unread_messages: 0,
        new_messages: 1,
      });
      await chat_room.save();
      await user_from.save();
      await user_to.save();
    } else {
      let chat_room = await ChatRoom.findById(room);
      chat_room.messages.push(message);
      await chat_room.save();
      await User.updateOne(filter(from, room), {
        $set: { [`chat_rooms.$.last_message`]: message },
        $inc: { [`chat_rooms.$.unread_messages`]: 1 },
      });
      await User.updateOne(filter(to, room), {
        $set: { [`chat_rooms.$.last_message`]: message },
        $inc: { [`chat_rooms.$.new_messages`]: 1 },
      });
    }
  });

  socket.on("delete_message", async ({ from, d_id, m_ids, u_m }) => {
    let chat_room = await ChatRoom.findById(d_id);
    let to = chat_room.whom.find((id) => id !== from);
    let minus_message = 0;
    let getLastMessage = () =>
      chat_room.messages[chat_room.messages.length - 1];
    let last_message_id = getLastMessage.id;

    m_ids.forEach((m_id) => {
      if (
        [...chat_room.messages].reverse().findIndex((m) => m.id === m_id) < u_m
      )
        minus_message--;
    });

    chat_room.messages = chat_room.messages.filter(
      (m) => !m_ids.includes(m.id)
    );

    if (connections[to])
      connections[to].emit("delete_message", {
        d_id: d_id,
        m_ids: m_ids,
        minus_message: minus_message,
        last_message:
          getLastMessage().id === last_message_id ? null : getLastMessage(),
      });

    await User.updateOne(filter(from, d_id), {
      $inc: { [`chat_rooms.$.unread_messages`]: minus_message },
      $set: { [`chat_rooms.$.last_message`]: getLastMessage() },
    });
    await User.updateOne(filter(to, d_id), {
      $inc: { [`chat_rooms.$.new_messages`]: minus_message },
      $set: { [`chat_rooms.$.last_message`]: getLastMessage() },
    });
    chat_room.save();
  });

  socket.on("edit_message", async ({ from, to, d_id, m_id, new_text }) => {
    if (connections[to])
      connections[to].emit("edit_message", {
        from: from,
        m_id: m_id,
        new_text,
      });
    await User.updateOne(filter(from, d_id), {
      $set: { [`chat_rooms.$.last_message.text`]: new_text },
    });
    await User.updateOne(filter(to, d_id), {
      $set: { [`chat_rooms.$.last_message.text`]: new_text },
    });
    await ChatRoom.updateOne(
      {
        _id: mongoose.Types.ObjectId(d_id),
        "messages.id": m_id,
      },
      { $set: { [`messages.$.text`]: new_text } }
    );
  });

  socket.on("typing", async ({ from, to, type }) => {
    if (connections[to])
      connections[to].emit("typing", { from: from, type: type });
  });

  socket.on("not_typing", async ({ from, to }) => {
    if (connections[to]) connections[to].emit("not_typing", { from: from });
  });

  socket.on("message_read", async ({ from, to, chat_room_id }) => {
    if (connections[to]) connections[to].emit("message_read", { from: from });

    await User.updateOne(filter(from, chat_room_id), {
      $set: { [`chat_rooms.$.new_messages`]: 0 },
    });
    await User.updateOne(filter(to, chat_room_id), {
      $set: { [`chat_rooms.$.unread_messages`]: 0 },
    });
  });
  socket.on("video", async ({ img, to }) => {
    if (connections[to]) connections[to].emit("video", { img: img });
  });
});

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.text());

//дисконект
app.use("/disconnect", async (req, res, next) => {
  //получение id
  let id = JSON.parse(req.body).id;
  console.log(id);
  if (id) {
    //удаление из коннектов
    delete connections[id];
    //получение юзера по id
    let user = await User.findById(id);
    //получение даты
    let date = moment().format("MMMM D YYYY HH:mm");
    for (let c_r of user.chat_rooms) {
      let to = c_r.user_id;
      if (connections[to])
        connections[to].emit("online_disconnect", { from: id, date: date });
    }
    user.online = date;
    user.save();
  }
});

app.use(async (req, res, next) => {
  if (req.headers.autorisation !== "") {
    let date = jwt.decode(req.headers.autorisation);
    let user = await User.findOne({ email: date?.email });
    if (user && user.password == date?.password) {
      req.id = user.id;
      next();
    } else res.json({ no_token: true });
  } else next();
});

app.use("/todo", todos);
app.use("/messages", messages);
app.use("/signup", signup);
app.use("/signin", signin);
app.use("/me", me);
app.use("/profile/", profile);
app.use("/users", users);
await mongoose
  .connect(
    "mongodb://127.0.0.1:27017/?compressors=zlib&gssapiServiceName=mongodb",
    { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true }
  )
  .catch(console.log);

server.listen(PORT, () => console.log("Start..."));
