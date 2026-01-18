import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema({
    activityType: {
        type: String,
        required: true,
        enum: [
            "sports",
            "cultural",
            "technical",
            "nss",
            "ncc",
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
    level: {
        type: String,
        enum: ["college", "district", "state", "national", "international"],
        required: true
    },
    position: {
        type: String,
        enum: ["first", "second", "third", "participant", "organizer", "any"],
        default: "any"
    },
    points: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
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

// Compound index for rule lookup
ruleSchema.index({ activityType: 1, level: 1, position: 1 });

const Rule = mongoose.model("Rule", ruleSchema);

export default Rule;
