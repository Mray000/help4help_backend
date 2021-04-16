import express from "express";
import Todo from "./models/Todo.js";
const router = express.Router();

router
  .route("/")
  .post(async (req, res) => {
    let todo = new Todo({
      todo: req.body.todo,
      completed: false,
    });
    await todo.save();
    res.json(todo);
  })
  .get(async (req, res) => res.json(await Todo.find({})))
  .delete((req, res) =>
    Todo.findByIdAndDelete(req.query.id).then(() => res.send("Ok!"))
  )
  .put(async (req, res) => {
    let todo = await Todo.findById(req.query.id);
    todo.completed = !todo.completed;
    await todo.save();
    res.send("Ok!");
  });

export default router;
