import express from 'express';
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import Rule from "../models/Rule.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { protectRoute, isTeacherOrAdmin } from "../middleware/auth.js";
import cloudinary from "../lib/cloudinary.js";
import { extractActivityFromDocument } from "../lib/gemini.js";

const router = express.Router();

// GET /api/activity/featured - Public: Get featured activities for blog
router.get("/featured", async (req, res) => {
    try {
        const activities = await Activity.find({
            featuredOnBlog: true,
            status: "approved"
        })
            .sort({ verifiedAt: -1 })
            .limit(12)
            .populate("student", "fullName profileImage branch semester");

        return res.status(200).json({ activities });
    } catch (error) {
        console.error("Error fetching featured activities:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

// POST /api/activity/ai-extract - Extract activity details from document using AI
router.post("/ai-extract", protectRoute, async (req, res) => {
    try {
        const { docBase64 } = req.body;

        if (!docBase64) {
            return res.status(400).json({ message: "No document provided" });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
            return res.status(500).json({ message: "AI extraction is not configured. Please set GEMINI_API_KEY." });
        }

        // Rate limiting: 3 per day, 1 hour cooldown between uses
        const user = await User.findById(req.user._id);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Filter to only today's extractions
        const todayExtractions = (user.aiExtractions || []).filter(
            (date) => new Date(date) >= todayStart
        );

        // Check daily limit (3 per day)
        if (todayExtractions.length >= 3) {
            return res.status(429).json({
                message: "Daily AI extraction limit reached (3/day). Try again tomorrow.",
                remaining: 0,
                resetAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
            });
        }

        // Check 1-hour cooldown
        if (todayExtractions.length > 0) {
            const lastExtraction = new Date(Math.max(...todayExtractions.map(d => new Date(d).getTime())));
            const hoursSince = (now - lastExtraction) / (1000 * 60 * 60);

            if (hoursSince < 1) {
                const nextAvailable = new Date(lastExtraction.getTime() + 60 * 60 * 1000);
                const minutesLeft = Math.ceil((nextAvailable - now) / (1000 * 60));
                return res.status(429).json({
                    message: `Please wait ${minutesLeft} minute(s) before next AI extraction.`,
                    remaining: 3 - todayExtractions.length,
                    nextAvailableAt: nextAvailable
                });
            }
        }

        const extractedData = await extractActivityFromDocument(docBase64);

        // Record this extraction
        await User.findByIdAndUpdate(req.user._id, {
            $push: { aiExtractions: now }
        });

        return res.status(200).json({
            message: "Document analyzed successfully",
            data: extractedData,
            remaining: 3 - todayExtractions.length - 1
        });

    } catch (error) {
        console.error("AI extraction error:", error);

        // Return clean error message — don't leak raw error details to frontend
        const msg = error.message || "";
        if (msg.includes("rate-limited") || msg.includes("quota")) {
            return res.status(503).json({
                message: "AI service is temporarily busy. Please try again in a few minutes."
            });
        }
        if (msg.includes("unavailable") || msg.includes("access denied")) {
            return res.status(503).json({
                message: "AI extraction service is currently unavailable. Please fill the form manually."
            });
        }

        return res.status(500).json({
            message: error.message || "AI extraction failed. Please try filling the form manually."
        });
    }
});

// Helper: Calculate suggested points based on rules
const calculatePoints = async (activityType, level, position) => {
    const rule = await Rule.findOne({
        activityType,
        level,
        $or: [
            { position },
            { position: "any" }
        ],
        isActive: true
    });
    return rule ? rule.points : 0;
};

// POST /api/activity/upload - Upload activity document and create activity
router.post("/upload", protectRoute, async (req, res) => {
    try {
        const {
            activityType,
            eventName,
            description,
            level,
            position,
            organization,
            startDate,
            endDate,
            uploadMode,
            docBase64,
            studentId // Optional: for faculty submissions
        } = req.body;

        // Determine if this is a teacher/admin submission for a student
        const isTeacherSubmission = studentId && (req.user.role === "teacher" || req.user.role === "admin");

        // Validation - docBase64 is optional for teacher submissions
        if (!activityType || !eventName || !level || !startDate) {
            return res.status(400).json({ message: "Required fields missing" });
        }
        if (!isTeacherSubmission && !docBase64) {
            return res.status(400).json({ message: "Document is required" });
        }

        // Determine which student this activity is for
        let targetStudentId = req.user._id;
        let submittedByRole = req.user.role;

        // If teacher/admin is submitting for a student
        if (isTeacherSubmission) {
            const student = await User.findById(studentId);
            if (!student || student.role !== "student") {
                return res.status(400).json({ message: "Invalid student" });
            }
            targetStudentId = studentId;
        }

        // Upload document to Cloudinary (if provided)
        let docUrl = "";
        let docPublicId = "";
        if (docBase64) {
            const uploadResult = await cloudinary.uploader.upload(docBase64, {
                folder: "activity_documents",
                resource_type: "auto"
            });
            docUrl = uploadResult.secure_url;
            docPublicId = uploadResult.public_id;
        }

        // Calculate suggested points
        const pointsSuggested = await calculatePoints(activityType, level, position || "participant");

        // For teacher submissions: auto-approve
        const activityStatus = isTeacherSubmission ? "approved" : "pending";
        const pointsAssigned = isTeacherSubmission ? pointsSuggested : 0;

        // Create activity
        const activity = new Activity({
            student: targetStudentId,
            submittedBy: req.user._id,
            submittedByRole,
            uploadMode: uploadMode || "manual",
            activityType,
            eventName,
            description: description || "",
            level,
            position: position || "",
            organization: organization || "",
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            pointsSuggested,
            pointsAssigned,
            docUrl: docUrl || "https://via.placeholder.com/400x300?text=No+Document",
            docPublicId: docPublicId || "",
            status: activityStatus,
            ...(isTeacherSubmission && {
                verifiedBy: req.user._id,
                verifiedAt: new Date()
            })
        });

        await activity.save();

        // If teacher submission: update student points and send notification
        if (isTeacherSubmission) {
            // Update student's total points
            await User.findByIdAndUpdate(targetStudentId, {
                $inc: { totalPoints: pointsAssigned }
            });

            // Create notification for student
            await Notification.create({
                type: "teacher_submission",
                recipient: targetStudentId,
                sender: req.user._id,
                title: "Activity Submitted by Teacher",
                message: `Your teacher ${req.user.fullName} submitted and approved "${eventName}" with ${pointsAssigned} points.`,
                link: `/student/activities`
            });
        }

        // Create audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "activity_create",
            targetType: "Activity",
            targetId: activity._id,
            description: `Activity "${eventName}" created${isTeacherSubmission ? ' (auto-approved by teacher)' : ''}`
        });

        return res.status(201).json({
            message: isTeacherSubmission
                ? "Activity submitted and approved for student"
                : "Activity submitted successfully",
            activity
        });

    } catch (error) {
        console.error("Error uploading activity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/activity/my - Get current user's activities
router.get("/my", protectRoute, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;

        const filter = { student: req.user._id };
        if (status) filter.status = status;
        if (type) filter.activityType = type;

        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("verifiedBy", "fullName")
            .populate("submittedBy", "fullName role");

        const total = await Activity.countDocuments(filter);

        return res.status(200).json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching activities:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/activity/pending - Get activities for teachers (supports status filter)
router.get("/pending", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { branch, semester, section, type, status = "pending", page = 1, limit = 10 } = req.query;

        // Build student filter based on teacher's subscribed classes
        let studentFilter = {};

        if (req.user.role === "teacher" && req.user.subscribedClasses?.length > 0) {
            const classConditions = req.user.subscribedClasses.map(c => ({
                branch: c.branch,
                semester: c.semester,
                ...(c.section && { section: c.section })
            }));
            studentFilter = { $or: classConditions };
        }

        // Apply additional filters
        if (branch) studentFilter.branch = branch;
        if (semester) studentFilter.semester = semester;
        if (section) studentFilter.section = section;

        // Get students matching filter
        const students = await User.find({ ...studentFilter, role: "student" }).select("_id");
        const studentIds = students.map(s => s._id);

        // Build activity filter - accept status filter or default to pending
        const activityFilter = {
            student: { $in: studentIds }
        };
        // Only add status filter if it's not 'all'
        if (status && status !== 'all') {
            activityFilter.status = status;
        }
        if (type) activityFilter.activityType = type;

        const activities = await Activity.find(activityFilter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate("student", "fullName registrationNumber branch semester section")
            .populate("submittedBy", "fullName role");

        const total = await Activity.countDocuments(activityFilter);

        return res.status(200).json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching pending activities:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/activity/:id - Get single activity
router.get("/:id", protectRoute, async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate("student", "fullName registrationNumber branch semester section email")
            .populate("submittedBy", "fullName role")
            .populate("verifiedBy", "fullName");

        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        // Check access: student can only view their own, teachers can view subscribed classes
        if (req.user.role === "student" && activity.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.status(200).json({ activity });

    } catch (error) {
        console.error("Error fetching activity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/activity/approve/:id - Approve activity
router.post("/approve/:id", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { pointsAssigned, comments, featuredOnBlog } = req.body;

        const activity = await Activity.findById(req.params.id)
            .populate("student");

        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        if (activity.status !== "pending" && activity.status !== "correction_needed") {
            return res.status(400).json({ message: "Activity already processed" });
        }

        // Update activity
        activity.status = "approved";
        activity.pointsAssigned = pointsAssigned || activity.pointsSuggested;
        activity.teacherComments = comments || "";
        activity.verifiedBy = req.user._id;
        activity.verifiedAt = new Date();
        if (featuredOnBlog !== undefined) activity.featuredOnBlog = featuredOnBlog;
        await activity.save();

        // Update student's total points
        await User.findByIdAndUpdate(activity.student._id, {
            $inc: { totalPoints: activity.pointsAssigned }
        });

        // Create notification for student
        await Notification.create({
            type: "approval",
            recipient: activity.student._id,
            sender: req.user._id,
            title: "Activity Approved!",
            message: `Your activity "${activity.eventName}" has been approved with ${activity.pointsAssigned} points.`,
            link: `/activities/${activity._id}`
        });

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "activity_approve",
            targetType: "Activity",
            targetId: activity._id,
            description: `Approved activity with ${activity.pointsAssigned} points`
        });

        return res.status(200).json({ message: "Activity approved", activity });

    } catch (error) {
        console.error("Error approving activity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/activity/edit/:id - Edit approved activity (update points/comments)
router.put("/edit/:id", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { pointsAssigned, teacherComments, featuredOnBlog } = req.body;

        const activity = await Activity.findById(req.params.id)
            .populate("student");

        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        if (activity.status !== "approved") {
            return res.status(400).json({ message: "Can only edit approved activities" });
        }

        const oldPoints = activity.pointsAssigned || 0;
        const newPoints = pointsAssigned !== undefined ? parseInt(pointsAssigned) : oldPoints;
        const pointDifference = newPoints - oldPoints;

        // Update activity
        activity.pointsAssigned = newPoints;
        if (teacherComments !== undefined) {
            activity.teacherComments = teacherComments;
        }
        if (featuredOnBlog !== undefined) {
            activity.featuredOnBlog = featuredOnBlog;
        }
        await activity.save();

        // Update student's total points if changed
        if (pointDifference !== 0) {
            await User.findByIdAndUpdate(activity.student._id, {
                $inc: { totalPoints: pointDifference }
            });
        }

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "activity_edit",
            targetType: "Activity",
            targetId: activity._id,
            description: `Edited activity: ${oldPoints} -> ${newPoints} points`
        });

        return res.status(200).json({ message: "Activity updated", activity });

    } catch (error) {
        console.error("Error editing activity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/activity/reject/:id - Reject activity
router.post("/reject/:id", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        activity.status = "rejected";
        activity.teacherComments = reason;
        activity.verifiedBy = req.user._id;
        activity.verifiedAt = new Date();
        await activity.save();

        // Create notification
        await Notification.create({
            type: "rejection",
            recipient: activity.student,
            sender: req.user._id,
            title: "Activity Rejected",
            message: `Your activity "${activity.eventName}" was rejected. Reason: ${reason}`,
            link: `/activities/${activity._id}`
        });

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "activity_reject",
            targetType: "Activity",
            targetId: activity._id,
            description: `Rejected activity: ${reason}`
        });

        return res.status(200).json({ message: "Activity rejected", activity });

    } catch (error) {
        console.error("Error rejecting activity:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/activity/correction/:id - Request correction
router.post("/correction/:id", protectRoute, isTeacherOrAdmin, async (req, res) => {
    try {
        const { comments } = req.body;

        if (!comments) {
            return res.status(400).json({ message: "Correction comments are required" });
        }

        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        activity.status = "correction_needed";
        activity.teacherComments = comments;
        await activity.save();

        // Create notification
        await Notification.create({
            type: "correction",
            recipient: activity.student,
            sender: req.user._id,
            title: "Correction Needed",
            message: `Your activity "${activity.eventName}" needs correction: ${comments}`,
            link: `/activities/${activity._id}`
        });

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "activity_correction",
            targetType: "Activity",
            targetId: activity._id,
            description: `Requested correction: ${comments}`
        });

        return res.status(200).json({ message: "Correction requested", activity });

    } catch (error) {
        console.error("Error requesting correction:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/activity/stats/me - Get student's activity statistics
router.get("/stats/me", protectRoute, async (req, res) => {
    try {
        const stats = await Activity.aggregate([
            { $match: { student: req.user._id } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    points: { $sum: "$pointsAssigned" }
                }
            }
        ]);

        const byType = await Activity.aggregate([
            { $match: { student: req.user._id, status: "approved" } },
            {
                $group: {
                    _id: "$activityType",
                    count: { $sum: 1 },
                    points: { $sum: "$pointsAssigned" }
                }
            }
        ]);

        return res.status(200).json({
            byStatus: stats,
            byType
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
