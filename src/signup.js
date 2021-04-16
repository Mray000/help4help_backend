import express from "express";
import Email from "email-templates";
import User from "./models/User.js";
const router = express.Router();
import path from "path";
const __dirname = path.resolve();
const root = path.join(__dirname, "src");
router.post("/", async (req, res) => {
  if (!(await User.findOne({ email: req.body.email }))) {
    const email = new Email({
      views: { root },
      send: true,
      preview: false,
      message: { from: "Help4Help" },
      transport: {
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "ainurhabibullin0@gmail.com",
          pass: "qazplm123456",
        },
      },
    });
    email.send({
      template: "mars",
      message: { to: req.body.email },
      locals: {
        name: req.body.name,
        email: req.body.email,
      },
    });
    router.get("/confirm", async (req1, res1) => {
      if (req1.query.email === req.body.email) {
        res1.redirect("http://localhost:3000/login");
        let user = new User(req.body);
        await user.save();
      }
    });
    res.send("Ok!");
  } else res.json({ is_registrate: true });
});

export default router;
