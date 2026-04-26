import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Clock, ShieldCheck, MapPin } from 'lucide-react';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleOrder = async () => {
    addToCart(product);
    navigate('/cart');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      style={{ padding: '20px' }}
    >
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginBottom: '20px' }}>
        <ArrowLeft />
      </button>

      <div className="glass" style={{ padding: '20px' }}>
        <img src={product.image} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '15px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>{product.category.toUpperCase()}</span>
            <h1 style={{ fontSize: '1.8rem' }}>{product.name}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>${product.price}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Star size={14} color="gold" fill="gold" /> 4.9 (120 reviews)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Clock size={14} /> 15 mins
          </div>
        </div>

        <p style={{ color: 'var(--text-dim)', marginBottom: '30px', lineHeight: '1.6' }}>{product.description}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck color="var(--success)" />
            <span style={{ fontSize: '0.8rem' }}>AI Verified Safe</span>
          </div>
          <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin color="var(--primary)" />
            <span style={{ fontSize: '0.8rem' }}>Real-time GPS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            className="glass" 
            style={{ flex: 1, padding: '18px', fontSize: '1rem', color: 'white', fontWeight: '600' }}
            onClick={() => addToCart(product)}
          >
            ADD TO CART
          </button>
          <button 
            className="btn-primary" 
            style={{ flex: 2, padding: '18px', fontSize: '1.1rem' }} 
            onClick={handleOrder}
          >
            BUY NOW & DELIVER
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetails;
