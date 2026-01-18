import express from 'express';
import NewUser from "../models/NewUser.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import OtpVerification from '../models/Otp.js';

const router = express.Router();

// Branch and Semester options
export const BRANCHES = ["CS", "IT", "EE", "ME", "CE", "EC", "CT"];
export const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
export const SECTIONS = ["A", "B", "C", "D"];

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
}

// Email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// OTP email template
const getOtpEmailHtml = (otp) => `
    <div style="
        font-family: 'Segoe UI', Arial, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
    ">
        <div style="
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
        ">
            <h2 style="color: #333; margin-bottom: 10px;">Verify Your Email</h2>
            <p style="color: #666; margin-bottom: 30px;">
                Use the following code to complete your registration:
            </p>
            
            <div style="
                display: inline-block;
                padding: 20px 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                color: white;
            ">
                ${otp}
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #888;">
                This code will expire in <strong>10 minutes</strong>.
            </p>
            <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
                If you didn't request this, please ignore this email.
            </p>
        </div>
    </div>
`;

// POST /api/auth/register - Student registration with new fields
router.post("/register", async (req, res) => {
    try {
        const { email, password, fullName, registrationNumber, branch, semester, section, dob } = req.body;

        // Validation
        if (!email || !password || !fullName || !registrationNumber || !branch || !semester || !dob) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Validate branch and semester
        if (!BRANCHES.includes(branch.toUpperCase())) {
            return res.status(400).json({ message: `Branch must be one of: ${BRANCHES.join(", ")}` });
        }

        if (!SEMESTERS.includes(semester.toUpperCase())) {
            return res.status(400).json({ message: `Semester must be one of: ${SEMESTERS.join(", ")}` });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { registrationNumber }]
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or registration number already exists" });
        }

        const existingNewUser = await NewUser.findOne({
            $or: [{ email }, { registrationNumber }]
        });
        if (existingNewUser) {
            return res.status(400).json({ message: "Registration already in progress. Please verify OTP." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Store pending verification
        await OtpVerification.findOneAndUpdate(
            { email },
            {
                email,
                otp: hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                userData: {
                    fullName,
                    email,
                    password,
                    registrationNumber,
                    branch: branch.toUpperCase(),
                    semester: semester.toUpperCase(),
                    section: section?.toUpperCase() || "",
                    dob: new Date(dob)
                }
            },
            { upsert: true }
        );

        // Send OTP email
        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account - Activity Tracker",
            html: getOtpEmailHtml(otp)
        });

        console.log(`OTP sent to ${email}: ${otp}`);

        return res.status(200).json({
            message: "OTP sent successfully. Please check your email (including spam folder)."
        });

    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/auth/verify-otp - Verify OTP and create user
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const otpRecord = await OtpVerification.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "No OTP found. Please register again." });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OtpVerification.deleteOne({ email });
            return res.status(400).json({ message: "OTP expired. Please register again." });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // OTP is valid - create verified user
        const { fullName, password, registrationNumber, branch, semester, section, dob } = otpRecord.userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            registrationNumber,
            branch,
            semester,
            section,
            dob,
            role: "student",
            verified: true
        });

        await newUser.save();
        await OtpVerification.deleteOne({ email });

        const token = generateToken(newUser._id);

        return res.status(201).json({
            message: "Registration successful!",
            user: {
                token,
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                registrationNumber: newUser.registrationNumber,
                branch: newUser.branch,
                semester: newUser.semester,
                section: newUser.section,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/auth/resend-otp - Resend OTP
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const otpRecord = await OtpVerification.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ message: "No pending registration found. Please register again." });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        await OtpVerification.updateOne(
            { email },
            {
                otp: hashedOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            }
        );

        // Send OTP email
        const transporter = createTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "New OTP - Activity Tracker",
            html: getOtpEmailHtml(otp)
        });

        return res.status(200).json({ message: "New OTP sent successfully." });

    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// POST /api/auth/login - Login with email or registration number
router.post("/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/Registration number and password are required" });
        }

        // Find user by email or registration number
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { registrationNumber: identifier }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.verified) {
            return res.status(400).json({ message: "Account not verified. Please contact admin." });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Login successful",
            user: {
                token,
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                registrationNumber: user.registrationNumber,
                branch: user.branch,
                semester: user.semester,
                section: user.section,
                role: user.role,
                profileImage: user.profileImage,
                totalPoints: user.totalPoints
            }
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// GET /api/auth/me - Get current user
router.get("/me", async (req, res) => {
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

        return res.status(200).json({ user });

    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
});

// GET /api/auth/options - Get branch, semester, section options
router.get("/options", (req, res) => {
    return res.status(200).json({
        branches: BRANCHES,
        semesters: SEMESTERS,
        sections: SECTIONS
    });
});

export default router;
