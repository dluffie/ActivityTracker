import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["reminder", "approval", "rejection", "correction", "system", "registration"],
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: ""
    },
    read: {
        type: Boolean,
        default: false
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
