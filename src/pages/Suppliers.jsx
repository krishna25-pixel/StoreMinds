import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Truck, Plus, Trash2, Phone, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', email: '' });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const data = await api.getSuppliers();
            setSuppliers(data);
        } catch (error) {
            toast.error('Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            await api.addSupplier(newSupplier);
            toast.success('Supplier added!');
            setNewSupplier({ name: '', contact: '', email: '' });
            setIsModalOpen(false);
            loadSuppliers();
        } catch (error) {
            toast.error('Failed to add supplier');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.deleteSupplier(id);
            toast.success('Supplier deleted');
            loadSuppliers();
        } catch (error) {
            toast.error('Failed to delete supplier');
        }
    };

    if (loading) return <div className="text-muted">Loading...</div>;

    return (
        <div>
            <Toaster position="top-right" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <div>
                    <h2 className="text-2xl">Suppliers</h2>
                    <p className="text-muted">Manage your inventory sources.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Add Supplier
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                {suppliers.length === 0 ? (
                    <p className="text-muted">No suppliers found.</p>
                ) : (
                    suppliers.map(supplier => (
                        <div key={supplier.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', color: '#3b82f6' }}>
                                        <Truck size={24} />
                                    </div>
                                    <h3 className="text-xl">{supplier.name}</h3>
                                </div>
                                <button onClick={() => handleDelete(supplier.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '4px' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                {supplier.contact && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <Phone size={16} /> <span>{supplier.contact}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <Mail size={16} /> <span>{supplier.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3 className="text-xl" style={{ marginBottom: 'var(--space-md)' }}>Add Supplier</h3>
                        <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <input
                                className="input"
                                placeholder="Supplier Name"
                                value={newSupplier.name}
                                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                required
                                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                            />
                            <input
                                className="input"
                                placeholder="Contact Number"
                                value={newSupplier.contact}
                                onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                            />
                            <input
                                className="input"
                                placeholder="Email Address"
                                value={newSupplier.email}
                                onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                style={{ padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
