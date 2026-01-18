import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import User from './models/User.js';

// Default accounts to create
const defaultAccounts = [
    {
        fullName: "Admin User",
        email: "admin@capms.com",
        password: "admin123",
        dob: new Date("1990-01-01"),
        registrationNumber: "ADMIN001",
        branch: "ADMIN",
        semester: "NA",
        section: "",
        role: "admin",
        verified: true
    },
    {
        fullName: "Teacher User",
        email: "teacher@capms.com",
        password: "teacher123",
        dob: new Date("1985-01-01"),
        registrationNumber: "TEACHER001",
        branch: "CS",
        semester: "NA",
        section: "",
        role: "teacher",
        verified: true,
        subscribedClasses: [
            { branch: "CS", semester: "S5", section: "A" },
            { branch: "CS", semester: "S5", section: "B" },
            { branch: "CS", semester: "S6", section: "A" },
        ]
    }
];

async function seedDatabase() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Drop the problematic index if it exists
        try {
            await mongoose.connection.db.collection('users').dropIndex('registrationNumber_1');
            console.log("Dropped old registrationNumber index");
        } catch (e) {
            // Index might not exist, that's fine
            console.log("No old registrationNumber index to drop (or already using sparse)");
        }

        // Ensure new indexes are created
        await User.syncIndexes();
        console.log("Synced indexes");

        for (const account of defaultAccounts) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: account.email });

            if (existingUser) {
                console.log(`User ${account.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(account.password, salt);

            // Create user
            const newUser = new User({
                ...account,
                password: hashedPassword
            });

            await newUser.save();
            console.log(`✅ Created ${account.role}: ${account.email} (password: ${account.password})`);
        }

        console.log("\n📋 Default Credentials:");
        console.log("========================");
        console.log("Admin:   admin@capms.com / admin123");
        console.log("Teacher: teacher@capms.com / teacher123");
        console.log("========================\n");

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
