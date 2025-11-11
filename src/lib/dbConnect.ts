import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "@/model/User";

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function seedAdminUser() {
  try {
    const existingAdmin = await UserModel.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    const adminUser = new UserModel({
      name: "Aseem",
      mobileNumber: "8437702351",
      password: hashedPassword,
      role: "Admin",
      isActive: true,
    });

    await adminUser.save();
    console.log("🌱 Admin user seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  }
}

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log("Already connected to database");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || "");
    connection.isConnected = db.connections[0].readyState;

    console.log("✅ DB connected successfully");

    // Seed admin user after successful connection
    await seedAdminUser();
  } catch (error) {
    console.log("❌ Database connection failed", error);
    process.exit(1);
  }
}

export default dbConnect;
