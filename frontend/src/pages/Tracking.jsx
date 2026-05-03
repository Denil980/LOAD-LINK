import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, Navigation, Shield, User, Phone, Clock, Layers, Maximize, Target, Crosshair, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';

const Tracking = () => {
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [mapType, setMapType] = useState('night');
    const [activeTrips, setActiveTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle | sharing | error
    const [gpsPosition, setGpsPosition] = useState(null);
    const [activeTruckId, setActiveTruckId] = useState(null);
    const gpsWatchRef = useRef(null);
    const userRole = localStorage.getItem('userRole');

    // Fetch active trips on load
    useEffect(() => {
        const fetchActiveTrips = async () => {
            setIsLoading(true);
            try {
                const res = await api.get('/trips/my-history');
                const data = Array.isArray(res.data) ? res.data : res.data.trips;
                const active = data.filter(t => t.load && ['assigned', 'in-transit'].includes(t.status));
                setActiveTrips(active);
            } catch (err) {
                console.error('Error fetching trips:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchActiveTrips();
        return () => { if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current); };
    }, []);

    const startGPS = (truckId) => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        setActiveTruckId(truckId);
        setGpsStatus('sharing');

        const pushLocation = async (position) => {
            const { latitude: lat, longitude: lng } = position.coords;
            setGpsPosition({ lat, lng });
            try {
                await api.put(`/trucks/${truckId}/location`, { lat, lng, city: 'Live', state: 'GPS Active' });
            } catch (err) {
                console.error('GPS push failed:', err);
            }
        };

        gpsWatchRef.current = navigator.geolocation.watchPosition(pushLocation, () => setGpsStatus('error'), {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 20000
        });
    };

    const stopGPS = () => {
        if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
        setGpsStatus('idle');
        setGpsPosition(null);
        setActiveTruckId(null);
    };

    const progress = (status) => {
        if (status === 'assigned') return 10;
        if (status === 'in-transit') return 60;
        if (status === 'delivered') return 100;
        return 0;
    };

    return (
        <div className="container animate-fade-in" style={{ marginTop: '1rem', height: 'calc(100vh - 120px)', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Fleet Command</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>Real-time GPS synchronization with active fleet</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* GPS Status */}
                    {userRole === 'truck_owner' && gpsStatus === 'sharing' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1.2rem', backgroundColor: 'rgba(46,204,113,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(46,204,113,0.2)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', animation: 'pulseGlow 2s infinite' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: '600' }}>Broadcasting Live GPS</span>
                            <button onClick={stopGPS} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Stop</button>
                        </div>
                    )}
                    {gpsStatus === 'error' && (
                        <span style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <AlertCircle size={16} /> GPS unavailable
                        </span>
                    )}
                    <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
                        <button onClick={() => setMapType('night')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', backgroundColor: mapType === 'night' ? 'var(--color-secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Dark</button>
                        <button onClick={() => setMapType('terrain')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', backgroundColor: mapType === 'terrain' ? 'var(--color-secondary)' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Satellite</button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', overflow: 'hidden', minHeight: 0 }}>
                {/* Left Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {isLoading ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : activeTrips.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <Truck size={48} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No active trips to track right now.</p>
                        </div>
                    ) : activeTrips.map(trip => (
                        <div
                            key={trip._id}
                            onClick={() => setSelectedTrip(trip)}
                            className="card glass-card-hover"
                            style={{ padding: '1.25rem', cursor: 'pointer', border: selectedTrip?._id === trip._id ? '1px solid var(--color-secondary)' : '1px solid rgba(255,255,255,0.07)', backgroundColor: selectedTrip?._id === trip._id ? 'rgba(0,168,232,0.06)' : 'rgba(0,0,0,0.2)' }}
                        >
                            <div className="flex justify-between" style={{ marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>#{trip._id.slice(-6).toUpperCase()}</span>
                                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                                    {trip.status === 'in-transit' ? '🟢 MOVING' : '🔵 SCHEDULED'}
                                </span>
                            </div>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>{trip.load.pickup} → {trip.load.drop}</h4>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', height: '4px', borderRadius: '2px', marginBottom: '0.75rem' }}>
                                <div style={{ width: `${progress(trip.status)}%`, height: '100%', backgroundColor: 'var(--color-secondary)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{trip.load.material} • {trip.load.weight}T</span>
                                <span>{progress(trip.status)}%</span>
                            </div>

                            {/* GPS share button for truck owner */}
                            {userRole === 'truck_owner' && trip.truck && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); activeTruckId === trip.truck._id ? stopGPS() : startGPS(trip.truck._id); }}
                                    style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', border: `1px solid ${activeTruckId === trip.truck._id ? '#ef4444' : 'var(--color-secondary)'}`, borderRadius: '8px', backgroundColor: 'transparent', color: activeTruckId === trip.truck._id ? '#ef4444' : 'var(--color-secondary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', alignItems: 'center' }}
                                >
                                    <Crosshair size={14} />
                                    {activeTruckId === trip.truck._id ? 'Stop Broadcasting' : 'Share Live Location'}
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Safety badge */}
                    <div className="card" style={{ padding: '1.25rem', marginTop: 'auto', background: 'linear-gradient(rgba(0,168,232,0.08), transparent)' }}>
                        <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <Shield size={18} color="var(--color-success)" />
                            <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Network Safety</h4>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
                            {gpsStatus === 'sharing'
                                ? `Broadcasting live coordinates. Lat: ${gpsPosition?.lat?.toFixed(4)}, Lng: ${gpsPosition?.lng?.toFixed(4)}`
                                : 'GPS updates are pushed every 10 seconds when location sharing is active.'}
                        </p>
                    </div>
                </div>

                {/* Map Panel */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, backgroundColor: '#070d1a', position: 'relative', backgroundImage: mapType === 'night' ? 'radial-gradient(rgba(0,168,232,0.12) 1.5px, transparent 0)' : 'radial-gradient(rgba(46,204,113,0.08) 1.5px, transparent 0)', backgroundSize: '40px 40px' }}>
                        {/* SVG track lines */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.25 }}>
                            <path d="M 80 420 Q 250 280 500 160 Q 720 60 900 80" fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeDasharray="12,6" />
                            <circle cx="80" cy="420" r="5" fill="var(--color-secondary)" opacity="0.9" />
                            <circle cx="900" cy="80" r="5" fill="var(--color-secondary)" opacity="0.9" />
                            {gpsPosition && (
                                <circle cx="450" cy="220" r="10" fill="var(--color-success)" opacity="0.9">
                                    <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}
                        </svg>

                        {/* Selected Trip Overlay */}
                        {selectedTrip ? (
                            <div className="animate-slide-up" style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', backgroundColor: 'rgba(7,13,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', backdropFilter: 'blur(10px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.5rem' }}>
                                <div>
                                    <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Trip #{selectedTrip._id.slice(-6).toUpperCase()}</h5>
                                    <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold' }}>{selectedTrip.load.pickup} → {selectedTrip.load.drop}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedTrip.load.material} • {selectedTrip.load.weight}T</p>
                                </div>
                                {selectedTrip.carrier && (
                                    <div>
                                        <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Carrier</h5>
                                        <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold' }}>{selectedTrip.carrier.fullName}</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>+91 {selectedTrip.carrier.phone}</p>
                                    </div>
                                )}
                                {selectedTrip.truck && (
                                    <div>
                                        <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Vehicle</h5>
                                        <p style={{ margin: '0 0 0.25rem', fontWeight: 'bold' }}>{selectedTrip.truck.vehicleNo}</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedTrip.truck.type} • {selectedTrip.truck.capacity}T</p>
                                        {selectedTrip.truck.currentLocation?.coordinates?.lat && (
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                                                📍 {selectedTrip.truck.currentLocation.coordinates.lat.toFixed(4)}, {selectedTrip.truck.currentLocation.coordinates.lng.toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {selectedTrip.carrier?.phone && (
                                        <a href={`tel:+91${selectedTrip.carrier.phone}`} className="btn btn-primary" style={{ flex: 1, gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', padding: '0.75rem 1rem' }}>
                                            <Phone size={16} /> Call
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                                <Clock size={64} style={{ marginBottom: '1.5rem', opacity: 0.08 }} />
                                <h3 style={{ opacity: 0.4 }}>Select a shipment to track</h3>
                                <p style={{ opacity: 0.3, margin: 0 }}>Live map visualization active</p>
                            </div>
                        )}

                        {/* Map Controls */}
                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ padding: '0.75rem', backgroundColor: 'rgba(7,13,26,0.8)' }}><Maximize size={18} /></button>
                            <button className="btn btn-outline" style={{ padding: '0.75rem', backgroundColor: 'rgba(7,13,26,0.8)' }}><Layers size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
