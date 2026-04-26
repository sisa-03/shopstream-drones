import mongoose from 'mongoose';

const droneSchema = new mongoose.Schema({
  droneId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['IDLE', 'TAKEOFF', 'EN_ROUTE', 'DELIVERING', 'RETURNING', 'CHARGING', 'MAINTENANCE'], 
    default: 'IDLE' 
  },
  battery: { type: Number, default: 100 },
  position: {
    lat: { type: Number, default: 19.0760 },
    lng: { type: Number, default: 72.8777 }
  },
  destination: {
    lat: Number,
    lng: Number
  },
  speed: { type: Number, default: 0 },
  altitude: { type: Number, default: 0 },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  path: [{ lat: Number, lng: Number }]
}, { timestamps: true });

export const Drone = mongoose.model('Drone', droneSchema);
