/* ============================================
 * MagicCvetov — API Client
 * Обёртка для REST API бэкенда
 * ============================================ */

const API_BASE = '/api/v1';

class MagicAPI {
  constructor() {
    this.baseUrl = API_BASE;
    this.sessionId = this._getOrCreateSessionId();
  }

  _getOrCreateSessionId() {
    let sid = localStorage.getItem('mc_session_id');
    if (!sid) {
      sid = 'mc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mc_session_id', sid);
    }
    return sid;
  }

  _headers(hasBody = false) {
    const h = {};
    if (hasBody) h['Content-Type'] = 'application/json';
    h['X-Session-Id'] = this.sessionId;
    const token = localStorage.getItem('mc_token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async _request(method, path, body = null) {
    const opts = {
      method,
      headers: this._headers(!!body),
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, opts);

    if (res.status === 204) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  get(path) { return this._request('GET', path); }
  post(path, body) { return this._request('POST', path, body); }
  put(path, body) { return this._request('PUT', path, body); }
  del(path) { return this._request('DELETE', path); }

  /* === Категории === */
  getCategories() { return this.get('/categories'); }

  /* === Продукты === */
  getProducts(page = 0, size = 20) {
    return this.get(`/products?page=${page}&size=${size}`);
  }

  getProduct(id) { return this.get(`/products/${id}`); }

  getProductsByCategory(categoryId, page = 0, size = 20) {
    return this.get(`/products/category/${categoryId}?page=${page}&size=${size}`);
  }

  getSpecialOffers() { return this.get('/products/special-offers'); }

  searchProducts(query, categoryId = null, page = 0, size = 20) {
    let url = `/products/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return this.get(url);
  }

  /* === Корзина === */
  getCart() { return this.get('/cart'); }

  addToCart(productId, quantity = 1) {
    return this.post('/cart/items', { productId, quantity });
  }

  updateCartItem(productId, quantity) {
    return this.put(`/cart/items/${productId}`, { quantity });
  }

  removeFromCart(productId) {
    return this.del(`/cart/items/${productId}`);
  }

  clearCart() { return this.del('/cart'); }

  /* === Заказы === */
  createOrder(data) { return this.post('/orders', data); }

  getOrder(orderId) { return this.get(`/orders/${orderId}`); }

  getUserOrders(page = 0, size = 10) {
    return this.get(`/orders?page=${page}&size=${size}`);
  }

  getPaymentUrl(orderId) {
    return this.get(`/orders/${orderId}/payment-url`);
  }

  /* === Авторизация === */
  register(data) { return this.post('/auth/register', data); }
  login(username) { return this.post('/auth/login', { username }); }

  /* === Доставка === */
  calculateDeliveryCost(address) {
    return this.post('/delivery/calculate-cost', { address });
  }

  getDeliveryLocations() { return this.get('/delivery/locations'); }

  getAddressSuggestions(query) {
    return this.get(`/delivery/address-suggestions?query=${encodeURIComponent(query)}`);
  }
}

const api = new MagicAPI();
