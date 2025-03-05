import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { validationResult } from "express-validator";

// ✅ Show Register Page
export const showRegisterPage = (req, res) => {
    res.render("auth/register", { error: null });
};

// ✅ Show Login Page
export const showLoginPage = (req, res) => {
    res.render("auth/login", { error: null });
};

// ✅ User Registration
export const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Password Regex: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character." });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
            [name, email, hashedPassword, role]
        );

        res.redirect("/auth/login"); // ✅ Redirect to login page after successful registration

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};
// ✅ User Login
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.render("auth/login", { error: "Invalid email or password" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("auth/login", { error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "your_secret_key",
            { expiresIn: "1h" }
        );

        req.session.token = token; // ✅ Store token in session
        req.session.user = { id: user.id, name: user.name, role: user.role };

        res.redirect("/dashboard"); // ✅ Redirect to dashboard after login

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Middleware to Protect Routes
export const authenticateUser = (req, res, next) => {
    if (!req.session.token) {
        return res.redirect("/auth/login"); // Redirect if not logged in
    }
    next();
};

// ✅ Middleware to Check User Role
export const checkRole = (role) => {
    return (req, res, next) => {
        if (req.session.user.role !== role) {
            return res.status(403).json({ message: "Access Denied" });
        }
        next();
    };
};
