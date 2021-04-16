import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChatRoom = new Schema({
  whom: Array,
  messages: Array,
});

export default model("ChatRoom", ChatRoom);
