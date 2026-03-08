import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL auto-cleanup
}, { timestamps: true });

export default mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
