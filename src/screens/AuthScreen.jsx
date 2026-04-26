import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { User, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('AuthScreen: Attempting login/signup...');
    setError('');
    
    try {
      const { data } = await axios.post(`/api/auth/${isLogin ? 'login' : 'signup'}`, { 
        email, 
        password, 
        name: isLogin ? undefined : name, 
        role: isLogin ? undefined : role 
      }, { timeout: 10000 });
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(''); // Clear errors
        setIsLogin(true);
        alert('Account created! Please sign in with your new credentials.');
      }
    } catch (err) {
      console.error('AuthScreen Error:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Connection timed out. Is the backend running?');
      } else {
        setError(err.response?.data?.message || 'Network error. Please check if the server (Port 3001) is online.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1a1a2e, #0a0a0f)' 
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{ width: '90%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: '30px' }}>
          <div className="pulse" style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #00f2ff, #7000ff)',
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0, 242, 255, 0.4)'
          }}>
            <LogIn size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px' }}>
            SKYNET <span style={{ color: 'var(--primary)' }}>DRONE</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Autonomous Delivery Redefined</p>
        </div>

        <div style={{ display: 'flex', marginBottom: '30px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '5px' }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{ 
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: isLogin ? 'var(--primary)' : 'transparent',
              color: isLogin ? 'black' : 'white', fontWeight: 'bold', transition: 'all 0.3s'
            }}
          >LOGIN</button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{ 
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: !isLogin ? 'var(--primary)' : 'transparent',
              color: !isLogin ? 'black' : 'white', fontWeight: 'bold', transition: 'all 0.3s'
            }}
          >SIGNUP</button>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ marginBottom: '15px' }}
              >
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                  <input 
                    className="input-field" 
                    placeholder="Full Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginBottom: '15px', position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input 
              className="input-field" 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '25px', position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
            <input 
              className="input-field" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <select 
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer Account</option>
                <option value="admin">Admin Fleet Manager</option>
              </select>
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '0.8rem' }}>{error}</p>}

          <button className="btn-primary" style={{ width: '100%', padding: '15px' }} disabled={loading}>
            {loading ? 'PROCESSING...' : (isLogin ? 'ENTER TERMINAL' : 'CREATE ACCOUNT')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
