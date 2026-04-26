import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Package, Clock, CheckCircle, ChevronRight, MapPin } from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/orders/user/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Synchronizing...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>Mission History</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>All your past and active drone deliveries</p>
      </header>

      {orders.length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
          <Package size={40} style={{ color: 'var(--text-dim)', marginBottom: '15px' }} />
          <p>No missions found. Start your first delivery today!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order, idx) => (
            <motion.div 
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass"
              style={{ padding: '20px', cursor: 'pointer' }}
              onClick={() => navigate(`/track/${order._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    padding: '8px', borderRadius: '8px', 
                    background: order.status === 'DELIVERED' ? 'rgba(0,255,136,0.1)' : 'rgba(0,242,255,0.1)' 
                  }}>
                    <Package size={20} color={order.status === 'DELIVERED' ? 'var(--success)' : 'var(--primary)'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>Order #{order._id.slice(-6)}</h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px',
                    background: order.status === 'DELIVERED' ? 'var(--success)' : 'var(--primary)',
                    color: 'black', fontWeight: 'bold'
                  }}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} /> {order.status === 'DELIVERED' ? 'Completed' : 'Active'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} /> {order.deliveryLocation?.address?.slice(0, 20) || 'Mumbai'}...
                  </div>
                </div>

                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('Abort this mission? The drone will return to base immediately.')) {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(`/api/orders/${order._id}/cancel`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          window.location.reload();
                        } catch (err) {
                          alert('Cancellation failed');
                        }
                      }
                    }}
                    style={{ 
                      background: 'rgba(255,59,48,0.1)', border: '1px solid var(--danger)', 
                      color: 'var(--danger)', padding: '5px 12px', borderRadius: '5px',
                      fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    CANCEL MISSION
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
