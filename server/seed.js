import mongoose from 'mongoose';
import { Product } from './models/Ecommerce.js';
import { Drone } from './models/Drone.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drone_delivery';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected for seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Drone.deleteMany({});

    // Seed Products
    const products = [
      {
        name: 'Emergency MedKit Pro',
        description: 'Advanced trauma kit with AI-assisted emergency protocols.',
        price: 55,
        category: 'Medicine',
        image: '/assets/medkit.png',
        stock: 50
      },
      {
        name: 'Insulin Cooling Unit',
        description: 'Active cooling container for temperature-sensitive medication.',
        price: 85,
        category: 'Medicine',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
        stock: 25
      },
      {
        name: 'Gourmet Sky Burger',
        description: 'Freshly prepared burger, delivered hot in a thermal pod.',
        price: 18,
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
        stock: 100
      },
      {
        name: 'Organic Fruit Basket',
        description: 'Assorted seasonal fruits picked from local farms.',
        price: 25,
        category: 'Food',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600',
        stock: 40
      },
      {
        name: 'Priority Data Drive',
        description: 'Secure, encrypted SSD for rapid physical data transfer.',
        price: 120,
        category: 'Parcel',
        image: '/assets/data_drive.png',
        stock: 15
      },
      {
        name: 'Drone Spare Parts Kit',
        description: 'Essential components for field drone maintenance.',
        price: 200,
        category: 'Electronics',
        image: '/assets/drone_parts.png',
        stock: 10
      },
      {
        name: 'Smart Delivery Hub',
        description: 'Home base for autonomous parcel reception.',
        price: 350,
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
        stock: 5
      },
      {
        name: 'Quick-Charge Battery Pack',
        description: 'High-density lithium ion pack for extended drone range.',
        price: 95,
        category: 'Electronics',
        image: '/assets/battery.png',
        stock: 30
      }
    ];

    await Product.insertMany(products);
    console.log('Products seeded!');

    // Seed Drones
    const drones = [
      { droneId: 'SKY-ALPHA-01', status: 'IDLE', position: { lat: 19.0760, lng: 72.8777 }, battery: 100 },
      { droneId: 'SKY-BETA-02', status: 'IDLE', position: { lat: 19.0850, lng: 72.8900 }, battery: 95 },
      { droneId: 'SKY-GAMMA-03', status: 'IDLE', position: { lat: 19.0600, lng: 72.8500 }, battery: 80 }
    ];

    await Drone.insertMany(drones);
    console.log('Drones seeded!');

    await mongoose.disconnect();
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

seedData();
