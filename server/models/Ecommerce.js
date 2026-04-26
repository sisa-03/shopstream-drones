import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, enum: ['Medicine', 'Food', 'Parcel', 'Electronics'], required: true },
  image: String,
  stock: { type: Number, default: 10 }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  total: Number,
  status: { 
    type: String, 
    enum: ['PENDING', 'DISPATCHED', 'IN_FLIGHT', 'DELIVERING', 'DELIVERED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  drone: { type: mongoose.Schema.Types.ObjectId, ref: 'Drone' },
  deliveryLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  estimatedDeliveryTime: Date
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
export const Order = mongoose.model('Order', orderSchema);
