// models/OtpVerification.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userData: { type: Object, required: true } // stores { username, password, branch, admissionNo, etc. }
});

export default mongoose.model("OtpVerification", otpSchema);
