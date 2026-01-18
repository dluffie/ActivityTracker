import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify JWT token
export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (!user.verified) {
            return res.status(401).json({ message: "Account not verified" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};

// Check if user is a student
export const isStudent = (req, res, next) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
    }
    next();
};

// Check if user is a teacher
export const isTeacher = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Teachers only." });
    }
    next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

// Teacher or Admin
export const isTeacherOrAdmin = (req, res, next) => {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Teachers or Admins only." });
    }
    next();
};
