import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, LogOut, ShoppingCart, Truck } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const [storeName, setStoreName] = useState('StoreMinds');
    const [user, setUser] = useState(null);

    const updateProfile = () => {
        const savedName = localStorage.getItem('storeName');
        const savedUser = localStorage.getItem('user');
        if (savedName) setStoreName(savedName);
        if (savedUser) setUser(JSON.parse(savedUser));
    };

    useEffect(() => {
        updateProfile();
        // Listen for storage events (changes from Settings page or Login)
        window.addEventListener('storage', updateProfile);
        return () => window.removeEventListener('storage', updateProfile);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShoppingCart, label: 'Point of Sale', path: '/pos' },
        { icon: Package, label: 'Inventory', path: '/inventory' },
        { icon: Truck, label: 'Suppliers', path: '/suppliers' },
    ];

    return (
        <div style={{ width: '260px', borderRight: '1px solid var(--border-color)', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)' }}>
            <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="text-xl" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Package size={24} />
                        StoreMinds
                    </h1>
                    <div style={{ paddingLeft: '32px' }}>
                        <p className="text-sm text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {user ? user.role : 'Store'}
                        </p>
                        <p className="text-sm" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                            {user ? user.username : storeName}
                        </p>
                    </div>
                </div>
                <button onClick={toggleTheme} className="btn btn-ghost" style={{ padding: '4px' }}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
            </div>

            <nav style={{ flex: 1, padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                fontWeight: isActive ? 600 : 400,
                                transition: 'all 0.2s ease'
                            })}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `btn btn-ghost ${isActive ? 'text-primary' : ''}`}
                    style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                    <Settings size={20} />
                    Settings
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', marginTop: '8px' }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

const Layout = () => {
    return (
        <div className="flex" style={{ minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto', maxHeight: '100vh' }}>
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
