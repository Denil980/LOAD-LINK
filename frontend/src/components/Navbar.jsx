import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Truck, LogIn, ShieldCheck } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const isAuthenticated = localStorage.getItem('userToken');
  const userRole = localStorage.getItem('userRole') || 'truck_owner';
  const location = useLocation();

  const linkStyle = {
    textDecoration: 'none',
    color: 'var(--color-text-muted)',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.3s ease'
  };

  return (
    <nav className="navbar animate-navbar" style={{ padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(13, 19, 35, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container flex justify-between items-center">
        <Link
          key={location.pathname}
          to="/"
          className="nav-brand nav-brand-drag"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          <Truck size={28} className="nav-truck-puller" style={{ color: 'var(--color-secondary)' }} />
          <div className="nav-text-container" style={{ display: 'flex' }}>
            {"LoadLink".split('').map((char, index) => (
              <span key={index} className="nav-pull-letter" style={{ animationDelay: `${(index * 0.1) + 0.3}s` }}>
                {char}
              </span>
            ))}
          </div>
        </Link>

        <div className="flex items-center" style={{ gap: '1.5rem' }}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link" style={linkStyle}>Dashboard</Link>
              {userRole === 'truck_owner' && <Link to="/loads" className="nav-link" style={linkStyle}>Marketplace</Link>}
              {userRole === 'company' && <Link to="/post-load" className="nav-link" style={linkStyle}>Post Load</Link>}
              <Link to="/tracking" className="nav-link" style={linkStyle}>Live Fleet</Link>
              <Link to="/operations-history" className="nav-link" style={linkStyle}>
                {userRole === 'truck_owner' ? 'Trip Ledger' : 'Archive'}
              </Link>
              {userRole === 'admin' && (
                <Link to="/admin" className="nav-link" style={{ ...linkStyle, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} /> Admin
                </Link>
              )}
              {/* Notification Bell */}
              <NotificationBell />
              {/* Profile Icon */}
              <Link to="/profile" className="nav-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <User size={20} color="var(--color-secondary)" />
              </Link>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
              <LogIn size={18} /> Join Network
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
