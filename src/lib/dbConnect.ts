import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel from '@/model/User';
import { ALL_PERMISSIONS } from '@/lib/rbac/permissions';

type ConnectionObject = {
  isConnected?: boolean;
};

const connection: ConnectionObject = {};

async function seedUsers() {
  try {
    const hashedPasswordAdmin = await bcrypt.hash('123456', 10);
    const hashedPasswordStaff = await bcrypt.hash('neelkanth@123', 10);

    // -------------------------
    // Seed Admin
    // -------------------------
    const existingAdmin = await UserModel.findOne({ role: 'Admin' });
    if (!existingAdmin) {
      await UserModel.create({
        name: 'Aseem',
        mobileNumber: '8437702351',
        password: hashedPasswordAdmin,
        role: 'Admin',
        permissions: ALL_PERMISSIONS,
        isActive: true,
      });
      console.log('🌱 Admin user seeded successfully');
    } else {
      console.log('✅ Admin user already exists');
    }

    // -------------------------
    // Seed Manager
    // -------------------------
    const existingManager = await UserModel.findOne({ role: 'Manager' });
    if (!existingManager) {
      await UserModel.create({
        name: 'Production',
        mobileNumber: '7508586574',
        password: hashedPasswordStaff,
        role: 'Manager',
        isActive: true,
      });
      console.log('🌱 Manager user seeded successfully');
    } else {
      console.log('✅ Manager user already exists');
    }

    // -------------------------
    // Seed Operator
    // -------------------------
    const existingOperator = await UserModel.findOne({ role: 'Operator' });
    if (!existingOperator) {
      await UserModel.create({
        name: 'Operator',
        mobileNumber: '9877741375',
        password: hashedPasswordStaff,
        role: 'Operator',
        isActive: true,
      });
      console.log('🌱 Operator user seeded successfully');
    } else {
      console.log('✅ Operator user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    console.log('✅ Already connected to database');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('❌ MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(mongoUri);
    connection.isConnected = true;

    console.log('✅ DB connected successfully');

    // Seed users after successful DB connection
    await seedUsers();
  } catch (error) {
    console.error('❌ Database connection failed', error);
    process.exit(1);
  }
}

export default dbConnect;
