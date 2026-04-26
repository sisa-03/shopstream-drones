import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import AuthScreen from './screens/AuthScreen';
import CustomerDashboard from './screens/CustomerDashboard';
import AdminDashboard from './screens/AdminDashboard';
import ProductDetails from './screens/ProductDetails';
import CartScreen from './screens/CartScreen';
import TrackOrder from './screens/TrackOrder';
import OrderHistory from './screens/OrderHistory';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import AdminGroundStation from './screens/AdminGroundStation';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart && savedCart !== 'undefined' ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure state is stable
    setTimeout(() => setAuthLoading(false), 500);
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <Activity className="pulse" color="var(--primary)" size={40} />
    </div>
  );

  const addToCart = (product) => {
    // Check if already in cart
    const exists = cart.find(item => item._id === product._id);
    if (exists) {
      setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(`${product.name} added to mission payload!`);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const clearCart = () => setCart([]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <div className="app-shell">
      {user && <Navbar user={user} onLogout={handleLogout} cartCount={cart.length} />}
      <div className="content-area" style={{ flex: 1, overflowY: 'auto', paddingBottom: user ? '100px' : '0' }}>
        <Routes>
          <Route path="/auth" element={!user ? <AuthScreen onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            user ? <CustomerDashboard addToCart={addToCart} /> : <Navigate to="/auth" />
          } />

          {/* Customer Routes */}
          <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
          <Route path="/cart" element={<CartScreen cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/track/:id" element={<TrackOrder />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            user?.role === 'admin' ? <AdminGroundStation onLogout={handleLogout} /> : <Navigate to="/" />
          } />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {user && <BottomNav cartCount={cart.length} role={user.role} />}
    </div>
  );
}

export default App;
