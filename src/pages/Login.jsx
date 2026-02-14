import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await api.login(credentials);
            localStorage.setItem('user', JSON.stringify(user));
            // Trigger storage event for other components to update
            window.dispatchEvent(new Event('storage'));
            toast.success('Welcome back!');
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (error) {
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-app)'
        }}>
            <Toaster position="top-right" />
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: 'var(--space-xl)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', color: 'var(--primary)'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl">Store Minds</h2>
                    <p className="text-muted">Sign in to manage your store</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{
                                    width: '100%', padding: '10px 10px 10px 40px',
                                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)'
                                }}
                                placeholder="Enter username"
                                value={credentials.username}
                                onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                style={{
                                    width: '100%', padding: '10px 10px 10px 40px',
                                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)'
                                }}
                                placeholder="Enter password"
                                value={credentials.password}
                                onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Default: admin / admin123
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
