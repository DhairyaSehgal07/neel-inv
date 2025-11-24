import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel from '@/model/User';

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function seedUsers() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const hashedPassword2 = await bcrypt.hash('neelkanth@123', 10);

    // Seed Admin
    const existingAdmin = await UserModel.findOne({ role: 'Admin' });
    if (!existingAdmin) {
      const adminUser = new UserModel({
        name: 'Aseem',
        mobileNumber: '8437702351',
        password: hashedPassword,
        role: 'Admin',
        isActive: true,
      });
      await adminUser.save();
      console.log('🌱 Admin user seeded successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Seed Manager
    const existingManager = await UserModel.findOne({ role: 'Manager' });
    if (!existingManager) {
      const managerUser = new UserModel({
        name: 'Production',
        mobileNumber: '7508586574',
        password: hashedPassword2,
        role: 'Manager',
        isActive: true,
      });
      await managerUser.save();
      console.log('🌱 Manager user seeded successfully');
    } else {
      console.log('✅ Manager user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log('Already connected to database');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI || '');
    connection.isConnected = db.connections[0].readyState;

    console.log('✅ DB connected successfully');

    // Seed both users after DB connection
    await seedUsers();
  } catch (error) {
    console.log('❌ Database connection failed', error);
    process.exit(1);
  }
}

export default dbConnect;
