import express from "express";
import ChatRoom from "./models/ChatRoom.js";
const router = express.Router();

router.get("/", async (req, res) => {
  let chat_room = await ChatRoom.findById(req.query.cr_id);
  if (!chat_room) return res.json({ no_room: true });
  if (!chat_room.whom.includes(req.id)) res.json({ no_access: true });
  else res.json({ messages: chat_room.messages });
});

export default router;
