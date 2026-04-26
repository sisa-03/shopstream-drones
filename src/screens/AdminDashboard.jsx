import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Battery, Navigation, Crosshair, Camera, Activity, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

// Custom Drone Icon
const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const AdminDashboard = () => {
  const [drones, setDrones] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [stats, setStats] = useState({ activeOrders: 0, idleDrones: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('http://localhost:3001/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();

    socket.on('droneTelemetry', (updatedDrone) => {
      setDrones(prev => {
        const index = prev.findIndex(d => d.droneId === updatedDrone.droneId);
        if (index === -1) return [...prev, updatedDrone];
        const newDrones = [...prev];
        newDrones[index] = updatedDrone;
        return newDrones;
      });
    });

    return () => socket.off('droneTelemetry');
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Map Section */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[19.0760, 72.8777]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {drones.map(drone => (
            <Marker 
              key={drone.droneId} 
              position={[drone.position.lat, drone.position.lng]} 
              icon={droneIcon}
              eventHandlers={{ click: () => setSelectedDrone(drone) }}
            >
              <Popup>
                <div style={{ color: 'black' }}>
                  <strong>{drone.droneId}</strong><br/>
                  Status: {drone.status}<br/>
                  Battery: {Math.round(drone.battery)}%
                </div>
              </Popup>
            </Marker>
          ))}
          {selectedDrone?.destination && (
            <Polyline 
              positions={[
                [selectedDrone.position.lat, selectedDrone.position.lng],
                [selectedDrone.destination.lat, selectedDrone.destination.lng]
              ]}
              color="var(--primary)"
              dashArray="5, 10"
            />
          )}
        </MapContainer>

        {/* Floating Telemetry Panel */}
        <AnimatePresence>
          {selectedDrone && (
            <motion.div 
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="glass"
              style={{ 
                position: 'absolute', right: '20px', top: '20px', bottom: '20px', 
                width: '320px', zIndex: 1000, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{selectedDrone.droneId}</h3>
                <button onClick={() => setSelectedDrone(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="glass" style={{ padding: '10px', textAlign: 'center' }}>
                  <Battery color={selectedDrone.battery < 20 ? 'var(--danger)' : 'var(--success)'} />
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{Math.round(selectedDrone.battery)}%</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>BATTERY</span>
                </div>
                <div className="glass" style={{ padding: '10px', textAlign: 'center' }}>
                  <Navigation color="var(--primary)" />
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedDrone.speed} kn</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>SPEED</span>
                </div>
              </div>

              {/* Simulated Camera Feed */}
              <div className="glass" style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'red', borderRadius: '50%' }} className="pulse"></div>
                  <span style={{ fontSize: '0.7rem' }}>LIVE CV FEED</span>
                </div>
                <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Here we can place a canvas for CV simulation */}
                  <Activity size={40} className="pulse" color="var(--primary)" opacity={0.3} />
                  <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(0,242,255,0.2)', pointerEvents: 'none' }}></div>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', border: '1px solid var(--primary)' }}></div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h4>Active Mission</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '10px' }}>STATUS: {selectedDrone.status}</p>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.9rem' }}>Dest: {selectedDrone.destination?.lat.toFixed(4)}, {selectedDrone.destination?.lng.toFixed(4)}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ flex: 1, fontSize: '0.8rem' }}>MANUAL OVERRIDE</button>
                <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)', fontSize: '0.8rem' }}>EMERGENCY LAND</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Control Bar */}
      <div className="glass" style={{ height: '80px', margin: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{stats.activeOrders}</p>
          <span>ACTIVE MISSIONS</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>{stats.idleDrones}</p>
          <span>AVAILABLE FLEET</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', fontWeight: 'bold' }}>${stats.revenue}</p>
          <span>TOTAL REVENUE</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
