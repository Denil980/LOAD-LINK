import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Navigation, ShieldCheck, Truck, CheckCircle, Info, Phone, User, X, ChevronRight, Activity, TrendingUp, RefreshCw } from 'lucide-react';
import api from '../api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [userRole] = useState(localStorage.getItem('userRole'));
    const [myPostings, setMyPostings] = useState([]);
    const [activeTrips, setActiveTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedLoad, setSelectedLoad] = useState(null);
    const [paymentAdvance, setPaymentAdvance] = useState('');
    const [paymentBalance, setPaymentBalance] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    const userRoleRef = useRef(userRole);
    
    // SECURITY CHECK: Redirect if not authenticated
    useEffect(() => {
        const token = localStorage.getItem('userToken');
        if (!token) navigate('/auth');
    }, [navigate]);

    const fetchData = useCallback(async (silent = false) => {
        if (!localStorage.getItem('userToken')) return;
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        try {
            const role = userRoleRef.current;
            if (role === 'company') {
                const res = await api.get('/loads/my-postings');
                setMyPostings(res.data);
            } else if (role === 'truck_owner') {
                const res = await api.get('/trips/my-history');
                setActiveTrips(res.data.filter(t => t.status !== 'delivered' && t.status !== 'cancelled'));
            }
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh when user returns to this tab / window
    useEffect(() => {
        const onFocus = () => fetchData(true);
        const onVisibility = () => { if (document.visibilityState === 'visible') fetchData(true); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [fetchData]);

    const handleStatusUpdate = async (tripId, nextStatus) => {
        try {
            await api.put(`/trips/${tripId}/status`, { status: nextStatus });
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleCancelLoad = async (loadId) => {
        if (!window.confirm("Are you sure you want to cancel this load?")) return;
        try {
            await api.put(`/loads/${loadId}/cancel`);
            fetchData();
            setSelectedLoad(null);
        } catch (err) {
            console.error('Error cancelling load:', err);
            alert(err.response?.data?.message || 'Failed to cancel load');
        }
    };

    const handleSelectLoad = (load) => {
        setSelectedLoad(load);
        if (load && load.assignedTrip) {
            setPaymentAdvance(load.assignedTrip.pricing?.advance || '');
            setPaymentBalance(load.assignedTrip.pricing?.balance || '');
        }
    };

    const handlePaymentUpdate = async (tripId) => {
        try {
            await api.put(`/trips/${tripId}/payment`, { advance: paymentAdvance, balance: paymentBalance });
            alert('Payment updated successfully');
            fetchData();
        } catch (err) {
            console.error('Error updating payment:', err);
            alert(err.response?.data?.message || 'Failed to update payment');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            open: { color: 'var(--color-secondary)', bg: 'rgba(0,168,232,0.1)' },
            assigned: { color: 'var(--color-success)', bg: 'rgba(34,197,94,0.1)', label: 'Booked' },
            scheduled: { color: 'var(--color-success)', bg: 'rgba(34,197,94,0.1)', label: 'Scheduled' },
            'in-transit': { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
            delivered: { color: 'var(--color-text-muted)', bg: 'rgba(255,255,255,0.05)' }
        };
        const config = styles[status] || styles.open;
        return (
            <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px', 
                backgroundColor: config.bg, 
                color: config.color,
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}>
                {config.label || status}
            </span>
        );
    };

    const calculateProgress = (status) => {
        if (status === 'open') return '0%';
        if (status === 'assigned' || status === 'scheduled') return '10%';
        if (status === 'in-transit') return '60%';
        if (status === 'delivered') return '100%';
        return '0%';
    };

    if (!userRole) return null; // Wait for security redirect

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
            {/* Carrier Detail Modal */}
            {selectedLoad && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card animate-scale-in" style={{ maxWidth: '420px', width: '100%', padding: '1.5rem', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
                        <button onClick={() => setSelectedLoad(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }} title="Close">
                            <X size={18} />
                        </button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Carrier Details</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Load ID: #{selectedLoad._id.slice(-6)}</p>
                        </div>

                        {selectedLoad.assignedTrip && (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>
                                        <User size={16} /> Driver / Owner Info
                                    </h4>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{selectedLoad.assignedTrip.carrier.fullName}</p>
                                    <p style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', margin: 0 }}>
                                        <Phone size={14} /> +91 {selectedLoad.assignedTrip.carrier.phone}
                                    </p>
                                </div>

                                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>
                                        <Truck size={16} /> Vehicle Information
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Reg Number:</span>
                                        <span style={{ fontWeight: 'bold' }}>{selectedLoad.assignedTrip.truck?.vehicleNo || 'V-4821'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Trip Status:</span>
                                        <StatusBadge status={selectedLoad.assignedTrip.status} />
                                    </div>
                                </div>

                                <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>
                                        <DollarSign size={16} /> Payment Tracking
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Total Amount:</span>
                                        <span style={{ fontWeight: 'bold' }}>₹{selectedLoad.price?.toLocaleString('en-IN') || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Advance Paid:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>₹</span>
                                            <input type="number" value={paymentAdvance} onChange={e => setPaymentAdvance(e.target.value)} style={{ width: '70px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: '0.85rem' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>Balance Due:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ color: 'var(--color-text-muted)' }}>₹</span>
                                            <input type="number" value={paymentBalance} onChange={e => setPaymentBalance(e.target.value)} style={{ width: '70px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: '0.85rem' }} />
                                        </div>
                                    </div>
                                    <button onClick={() => handlePaymentUpdate(selectedLoad.assignedTrip._id)} className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem', padding: '0.4rem' }}>Save Payments</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.6rem', marginBottom: '0.25rem', letterSpacing: '-1px' }}>
                        {userRole === 'truck_owner' ? 'Driver Central' : 'Logistics Command'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '1.1rem' }}>
                        Welcome back, <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>{userData.fullName || 'Verified Member'}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {lastUpdated && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        title="Refresh dashboard"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-secondary)', transition: 'all 0.3s ease' }}
                    >
                        <RefreshCw size={18} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <span className="badge badge-success" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '50px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 0 10px #fff' }}></div>
                        Network Active
                    </span>
                </div>
            </div>

            {/* Dynamic Stats Grid based on Role */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {userRole === 'truck_owner' ? (
                    <>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><DollarSign size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Monthly Earnings</span>
                                <DollarSign size={20} color="var(--color-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>₹ 84,200</h2>
                            <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <TrendingUp size={14} /> +15.4% from last month
                            </p>
                        </div>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><Navigation size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Total Distance</span>
                                <Navigation size={20} color="var(--color-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>2,450 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>km</span></h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>8 Trips successfully clocked</p>
                        </div>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><ShieldCheck size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Fleet Rating</span>
                                <ShieldCheck size={20} color="var(--color-success)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>4.9<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/5</span></h2>
                            <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: '600' }}>Platinum Carrier Badge</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><Truck size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Active Postings</span>
                                <Truck size={20} color="var(--color-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>{myPostings.length}</h2>
                            <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: '600' }}>Live reporting active</p>
                        </div>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><DollarSign size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Logistics Spend</span>
                                <DollarSign size={20} color="var(--color-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>₹ 4.2<span style={{ fontSize: '1rem' }}>L</span></h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>Within projected quarterly budget</p>
                        </div>
                        <div className="card glass-card-hover" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}><Activity size={48} /></div>
                            <div className="flex justify-between" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Network Reach</span>
                                <Activity size={20} color="var(--color-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>180<span style={{ fontSize: '1rem', fontWeight: 'normal' }}>+</span></h2>
                            <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: '600' }}>High carrier availability</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: userRole === 'company' ? '1fr' : '1.8fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2.5rem', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '2.5rem' }}>
                        <div>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>
                            {userRole === 'truck_owner' ? 'Active Trip Management' : 'My Posting Dashboard'}
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Real-time coordination of your logistics operations</p>
                        </div>
                        <Link to={userRole === 'truck_owner' ? '/operations-history' : '/post-load'} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            {userRole === 'truck_owner' ? 'Historical Ledger' : 'Broadcast Load +'}
                        </Link>
                    </div>
                    
                    <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        {userRole === 'truck_owner' ? (
                            <div style={{ width: '100%' }}>
                                {isLoading ? (
                                    <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>
                                ) : activeTrips.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '2rem' }}>
                                        {activeTrips.map((trip) => (
                                            <div key={trip._id} className="card glass-card-hover" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div className="flex justify-between items-start" style={{ marginBottom: '2rem' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem 0' }}>{trip.load.pickup} → {trip.load.drop}</h4>
                                                        <div className="flex items-center" style={{ gap: '1.5rem' }}>
                                                            <StatusBadge status={trip.status} />
                                                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14} /> Material: {trip.load.material}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>₹{trip.load.price.toLocaleString('en-IN')}</div>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Trip Revenue</span>
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '2.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                                                        <span>Pickup Point</span>
                                                        <span>Final Delivery</span>
                                                    </div>
                                                    <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', marginBottom: '1.5rem' }}>
                                                        <div style={{ width: calculateProgress(trip.status), height: '100%', backgroundColor: 'var(--color-secondary)', borderRadius: '4px', boxShadow: '0 0 15px var(--color-secondary)' }}></div>
                                                        {trip.status === 'in-transit' && <Truck size={20} color="var(--color-secondary)" style={{ position: 'absolute', left: '60%', top: '-25px' }} />}
                                                    </div>
                                                </div>

                                                {trip.pricing && (trip.pricing.advance > 0 || trip.pricing.balance > 0) && (
                                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Advance Paid</div>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--color-success)', fontSize: '1.1rem' }}>₹{trip.pricing.advance.toLocaleString('en-IN')}</div>
                                                        </div>
                                                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Balance Due</div>
                                                            <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)', fontSize: '1.1rem' }}>₹{trip.pricing.balance.toLocaleString('en-IN')}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex" style={{ gap: '1.5rem' }}>
                                                    {trip.status === 'scheduled' && (
                                                        <button onClick={() => handleStatusUpdate(trip._id, 'in-transit')} className="btn btn-primary" style={{ flex: 1, height: '3.5rem', gap: '0.75rem' }}>
                                                            <Navigation size={20} /> Depart for Transit
                                                        </button>
                                                    )}
                                                    {trip.status === 'in-transit' && (
                                                        <button onClick={() => handleStatusUpdate(trip._id, 'delivered')} className="btn btn-primary" style={{ flex: 1, height: '3.5rem', gap: '0.75rem', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                                                            <CheckCircle size={20} /> Confirm Delivery
                                                        </button>
                                                    )}
                                                    <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: '3.5rem' }}>
                                                        <Phone size={18} /> Support 24/7
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                                        <Truck size={64} color="var(--color-secondary)" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                        <h3 style={{ color: 'var(--color-secondary)', fontSize: '1.8rem', marginBottom: '1rem' }}>No Active Trips</h3>
                                        <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 2.5rem' }}>Your fleet is currently stationary. Head to the live marketplace to secure profitable loads.</p>
                                        <Link to="/loads" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Browse Market Loads</Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                                    <Info size={20} color="var(--color-secondary)" />
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>Click on any <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Booked</span> load to view carrier and vehicle information.</p>
                                </div>
                                {isLoading ? (
                                    <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner"></div></div>
                                ) : myPostings.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {myPostings.map((load) => (
                                            <div key={load._id} 
                                                onClick={() => load.assignedTrip && handleSelectLoad(load)}
                                                style={{ 
                                                    padding: '1.5rem', 
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    cursor: load.assignedTrip ? 'pointer' : 'default',
                                                    backgroundColor: load.assignedTrip ? 'rgba(34,197,94,0.04)' : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: 'var(--radius-lg)'
                                                }}
                                                className={load.assignedTrip ? 'glass-card-hover' : ''}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{load.pickup} → {load.drop}</span>
                                                        <StatusBadge status={load.assignedTrip ? load.assignedTrip.status : 'open'} />
                                                    </div>
                                                    <div style={{ width: '200px', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', margin: '0.75rem 0' }}>
                                                        <div style={{ width: calculateProgress(load.assignedTrip?.status || 'open'), height: '100%', backgroundColor: 'var(--color-secondary)', borderRadius: '2px' }}></div>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                        ID: #{load._id.slice(-6)} • {load.material} • {load.weight} Tons • ₹{load.price.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    {!load.assignedTrip ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Activity size={14} /> Waiting for Bids...
                                                            </span>
                                                            {load.status !== 'cancelled' && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleCancelLoad(load._id); }}
                                                                    className="btn btn-outline" 
                                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
                                                                >
                                                                    Cancel Load
                                                                </button>
                                                            )}
                                                            {load.status === 'cancelled' && (
                                                                <span style={{ fontSize: '0.85rem', color: '#ff6b6b', fontWeight: 'bold' }}>Cancelled</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>View Tracking</span>
                                                                <ChevronRight size={18} />
                                                            </div>
                                                            {load.status !== 'cancelled' && load.status !== 'delivered' && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleCancelLoad(load._id); }}
                                                                    className="btn btn-outline" 
                                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)' }}
                                                                >
                                                                    Cancel Load
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '5rem', textAlign: 'center' }}>
                                        <Truck size={48} color="var(--color-secondary)" style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                                        <p style={{ color: 'var(--color-text-muted)' }}>You haven't posted any active loads yet.</p>
                                        <Link to="/post-load" className="btn btn-outline" style={{ marginTop: '1.5rem' }}>Post Your First Load</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {userRole === 'truck_owner' && (
                    <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: '2rem' }}>
                        <div className="card" style={{ padding: '2rem' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '1.1rem' }}>Premium Loads</h4>
                                <Link to="/loads"><ChevronRight size={20} color="var(--color-secondary)" /></Link>
                            </div>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                                    <div><span style={{ fontSize: '1rem', fontWeight: '600' }}>Mumbai → Delhi</span><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Steel, 18 Tons</p></div>
                                    <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>₹ 52,000</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><span style={{ fontSize: '1rem', fontWeight: '600' }}>Pune → Surat</span><p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>Textiles, 8 Tons</p></div>
                                    <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>₹ 24,500</span>
                                </div>
                            </div>
                            <Link to="/loads" className="btn btn-outline" style={{ width: '100%', marginTop: '2rem', fontSize: '0.9rem', display: 'block', textAlign: 'center' }}>Enter Marketplace</Link>
                        </div>

                        <div className="card" style={{ padding: '2rem', background: 'linear-gradient(rgba(0,168,232,0.1), transparent)' }}>
                            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShieldCheck size={20} color="var(--color-success)" /> Security & Trust
                            </h4>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>ID Verification</span>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Active</span>
                                </div>
                                <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>RC Documents</span>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Verified</span>
                                </div>
                                <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Payment Wallet</span>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>₹ 12,500</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
