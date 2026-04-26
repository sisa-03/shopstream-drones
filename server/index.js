import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { User } from './models/User.js';
import { Drone } from './models/Drone.js';
import { Product, Order } from './models/Ecommerce.js';
import { simulateDroneMovement } from './simulation.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drone_delivery';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
// Serve production frontend build FIRST to ensure JS/CSS loads correctly
app.use(express.static(path.join(__dirname, '../dist')));

// Serve drone-specific images (medkit, etc.) from a separate path to avoid conflicts
app.use('/drone-assets', express.static(path.join(__dirname, 'public/assets')));


// Database Connection - Backgrounded so server starts immediately
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    initDrones(); // Run these after connection
    initProducts();
    runSimulation();
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('Proceeding with server startup (some features may be disabled)');
  });

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- ROUTES ---

// Auth
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    console.log(`Signup Attempt: ${email} (${role})`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name, role });
    await user.save();
    console.log(`Signup Success: ${email}`);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup Error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login Attempt: ${email}`);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login Failed: User ${email} not found`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
      console.log(`Login Success: ${email} (${user.role})`);
      res.json({ token, user: { name: user.name, role: user.role, id: user._id } });
    } else {
      console.log(`Login Failed: Incorrect password for ${email}`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) res.json(product);
    else res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid product ID' });
  }
});

// Orders
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, total, deliveryLocation } = req.body;
    const order = new Order({
      user: req.user.id,
      items,
      total,
      deliveryLocation
    });
    await order.save();

    // Try to assign immediately, otherwise it stays PENDING
    const droneIndex = liveFleet.findIndex(d => d.status === 'IDLE');
    if (droneIndex !== -1) {
      const droneObj = liveFleet[droneIndex];
      droneObj.status = 'EN_ROUTE';
      droneObj.destination = deliveryLocation;
      droneObj.currentOrderId = order._id;
      
      await Drone.findByIdAndUpdate(droneObj._id, { 
        status: 'EN_ROUTE', 
        destination: deliveryLocation, 
        currentOrderId: order._id 
      });
      
      order.status = 'DISPATCHED';
      order.drone = droneObj._id;
      await order.save();
      console.log(`[REALTIME] Drone ${droneObj.droneId} assigned to Order ${order._id}`);
    } else {
      order.status = 'PENDING';
      await order.save();
    }

    const populatedOrder = await Order.findById(order._id).populate('user', 'name').populate('items.product');
    io.emit('newOrder', populatedOrder);

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Merged into the route below with population support

app.post('/api/orders/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.status = 'CANCELLED';
    await order.save();

    // Recall drone
    const drone = liveFleet.find(d => d.currentOrderId && d.currentOrderId.toString() === order._id.toString());
    if (drone) {
      drone.status = 'RETURNING';
      drone.destination = { lat: 19.0760, lng: 72.8777, address: 'Headquarters Base' };
      drone.deliveryTimer = 0;
      await Drone.findByIdAndUpdate(drone._id, { status: 'RETURNING', destination: drone.destination, deliveryTimer: 0 });
      io.emit('droneTelemetry', drone); // Immediate update to everyone
    }

    io.emit('orderUpdated', order); // Notify UI
    res.json({ message: 'Mission Aborted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/user/all', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/:id/tracking', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Find drone in memory or DB
    let drone = liveFleet.find(d => String(d.currentOrderId) === String(order._id));
    if (!drone && order.drone) {
      drone = await Drone.findById(order.drone);
    }
    
    res.json({ order, drone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/orders', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  const orders = await Order.find().populate('user', 'name').populate('items.product');
  res.json(orders);
});

app.get('/api/admin/stats', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  const activeOrders = await Order.countDocuments({ status: { $ne: 'DELIVERED' } });
  const idleDrones = await Drone.countDocuments({ status: 'IDLE' });
  const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]);
  console.log(`Admin Stats Requested: ${activeOrders} active, ${idleDrones} idle`);
  res.json({ activeOrders, idleDrones, revenue: totalRevenue[0]?.total || 0 });
});

app.get('/api/admin/drones', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    console.log(`Unauthorized admin access attempt by ${req.user.id}`);
    return res.status(403).send('Forbidden');
  }
  try {
    const drones = await Drone.find();
    console.log(`Admin Drones Requested: Found ${drones.length} drones`);
    res.json(drones);
  } catch (err) {
    console.error('Admin Drones Fetch Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/drones/:id/charge', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, { battery: 100 }, { new: true });
    io.emit('droneTelemetry', drone);
    res.json(drone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/admin/drones/:id/rtl', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, { 
      status: 'RETURNING', 
      destination: { lat: 19.0760, lng: 72.8777 } 
    }, { new: true });
    io.emit('droneTelemetry', drone);
    res.json(drone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/admin/drones/:id/override', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, { 
      status: 'IDLE', 
      currentOrderId: null,
      destination: null 
    }, { new: true });
    io.emit('droneTelemetry', drone);
    res.json(drone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- TELEMETRY & SIMULATION ---
let liveFleet = [];

const initDrones = async () => {
  await Drone.deleteMany({}); // Nuke and re-seed for full fleet display
  if (true) {
    await Drone.create([
      { droneId: 'SKY-ALPHA-01', status: 'IDLE', position: { lat: 19.0760, lng: 72.8777 }, battery: 100 },
      { droneId: 'SKY-ALPHA-02', status: 'IDLE', position: { lat: 19.0820, lng: 72.8880 }, battery: 100 },
      { droneId: 'SKY-BRAVO-03', status: 'IDLE', position: { lat: 19.0950, lng: 72.8950 }, battery: 100 },
      { droneId: 'SKY-BRAVO-04', status: 'IDLE', position: { lat: 19.0600, lng: 72.8600 }, battery: 100 },
      { droneId: 'SKY-GAMMA-05', status: 'IDLE', position: { lat: 19.1000, lng: 72.9000 }, battery: 100 },
      { droneId: 'SKY-GAMMA-06', status: 'IDLE', position: { lat: 19.1200, lng: 72.9200 }, battery: 100 },
      { droneId: 'SKY-DELTA-07', status: 'IDLE', position: { lat: 19.0400, lng: 72.8400 }, battery: 100 },
      { droneId: 'SKY-DELTA-08', status: 'IDLE', position: { lat: 19.0500, lng: 72.8500 }, battery: 100 }
    ]);
  }
  const drones = await Drone.find();
  liveFleet = drones.map(d => d.toObject());
  console.log(`FLEET STATUS: ${liveFleet.length} drones online and ready for dispatch.`);
  liveFleet.forEach(d => console.log(` - Drone ${d.droneId} initialized at [${d.position.lat}, ${d.position.lng}]`));

  // Cleanup: Reset any orders that are stuck in 'ASSIGNED' or 'IN_FLIGHT' 
  // but don't have a matching active drone in memory
  const activeOrders = await Order.find({ status: { $in: ['ASSIGNED', 'IN_FLIGHT', 'DISPATCHED'] } });
  for (const order of activeOrders) {
    const drone = liveFleet.find(d => String(d.currentOrderId) === String(order._id) || String(d._id) === String(order.drone));
    if (drone && drone.status !== 'IDLE') {
      console.log(`Resuming mission for Order ${order._id} with Drone ${drone.droneId}`);
    } else {
      console.log(`Order ${order._id} was stuck. Resetting to PENDING.`);
      order.status = 'PENDING';
      order.drone = null;
      await order.save();
    }
  }
};

const initProducts = async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.create([
      { 
        name: 'Emergency Med-Kit', 
        description: 'Comprehensive medical kit for emergency drone delivery.', 
        price: 45, 
        category: 'Medicine', 
        image: 'https://images.unsplash.com/photo-1603398938378-e54eab446ddd?auto=format&fit=crop&q=80&w=400',
        stock: 50 
      },
      { 
        name: 'Insulin Cool-Pack', 
        description: 'Temperature-controlled insulin delivery pack.', 
        price: 30, 
        category: 'Medicine', 
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
        stock: 30 
      },
      { 
        name: 'Gourmet Bento Box', 
        description: 'Premium chef-prepared meal in a secure container.', 
        price: 25, 
        category: 'Food', 
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
        stock: 20 
      },
      { 
        name: 'Fresh Fruit Platter', 
        description: 'Seasonal fruit selection, chilled for delivery.', 
        price: 18, 
        category: 'Food', 
        image: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&q=80&w=400',
        stock: 15 
      },
      { 
        name: 'Secure Document Tube', 
        description: 'Weather-proof tube for legal and official documents.', 
        price: 12, 
        category: 'Parcel', 
        image: 'https://images.unsplash.com/photo-1586769852044-692d6e69a498?auto=format&fit=crop&q=80&w=400',
        stock: 100 
      },
      { 
        name: 'Precision Electronics', 
        description: 'Sensitive electronic components in anti-static packaging.', 
        price: 85, 
        category: 'Electronics', 
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
        stock: 10 
      }
    ]);
    console.log('Initial products seeded');
  }
};


// 1. Optimized High-Speed Simulation Loop
const runSimulation = () => {
  setInterval(() => {
    try {
      let updatesNeeded = false;
      for (const drone of liveFleet) {
        // Auto-correct: If a drone has a destination but is marked IDLE, wake it up
        if (drone.status === 'IDLE' && drone.destination) {
          console.log(`[SIM] Waking up ${drone.droneId} for pending mission.`);
          drone.status = 'EN_ROUTE';
        }
        
        if (drone.status === 'IDLE' || !drone.destination) continue;

        const statusBefore = drone.status;
        simulateDroneMovement(drone, io);
        
        if (statusBefore !== drone.status) {
          updatesNeeded = true;
          let dbOrderStatus = 'DISPATCHED';
          if (drone.status === 'EN_ROUTE') dbOrderStatus = 'IN_FLIGHT';
          if (drone.status === 'DELIVERING') dbOrderStatus = 'DELIVERING';
          if (drone.status === 'RETURNING' && statusBefore === 'DELIVERING') dbOrderStatus = 'DELIVERED';
          
          if (drone.currentOrderId) {
            Order.findByIdAndUpdate(drone.currentOrderId, { status: dbOrderStatus }, { new: true })
              .then(order => {
                io.emit('orderUpdated', order);
                if (dbOrderStatus === 'DELIVERED') console.log(`[SIM] Mission Accomplished: ${drone.droneId}`);
              })
              .catch(err => {});
          }
        }
      }
    } catch (err) {
      console.error('[SIM] Loop error:', err);
    }
  }, 200); // 5Hz is enough for smooth UI with transitions

  // 2. Auto-assign Pending Orders (Less frequent to save DB)
  setInterval(() => {
    Order.find({ status: 'PENDING' }).sort({ createdAt: 1 }).limit(liveFleet.length).then(pendingOrders => {
      for (const order of pendingOrders) {
        const drone = liveFleet.find(d => d.status === 'IDLE');
        if (drone) {
          console.log(`[ASSIGN] Linking ${drone.droneId} to Order ${order._id}`);
          drone.status = 'EN_ROUTE';
          drone.destination = order.deliveryLocation;
          drone.currentOrderId = order._id;
          
          Drone.findByIdAndUpdate(drone._id, { 
            status: 'EN_ROUTE', 
            destination: order.deliveryLocation, 
            currentOrderId: order._id 
          }).catch(err => console.error('Drone sync error:', err));
          
          Order.findByIdAndUpdate(order._id, { status: 'DISPATCHED', drone: drone._id })
            .then(updatedOrder => io.emit('orderUpdated', updatedOrder))
            .catch(err => console.error('Order sync error:', err));
            
          console.log(`Mission Dispatched: ${drone.droneId} -> Order ${order._id}`);
        }
      }
    }).catch(err => console.error('Order fetch error:', err));
  }, 3000);
};

// 3. Batched DB Sync (Every 5 seconds) to keep DB updated without lag
setInterval(() => {
  const updates = liveFleet.map(drone => ({
    updateOne: {
      filter: { _id: drone._id },
      update: { position: drone.position, battery: drone.battery, status: drone.status }
    }
  }));
  if (updates.length > 0) {
    Drone.bulkWrite(updates).catch(err => console.error('Bulk sync error:', err));
  }
}, 5000);

const startServer = () => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production Server Ready on Port ${PORT}`);
    console.log(`🔗 Local Access: http://localhost:${PORT}`);
  });
};

// SPA Routing: Redirect all unknown routes to the frontend build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

startServer();
