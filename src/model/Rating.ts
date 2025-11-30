import mongoose, { Schema, Document } from 'mongoose';

export interface RatingDoc extends Document {
  rating: string; // e.g., "200/2", "315/3"
  strength: number; // e.g., 100, 125, 150
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<RatingDoc>(
  {
    rating: { type: String, required: true, unique: true },
    strength: { type: Number, required: true },
  },
  { timestamps: true }
);

const Rating =
  (mongoose.models.Rating as mongoose.Model<RatingDoc>) ||
  mongoose.model<RatingDoc>('Rating', RatingSchema);

export default Rating;
