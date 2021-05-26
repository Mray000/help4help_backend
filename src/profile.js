import express from "express";
import mongoose from "mongoose";
import User from "./models/User.js";
const router = express.Router();

router.get("/:id", async (req, res) => {
  if (mongoose.Types.ObjectId.isValid(req.params.id)) {
    let user = await User.findById(req.params.id);
    if (!user) res.json({ no_user: true });
    else {
      if (user.reviews.length) {
        let review_ids = user.reviews.map((r) => r.id);
        let users_review = (await User.find({ _id: { $in: review_ids } })).sort(
          (u) => u._id.toString()
        );

        user.reviews
          .sort((r) => r.id)
          .forEach((r, i) => {
            let user_review = users_review[i];
            r.profile = {
              id: user_review._id,
              name_surname: user_review.name + " " + user_review.surname,
              ava: user_review.ava,
            };
          });
      }

      User.find();
      res.json({
        id: user._id,
        name: user.name,
        surname: user.surname,
        ava: user.ava,
        email: user.email,
        country: user.country,
        birthday: user.birthday,
        online: user.online,
        subjects: {
          to_learn: user.subjects.to_learn,
          to_teach: user.subjects.to_teach,
        },
        reviews: user.reviews,
      });
    }
  } else res.json({ no_user: true });
});

router.put("/photo", async (req, res) => {
  res.send("Ok!");
  await User.findByIdAndUpdate(req.id, { ava: req.body.ava });
});

router.post("/review", async (req, res) => {
  res.send("Ok!");
  await User.findByIdAndUpdate(req.body.to, {
    $push: { reviews: { id: req.id, review: req.body.review } },
  });
});

export default router;
