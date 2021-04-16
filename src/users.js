import express from "express";
import User from "./models/User.js";
const router = express.Router();

router.post("/", async (req, res) => {
  let user = await User.findById(req.body.id);
  let to_learn = user.subjects.to_learn;
  let to_teach = user.subjects.to_teach;
  let users = await User.find({});
  let suitable_users = users
    .filter(
      (u) =>
        to_learn.filter((s) => u.subjects.to_teach.includes(s)).length ||
        to_teach.filter((s) => u.subjects.to_learn.includes(s)).length
    )
    .sort((u) =>
      to_learn.filter((s) => u.subjects.to_teach.includes(s)).length &&
      to_teach.filter((s) => u.subjects.to_learn.includes(s)).length
        ? -1
        : 1
    );

  res.json(
    suitable_users.map((u) => ({
      id: u._id,
      subjects: u.subjects,
      name: u.name,
      surname: u.surname,
      country: u.country,
      birthday: u.birthday,
      email: u.email,
      ava: u.ava,
      online: u.online,
    }))
  );
});

export default router;
