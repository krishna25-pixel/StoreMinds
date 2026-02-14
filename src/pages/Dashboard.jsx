import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{
            backgroundColor: `rgba(${color}, 0.1)`,
            padding: '12px',
            borderRadius: 'var(--radius-lg)',
            color: `rgb(${color})`
        }}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-muted text-sm">{title}</h3>
            <p className="text-2xl">{value}</p>
            {subtext && <p className="text-sm text-muted">{subtext}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const [data, setData] = useState({
        stats: { totalItems: 0, totalValue: 0, lowStock: 0 },
        activity: []
    });
    const [inventory, setInventory] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [dailySales, setDailySales] = useState([]);
    const [loading, setLoading] = useState(true);

    const currency = localStorage.getItem('currency') || '$';

    useEffect(() => {
        const loadData = async () => {
            try {
                const [dashData, invData, sales, topProd, daily] = await Promise.all([
                    api.getDashboardStats(),
                    api.getInventory(),
                    api.getSalesAnalytics(),
                    api.getTopProducts(),
                    api.getDailySales()
                ]);
                setData(dashData);
                setInventory(invData);
                setSalesData(sales);
                setTopProducts(topProd);
                setDailySales(daily);

                // Low Stock Notification
                if (dashData.stats.lowStock > 0) {
                    toast('Warning: Some items are low on stock!', {
                        icon: '⚠️',
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }

            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        // Listen for storage changes
        const handleStorageChange = () => window.location.reload();
        window.addEventListener('storage', handleStorageChange);

        loadData();

        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Calculate Daily Totals
    const dailyTotal = dailySales.reduce((sum, item) => sum + item.total, 0);
    const dailyCash = dailySales.find(i => i.payment_method === 'Cash')?.total || 0;
    const dailyCard = dailySales.find(i => i.payment_method === 'Card')?.total || 0;
    const dailyCount = dailySales.reduce((sum, item) => sum + item.count, 0);

    // Prepare Chart Data
    const getCategoryData = () => {
        const counts = {};
        inventory.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const categoryData = getCategoryData();

    if (loading) return <div className="text-muted">Loading dashboard...</div>;

    return (
        <div>
            <Toaster position="top-right" />
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 className="text-2xl">Dashboard</h2>
                <p className="text-muted">Overview of your inventory status.</p>
            </div>

            {/* Daily Sales Section */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 className="text-xl" style={{ marginBottom: 'var(--space-md)', color: 'var(--primary)' }}>Today's Sales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                    <div>
                        <p className="text-muted text-sm">Total Revenue</p>
                        <p className="text-2xl">{currency}{dailyTotal.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-sm">Cash Collected</p>
                        <p className="text-xl" style={{ color: '#10b981' }}>{currency}{dailyCash.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-sm">Card Collected</p>
                        <p className="text-xl" style={{ color: '#3b82f6' }}>{currency}{dailyCard.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-sm">Transactions</p>
                        <p className="text-xl">{dailyCount}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)'
            }}>
                <StatCard
                    title="Total Products"
                    value={data.stats.totalItems}
                    subtext="Items in stock"
                    icon={Package}
                    color="59, 130, 246"
                />
                <StatCard
                    title="Total Value"
                    value={`${currency}${(data.stats.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtext="Inventory assets"
                    icon={DollarSign}
                    color="16, 185, 129"
                />
                <StatCard
                    title="Low Stock"
                    value={data.stats.lowStock}
                    subtext="Items below 5 qty"
                    icon={AlertTriangle}
                    color="239, 68, 68"
                />
            </div>

            {/* Sales Chart */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', height: '400px' }}>
                <h3 className="text-xl" style={{ marginBottom: '16px' }}>Sales Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData.length ? salesData : [{ date: 'No Data', revenue: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)'
            }}>
                <div className="card" style={{ height: '350px' }}>
                    <h3 className="text-xl" style={{ marginBottom: '16px' }}>Inventory by Category</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ minHeight: '350px' }}>
                    <h3 className="text-xl" style={{ marginBottom: '16px' }}>Top Selling Products</h3>
                    {topProducts.length === 0 ? (
                        <p className="text-muted">No sales data yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }} className="text-muted">Product</th>
                                    <th style={{ padding: '8px' }} className="text-muted">Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 8px' }}>{p.name}</td>
                                        <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--primary)' }}>{p.sold}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <Activity size={20} className="text-muted" />
                    <h3 className="text-xl">Recent Activity</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {data.activity.length === 0 ? (
                        <p className="text-muted">No recent activity.</p>
                    ) : (
                        data.activity.map((act, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                <div>
                                    <p style={{ fontWeight: 500 }}>{act.type}: {act.item_name}</p>
                                    <p className="text-sm text-muted">{new Date(act.timestamp).toLocaleString()}</p>
                                </div>
                                <div className={`text-sm ${act.quantity_change > 0 ? 'text-primary' : 'text-danger'}`}>
                                    {act.quantity_change > 0 ? '+' : ''}{act.quantity_change !== 0 ? act.quantity_change : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
