import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Navigation, Building, CheckCircle, Truck, Info, DollarSign, ArrowRight, ShieldCheck, X, AlertCircle } from 'lucide-react';
import api from '../api';


const LoadList = () => {
    const [loads, setLoads] = useState([]);
    const [fleet, setFleet] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPickup, setSearchPickup] = useState('');
    const [searchDrop, setSearchDrop] = useState('');
    const [filterWeight, setFilterWeight] = useState('Any Weight');
    
    // Booking Flow State
    const [selectedLoadForBooking, setSelectedLoadForBooking] = useState(null);
    const [selectedTruckId, setSelectedTruckId] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const userRole = localStorage.getItem('userRole') || 'truck_owner';

    const fetchData = async () => {
        setIsSearching(true);
        try {
            // Fetch Loads
            let weightParams = {};
            if (filterWeight === '0-5 Tons') weightParams = { minWeight: 0, maxWeight: 5 };
            else if (filterWeight === '5-15 Tons') weightParams = { minWeight: 5, maxWeight: 15 };
            else if (filterWeight === '15+ Tons') weightParams = { minWeight: 15 };

            const params = { pickup: searchPickup, drop: searchDrop, ...weightParams };
            const loadsRes = await api.get('/loads', { params });
            setLoads(loadsRes.data);

            // Fetch Fleet if Truck Owner
            if (userRole === 'truck_owner') {
                const fleetRes = await api.get('/trucks/my-fleet');
                setFleet(fleetRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBooking = async () => {
        if (!selectedTruckId) return;
        setIsBooking(true);
        try {
            await api.post('/trips/accept', { 
                loadId: selectedLoadForBooking._id, 
                truckId: selectedTruckId 
            });
            setBookingSuccess(selectedLoadForBooking._id);
            setTimeout(() => {
                setSelectedLoadForBooking(null);
                fetchData(); // Refresh list
            }, 2000);
        } catch (err) {
            console.error('Booking error:', err);
            alert('Failed to book. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    if (userRole === 'company') {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}>
                <div className="card animate-scale-in" style={{ padding: '4rem', maxWidth: '500px', margin: '0 auto' }}>
                    <ShieldCheck size={80} color="var(--color-secondary)" style={{ marginBottom: '2rem', filter: 'drop-shadow(0 0 20px rgba(0, 168, 232, 0.4))' }} />
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Restricted Access</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>The open load market is a secured space reserved for registered and verified Truck Owners to find work.</p>
                    <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '2.5rem', width: '100%' }}>Back to Workspace</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
            
            {/* Truck Selection Modal */}
            {selectedLoadForBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card animate-scale-in" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', position: 'relative' }}>
                        <button onClick={() => setSelectedLoadForBooking(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        
                        {bookingSuccess ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <CheckCircle size={48} color="var(--color-success)" />
                                </div>
                                <h2 style={{ marginBottom: '0.5rem' }}>Trip Scheduled!</h2>
                                <p style={{ color: 'var(--color-text-muted)' }}>Load has been assigned to your truck. Redirecting...</p>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ marginBottom: '0.5rem' }}>Complete Booking</h2>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Select a truck from your fleet for this trip</p>
                                
                                <div className="input-group">
                                    <label className="input-label">Available Fleet</label>
                                    <select className="input-field" value={selectedTruckId} onChange={e => setSelectedTruckId(e.target.value)}>
                                        <option value="">-- Choose Truck --</option>
                                        {fleet.map(truck => (
                                            <option key={truck._id} value={truck._id}>{truck.vehicleNo} ({truck.type})</option>
                                        ))}
                                    </select>
                                </div>

                                {fleet.length === 0 && (
                                    <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255,193,7,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(255,193,7,0.2)' }}>
                                        <AlertCircle size={20} color="#ffc107" />
                                        <p style={{ fontSize: '0.85rem', color: '#ffc107', margin: 0 }}>You don't have any trucks registered. Please add a truck in your profile first.</p>
                                    </div>
                                )}

                                <div className="card" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.25rem', marginBottom: '2rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>Load Overview</h4>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedLoadForBooking.pickup} → {selectedLoadForBooking.drop}</p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{selectedLoadForBooking.material} • {selectedLoadForBooking.weight} Tons</p>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', height: '3.5rem' }} 
                                    onClick={handleBooking}
                                    disabled={!selectedTruckId || isBooking}
                                >
                                    {isBooking ? <div className="spinner"></div> : 'Confirm & Finalize Booking'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end" style={{ marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.8rem', marginBottom: '0.25rem', background: 'linear-gradient(white, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Marketplace</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Available profitable loads in your operational range</p>
                </div>
                <div className="flex" style={{ gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Active Loads</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{loads.length}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Available Trucks</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{fleet.length}</span>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={(e) => {e.preventDefault(); fetchData();}} className="card" style={{ padding: '1.5rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--color-secondary)' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ opacity: 0.6 }}>Pickup City</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                            <input type="text" className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="e.g. Mumbai" value={searchPickup} onChange={e => setSearchPickup(e.target.value)} />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ opacity: 0.6 }}>Drop City</label>
                        <div style={{ position: 'relative' }}>
                            <Navigation size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)' }} />
                            <input type="text" className="input-field" style={{ paddingLeft: '2.5rem' }} placeholder="e.g. Delhi" value={searchDrop} onChange={e => setSearchDrop(e.target.value)} />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label" style={{ opacity: 0.6 }}>Weight Category</label>
                        <select className="input-field" value={filterWeight} onChange={e => setFilterWeight(e.target.value)}>
                            <option>Any Weight</option>
                            <option>0-5 Tons</option>
                            <option>5-15 Tons</option>
                            <option>15+ Tons</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '3.2rem', gap: '0.75rem', fontSize: '1.1rem' }} disabled={isSearching}>
                            {isSearching ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : <><Search size={20} /> Live Search</>}
                        </button>
                    </div>
                </div>
            </form>

            {/* Results */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {loads && loads.length > 0 ? loads.map((load, index) => (
                    <div key={load._id} className="card glass-card-hover animate-slide-up" style={{ padding: '0', overflow: 'hidden', animationDelay: `${index * 0.1}s` }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            <div style={{ width: '12px', backgroundColor: 'var(--color-secondary)' }}></div>
                            <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <Building size={18} color="var(--color-secondary)" />
                                        <span style={{ fontWeight: '600' }}>{load.poster?.fullName || 'Verified Shipper'}</span>
                                        <CheckCircle size={14} color="var(--color-success)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.8rem', margin: '0 0 1rem 0' }}>
                                        {load.pickup} <ArrowRight size={20} style={{ margin: '0 1rem', opacity: 0.3 }} /> {load.drop}
                                    </h3>
                                    <div className="flex" style={{ gap: '2rem', color: 'var(--color-text-muted)' }}>
                                        <span className="flex items-center" style={{ gap: '0.5rem' }}><Truck size={18} /> {load.weight} Tons</span>
                                        <span className="flex items-center" style={{ gap: '0.5rem' }}><Info size={18} /> {load.material}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--color-success)', marginBottom: '1rem' }}>
                                        ₹{load.price ? Number(load.price).toLocaleString('en-IN') : '0'}
                                    </div>
                                    <button onClick={() => setSelectedLoadForBooking(load)} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Accept & Book Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                        <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No loads found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadList;
