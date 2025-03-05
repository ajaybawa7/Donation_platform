import express from "express";
import { authenticateUser } from "../controllers/authController.js";

const router = express.Router();

router.get("/", authenticateUser, (req, res) => {
    res.render("dashboard", { user: req.session.user });
});

export default router;
