import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Trash2, MapPin, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CartScreen = ({ cart, removeFromCart, clearCart }) => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!address || !pincode) {
      alert('Please provide delivery details for the flight path.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Simulated Geocoding (Random coordinate within Mumbai based on pincode)
      const deliveryLocation = {
        lat: 19.0760 + (Math.random() - 0.5) * 0.05,
        lng: 72.8777 + (Math.random() - 0.5) * 0.05,
        address: `${address}, ${city} - ${pincode}`
      };

      const { data } = await axios.post('/api/orders', {
        items: cart.map(item => ({ product: item._id, quantity: item.quantity })),
        total,
        deliveryLocation: {
          lat: 19.0760 + (Math.random() - 0.5) * 0.05,
          lng: 72.8777 + (Math.random() - 0.5) * 0.05,
          address: 'Mumbai Central Delivery Hub'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Order Successful! Delivery Mission Launched.');
      clearCart();
      navigate(`/track/${data._id}`);
    } catch (err) {
      alert('Checkout failed. Please try again.');
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
        <ShoppingBag size={80} style={{ color: 'var(--text-dim)', marginBottom: '20px' }} />
        <h2>Your Payload is Empty</h2>
        <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Ready for a new delivery mission?</p>
        <button className="btn-primary" onClick={() => navigate('/')}>BROWSE FLEET</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px' }}>Mission Payload (Cart)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {cart.map(item => (
            <motion.div 
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass"
              style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}
            >
              <img src={item.image} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem' }}>{item.name}</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${item.price} x {item.quantity}</p>
              </div>
              <button 
                onClick={() => removeFromCart(item._id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
              >
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </div>

          <div className="glass" style={{ padding: '20px', height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>DELIVERY DESTINATION</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>STREET ADDRESS</label>
            <input 
              className="input-field" 
              placeholder="e.g. 101, Sky Heights" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>CITY</label>
              <input className="input-field" value={city} readOnly />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: '5px' }}>PINCODE</label>
              <input 
                className="input-field" 
                placeholder="400001" 
                value={pincode} 
                onChange={(e) => setPincode(e.target.value)} 
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--glass-border)', marginBottom: '20px' }} />
          
          <h3 style={{ marginBottom: '20px', fontSize: '1rem' }}>MISSION SUMMARY</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
            <span>Cargo Weight</span>
            <span>2.4 kg</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem' }}>
            <span>Delivery Radius</span>
            <span>4.2 km</span>
          </div>
          
          <hr style={{ borderColor: 'var(--glass-border)', marginBottom: '20px' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '1.2rem', fontWeight: 'bold' }}>
            <span>TOTAL</span>
            <span style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
               <MapPin size={14} /> Home: Mumbai, India
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
               <CreditCard size={14} /> SkyPay Wallet
             </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '15px' }} onClick={handleCheckout}>
            LAUNCH DELIVERY <ArrowRight size={18} style={{ marginLeft: '10px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
