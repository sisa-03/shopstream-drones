import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ShoppingCart, Search, Package, Pill, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get('/api/products');
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Welcome back, Explorer</h2>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input 
            className="input-field" 
            placeholder="Search for products..." 
            style={{ paddingLeft: '40px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '30px', paddingBottom: '10px' }}>
        {['All', 'Medicine', 'Food', 'Parcel'].map(cat => (
          <button 
            key={cat}
            onClick={() => setCategory(cat)}
            style={{ 
              padding: '10px 20px', borderRadius: '12px', border: 'none', 
              background: category === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: category === cat ? 'black' : 'white', cursor: 'pointer',
              whiteSpace: 'nowrap', fontWeight: '600'
            }}
          >
            {cat === 'Medicine' && <Pill size={14} style={{ marginRight: '5px' }} />}
            {cat === 'Food' && <Utensils size={14} style={{ marginRight: '5px' }} />}
            {cat === 'Parcel' && <Package size={14} style={{ marginRight: '5px' }} />}
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: 'var(--text-dim)' }}>
            <Package size={40} style={{ marginBottom: '15px' }} />
            <p>No products found in this category.</p>
          </div>
        ) : filteredProducts.map((product, idx) => (
          <motion.div 
            key={product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass"
            style={{ padding: '10px', overflow: 'hidden' }}
            onClick={() => navigate(`/product/${product._id}`)}
          >
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }} 
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = 'https://placehold.co/600x400/111/00f2ff?text=SKYNET+CARGO';
              }}
            />
            <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{product.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${product.price}</span>
              <button 
                className="btn-primary" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
              >
                <ShoppingCart size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;
