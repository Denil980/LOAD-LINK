import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle } from 'lucide-react';
import api from '../api';

const PostLoad = () => {
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [material, setMaterial] = useState('');
    const [weight, setWeight] = useState('');
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const loadData = {
                pickup,
                drop,
                material,
                weight: Number(weight),
                price: Number(price),
                urgency: 'Normal'
            };

            await api.post('/loads', loadData);
            setIsSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            console.error('Error posting load:', err);
            alert('Failed to post load. Please check your inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="container animate-fade-in" style={{ textAlign: 'center', marginTop: '10rem' }}>
                <div className="card" style={{ padding: '4rem', maxWidth: '500px', margin: '0 auto' }}>
                    <CheckCircle size={80} color="var(--color-success)" style={{ marginBottom: '2rem' }} />
                    <h2>Load Broadcasted!</h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Your shipment is now visible to thousands of verified carriers.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '650px', marginTop: '3rem' }}>
            <form onSubmit={handleSubmit} className="card">
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Post a New Load</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Enter shipment details to broadcast to available verified trucks.</p>
                
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Pickup City</label>
                        <input type="text" className="input-field" placeholder="e.g., Mumbai" required value={pickup} onChange={e => setPickup(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Drop City</label>
                        <input type="text" className="input-field" placeholder="e.g., Delhi" required value={drop} onChange={e => setDrop(e.target.value)} />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">Material Description</label>
                    <input type="text" className="input-field" placeholder="What are you shipping? (e.g. Electronics)" required value={material} onChange={e => setMaterial(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Weight (Tons)</label>
                        <input type="number" className="input-field" placeholder="10" required value={weight} onChange={e => setWeight(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label className="input-label">Offered Price (₹)</label>
                        <input type="number" className="input-field" placeholder="45000" required value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1.2rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={isLoading}>
                    {isLoading ? <div className="spinner" style={{ width: '22px', height: '22px' }}></div> : <><Send size={18} /> Broadcast Load</>}
                </button>
            </form>
        </div>
    );
};

export default PostLoad;
