import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    // Identity fields
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    registrationNumber: {
        type: String,
        unique: true,
        sparse: true,  // Allows multiple documents without this field
        default: null
    },

    // Academic fields
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    section: {
        type: String,
        default: ""
    },

    // Profile
    profileImage: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },

    // Role & Access
    role: {
        type: String,
        required: true,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },
    verified: {
        type: Boolean,
        default: true
    },

    // Profile verification by teacher
    profileVerified: {
        type: Boolean,
        default: false
    },
    profileVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    profileVerifiedAt: {
        type: Date
    },

    // Teacher-specific: subscribed classes
    subscribedClasses: [{
        branch: String,
        semester: String,
        section: String
    }],

    // Points tracking (for students)
    totalPoints: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
}

// Update timestamp on save
userSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model("User", userSchema);

export default User;