import { useNavigate, Link } from 'react-router-dom';
import { Home, ShoppingCart, User, LogOut, Package } from 'lucide-react';

const Navbar = ({ user, onLogout, cartCount }) => {
  const navigate = useNavigate();

  return (
    <nav className="glass" style={{ 
      margin: '15px', padding: '15px 25px', display: 'flex', 
      justifyContent: 'space-between', alignItems: 'center',
      position: 'sticky', top: '15px', zIndex: 1000
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={20} color="black" />
        </div>
        <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>SKYNET</span>
      </Link>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* Navigation links hidden here on mobile, moved to BottomNav */}
        <div className="desktop-only" style={{ display: 'flex', gap: '20px' }}>
          {user.role === 'customer' && (
            <>
              <Link to="/orders" style={{ color: 'white' }}>
                <Package size={22} />
              </Link>
              <Link to="/cart" style={{ color: 'white', position: 'relative' }}>
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span style={{ 
                    position: 'absolute', top: '-10px', right: '-10px', 
                    background: 'var(--accent)', color: 'white', borderRadius: '50%', 
                    width: '18px', height: '18px', fontSize: '0.7rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <Package size={18} />
              RADAR
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {user.name ? user.name.split(' ')[0].toUpperCase() : 'PILOT'}
            </span>
          </div>
          
          <button 
            onClick={onLogout} 
            className="desktop-only"
            style={{ 
              background: 'rgba(255,59,48,0.1)', border: '1px solid var(--danger)', 
              color: 'var(--danger)', padding: '6px 15px', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.3s'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
