/* ============================================
 * MagicCvetov — Product Detail Page Logic
 * ============================================ */

const ProductPage = {
  product: null,

  async init() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) {
      window.location.href = '/website/catalog.html';
      return;
    }
    await this.loadProduct(productId);
  },

  async loadProduct(id) {
    const container = document.getElementById('product-container');
    container.innerHTML = '<div class="loading-placeholder"><div class="loader"></div></div>';

    try {
      this.product = await api.getProduct(id);
      this.renderProduct();
      document.title = `${this.product.name} — Магия Цветов`;
    } catch (e) {
      container.innerHTML = `
        <div class="text-center" style="padding:4rem">
          <h2>Товар не найден</h2>
          <p class="text-secondary" style="margin-bottom:2rem">Возможно, товар был удалён или ссылка неверна.</p>
          <a href="/website/catalog.html" class="btn btn--primary">Перейти в каталог</a>
        </div>
      `;
    }
  },

  renderProduct() {
    const p = this.product;
    const imageUrl = p.imageUrl || p.image || '/website/images/placeholder.jpg';
    const hasOldPrice = p.oldPrice && p.oldPrice > p.price;

    document.getElementById('breadcrumb-name').textContent = p.name;
    document.getElementById('product-container').innerHTML = `
      <div class="product-page__layout">
        <!-- Галерея -->
        <div class="product-gallery">
          <div class="product-gallery__main">
            <img id="gallery-main-img" src="${imageUrl}" alt="${p.name}"
                 onerror="this.src='/website/images/placeholder.jpg'">
          </div>
        </div>

        <!-- Информация -->
        <div class="product-info">
          <h1 class="product-info__title">${p.name}</h1>

          <div class="product-info__price-wrap">
            <span class="product-info__price">${App.formatPrice(p.price)}</span>
            ${hasOldPrice ? `<span class="product-info__price-old">${App.formatPrice(p.oldPrice)}</span>` : ''}
          </div>

          ${p.description ? `<p class="product-info__desc">${p.description}</p>` : ''}

          <div class="product-info__actions">
            <button class="btn btn--primary btn--lg" onclick="App.addToCart(${p.id})">
              <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              В корзину
            </button>
            <button class="btn btn--secondary btn--lg" onclick="App.buyOneClick(${p.id})">
              Купить в 1 клик
            </button>
          </div>

          <div class="product-info__meta">
            <span>
              <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              Доставка: 2 часа
            </span>
            <span>
              <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              Гарантия свежести 24 часа
            </span>
            <span>
              <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
              Оплата: карта, СБП, наличные
            </span>
          </div>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => ProductPage.init());
