import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  name: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
    address: String
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
