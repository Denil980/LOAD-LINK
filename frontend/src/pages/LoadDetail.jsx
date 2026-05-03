import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Navigation, Package, DollarSign, Truck, ArrowLeft, CheckCircle, Clock, AlertCircle, Building, Phone } from 'lucide-react';
import api from '../api';

const LoadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [load, setLoad] = useState(null);
    const [fleet, setFleet] = useState([]);
    const [selectedTruckId, setSelectedTruckId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState('');
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        const fetchLoad = async () => {
            try {
                setIsLoading(true);
                const [loadRes, fleetRes] = await Promise.all([
                    api.get(`/loads/${id}`),
                    userRole === 'truck_owner' ? api.get('/trucks/my-fleet') : Promise.resolve({ data: [] })
                ]);
                setLoad(loadRes.data);
                setFleet(fleetRes.data);
            } catch (err) {
                setError('Load not found or has been removed.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLoad();
    }, [id, userRole]);

    const handleBook = async () => {
        if (!selectedTruckId) return setError('Please select a truck.');
        setIsBooking(true);
        setError('');
        try {
            await api.post('/trips/accept', { loadId: id, truckId: selectedTruckId });
            setBookingSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    const urgencyColor = { High: '#ef4444', Urgent: '#f97316', Normal: 'var(--color-success)' };

    if (isLoading) return <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}><div className="spinner" /></div>;
    if (!load) return (
        <div className="container" style={{ textAlign: 'center', marginTop: '8rem' }}>
            <AlertCircle size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2>Load Not Found</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
            <Link to="/loads" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Marketplace</Link>
        </div>
    );

    if (bookingSuccess) return (
        <div className="container animate-fade-in" style={{ textAlign: 'center', marginTop: '10rem' }}>
            <div className="card" style={{ padding: '4rem', maxWidth: '480px', margin: '0 auto' }}>
                <CheckCircle size={80} color="var(--color-success)" style={{ marginBottom: '1.5rem' }} />
                <h2>Trip Confirmed!</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>{load.pickup} → {load.drop} is now assigned to your truck. Redirecting to dashboard…</p>
            </div>
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem', maxWidth: '900px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.95rem' }}>
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>
                {/* Load Details */}
                <div>
                    <div className="card" style={{ marginBottom: '2rem', padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Load ID</span>
                                <p style={{ fontWeight: 'bold', color: 'var(--color-secondary)', margin: '0.2rem 0 0 0' }}>#{id.slice(-8).toUpperCase()}</p>
                            </div>
                            {load.urgency && (
                                <span style={{ padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: `${urgencyColor[load.urgency]}22`, color: urgencyColor[load.urgency] }}>
                                    {load.urgency} Priority
                                </span>
                            )}
                        </div>

                        <h2 style={{ fontSize: '2.4rem', marginBottom: '2rem' }}>
                            {load.pickup} <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem', margin: '0 0.75rem' }}>→</span> {load.drop}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                            {[
                                { icon: Package, label: 'Material', value: load.material },
                                { icon: Truck, label: 'Weight', value: `${load.weight} Tons` },
                                { icon: DollarSign, label: 'Offered Price', value: `₹${Number(load.price).toLocaleString('en-IN')}`, green: true },
                                { icon: Clock, label: 'Posted', value: new Date(load.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
                            ].map(({ icon: Icon, label, value, green }) => (
                                <div key={label} style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Icon size={16} color="var(--color-secondary)" />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</span>
                                    </div>
                                    <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1.1rem', color: green ? 'var(--color-success)' : 'white' }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Poster Company Info */}
                    {load.poster && (
                        <div className="card" style={{ padding: '2rem' }}>
                            <h4 style={{ marginBottom: '1.25rem', color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Shipper Information</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building size={28} color="var(--color-secondary)" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{load.poster.fullName}</p>
                                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Phone size={14} /> +91 {load.poster.phone}
                                        </span>
                                        {load.poster.verified && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <CheckCircle size={14} /> Verified Business
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Booking Panel */}
                {userRole === 'truck_owner' && load.status === 'open' && (
                    <div className="card" style={{ padding: '2rem', position: 'sticky', top: '90px' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Accept This Load</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Choose a truck from your fleet to assign to this trip.</p>

                        <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1.5rem' }}>
                            ₹{Number(load.price).toLocaleString('en-IN')}
                        </div>

                        {error && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', backgroundColor: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

                        <div className="input-group">
                            <label className="input-label">Select Truck</label>
                            <select className="input-field" value={selectedTruckId} onChange={e => setSelectedTruckId(e.target.value)}>
                                <option value="">-- Choose from fleet --</option>
                                {fleet.filter(t => t.status === 'available').map(truck => (
                                    <option key={truck._id} value={truck._id}>{truck.vehicleNo} • {truck.type} • {truck.capacity}T</option>
                                ))}
                            </select>
                        </div>

                        {fleet.filter(t => t.status === 'available').length === 0 && (
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#f97316' }}>
                                No available trucks. Add a truck in your Profile first.
                            </div>
                        )}

                        <button onClick={handleBook} disabled={isBooking || !selectedTruckId} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                            {isBooking ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Confirm Booking'}
                        </button>

                        <Link to="/loads" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                            ← Back to Marketplace
                        </Link>
                    </div>
                )}

                {load.status !== 'open' && (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <AlertCircle size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} color="var(--color-text-muted)" />
                        <h4 style={{ textTransform: 'capitalize' }}>Load {load.status}</h4>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>This load is no longer accepting bookings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadDetail;
