import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, History, Star, ChevronLeft, ChevronRight, Filter, X, CheckCircle } from 'lucide-react';
import api from '../api';

const RatingModal = ({ trip, onClose, onSubmitted }) => {
    const [score, setScore] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        if (!score) return setError('Please select a star rating.');
        setIsSubmitting(true);
        try {
            await api.post('/ratings', { tripId: trip._id, score, comment });
            onSubmitted();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit rating.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="card animate-scale-in" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={22} /></button>
                <h3 style={{ marginBottom: '0.5rem' }}>Rate This Trip</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    {trip.load?.pickup} → {trip.load?.drop}
                </p>

                {/* Star Selector */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <button
                            key={s}
                            onMouseEnter={() => setHovered(s)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setScore(s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.15s ease', transform: hovered >= s || score >= s ? 'scale(1.2)' : 'scale(1)' }}
                        >
                            <Star size={36} color={(hovered || score) >= s ? '#fbbf24' : 'rgba(255,255,255,0.15)'} fill={(hovered || score) >= s ? '#fbbf24' : 'none'} />
                        </button>
                    ))}
                </div>
                {score > 0 && (
                    <p style={{ textAlign: 'center', color: '#fbbf24', fontWeight: '600', marginBottom: '1.5rem', fontSize: '1rem' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][score]}
                    </p>
                )}

                <div className="input-group">
                    <label className="input-label">Comment (optional)</label>
                    <textarea
                        className="input-field"
                        rows={3}
                        placeholder="Share your experience..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {error && <p style={{ color: '#ff4d4d', fontSize: '0.85rem', backgroundColor: 'rgba(255,77,77,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</p>}

                <button onClick={submit} disabled={isSubmitting || !score} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    {isSubmitting ? <div className="spinner" style={{ width: '20px', height: '20px' }} /> : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

const OperationsHistory = () => {
    const userRole = localStorage.getItem('userRole') || 'truck_owner';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [trips, setTrips] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [ratingTrip, setRatingTrip] = useState(null);
    const [ratedTrips, setRatedTrips] = useState(new Set());
    const [ratingSuccess, setRatingSuccess] = useState('');

    const fetchHistory = useCallback(async (p = 1) => {
        setIsLoading(true);
        try {
            const params = { page: p, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/trips/my-history', { params });
            // Support both old (array) and new (paginated object) response
            const data = Array.isArray(res.data) ? res.data : res.data.trips;
            const tot = Array.isArray(res.data) ? res.data.length : res.data.total;
            const tp = Array.isArray(res.data) ? 1 : res.data.totalPages;
            setTrips(data.filter(t => t.load));
            setTotal(tot);
            setTotalPages(tp);
            setPage(p);
        } catch (err) {
            console.error('Error fetching trip history:', err);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchHistory(1); }, [fetchHistory]);

    const filteredRecords = trips.filter(trip => {
        const route = `${trip.load?.pickup || ''} ${trip.load?.drop || ''}`.toLowerCase();
        return route.includes(searchTerm.toLowerCase());
    });

    const statusColors = {
        assigned: { color: 'var(--color-success)', label: 'Scheduled' },
        'in-transit': { color: '#f97316', label: 'In Transit' },
        delivered: { color: 'var(--color-success)', label: 'Delivered' },
        cancelled: { color: '#ef4444', label: 'Cancelled' }
    };

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
            {ratingTrip && (
                <RatingModal
                    trip={ratingTrip}
                    onClose={() => setRatingTrip(null)}
                    onSubmitted={() => {
                        setRatedTrips(prev => new Set([...prev, ratingTrip._id]));
                        setRatingSuccess(`Rating submitted for ${ratingTrip.load?.pickup} → ${ratingTrip.load?.drop}`);
                        setRatingTrip(null);
                        setTimeout(() => setRatingSuccess(''), 4000);
                    }}
                />
            )}

            {ratingSuccess && (
                <div style={{ position: 'fixed', top: '90px', right: '2rem', backgroundColor: 'var(--color-success)', color: '#fff', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', zIndex: 2000, fontWeight: '600', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <CheckCircle size={18} /> {ratingSuccess}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>{userRole === 'truck_owner' ? 'Trip Ledger' : 'Postings Archive'}</h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Complete historical record of your logistics operations</p>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{total} total records</div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input type="text" className="input-field" placeholder="Search by route..." style={{ paddingLeft: '3rem' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="input-field" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }}>
                    <option value="">All Statuses</option>
                    <option value="assigned">Scheduled</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filteredRecords.length > 0 ? filteredRecords.map((item, index) => {
                    const sc = statusColors[item.status] || { color: 'var(--color-text-muted)', label: item.status };
                    const canRate = item.status === 'delivered' && !ratedTrips.has(item._id);
                    return (
                        <div key={item._id} style={{ padding: '1.5rem 2rem', borderBottom: index !== filteredRecords.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <div className="flex items-center" style={{ gap: '1.5rem' }}>
                                <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={24} color="var(--color-secondary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{item.load.pickup} → {item.load.drop}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        #{item._id.slice(-6).toUpperCase()} • {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        {userRole === 'truck_owner' && item.truck && ` • ${item.truck.vehicleNo}`}
                                        {userRole === 'company' && item.carrier && ` • ${item.carrier.fullName}`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center" style={{ gap: '2rem', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{Number(item.load.price).toLocaleString('en-IN')}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                        {userRole === 'truck_owner' ? 'Revenue' : 'Cost'}
                                    </div>
                                </div>
                                <span style={{ padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: `${sc.color}22`, color: sc.color, minWidth: '90px', textAlign: 'center' }}>
                                    {sc.label}
                                </span>
                                {canRate && (
                                    <button onClick={() => setRatingTrip(item)} style={{ padding: '0.5rem 1rem', border: '1px solid #fbbf24', borderRadius: '8px', backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        <Star size={14} fill="#fbbf24" /> Rate
                                    </button>
                                )}
                                {ratedTrips.has(item._id) && (
                                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                        <Star size={14} fill="#fbbf24" /> Rated
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <History size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No records found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
                    <button onClick={() => fetchHistory(page - 1)} disabled={page <= 1} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
                    <button onClick={() => fetchHistory(page + 1)} disabled={page >= totalPages} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default OperationsHistory;
