import express from "express";
import User from "./models/User.js";
import moment from "moment";
const router = express.Router();

router.post("/", async (req, res) => {
  let user = await User.findById(req.body.id);
  let to_learn = user.subjects.to_learn;
  let to_teach = user.subjects.to_teach;
  let users = await User.find({});
  let filter = req.body.filter;
  let suitable_users = filter.smart
    ? users
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
        )
        .filter(
          (u) =>
            (u.name + " " + u.surname)
              .toLowerCase()
              .includes(filter.fullname.toLowerCase()) &&
            u.country.toLowerCase().includes(filter.country.toLowerCase()) &&
            Number(moment().diff(moment(u.birthday), "years")) >= filter.age
        )
    : users.filter(
        (u) =>
          (u.name + " " + u.surname)
            .toLowerCase()
            .includes(filter.fullname.toLowerCase()) &&
          u.country.toLowerCase().includes(filter.country.toLowerCase()) &&
          Number(moment().diff(moment(u.birthday), "years")) >= filter.age
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
