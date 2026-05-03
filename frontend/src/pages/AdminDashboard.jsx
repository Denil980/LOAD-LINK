import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Package, Truck, CheckCircle, X, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loads, setLoads] = useState([]);
    const [trips, setTrips] = useState([]);
    const [tab, setTab] = useState('users');
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [verifiedFilter, setVerifiedFilter] = useState('');
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchStats = async () => {
        try { const res = await api.get('/admin/stats'); setStats(res.data); } catch (_) {}
    };

    const fetchUsers = async (p = 1) => {
        setIsLoading(true);
        try {
            const params = { page: p, limit: 15 };
            if (roleFilter) params.role = roleFilter;
            if (verifiedFilter !== '') params.verified = verifiedFilter;
            const res = await api.get('/admin/users', { params });
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (_) {} finally { setIsLoading(false); }
    };

    const fetchLoads = async (p = 1) => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/loads', { params: { page: p, limit: 15 } });
            setLoads(res.data.loads);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (_) {} finally { setIsLoading(false); }
    };

    const fetchTrips = async (p = 1) => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/trips', { params: { page: p, limit: 15 } });
            setTrips(res.data.trips);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (_) {} finally { setIsLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        if (tab === 'users') fetchUsers(1);
        else if (tab === 'loads') fetchLoads(1);
        else if (tab === 'trips') fetchTrips(1);
    }, [tab, roleFilter, verifiedFilter]);

    const approveUser = async (userId) => {
        try { await api.put(`/admin/users/${userId}/approve`); showToast('User approved ✓'); fetchUsers(page); fetchStats(); } catch (_) {}
    };
    const rejectUser = async (userId) => {
        try { await api.put(`/admin/users/${userId}/reject`); showToast('User suspended'); fetchUsers(page); fetchStats(); } catch (_) {}
    };

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="card" style={{ padding: '1.75rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={28} color={color} />
            </div>
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value ?? '—'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</div>
            </div>
        </div>
    );

    const tabs = ['users', 'loads', 'trips'];

    return (
        <div className="container animate-fade-in" style={{ marginTop: '2rem', paddingBottom: '5rem' }}>
            {toast && (
                <div style={{ position: 'fixed', top: '90px', right: '2rem', backgroundColor: 'var(--color-success)', color: '#fff', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', zIndex: 2000, fontWeight: '600', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {toast}
                </div>
            )}

            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Admin Panel</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>Platform control center — manage users, loads, and trips</p>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="var(--color-secondary)" />
                    <StatCard icon={Package} label="Total Loads" value={stats.totalLoads} color="var(--color-success)" />
                    <StatCard icon={Truck} label="Total Trips" value={stats.totalTrips} color="#f97316" />
                    <StatCard icon={AlertCircle} label="Pending Verification" value={stats.pendingVerifications} color="#f59e0b" />
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding: '0.6rem 1.5rem', border: 'none', borderRadius: 'var(--radius-md)', backgroundColor: tab === t ? 'var(--color-secondary)' : 'transparent', color: tab === t ? '#fff' : 'var(--color-text-muted)', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Filters for Users */}
            {tab === 'users' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <select className="input-field" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="truck_owner">Truck Owner</option>
                        <option value="company">Company</option>
                    </select>
                    <select className="input-field" style={{ width: 'auto' }} value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="false">Pending</option>
                        <option value="true">Verified</option>
                    </select>
                </div>
            )}

            {/* Content */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : tab === 'users' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['Name / Phone', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <p style={{ margin: 0, fontWeight: '600' }}>{u.fullName}</p>
                                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>+91 {u.phone}</p>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: u.role === 'truck_owner' ? 'rgba(0,168,232,0.1)' : 'rgba(46,204,113,0.1)', color: u.role === 'truck_owner' ? 'var(--color-secondary)' : 'var(--color-success)', fontWeight: '600' }}>
                                            {u.role === 'truck_owner' ? 'Truck Owner' : 'Company'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{u.joinedDate}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: u.verified ? 'var(--color-success)' : '#f59e0b' }}>
                                            {u.verified ? '✓ Verified' : '⏳ Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {!u.verified && (
                                                <button onClick={() => approveUser(u._id)} style={{ padding: '0.4rem 0.9rem', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(46,204,113,0.15)', color: 'var(--color-success)', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>
                                                    Approve
                                                </button>
                                            )}
                                            {u.verified && (
                                                <button onClick={() => rejectUser(u._id)} style={{ padding: '0.4rem 0.9rem', border: 'none', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>
                                                    Suspend
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : tab === 'loads' ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['Route', 'Material / Weight', 'Price', 'Poster', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loads.map((l, i) => (
                                <tr key={l._id} style={{ borderBottom: i < loads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{l.pickup} → {l.drop}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{l.material} • {l.weight}T</td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>₹{Number(l.price).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{l.poster?.fullName}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: l.status === 'open' ? 'rgba(0,168,232,0.1)' : l.status === 'delivered' ? 'rgba(46,204,113,0.1)' : 'rgba(249,115,22,0.1)', color: l.status === 'open' ? 'var(--color-secondary)' : l.status === 'delivered' ? 'var(--color-success)' : '#f97316', fontWeight: '700', textTransform: 'uppercase' }}>
                                            {l.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {['Route', 'Carrier', 'Truck', 'Date', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((t, i) => (
                                <tr key={t._id} style={{ borderBottom: i < trips.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>{t.load?.pickup} → {t.load?.drop}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>{t.carrier?.fullName}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t.truck?.vehicleNo}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize', color: t.status === 'delivered' ? 'var(--color-success)' : t.status === 'cancelled' ? '#ef4444' : 'var(--color-secondary)' }}>{t.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
                    <button onClick={() => { if (tab === 'users') fetchUsers(page - 1); else if (tab === 'loads') fetchLoads(page - 1); else fetchTrips(page - 1); }} disabled={page <= 1} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
                    <button onClick={() => { if (tab === 'users') fetchUsers(page + 1); else if (tab === 'loads') fetchLoads(page + 1); else fetchTrips(page + 1); }} disabled={page >= totalPages} className="btn btn-outline" style={{ padding: '0.6rem 1rem' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
