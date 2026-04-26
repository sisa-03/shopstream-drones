import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Package, User } from 'lucide-react';

const BottomNav = ({ cartCount, role }) => {
  return (
    <nav className="bottom-nav glass">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Shop</span>
      </NavLink>
      
      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Package size={24} />
        <span>Missions</span>
      </NavLink>
      
      <NavLink to="/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <ShoppingCart size={24} />
          {cartCount > 0 && (
            <span className="cart-badge">{cartCount}</span>
          )}
        </div>
        <span>Cart</span>
      </NavLink>
      
      {role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={24} />
          <span>Radar</span>
        </NavLink>
      )}
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
