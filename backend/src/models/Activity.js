import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    // Who this activity belongs to
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Who submitted (could be student, teacher, or admin)
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    submittedByRole: {
        type: String,
        enum: ["student", "teacher", "admin"],
        required: true
    },

    // Upload mode
    uploadMode: {
        type: String,
        enum: ["manual", "ai"],
        default: "manual"
    },

    // Activity details
    activityType: {
        type: String,
        required: true,
        enum: [
            // New categories (college manual)
            "ncc",
            "nss",
            "disaster_management",
            "sports",
            "cultural",
            "online_courses",
            "competitions",
            "conferences",
            "paper_presentation",
            "leadership",
            "entrepreneurship",
            "custom",
            // Legacy values (backward compatibility)
            "technical",
            "internship",
            "workshop",
            "seminar",
            "hackathon",
            "paper_publication",
            "project",
            "volunteer",
            "other"
        ]
    },
    eventName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    level: {
        type: String,
        enum: ["college", "zonal", "district", "state", "national", "international"],
        required: true
    },
    position: {
        type: String,
        enum: ["first", "second", "third", "participant", "organizer", "coordinator", "sub_coordinator", "volunteer", "chairman", "secretary", "council_member", "class_representative", ""],
        default: ""
    },
    organization: {
        type: String,
        default: ""
    },

    // Dates
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },

    // Points
    pointsSuggested: {
        type: Number,
        default: 0
    },
    pointsAssigned: {
        type: Number,
        default: 0
    },

    // Verification status
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "correction_needed"],
        default: "pending"
    },
    teacherComments: {
        type: String,
        default: ""
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    verifiedAt: {
        type: Date
    },

    // Document (Cloudinary URL)
    docUrl: {
        type: String,
        default: ""
    },
    docPublicId: {
        type: String // Cloudinary public ID for deletion
    },

    // AI extraction data
    rawExtractedText: {
        type: String,
        default: ""
    },
    aiConfidence: {
        type: Number,
        min: 0,
        max: 100
    },

    // Blog feature flag — teacher sets this when approving
    featuredOnBlog: {
        type: Boolean,
        default: false
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

// Update timestamp on save
activitySchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient queries
activitySchema.index({ student: 1, status: 1 });
activitySchema.index({ status: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
