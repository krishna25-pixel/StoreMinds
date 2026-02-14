import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const POS = () => {
    const [inventory, setInventory] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const data = await api.getInventory();
            setInventory(data);
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        if (item.quantity <= 0) {
            toast.error('Item out of stock!');
            return;
        }

        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                if (existing.cartQuantity >= item.quantity) {
                    toast.error('Not enough stock!');
                    return prev;
                }
                return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
            }
            return [...prev, { ...item, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQty = item.cartQuantity + delta;
                    if (newQty <= 0) return null; // Remove if 0
                    if (newQty > item.quantity) {
                        toast.error('Max stock reached');
                        return item;
                    }
                    return { ...item, cartQuantity: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const currency = localStorage.getItem('currency') || '$';

    const handleCheckout = async (method) => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);

        try {
            await api.processCheckout({
                cart,
                paymentMethod: method,
                total: cartTotal
            });

            toast.success('Transaction Completed!');
            setCart([]);
            loadInventory(); // Refresh stock
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', gap: 'var(--space-lg)', height: 'calc(100vh - 100px)' }}>
            <Toaster position="top-right" />

            {/* Product Grid - Left Side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', backgroundColor: 'var(--bg-app)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <Search size={20} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-md)', overflowY: 'auto', paddingRight: '8px' }}>
                    {filteredInventory.map(item => (
                        <div key={item.id} className="card"
                            style={{ cursor: item.quantity > 0 ? 'pointer' : 'not-allowed', opacity: item.quantity > 0 ? 1 : 0.6, transition: 'all 0.2s', padding: '16px' }}
                            onClick={() => item.quantity > 0 && addToCart(item)}
                        >
                            <div style={{ height: '100px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '2rem' }}>📦</span>
                            </div>
                            <h3 style={{ fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
                            <p className="text-sm text-muted" style={{ marginBottom: '8px' }}>Stock: {item.quantity}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{currency}{item.price}</span>
                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} disabled={item.quantity <= 0}>Add</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar - Right Side */}
            <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
                <h2 className="text-xl" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)' }}>
                    <ShoppingCart /> Current Sale
                </h2>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                            Cart is empty
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500 }}>{item.name}</p>
                                    <p className="text-sm text-muted">{currency}{item.price} x {item.cartQuantity}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-ghost" style={{ padding: '4px' }}><Minus size={16} /></button>
                                    <span>{item.cartQuantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-ghost" style={{ padding: '4px' }}><Plus size={16} /></button>
                                    <button onClick={() => removeFromCart(item.id)} className="btn btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)', fontSize: '1.25rem', fontWeight: 700 }}>
                        <span>Total:</span>
                        <span>{currency}{cartTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                        <button
                            className="btn"
                            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                            onClick={() => handleCheckout('Cash')}
                            disabled={cart.length === 0 || isCheckingOut}
                        >
                            <Banknote size={20} /> Cash
                        </button>
                        <button
                            className="btn"
                            style={{ backgroundColor: '#3b82f6', color: 'white' }}
                            onClick={() => handleCheckout('Card')}
                            disabled={cart.length === 0 || isCheckingOut}
                        >
                            <CreditCard size={20} /> Card
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POS;
