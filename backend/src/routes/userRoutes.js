import express from 'express';
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import { protectRoute } from "../middleware/auth.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

// GET /api/user/profile - Get current user's profile
router.get("/profile", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// PUT /api/user/profile - Update profile
router.put("/profile", protectRoute, async (req, res) => {
    try {
        const { semester, section, phone, profileImage } = req.body;

        const updateData = {};
        let profileFieldsChanged = false; // Track if non-photo fields changed

        // Students can update semester (lifecycle change)
        if (semester && semester.toUpperCase() !== req.user.semester) {
            updateData.semester = semester.toUpperCase();
            profileFieldsChanged = true;
        }
        if (section && section.toUpperCase() !== req.user.section) {
            updateData.section = section.toUpperCase();
            profileFieldsChanged = true;
        }
        if (phone && phone !== req.user.phone) {
            updateData.phone = phone;
            profileFieldsChanged = true;
        }

        // Handle profile image upload (doesn't reset verification)
        if (profileImage && profileImage.startsWith("data:")) {
            // Delete old image if exists
            if (req.user.profileImage) {
                const publicId = req.user.profileImage.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(`profile_images/${publicId}`);
            }

            const uploadResult = await cloudinary.uploader.upload(profileImage, {
                folder: "profile_images",
                transformation: [
                    { width: 200, height: 200, crop: "fill" },
                    { quality: "auto" }
                ]
            });
            updateData.profileImage = uploadResult.secure_url;
        }

        // Reset profile verification if non-photo fields changed (for students only)
        if (profileFieldsChanged && req.user.role === "student" && req.user.profileVerified) {
            updateData.profileVerified = false;
            updateData.profileVerifiedBy = null;
            updateData.profileVerifiedAt = null;

            // Find and notify subscribed teachers
            const teachers = await User.find({
                role: "teacher",
                subscribedClasses: {
                    $elemMatch: {
                        branch: req.user.branch,
                        semester: req.user.semester
                    }
                }
            });

            // Create notifications for teachers
            const teacherNotifications = teachers.map(teacher => ({
                type: "profile_update",
                recipient: teacher._id,
                sender: req.user._id,
                title: "Student Profile Updated",
                message: `${req.user.fullName} (${req.user.registrationNumber}) has updated their profile. Please re-verify.`
            }));

            if (teacherNotifications.length > 0) {
                await Notification.insertMany(teacherNotifications);
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        // Audit log
        await AuditLog.create({
            actor: req.user._id,
            action: "profile_update",
            targetType: "User",
            targetId: req.user._id,
            description: `Profile updated: ${Object.keys(updateData).join(", ")}`
        });

        return res.status(200).json({ message: "Profile updated", user });

    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/user/:id - Get user by ID (for teachers viewing students)
router.get("/:id", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Students can only view themselves
        if (req.user.role === "student" && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.status(200).json({ user });

    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
