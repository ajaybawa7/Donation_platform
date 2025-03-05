import express from "express";
import { showRegisterPage, showLoginPage, register, login } from "../controllers/authController.js";
import { body } from "express-validator";

const router = express.Router();

// ✅ Show Register & Login Pages
router.get("/register", showRegisterPage);
router.get("/login", showLoginPage);

// ✅ Register User (Donor/Admin)
router.post("/register", [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["admin", "donor"]).withMessage("Role must be admin or donor")
], register);

// ✅ Login User
router.post("/login", [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
], login);

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});


export default router;
