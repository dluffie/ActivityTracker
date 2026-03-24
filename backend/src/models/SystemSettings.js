import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
    // Singleton identifier
    _id: {
        type: String,
        default: "system_settings"
    },

    systemName: {
        type: String,
        default: "Activity Point Management System"
    },
    requiredPoints: {
        type: Number,
        default: 60
    },
    maxFileSize: {
        type: Number,
        default: 10
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    autoApprove: {
        type: Boolean,
        default: false
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Static helper: get the singleton settings document
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findById("system_settings");
    if (!settings) {
        settings = await this.create({ _id: "system_settings" });
    }
    return settings;
};

// Static helper: update settings
systemSettingsSchema.statics.updateSettings = async function (updates) {
    const settings = await this.findOneAndUpdate(
        { _id: "system_settings" },
        { $set: { ...updates, updatedAt: Date.now() } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return settings;
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
