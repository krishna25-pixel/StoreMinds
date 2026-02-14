import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Search, Plus, Trash, Edit2, X, Save, Download, Tag, Package, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', quantity: 0, price: 0
    });

    const currency = localStorage.getItem('currency') || '$';

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invData, catData] = await Promise.all([
                api.getInventory(),
                api.getCategories()
            ]);
            setInventory(invData);
            setCategories(catData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [inventory, searchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Delete this item?')) {
            try {
                await api.deleteItem(id);
                setInventory(prev => prev.filter(item => item.id !== id));
                toast.success('Item deleted');
            } catch (error) {
                toast.error('Error deleting item');
            }
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData(item);
        } else {
            setEditingItem(null);
            // Default to first category if available
            setFormData({
                name: '', sku: '',
                category: categories.length > 0 ? categories[0].name : '',
                quantity: 0, price: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                const updatedItem = await api.updateItem(editingItem.id, formData);
                setInventory(prev => prev.map(item =>
                    item.id === editingItem.id ? { ...updatedItem, id: item.id } : item
                ));
                toast.success('Item updated');
            } else {
                const newItem = await api.addItem(formData);
                setInventory(prev => [...prev, newItem]);
                toast.success('Item added');
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to save item");
        }
    };

    const exportCSV = () => {
        const headers = ['ID,Name,SKU,Category,Quantity,Price'];
        const rows = inventory.map(item =>
            `${item.id},"${item.name}","${item.sku}","${item.category}",${item.quantity},${item.price}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "storeminds_inventory.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV Downloaded');
    };

    const getCategoryColor = (catName) => {
        const cat = categories.find(c => c.name === catName);
        return cat ? cat.color : '#64748b';
    };

    return (
        <div>
            <Toaster position="top-right" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h2 className="text-2xl">Inventory</h2>
                    <p className="text-muted">Manage your stock items.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-ghost" onClick={exportCSV}>
                        <FileText size={20} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} /> Add Item
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)' }}>
                <Search size={20} className="text-muted" />
                <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontSize: '1rem',
                        width: '100%'
                    }}
                />
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Product</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>SKU</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Qty</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                            <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredInventory.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: getCategoryColor(item.category),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 'bold', fontSize: '0.8rem'
                                        }}>
                                            {/* Simple Logic: First letter of category. Enhanced logic would assign icons map */}
                                            {item.category ? item.category[0].toUpperCase() : '?'}
                                        </div>
                                        {item.name}
                                    </div>
                                </td>
                                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{item.sku}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        fontSize: '0.875rem',
                                        color: getCategoryColor(item.category),
                                        border: `1px solid ${getCategoryColor(item.category)}`
                                    }}>
                                        {item.category}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <span style={{ color: item.quantity < 5 ? 'var(--danger)' : 'inherit' }}>
                                        {item.quantity}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>{currency}{item.price.toFixed(2)}</td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => handleOpenModal(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }} onClick={() => handleDelete(item.id)}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && filteredInventory.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                            <h3 className="text-xl">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label className="text-sm text-muted">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted">SKU</label>
                                    <input
                                        type="text"
                                        required
                                        style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted">Category</label>
                                    <select
                                        style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-sm text-muted">Price</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'white' }}
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> Save Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
