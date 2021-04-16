import mongoose from "mongoose";
const { Schema, model } = mongoose;

const User = new Schema({
  _id: mongoose.Types.ObjectId,
  name: String,
  surname: String,
  ava: String || null,
  email: String,
  password: String,
  country: String,
  birthday: String,
  online: String,
  subjects: {
    to_learn: Array,
    to_teach: Array,
  },
  reviews: Array,
  chat_rooms: Array,
});

export default model("User", User);
