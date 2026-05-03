import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCheck, Truck, Package, Star, AlertTriangle } from 'lucide-react';
import api from '../api';

const iconMap = {
    load_accepted: <Truck size={18} color="var(--color-success)" />,
    trip_delivered: <CheckCheck size={18} color="var(--color-success)" />,
    load_cancelled: <AlertTriangle size={18} color="#f97316" />,
    trip_cancelled: <AlertTriangle size={18} color="#f97316" />,
    new_rating: <Star size={18} color="#fbbf24" />,
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (_) {}
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAllRead = async () => {
        await api.put('/notifications/read-all');
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => { setOpen(o => !o); if (!open && unreadCount > 0) fetchNotifications(); }}
                style={{ position: 'relative', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.3s ease' }}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--color-accent)', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '50%', minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 0 10px rgba(231,76,60,0.6)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    {/* Dropdown */}
                    <div className="animate-fade-in" style={{ position: 'absolute', top: '3.2rem', right: 0, width: '360px', maxHeight: '480px', backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>Notifications {unreadCount > 0 && <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem' }}>({unreadCount} new)</span>}</h4>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                                        Mark all read
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No notifications yet</p>
                                </div>
                            ) : notifications.map(n => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.isRead && markRead(n._id)}
                                    style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '1rem', alignItems: 'flex-start', backgroundColor: n.isRead ? 'transparent' : 'rgba(0,168,232,0.04)', cursor: n.isRead ? 'default' : 'pointer', transition: 'background 0.2s' }}
                                >
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {iconMap[n.type] || <Bell size={16} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', lineHeight: '1.4', color: n.isRead ? 'var(--color-text-muted)' : 'white' }}>
                                            {n.message}
                                        </p>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {!n.isRead && (
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', flexShrink: 0, marginTop: '4px' }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
