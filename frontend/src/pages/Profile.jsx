import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, PhoneCall, MapPin, Truck, FileCheck, Search, LogIn, Plus, X, Trash2 } from 'lucide-react';
import api from '../api';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [fleet, setFleet] = useState([]);
    const [isLoadingFleet, setIsLoadingFleet] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [showAddTruck, setShowAddTruck] = useState(false);
    const [newTruck, setNewTruck] = useState({ vehicleNo: '', rcNo: '', type: 'Open Truck', capacity: '' });
    const [truckError, setTruckError] = useState('');

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setUserData(res.data);
            localStorage.setItem('userData', JSON.stringify(res.data));
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const fetchFleet = async () => {
        setIsLoadingFleet(true);
        try {
            const res = await api.get('/trucks/my-fleet');
            setFleet(res.data);
        } catch (err) {
            console.error('Error fetching fleet:', err);
        } finally {
            setIsLoadingFleet(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Only fetch fleet after we know the user's role
    useEffect(() => {
        if (userData?.role === 'truck_owner') {
            fetchFleet();
        }
    }, [userData]);

    const handleAddTruck = async (e) => {
        e.preventDefault();
        setTruckError('');
        try {
            await api.post('/trucks', { ...newTruck, capacity: Number(newTruck.capacity) });
            setNewTruck({ vehicleNo: '', rcNo: '', type: 'Open Truck', capacity: '' });
            setShowAddTruck(false);
            fetchFleet();
        } catch (err) {
            setTruckError(err.response?.data?.message || 'Failed to add vehicle. Check all fields.');
        }
    };

    const handleDeleteTruck = async (truckId) => {
        if (!window.confirm('Remove this vehicle from your fleet?')) return;
        try {
            await api.delete(`/trucks/${truckId}`);
            fetchFleet();
        } catch (err) {
            alert('Failed to remove vehicle.');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    if (isLoadingProfile) {
        return <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}><div className="spinner"></div></div>;
    }

    if (!userData) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}>
                <h2>No Profile Found</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Please register to create your profile.</p>
                <Link to="/auth" className="btn btn-primary">Go to Registration</Link>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem', maxWidth: '1000px' }}>
            
            {/* Add Truck Modal */}
            {showAddTruck && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <form onSubmit={handleAddTruck} className="card animate-scale-in" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', position: 'relative' }}>
                        <button type="button" onClick={() => setShowAddTruck(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add New Vehicle</h2>
                        
                        <div className="input-group">
                            <label className="input-label">Vehicle Registration Number</label>
                            <input type="text" className="input-field" placeholder="e.g. MH 12 AB 1234" required value={newTruck.vehicleNo} onChange={e => setNewTruck({...newTruck, vehicleNo: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">RC Book Number</label>
                            <input type="text" className="input-field" placeholder="e.g. RC123456" required value={newTruck.rcNo} onChange={e => setNewTruck({...newTruck, rcNo: e.target.value})} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Truck Type</label>
                            <select className="input-field" value={newTruck.type} onChange={e => setNewTruck({...newTruck, type: e.target.value})}>
                                <option>Open Truck</option>
                                <option>Container</option>
                                <option>Trailer</option>
                                <option>Tanker</option>
                                <option>Refrigerated</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Payload Capacity (Tons)</label>
                            <input type="number" className="input-field" placeholder="10" required value={newTruck.capacity} onChange={e => setNewTruck({...newTruck, capacity: e.target.value})} />
                        </div>
                        {truckError && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', backgroundColor: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px' }}>{truckError}</p>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register Vehicle</button>
                    </form>
                </div>
            )}

            {/* Profile Header */}
            <div className="card" style={{ padding: '3rem', position: 'relative', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)', zIndex: 0 }}></div>
                
                <div className="flex justify-between items-start" style={{ position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '2rem' }}>
                    <div className="flex" style={{ gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '120px', height: '120px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={64} color="var(--color-secondary)" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{userData.fullName}</h2>
                                <span className="badge badge-success"><ShieldCheck size={14} /> Verified Member</span>
                            </div>
                            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                {userData.role === 'truck_owner' ? 'Professional Carrier' : 'Logistics Business Partner'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleLogout} className="btn btn-primary" style={{ backgroundColor: '#ff4d4d', border: 'none', padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <LogIn size={18} style={{ transform: 'rotate(180deg)' }} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Account Stats */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Account Details</h3>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Phone</label>
                                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>+91 {userData.phone}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{userData.role === 'company' ? 'Company Name' : 'Full Name'}</label>
                                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>{userData.fullName}</p>
                            </div>
                            {userData.companyAddress && (
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Headquarters</label>
                                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 'bold' }}>{userData.companyAddress}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Trust Score</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>4.9</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {[1,2,3,4,5].map(i => <ShieldCheck key={i} size={20} color="var(--color-success)" />)}
                            </div>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Verified member since {new Date().getFullYear()}. Full identity and asset verification completed.</p>
                    </div>
                </div>

                {/* Role Specific Content */}
                {userData.role === 'truck_owner' ? (
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.6rem' }}>My Fleet</h3>
                            <button onClick={() => setShowAddTruck(true)} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', gap: '0.5rem' }}>
                                <Plus size={18} /> Add Vehicle
                            </button>
                        </div>

                        {isLoadingFleet ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner"></div></div>
                        ) : fleet.length > 0 ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {fleet.map((truck) => (
                                    <div key={truck._id} style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="flex items-center" style={{ gap: '1.25rem' }}>
                                            <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(0,168,232,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Truck size={24} color="var(--color-secondary)" />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{truck.vehicleNo}</p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>{truck.type} • {truck.capacity} Tons</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteTruck(truck._id)} className="btn" style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.5)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Truck size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                                <p style={{ color: 'var(--color-text-muted)' }}>No vehicles registered in your fleet.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>Warehouse Compliance</h3>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {[
                                { name: 'GST Certificate', status: 'Approved' },
                                { name: 'FSSAI License', status: 'Under Review' },
                                { name: 'Proof of Address', status: 'Approved' }
                            ].map((doc, i) => (
                                <div key={i} style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="flex items-center" style={{ gap: '1rem' }}>
                                        <FileCheck size={24} color="var(--color-secondary)" />
                                        <span style={{ fontWeight: '600' }}>{doc.name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: doc.status === 'Approved' ? 'var(--color-success)' : 'var(--color-secondary)', fontWeight: 'bold' }}>{doc.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
