// API Client Wrapper for Lumina Luxe

const api = {
  // Helper for fetch requests
  async request(url, options = {}) {
    // Default headers
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (err) {
      console.error(`API Error for ${url}:`, err.message);
      throw err;
    }
  },

  // Authentication
  async register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST'
    });
  },

  async getCurrentUser() {
    return this.request('/api/auth/me');
  },

  // Products
  async getProducts({ search = '', category = 'All', sort = '' } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'All') params.append('category', category);
    if (sort) params.append('sort', sort);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/products${queryString}`);
  },

  async getProductDetails(id) {
    return this.request(`/api/products/${id}`);
  },

  // Orders
  async createOrder({ items, shippingAddress, paymentDetails }) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items, shippingAddress, paymentDetails })
    });
  },

  async getMyOrders() {
    return this.request('/api/orders/my-orders');
  },

  // Admin Controls
  async getAdminOrders() {
    return this.request('/api/admin/orders');
  },

  async updateOrderStatus(orderId, status) {
    return this.request(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  // Environmental Configuration
  async getConfig() {
    return this.request('/api/config');
  }
};
