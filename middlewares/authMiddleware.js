import jwt from "jsonwebtoken";

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies?.token; // Use optional chaining to avoid undefined errors

    if (!token) {
        return res.redirect("/auth/login");
    }

    try {
        const decoded = jwt.verify(token, "your_secret_key");
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie("token");
        res.redirect("/auth/login");
    }
};
