const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export const api = {
    getInventory: async () => {
        const res = await fetch(`${API_URL}/inventory`);
        return res.json();
    },

    addItem: async (item) => {
        const res = await fetch(`${API_URL}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        return res.json();
    },

    updateItem: async (id, item) => {
        const res = await fetch(`${API_URL}/inventory/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        return res.json();
    },

    deleteItem: async (id) => {
        const res = await fetch(`${API_URL}/inventory/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    getDashboardStats: async () => {
        const res = await fetch(`${API_URL}/dashboard`);
        return res.json();
    },

    resetDatabase: async () => {
        const res = await fetch(`${API_URL}/reset`, {
            method: 'POST',
        });
        return res.json();
    },

    getCategories: async () => {
        const res = await fetch(`${API_URL}/categories`);
        return res.json();
    },

    addCategory: async (category) => {
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category),
        });
        return res.json();
    },

    deleteCategory: async (id) => {
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    processCheckout: async (cartData) => {
        const res = await fetch(`${API_URL}/pos/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartData),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Checkout failed');
        }
        return res.json();
    },

    getSalesAnalytics: async () => {
        const res = await fetch(`${API_URL}/analytics/sales`);
        return res.json();
    },

    getTopProducts: async () => {
        const res = await fetch(`${API_URL}/analytics/top-products`);
        return res.json();
    },

    getSuppliers: async () => {
        const res = await fetch(`${API_URL}/suppliers`);
        return res.json();
    },

    addSupplier: async (supplier) => {
        const res = await fetch(`${API_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier),
        });
        return res.json();
    },

    deleteSupplier: async (id) => {
        const res = await fetch(`${API_URL}/suppliers/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    login: async (credentials) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Login failed (${res.status})`);
        }
        return res.json();
    },

    getDailySales: async () => {
        const res = await fetch(`${API_URL}/analytics/daily-sales`);
        return res.json();
    }
};
