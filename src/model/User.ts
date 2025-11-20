import mongoose, { Schema, Document } from 'mongoose';
import { Permission, ALL_PERMISSIONS } from '@/lib/rbac/permissions';

export type Role = 'Admin' | 'Manager' | 'Supervisor' | 'Worker';

export interface User extends Document {
  name: string;
  mobileNumber: string;
  password: string;
  role: Role;
  permissions: Permission[]; // Array of permissions assigned by Admin
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<User> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Supervisor', 'Worker'],
      default: 'Worker',
    },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>('User', UserSchema);

export default UserModel;
