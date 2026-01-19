import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            "user_register",
            "user_login",
            "user_verify",
            "profile_update",
            "profile_verify",
            "profile_reject",
            "activity_create",
            "activity_approve",
            "activity_reject",
            "activity_correction",
            "rule_create",
            "rule_update",
            "rule_delete",
            "class_subscribe",
            "send_reminder",
            "bulk_upload",
            "admin_action"
        ]
    },
    targetType: {
        type: String,
        enum: ["User", "Activity", "Rule", "Notification", "System"],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    description: {
        type: String,
        default: ""
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
