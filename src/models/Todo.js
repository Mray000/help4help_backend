import mongoose from "mongoose";
const { Schema, model } = mongoose;

const Todo = new Schema({
  todo: String,
  completed: Boolean,
});

export default model("Todo", Todo);
