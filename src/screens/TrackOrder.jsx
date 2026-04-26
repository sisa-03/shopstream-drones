import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Package, Truck, CheckCircle, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';

import axios from 'axios';
const socket = io('/', {
  transports: ['websocket', 'polling']
});

const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Helper component to update map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom]);
  return null;
};

const TrackOrder = () => {
  const { id } = useParams();
  const [drone, setDrone] = useState(null);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`/api/orders/${id}/tracking`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(data.order);
        setDrone(data.drone);
      } catch (err) {
        console.error('Error fetching tracking:', err);
      }
    };
    fetchTrackingData();

    socket.on('droneTelemetry', (updatedDrone) => {
      if (String(updatedDrone.currentOrderId) === String(id)) {
        setDrone(updatedDrone);
      }
    });
    
    socket.on('orderUpdated', (updatedOrder) => {
      if (String(updatedOrder._id) === String(id)) {
        setOrder(updatedOrder);
      }
    });

    return () => {
      socket.off('droneTelemetry');
      socket.off('orderUpdated');
    };
  }, [id]);

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Tracking Order #{id.slice(-6)}</h2>
        <p style={{ color: 'var(--text-dim)' }}>Your package is in the air</p>
      </header>

      <div className="glass" style={{ flex: 1, overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
        <MapContainer 
          center={[19.0760, 72.8777]} 
          zoom={16} 
          style={{ height: '100%', width: '100%', borderRadius: '15px' }}
        >
          <ChangeView center={drone ? [drone.position.lat, drone.position.lng] : null} zoom={16} />
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution='&copy; Esri'
          />
          {drone && (
            <>
              <Marker position={[drone.position.lat, drone.position.lng]} icon={droneIcon} />
              {drone.destination && (
                <>
                  <Marker position={[drone.destination.lat, drone.destination.lng]}>
                    <Popup>Delivery Point</Popup>
                  </Marker>
                  <Polyline 
                    positions={[[drone.position.lat, drone.position.lng], [drone.destination.lat, drone.destination.lng]]} 
                    color="var(--primary)" 
                    dashArray="5, 10"
                  />
                </>
              )}
            </>
          )}
        </MapContainer>

        {/* Live Status Overlay */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 1000 }}>
          <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="pulse" style={{ background: (drone?.status === 'DELIVERING' || order?.status === 'DELIVERED') ? 'var(--success)' : 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
              <Navigation color="black" />
            </div>
            <div>
              <p style={{ fontWeight: 'bold' }}>{drone?.status || order?.status || 'PREPARING'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }} className="pulse"></div>
                <p style={{ fontSize: '0.6rem', color: 'var(--success)', fontWeight: 'bold' }}>TELEMETRY ACTIVE</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: 'var(--success)', marginBottom: '5px' }}><CheckCircle size={20} /></div>
            <span style={{ fontSize: '0.7rem' }}>PLACED</span>
          </div>
          <div style={{ width: '50px', height: '2px', background: 'var(--success)', marginTop: '10px' }}></div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: (drone || order?.status === 'DELIVERED') ? 'var(--success)' : 'var(--text-dim)', marginBottom: '5px' }}><Package size={20} /></div>
            <span style={{ fontSize: '0.7rem' }}>PICKED UP</span>
          </div>
          <div style={{ width: '50px', height: '2px', background: (drone?.status === 'EN_ROUTE' || order?.status === 'DELIVERED') ? 'var(--success)' : 'var(--glass-border)', marginTop: '10px' }}></div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: (drone?.status === 'EN_ROUTE' || order?.status === 'DELIVERED') ? 'var(--primary)' : 'var(--text-dim)', marginBottom: '5px' }}><Truck size={20} /></div>
            <span style={{ fontSize: '0.7rem' }}>EN ROUTE</span>
          </div>
        </div>

        {order?.status !== 'DELIVERED' && order?.status !== 'CANCELLED' && (
          <button 
            onClick={async () => {
              if (window.confirm('Abort mission and recall drone?')) {
                try {
                  const token = localStorage.getItem('token');
                  await axios.post(`/api/orders/${id}/cancel`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  navigate('/customer-dashboard');
                } catch (err) {
                  alert('Cancellation failed');
                }
              }
            }}
            style={{ 
              width: '100%', padding: '12px', background: 'rgba(255,59,48,0.1)', 
              border: '1px solid var(--danger)', color: 'var(--danger)', 
              borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            CANCEL MISSION & RECALL DRONE
          </button>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
