import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, RefreshCw, Database, Plus, Trash, Tag } from 'lucide-react';
import { api } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Settings = () => {
    const [storeName, setStoreName] = useState('StoreMinds');
    const [currency, setCurrency] = useState('$');
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(false);

    // Hardcoded icons for simplicity in this version, could be expanded
    const [selectedColor, setSelectedColor] = useState('#3b82f6');

    useEffect(() => {
        const savedName = localStorage.getItem('storeName');
        const savedCurrency = localStorage.getItem('currency');
        if (savedName) setStoreName(savedName);
        if (savedCurrency) setCurrency(savedCurrency);
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories', error);
        }
    };

    const handleSaveProfile = (e) => {
        e.preventDefault();
        localStorage.setItem('storeName', storeName);
        localStorage.setItem('currency', currency);
        window.dispatchEvent(new Event('storage'));
        toast.success('Settings saved successfully!');
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        try {
            const cat = await api.addCategory({
                name: newCategory,
                color: selectedColor,
                icon: 'Box' // Default icon
            });
            setCategories([...categories, cat]);
            setNewCategory('');
            toast.success('Category added!');
        } catch (error) {
            toast.error('Failed to add category');
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Delete this category?')) {
            try {
                await api.deleteCategory(id);
                setCategories(categories.filter(c => c.id !== id));
                toast.success('Category deleted');
            } catch (error) {
                toast.error('Failed to delete category');
            }
        }
    };

    const handleResetDatabase = async () => {
        if (window.confirm('WARNING: This will delete ALL inventory items and activity logs. This action cannot be undone. Are you sure?')) {
            try {
                setLoading(true);
                await api.resetDatabase();
                toast.success('Database has been reset.');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Reset failed:', error);
                toast.error('Failed to reset database.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <Toaster position="top-right" />
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 className="text-2xl">Settings</h2>
                <p className="text-muted">Manage your store preferences and data.</p>
            </div>

            {/* General Settings */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 className="text-xl" style={{ marginBottom: 'var(--space-md)' }}>General Preferences</h3>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div>
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Store Name</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'var(--bg-app)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '8px' }}>Currency Symbol</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            style={{
                                width: '100px',
                                padding: '12px',
                                backgroundColor: 'var(--bg-app)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        >
                            <option value="$">US Dollar ($)</option>
                            <option value="€">Euro (€)</option>
                            <option value="£">British Pound (£)</option>
                            <option value="₹">Indian Rupee (₹)</option>
                            <option value="¥">Japanese Yen (¥)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> Save Preferences
                        </button>
                    </div>
                </form>
            </div>

            {/* Category Management */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 className="text-xl" style={{ marginBottom: 'var(--space-md)' }}>Manage Categories</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <input
                        type="text"
                        placeholder="New Category Name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                    />
                    <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        style={{ width: '50px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    />
                    <button onClick={handleAddCategory} className="btn btn-primary">
                        <Plus size={18} /> Add
                    </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    {categories.map(cat => (
                        <div key={cat.id} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 12px', borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${cat.color}`
                        }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }}></span>
                            <span>{cat.name}</span>
                            <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '4px' }}>
                                <Trash size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ border: '1px solid var(--danger)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl" style={{ color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h3>
                        <p className="text-muted" style={{ marginBottom: 'var(--space-md)' }}>
                            Resetting the database will permanently delete all inventory items and activity history. This action cannot be undone.
                        </p>
                        <button
                            onClick={handleResetDatabase}
                            disabled={loading}
                            className="btn"
                            style={{
                                backgroundColor: 'var(--danger)',
                                color: 'white',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <Database size={18} />
                            {loading ? 'Resetting...' : 'Reset Database'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
