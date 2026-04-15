/* ============================================
 * MagicCvetov — Cart Page Logic
 * ============================================ */

const CartPage = {
  cart: null,

  async init() {
    await this.loadCart();
  },

  async loadCart() {
    const container = document.getElementById('cart-container');
    container.innerHTML = '<div class="loading-placeholder"><div class="loader"></div></div>';

    try {
      this.cart = await api.getCart();
      this.renderCart();
    } catch (e) {
      container.innerHTML = '<p class="text-secondary text-center">Не удалось загрузить корзину</p>';
    }
  },

  renderCart() {
    const container = document.getElementById('cart-container');
    const items = this.cart?.items || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">🛒</div>
          <h2>Корзина пуста</h2>
          <p class="cart-empty__text">Добавьте красивый букет из нашего каталога</p>
          <a href="/website/catalog.html" class="btn btn--primary btn--lg">Перейти в каталог</a>
        </div>
      `;
      return;
    }

    const total = items.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + price * (item.quantity || 1);
    }, 0);

    container.innerHTML = `
      <div class="cart-page__title">
        <h1>Корзина <span style="color:var(--color-text-secondary);font-size:var(--fs-lg)">(${items.length})</span></h1>
      </div>

      <div style="display:grid;grid-template-columns:1fr 380px;gap:var(--space-xl);align-items:start">
        <div>
          ${items.map(item => this.renderCartItem(item)).join('')}
        </div>

        <div class="cart-summary">
          <h3 style="margin-bottom:var(--space-lg)">Итого</h3>
          <div class="cart-summary__row">
            <span>Товары (${items.length})</span>
            <span>${App.formatPrice(total)}</span>
          </div>
          <div class="cart-summary__row">
            <span>Доставка</span>
            <span style="color:var(--color-secondary)">Бесплатно</span>
          </div>
          <div class="cart-summary__row cart-summary__total">
            <span>К оплате</span>
            <span>${App.formatPrice(total)}</span>
          </div>
          <a href="/website/checkout.html" class="btn btn--primary btn--full" style="margin-top:var(--space-lg)">
            Оформить заказ
          </a>
          <button onclick="CartPage.clearCart()" class="btn btn--outline btn--full" style="margin-top:var(--space-sm)">
            Очистить корзину
          </button>
        </div>
      </div>
    `;
  },

  renderCartItem(item) {
    const product = item.product || item;
    const imageUrl = product.imageUrl || product.image || '/website/images/placeholder.jpg';
    const name = product.name || item.name || 'Товар';
    const price = product.price || item.price || 0;
    const quantity = item.quantity || 1;
    const productId = product.id || item.productId;

    return `
      <div class="cart-item" data-product-id="${productId}">
        <a href="/website/product.html?id=${productId}">
          <img class="cart-item__image" src="${imageUrl}" alt="${name}"
               onerror="this.src='/website/images/placeholder.jpg'">
        </a>
        <div class="cart-item__info">
          <a href="/website/product.html?id=${productId}" class="cart-item__title">${name}</a>
          <div class="cart-item__price">${App.formatPrice(price * quantity)}</div>
        </div>
        <div class="cart-item__controls">
          <button class="quantity-btn" onclick="CartPage.updateQuantity(${productId}, ${quantity - 1})">−</button>
          <span class="quantity-value">${quantity}</span>
          <button class="quantity-btn" onclick="CartPage.updateQuantity(${productId}, ${quantity + 1})">+</button>
        </div>
        <button class="cart-item__remove" onclick="CartPage.removeItem(${productId})">Удалить</button>
      </div>
    `;
  },

  async updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      await this.removeItem(productId);
      return;
    }
    try {
      await api.updateCartItem(productId, newQuantity);
      await this.loadCart();
      await App.updateCartCount();
    } catch (e) {
      App.showToast('Ошибка при обновлении', 'error');
    }
  },

  async removeItem(productId) {
    try {
      await api.removeFromCart(productId);
      await this.loadCart();
      await App.updateCartCount();
      App.showToast('Товар удалён из корзины', 'success');
    } catch (e) {
      App.showToast('Ошибка при удалении', 'error');
    }
  },

  async clearCart() {
    try {
      await api.clearCart();
      await this.loadCart();
      await App.updateCartCount();
      App.showToast('Корзина очищена', 'success');
    } catch (e) {
      App.showToast('Ошибка', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => CartPage.init());
