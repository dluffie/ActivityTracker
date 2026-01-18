import express from 'express';
import User from "../models/User.js";
import NewUser from "../models/NewUser.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { protectRoute, isTeacher, isTeacherOrAdmin } from "../middleware/auth.js";
import nodemailer from "nodemailer";
import { BRANCHES, SEMESTERS, SECTIONS } from "./authRoutes.js";

const router = express.Router();

// POST /api/teacher/subscribe-classes - Subscribe to classes
router.post("/subscribe-classes", protectRoute, isTeacher, async (req, res) => {
    try {
        const { classes } = req.body;

        if (!classes || !Array.isArray(classes) || classes.length === 0) {
            return res.status(400).json({ message: "Please select at least one class" });
        }

        // Validate classes
        for (const c of classes) {
            if (!c.branch || !c.semester) {
                return res.status(400).json({ message: "Each class must have branch and semester" });
            }
            if (!BRANCHES.includes(c.branch.toUpperCase())) {
                return res.status(400).json({ message: `Invalid branch: ${c.branch}` });
            }
            if (!SEMESTERS.includes(c.semester.toUpperCase())) {
                return res.status(400).json({ message: `Invalid semester: ${c.semester}` });
            }
        }

        // Format classes
        const formattedClasses = classes.map(c => ({
            branch: c.branch.toUpperCase(),
            semester: c.semester.toUpperCase(),
            section: c.section?.toUpperCase() || ""
        }));

        await User.findByIdAndUpdate(req.user._id, {
            $set: { subscribedClasses: formattedClasses }
        });

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "class_subscribe",
            targetType: "User",
            targetId: req.user._id,
            description: `Subscribed to ${formattedClasses.length} classes`
        });

        return res.status(200).json({
            message: "Classes subscribed successfully",
            subscribedClasses: formattedClasses
        });

    } catch (error) {
        console.error("Error subscribing to classes:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/teacher/my-classes - Get subscribed classes
router.get("/my-classes", protectRoute, isTeacher, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("subscribedClasses");
        return res.status(200).json({ classes: user.subscribedClasses || [] });
    } catch (error) {
        console.error("Error getting classes:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/teacher/students - Get students from subscribed classes
router.get("/students", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { branch, semester, section, page = 1, limit = 20 } = req.query;

        let filter = { role: "student" };

        // For teachers, filter by subscribed classes
        if (req.user.role === "teacher" && req.user.subscribedClasses?.length > 0) {
            const classConditions = req.user.subscribedClasses.map(c => ({
                branch: c.branch,
                semester: c.semester,
                ...(c.section && { section: c.section })
            }));
            filter.$or = classConditions;
        }

        // Apply additional filters
        if (branch) filter.branch = branch.toUpperCase();
        if (semester) filter.semester = semester.toUpperCase();
        if (section) filter.section = section.toUpperCase();

        const students = await User.find(filter)
            .select("-password")
            .sort({ registrationNumber: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        return res.status(200).json({
            students,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/teacher/pending-registrations - Get pending student registrations
router.get("/pending-registrations", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        let filter = { verified: false };

        // For teachers, filter by subscribed classes
        if (req.user.role === "teacher" && req.user.subscribedClasses?.length > 0) {
            const classConditions = req.user.subscribedClasses.map(c => ({
                branch: c.branch,
                semester: c.semester
            }));
            filter.$or = classConditions;
        }

        const pendingUsers = await NewUser.find(filter)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await NewUser.countDocuments(filter);

        return res.status(200).json({
            users: pendingUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching pending registrations:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/teacher/dashboard-stats - Get dashboard statistics
router.get("/dashboard-stats", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        // Get student IDs from subscribed classes
        let studentFilter = { role: "student" };

        if (req.user.role === "teacher" && req.user.subscribedClasses?.length > 0) {
            const classConditions = req.user.subscribedClasses.map(c => ({
                branch: c.branch,
                semester: c.semester,
                ...(c.section && { section: c.section })
            }));
            studentFilter.$or = classConditions;
        }

        const students = await User.find(studentFilter).select("_id");
        const studentIds = students.map(s => s._id);

        // Get activity counts
        const pendingActivities = await Activity.countDocuments({
            student: { $in: studentIds },
            status: "pending"
        });

        const approvedActivities = await Activity.countDocuments({
            student: { $in: studentIds },
            status: "approved"
        });

        const rejectedActivities = await Activity.countDocuments({
            student: { $in: studentIds },
            status: "rejected"
        });

        // Recent activities
        const recentActivities = await Activity.find({
            student: { $in: studentIds }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("student", "fullName registrationNumber");

        return res.status(200).json({
            stats: {
                totalStudents: students.length,
                pendingActivities,
                approvedActivities,
                rejectedActivities
            },
            recentActivities
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/teacher/send-reminder - Send email reminder to students
router.post("/send-reminder", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { recipients, recipientType, subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: "Subject and message are required" });
        }

        let users = [];

        // Support recipientType for batch operations (from SendReminders component)
        if (recipientType) {
            // Build student filter based on teacher's subscribed classes
            let studentFilter = { role: "student" };

            if (req.user.role === "teacher" && req.user.subscribedClasses?.length > 0) {
                const classConditions = req.user.subscribedClasses.map(c => ({
                    branch: c.branch,
                    semester: c.semester,
                    ...(c.section && { section: c.section })
                }));
                studentFilter.$or = classConditions;
            }

            // Apply recipient type filters
            if (recipientType === 'low_points') {
                studentFilter.totalPoints = { $lt: 30 }; // Less than half of required 60 points
            } else if (recipientType === 'no_activities') {
                // Find students with no activities
                const studentsWithActivities = await Activity.distinct("student");
                studentFilter._id = { $nin: studentsWithActivities };
            }
            // 'all' doesn't need additional filters

            users = await User.find(studentFilter).select("email fullName");
        } else if (recipients && Array.isArray(recipients) && recipients.length > 0) {
            // Support explicit recipients array (backward compatibility)
            users = await User.find({ _id: { $in: recipients } }).select("email fullName");
        } else {
            return res.status(400).json({ message: "Please select recipients or recipient type" });
        }

        // Get recipient emails (kept from original)

        if (users.length === 0) {
            return res.status(400).json({ message: "No valid recipients found" });
        }

        // Send emails
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const emailPromises = users.map(user =>
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Hello ${user.fullName},</h2>
                        <div style="color: #555; line-height: 1.6;">
                            ${message}
                        </div>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #888; font-size: 12px;">
                            This email was sent from the Activity Point Management System.
                        </p>
                    </div>
                `
            })
        );

        await Promise.all(emailPromises);

        // Create notifications
        const notifications = users.map(user => ({
            type: "reminder",
            recipient: user._id,
            sender: req.user._id,
            title: subject,
            message: message.substring(0, 200),
            emailSent: true
        }));

        await Notification.insertMany(notifications);

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "send_reminder",
            targetType: "Notification",
            description: `Sent reminder to ${users.length} students: ${subject}`
        });

        return res.status(200).json({
            message: `Reminder sent to ${users.length} students`
        });

    } catch (error) {
        console.error("Error sending reminder:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
