import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Building, Camera, FileCheck, UploadCloud, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../api';

const Auth = () => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('truck_owner');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [rcNo, setRcNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Document upload state
  const [selfieFile, setSelfieFile] = useState(null);
  const [mParivFile, setMParivFile] = useState(null);
  const [ownerCertFile, setOwnerCertFile] = useState(null);

  const selfieRef = useRef(null);
  const mParivRef = useRef(null);
  const ownerCertRef = useRef(null);

  const navigate = useNavigate();

  const validate = () => {
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length !== 10) {
      setLoginError('Enter a valid 10-digit phone number.');
      return false;
    }
    if (!password || password.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return false;
    }
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLoginError('Passwords do not match!');
        return false;
      }
      if (role === 'truck_owner') {
        if (!fullName.trim()) { setLoginError('Full name is required.'); return false; }
        if (!vehicleNo.trim()) { setLoginError('Vehicle registration number is required.'); return false; }
        if (!rcNo.trim()) { setLoginError('RC Book number is required.'); return false; }
      } else {
        if (!companyName.trim()) { setLoginError('Company name is required.'); return false; }
        if (!companyAddress.trim()) { setLoginError('Company address is required.'); return false; }
      }
    }
    return true;
  };

  const handleAuth = async () => {
    setLoginError('');
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const formData = new FormData();
        formData.append('role', role);
        formData.append('phone', phone.replace(/\D/g, ''));
        formData.append('password', password);
        formData.append('fullName', role === 'company' ? companyName.trim() : fullName.trim());
        if (role === 'truck_owner') {
          formData.append('vehicleNo', vehicleNo.trim());
          formData.append('rcNo', rcNo.trim());
          if (selfieFile) formData.append('selfie', selfieFile);
          if (mParivFile) formData.append('mParivahan', mParivFile);
        } else {
          formData.append('companyAddress', companyAddress.trim());
          if (ownerCertFile) formData.append('ownerCert', ownerCertFile);
        }
        const res = await api.post('/auth/signup', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userRole', res.data.user.role);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        navigate('/dashboard');

      } else {
        const res = await api.post('/auth/login', {
          phone: phone.replace(/\D/g, ''),
          password,
          role,
        });
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userRole', res.data.user.role);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const UploadBtn = ({ label, icon: Icon, file, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-outline animate-fade-in"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0.75rem', padding: '1.5rem 1rem',
        borderColor: file ? 'var(--color-success)' : undefined,
        color: file ? 'var(--color-success)' : undefined,
      }}
    >
      {file ? <CheckCircle size={32} color="var(--color-success)" /> : <Icon size={32} />}
      <span style={{ fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>
        {file ? (file.name.length > 14 ? file.name.slice(0, 14) + '…' : file.name) : label}
      </span>
    </button>
  );

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '600px', margin: '3rem auto', paddingBottom: '4rem' }}>
      <div className="card">
        {/* Tab Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => { setMode('login'); setLoginError(''); }}
            style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: mode === 'login' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: mode === 'login' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
          >Login</button>
          <button
            onClick={() => { setMode('signup'); setLoginError(''); }}
            style={{ padding: '1rem', background: 'none', border: 'none', borderBottom: mode === 'signup' ? '3px solid var(--color-secondary)' : '3px solid transparent', color: mode === 'signup' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
          >Registration</button>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
          Select your role and enter credentials
        </p>

        {/* Role Selector */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setRole('truck_owner')}
            style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: role === 'truck_owner' ? 'var(--color-secondary)' : 'transparent', color: role === 'truck_owner' ? '#fff' : 'var(--color-text-muted)', fontWeight: '600', transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Truck size={20} /> Truck Owner
          </button>
          <button
            onClick={() => setRole('company')}
            style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: role === 'company' ? 'var(--color-primary)' : 'transparent', color: role === 'company' ? '#fff' : 'var(--color-text-muted)', fontWeight: '600', transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Building size={20} /> Business / Warehouse
          </button>
        </div>

        {loginError && (
          <p style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', backgroundColor: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
            {loginError}
          </p>
        )}

        {/* Phone */}
        <div className="input-group">
          <label className="input-label">Phone Number (Account ID)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="input-field" value="+91" style={{ width: '4rem', textAlign: 'center' }} readOnly />
            <input
              type="tel"
              className="input-field"
              placeholder="10-digit mobile number"
              style={{ flex: 1 }}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
            />
          </div>
        </div>

        {/* Password */}
        <div className="input-group">
          <label className="input-label">Account Password</label>
          <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {mode === 'signup' && (
          <div className="input-group animate-fade-in">
            <label className="input-label">Confirm Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        )}

        {/* Signup Profile Fields */}
        {mode === 'signup' && (
          <>
            <h3 style={{ fontSize: '1.2rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: 'var(--color-secondary)' }}>
              2. {role === 'company' ? 'Business Profile' : 'Truck Owner Profile'}
            </h3>

            {role === 'company' ? (
              <div className="animate-fade-in">
                <div className="input-group">
                  <label className="input-label">Company / Business Name <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" className="input-field" placeholder="Registered business name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Company Address <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" className="input-field" placeholder="Full office/warehouse address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Live Warehouse Location (optional)</label>
                  <button type="button" className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}>
                    <MapPin size={20} /> Detect Current GPS Pin
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="input-group">
                  <label className="input-label">Full Name (As per Aadhaar) <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" className="input-field" placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Vehicle Registration Number <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" className="input-field" placeholder="e.g. MH 12 AB 1234" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">RC Book Number <span style={{ color: '#ff6b6b' }}>*</span></label>
                  <input type="text" className="input-field" placeholder="Enter RC number" value={rcNo} onChange={e => setRcNo(e.target.value)} />
                </div>
              </div>
            )}

            <h3 style={{ fontSize: '1.2rem', marginTop: '2rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: 'var(--color-secondary)' }}>
              3. Official Documents
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Click to upload a file (image or PDF). Documents are reviewed during verification.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {role === 'company' ? (
                <>
                  <input ref={ownerCertRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setOwnerCertFile(e.target.files[0] || null)} />
                  <UploadBtn label="Ownership Certificate" icon={UploadCloud} file={ownerCertFile} onClick={() => ownerCertRef.current.click()} />
                </>
              ) : (
                <>
                  <input ref={selfieRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSelfieFile(e.target.files[0] || null)} />
                  <input ref={mParivRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => setMParivFile(e.target.files[0] || null)} />
                  <UploadBtn label="Selfie / Aadhaar Photo" icon={Camera} file={selfieFile} onClick={() => selfieRef.current.click()} />
                  <UploadBtn label="mParivahan / RC Proof" icon={FileCheck} file={mParivFile} onClick={() => mParivRef.current.click()} />
                </>
              )}
            </div>
          </>
        )}

        <button
          className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`}
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
          onClick={handleAuth}
          disabled={isLoading}
        >
          {isLoading
            ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
            : <>{mode === 'login' ? 'Login Securely' : 'Complete Registration'} <ArrowRight size={18} /></>
          }
        </button>

        {mode === 'signup' && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '2rem', lineHeight: '1.4' }}>
            By registering, you agree to manual document verification against official government databases prior to full account activation.
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
