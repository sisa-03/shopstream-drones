import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import axios from 'axios';
import { 
  Battery, Navigation, Shield, Radio, Activity, 
  Map as MapIcon, LayoutGrid, Camera, Package, Info, AlertCircle, User, LogOut, Search 
} from 'lucide-react';
import L from 'leaflet';

const socket = io('/', {
  transports: ['websocket', 'polling']
});

const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233481.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854866.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12]
});

// Helper component to update map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom]);
  return null;
};

const AdminGroundStation = ({ onLogout }) => {
  const [drones, setDrones] = useState([]);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);

  const filteredDrones = drones.filter(d => 
    d.droneId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDrone = drones.find(d => d.droneId === selectedDroneId);

  useEffect(() => {
    console.log('AdminGroundStation: Component Mounted');
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('AdminGroundStation: Fetching initial data...');
        const [ordersRes, dronesRes] = await Promise.all([
          axios.get('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/drones', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        console.log(`AdminGroundStation: Received ${dronesRes.data.length} drones and ${ordersRes.data.length} orders`);
        setOrders(ordersRes.data);
        setDrones(dronesRes.data);
      } catch (err) {
        console.error('Ground Station Data Fetch Error:', err);
      }
    };
    fetchData();

    const onTelemetry = (updatedDrone) => {
      setDrones(prev => {
        const index = prev.findIndex(d => d.droneId === updatedDrone.droneId);
        if (index === -1) return [...prev, updatedDrone];
        const newDrones = [...prev];
        newDrones[index] = updatedDrone;
        return newDrones;
      });
    };

    const onNewOrder = (order) => {
      console.log('AdminGroundStation: New order received via socket', order._id);
      setOrders(prev => [order, ...prev]);
    };

    socket.on('droneTelemetry', onTelemetry);
    socket.on('newOrder', onNewOrder);

    return () => {
      socket.off('droneTelemetry', onTelemetry);
      socket.off('newOrder', onNewOrder);
    };
  }, []); // Run once on mount

  // Auto-select logic moved to separate effect
  useEffect(() => {
    if (!selectedDroneId && drones.length > 0) {
      const active = drones.find(d => d.status !== 'IDLE');
      if (active) {
        setSelectedDroneId(active.droneId);
      } else {
        setSelectedDroneId(drones[0].droneId);
      }
    }
  }, [drones.length, selectedDroneId]);

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', gap: '15px', padding: '15px' }}>
      
      {/* Sidebar: Drone Fleet List (Ground Station) */}
      <div className="glass" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
              <Radio size={20} className="pulse" />
              <h2 style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>GROUND STATION</h2>
            </div>
            <button 
              onClick={onLogout}
              style={{ 
                background: 'rgba(255,59,48,0.1)', border: 'none', borderRadius: '8px', 
                padding: '8px', color: 'var(--danger)', cursor: 'pointer' 
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
          <div style={{ marginTop: '15px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input 
              className="input-field" 
              placeholder="Search fleet (e.g. SKY-ALPHA)..." 
              style={{ paddingLeft: '35px', fontSize: '0.8rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }} className="pulse"></div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              STATUS: <span style={{ color: 'var(--success)' }}>CONNECTED</span> | LINK: STABLE
            </p>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {filteredDrones.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: '20px' }}>No matching drones found</p>
          ) : filteredDrones.map(drone => (
            <motion.div 
              key={drone.droneId}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDroneId(drone.droneId)}
              className="glass"
              style={{ 
                padding: '15px', marginBottom: '10px', cursor: 'pointer',
                borderLeft: selectedDroneId === drone.droneId ? '4px solid var(--primary)' : '1px solid var(--glass-border)',
                background: selectedDroneId === drone.droneId ? 'rgba(0,242,255,0.05)' : 'rgba(255,255,255,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{drone.droneId}</span>
                <span style={{ 
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                  background: drone.status === 'IDLE' ? 'var(--success)' : 'var(--warning)',
                  color: 'black', fontWeight: 'bold'
                }}>
                  {drone.status}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Battery size={14} color={drone.battery < 20 ? 'red' : 'var(--success)'} />
                  {Math.round(drone.battery)}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Navigation size={14} color="var(--primary)" />
                  {drone.speed} kn
                </div>
              </div>
              {drone.status !== 'IDLE' && drone.currentOrderId && (
                <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--primary)', borderTop: '1px solid rgba(0,242,255,0.1)', paddingTop: '5px' }}>
                  <Package size={12} style={{ marginRight: '5px' }} />
                  PAYLOAD: {orders.find(o => String(o._id) === String(drone.currentOrderId))?.items[0]?.product?.name || 'Loading Package...'}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <h4 style={{ fontSize: '0.8rem', marginBottom: '10px' }}>MISSION QUEUE</h4>
          {orders.filter(o => o.status === 'PENDING').map(order => (
            <div key={order._id} style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
              <span>Order #{order._id.slice(-6)}</span>
              <span>WAITING</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Map and Monitoring */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Top: Map Monitoring */}
        <div className="glass" style={{ flex: 2, overflow: 'hidden', position: 'relative' }}>
          <MapContainer center={[19.0760, 72.8777]} zoom={13} style={{ height: '100%', width: '100%' }}>
            {selectedDrone && <ChangeView center={[selectedDrone.position.lat, selectedDrone.position.lng]} zoom={15} />}
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {drones.map(drone => (
              <Marker 
                key={drone.droneId} 
                position={[drone.position.lat, drone.position.lng]} 
                icon={droneIcon}
                eventHandlers={{
                  click: () => setSelectedDroneId(drone.droneId),
                }}
              >
                <Popup>
                  <div style={{ padding: '5px', color: 'black' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{drone.droneId}</h4>
                    <p style={{ margin: '0', fontSize: '0.75rem' }}>Status: <strong>{drone.status}</strong></p>
                    <p style={{ margin: '0', fontSize: '0.75rem' }}>Battery: {Math.round(drone.battery)}%</p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {selectedDrone?.destination && selectedDrone.destination.lat && (
              <>
                <Marker 
                  position={[selectedDrone.destination.lat, selectedDrone.destination.lng]} 
                  icon={destinationIcon}
                >
                  <Popup>
                    <div style={{ color: 'black', padding: '5px' }}>
                      <strong style={{ fontSize: '0.8rem' }}>DELIVERY TARGET</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem' }}>{selectedDrone.destination.address || 'Authorized Drop Zone'}</p>
                    </div>
                  </Popup>
                </Marker>
                <Polyline 
                  positions={[
                    [selectedDrone.position.lat, selectedDrone.position.lng],
                    ...(selectedDrone.path || [[selectedDrone.destination.lat, selectedDrone.destination.lng]]),
                    [selectedDrone.destination.lat, selectedDrone.destination.lng]
                  ]}
                  color="var(--primary)"
                  dashArray="10, 10"
                  weight={2}
                />
              </>
            )}
          </MapContainer>

          {/* Map Overlay Stats */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
            <div className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutGrid size={18} color="var(--primary)" />
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>TOTAL FLEET</p>
                <p style={{ fontWeight: 'bold' }}>{drones.length}</p>
              </div>
            </div>
            <div className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="var(--success)" />
              <div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ACTIVE MISSIONS</p>
                <p style={{ fontWeight: 'bold' }}>{drones.filter(d => d.status !== 'IDLE').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Details and CV Feed */}
        <div style={{ flex: 1, display: 'flex', gap: '15px' }}>
          
          {/* Detailed Drone Monitor */}
          <div className="glass" style={{ flex: 1.5, padding: '20px', display: 'flex', gap: '20px' }}>
            {selectedDrone ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <Info size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1rem' }}>DRONE TELEMETRY: {selectedDrone.droneId}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ALTITUDE</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedDrone.altitude}m</p>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>HEADING</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>42° NE</p>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>LATITUDE</p>
                      <p style={{ fontSize: '0.9rem' }}>{selectedDrone.position.lat.toFixed(6)}</p>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>LONGITUDE</p>
                      <p style={{ fontSize: '0.9rem' }}>{selectedDrone.position.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--glass-border)' }}></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.8rem', marginBottom: '10px', color: 'var(--text-dim)' }}>MISSION DETAILS</h4>
                  {(() => {
                    try {
                      if (!selectedDrone) return <div style={{ color: 'var(--text-dim)', textAlign: 'center', width: '100%', padding: '20px' }}>SELECT A DRONE TO INITIATE SATELLITE DOWNLINK</div>;
                      
                      const activeOrder = orders.find(o => String(o._id) === String(selectedDrone.currentOrderId));
                      const isBusy = selectedDrone.status !== 'IDLE';

                      return (
                        <div className="glass" style={{ padding: '15px', background: 'rgba(0,242,255,0.02)', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Package size={16} color={isBusy ? 'var(--primary)' : 'var(--text-dim)'} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                              {isBusy ? (activeOrder?.items?.[0]?.product?.name || 'Authorized Cargo (Loading...)') : 'DE-ASSIGNED / IDLE'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <User size={16} color={isBusy ? 'var(--primary)' : 'var(--text-dim)'} />
                            <span style={{ fontSize: '0.8rem' }}>
                              {isBusy ? (activeOrder?.user?.name || 'Authorized Client') : 'GROUND CONTROL'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={16} color={isBusy ? 'var(--success)' : 'var(--warning)'} />
                            <span style={{ fontSize: '0.8rem' }}>Telemetry: {selectedDrone.status || 'LINK_LOST'}</span>
                          </div>
                        </div>
                      );
                    } catch (err) {
                      return <div style={{ color: 'var(--danger)', fontSize: '0.7rem' }}>CRITICAL_RENDER_ERROR: CONTACT SYS_ADMIN</div>;
                    }
                  })()}
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, fontSize: '0.7rem', padding: '10px' }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(`/api/admin/drones/${selectedDrone._id}/override`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert(`System Override Initiated for ${selectedDrone.droneId}`);
                        } catch (err) {
                          alert('Override Failed');
                        }
                      }}
                    >
                      OVERRIDE
                    </button>
                    
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, background: 'var(--success)', color: 'black', fontSize: '0.7rem', padding: '10px' }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const droneId = selectedDrone._id || selectedDrone.id;
                          await axios.post(`/api/admin/drones/${droneId}/charge`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert(`Drone ${selectedDrone.droneId} fully recharged!`);
                        } catch (err) {
                          alert('Charging failed');
                        }
                      }}
                    >
                      RECHARGE
                    </button>

                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, background: 'var(--danger)', fontSize: '0.7rem', padding: '10px' }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(`/api/admin/drones/${selectedDrone._id}/rtl`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert(`RTL (Return to Launch) activated for ${selectedDrone.droneId}`);
                        } catch (err) {
                          alert('RTL Command Failed');
                        }
                      }}
                    >
                      RTL
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                SELECT A DRONE FOR DETAILED TELEMETRY
              </div>
            )}
          </div>

          {/* Camera Vision Feed - Dynamic HUD */}
          <div className="glass" style={{ width: '300px', overflow: 'hidden', position: 'relative', background: '#000' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', background: 'red', borderRadius: '50%' }} className="pulse"></div>
              <span style={{ fontSize: '0.6rem', fontWeight: 'bold', textShadow: '0 0 5px black' }}>LIVE CV OPTICS</span>
            </div>
            
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {selectedDrone ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{ 
                    width: '100%', height: '100%', position: 'relative', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ width: '100%', height: '100%' }}>
                      <MapContainer 
                        center={[selectedDrone.position.lat, selectedDrone.position.lng]} 
                        zoom={19} 
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        doubleClickZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <ChangeView center={[selectedDrone.position.lat, selectedDrone.position.lng]} zoom={19} />
                        <TileLayer 
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                          attribution='&copy; Esri'
                        />
                      </MapContainer>
                    </div>
                  </div>
                  
                  {/* Digital HUD Overlays */}
                  <div style={{ 
                    position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none',
                    background: 'rgba(0, 242, 255, 0.05)',
                    boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px', height: '100px', border: '1px solid rgba(0,242,255,0.3)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '2px', height: '20px', background: 'var(--primary)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '2px', background: 'var(--primary)' }}></div>
                    
                    {/* Compass/Orientation HUD */}
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', fontSize: '0.6rem', color: 'var(--primary)' }}>
                      <p>ALT: {selectedDrone.altitude}M</p>
                      <p>SPD: {selectedDrone.speed}KN</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', zIndex: 1, color: 'rgba(255,255,255,0.3)' }}>
                  <Camera size={40} />
                  <p style={{ fontSize: '0.6rem', marginTop: '10px' }}>WAITING_FOR_UPLINK</p>
                </div>
              )}
              
              {/* Scanline Effect */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 1001, background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none', opacity: 0.2 }}></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminGroundStation;
