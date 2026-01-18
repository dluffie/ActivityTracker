import express from 'express';
import Notification from "../models/Notification.js";
import { protectRoute } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get("/", protectRoute, async (req, res) => {
    try {
        const { unreadOnly, page = 1, limit = 20 } = req.query;

        const filter = { recipient: req.user._id };
        if (unreadOnly === "true") filter.read = false;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("sender", "fullName role");

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            read: false
        });

        return res.status(200).json({
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/notifications/:id/read - Mark as read
router.put("/:id/read", protectRoute, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.status(200).json({ message: "Marked as read", notification });

    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", protectRoute, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true }
        );

        return res.status(200).json({ message: "All notifications marked as read" });

    } catch (error) {
        console.error("Error marking all as read:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
