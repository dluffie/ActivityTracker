import express from 'express';
import User from "../models/User.js";
import Rule from "../models/Rule.js";
import Activity from "../models/Activity.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import { protectRoute, isAdmin } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// ==================== RULES MANAGEMENT ====================

// GET /api/admin/rules - Get all rules
router.get("/rules", protectRoute, isAdmin, async (req, res) => {
    try {
        const rules = await Rule.find().sort({ activityType: 1, level: 1 });
        return res.status(200).json({ rules });
    } catch (error) {
        console.error("Error fetching rules:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/admin/rules - Create rule
router.post("/rules", protectRoute, isAdmin, async (req, res) => {
    try {
        const { activityType, level, position, points, description } = req.body;

        if (!activityType || !level || points === undefined) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const rule = new Rule({
            activityType,
            level,
            position: position || "any",
            points,
            description: description || ""
        });

        await rule.save();

        await AuditLog.create({
            actor: req.user._id,
            action: "rule_create",
            targetType: "Rule",
            targetId: rule._id,
            description: `Created rule: ${activityType} - ${level} - ${points} points`
        });

        return res.status(201).json({ message: "Rule created", rule });

    } catch (error) {
        console.error("Error creating rule:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/admin/rules/:id - Update rule
router.put("/rules/:id", protectRoute, isAdmin, async (req, res) => {
    try {
        const { activityType, level, position, points, description, isActive } = req.body;

        const rule = await Rule.findByIdAndUpdate(
            req.params.id,
            {
                activityType,
                level,
                position,
                points,
                description,
                isActive,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!rule) {
            return res.status(404).json({ message: "Rule not found" });
        }

        await AuditLog.create({
            actor: req.user._id,
            action: "rule_update",
            targetType: "Rule",
            targetId: rule._id,
            description: `Updated rule: ${rule.activityType} - ${rule.level}`
        });

        return res.status(200).json({ message: "Rule updated", rule });

    } catch (error) {
        console.error("Error updating rule:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// DELETE /api/admin/rules/:id - Delete rule
router.delete("/rules/:id", protectRoute, isAdmin, async (req, res) => {
    try {
        const rule = await Rule.findByIdAndDelete(req.params.id);

        if (!rule) {
            return res.status(404).json({ message: "Rule not found" });
        }

        await AuditLog.create({
            actor: req.user._id,
            action: "rule_delete",
            targetType: "Rule",
            targetId: req.params.id,
            description: `Deleted rule: ${rule.activityType} - ${rule.level}`
        });

        return res.status(200).json({ message: "Rule deleted" });

    } catch (error) {
        console.error("Error deleting rule:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users
router.get("/users", protectRoute, isAdmin, async (req, res) => {
    try {
        const { role, branch, semester, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (branch) filter.branch = branch.toUpperCase();
        if (semester) filter.semester = semester.toUpperCase();

        const users = await User.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        return res.status(200).json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/admin/users - Create user (for adding teachers/admins)
router.post("/users", protectRoute, isAdmin, async (req, res) => {
    try {
        const { fullName, email, password, registrationNumber, branch, semester, section, dob, role } = req.body;

        if (!fullName || !email || !password || !registrationNumber || !branch || !role) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { registrationNumber }]
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            registrationNumber,
            branch: branch.toUpperCase(),
            semester: semester?.toUpperCase() || "S1",
            section: section?.toUpperCase() || "",
            dob: dob ? new Date(dob) : new Date(),
            role,
            verified: true
        });

        await user.save();

        await AuditLog.create({
            actor: req.user._id,
            action: "admin_action",
            targetType: "User",
            targetId: user._id,
            description: `Created ${role}: ${fullName}`
        });

        return res.status(201).json({
            message: "User created",
            user: { ...user.toObject(), password: undefined }
        });

    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/admin/users/:id - Update user
router.put("/users/:id", protectRoute, isAdmin, async (req, res) => {
    try {
        const { fullName, branch, semester, section, role, verified } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (branch) updateData.branch = branch.toUpperCase();
        if (semester) updateData.semester = semester.toUpperCase();
        if (section !== undefined) updateData.section = section.toUpperCase();
        if (role) updateData.role = role;
        if (verified !== undefined) updateData.verified = verified;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await AuditLog.create({
            actor: req.user._id,
            action: "admin_action",
            targetType: "User",
            targetId: user._id,
            description: `Updated user: ${user.fullName}`
        });

        return res.status(200).json({ message: "User updated", user });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", protectRoute, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Also delete user's activities
        await Activity.deleteMany({ student: req.params.id });

        await AuditLog.create({
            actor: req.user._id,
            action: "admin_action",
            targetType: "User",
            targetId: req.params.id,
            description: `Deleted user: ${user.fullName}`
        });

        return res.status(200).json({ message: "User deleted" });

    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ==================== ANALYTICS ====================

// GET /api/admin/stats - Get system statistics
router.get("/stats", protectRoute, isAdmin, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalTeachers = await User.countDocuments({ role: "teacher" });
        const totalActivities = await Activity.countDocuments();
        const pendingActivities = await Activity.countDocuments({ status: "pending" });
        const approvedActivities = await Activity.countDocuments({ status: "approved" });

        // Activities by type
        const byType = await Activity.aggregate([
            { $group: { _id: "$activityType", count: { $sum: 1 } } }
        ]);

        // Activities by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const byMonth = await Activity.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top students by points
        const topStudents = await User.find({ role: "student" })
            .sort({ totalPoints: -1 })
            .limit(10)
            .select("fullName registrationNumber branch semester totalPoints");

        return res.status(200).json({
            overview: {
                totalStudents,
                totalTeachers,
                totalActivities,
                pendingActivities,
                approvedActivities
            },
            byType,
            byMonth,
            topStudents
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/admin/audit-logs - Get audit logs
router.get("/audit-logs", protectRoute, isAdmin, async (req, res) => {
    try {
        const { action, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (action) filter.action = action;

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("actor", "fullName role");

        const total = await AuditLog.countDocuments(filter);

        return res.status(200).json({
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
