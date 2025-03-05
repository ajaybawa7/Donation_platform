import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import flash from "connect-flash";
import passport from "passport";
import { fileURLToPath } from "url";
import { dirname } from "path";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import campaignRoutes from "./routes/campaignRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import pool from "./config/db.js";  // ✅ Ensure this import is correct

dotenv.config();

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ Check database connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully");
        connection.release();
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1); // Stop execution if DB fails
    }
})();

// ✅ Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(cookieParser());
app.use(express.static("public"));

// ✅ Set View Engine
app.set("view engine", "ejs");

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/donations", donationRoutes);
app.use("/dashboard", dashboardRoutes);

// ✅ Default Homepage Route
app.get("/", (req, res) => {
    res.render("index");
});

// ✅ Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
