import mongoose from "mongoose";
const { Schema, model } = mongoose;

const Message = new Schema({
  id: Number,
  whom: String,
  text: String,
  photos: Array,
  files: Array,
  audio: String,
  reply: Array,
  date: String,
});

export default model("Message", Message);
