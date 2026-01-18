import express from 'express';
import cors from 'cors';
import "dotenv/config";
import { connectDB } from './lib/db.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: "50mb" })); // Increased for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/user", userRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});