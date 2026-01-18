import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const newUserSchema = new mongoose.Schema({
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
        required: true
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

    // Role & Access
    role: {
        type: String,
        required: true,
        enum: ["student", "teacher", "admin"],
        default: "student"
    },
    verified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
newUserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

const NewUser = mongoose.model("NewUser", newUserSchema);

export default NewUser;