import React, { useState } from 'react';
import { Truck, Building, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [role, setRole] = useState('truck_owner');
  const navigate = useNavigate();

  const handleEnter = () => {
    const dummyUser = {
      _id: 'test-id',
      phone: '0000000000',
      role,
      fullName: 'Test User',
      verified: true
    };
    const token = 'dummy-token';
    localStorage.setItem('userToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(dummyUser));
    navigate('/dashboard');
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '600px', margin: '3rem auto', paddingBottom: '4rem' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>Select Role</h2>
        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setRole('truck_owner')}
            style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: role === 'truck_owner' ? 'var(--color-secondary)' : 'transparent', color: role === 'truck_owner' ? '#fff' : 'var(--color-text-muted)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Truck size={20} /> Truck Owner
          </button>
          <button
            onClick={() => setRole('company')}
            style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: role === 'company' ? 'var(--color-primary)' : 'transparent', color: role === 'company' ? '#fff' : 'var(--color-text-muted)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Building size={20} /> Business / Warehouse
          </button>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
          onClick={handleEnter}
        >
          Take me in <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Auth;
