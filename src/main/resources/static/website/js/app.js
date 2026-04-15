/* ============================================
 * MagicCvetov — App Core
 * Инициализация, header, корзина, навигация
 * ============================================ */

const App = {
  cartCount: 0,

  async init() {
    this.initHeader();
    this.initMobileMenu();
    await this.updateCartCount();
    this.initFAQ();
  },

  /* === Header scroll === */
  initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('header--scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  },

  /* === Мобильное меню === */
  initMobileMenu() {
    const burger = document.querySelector('.header__burger');
    const menu = document.querySelector('.mobile-menu');
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    menu.querySelectorAll('.mobile-menu__link').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  },

  /* === Счётчик корзины === */
  async updateCartCount() {
    try {
      const cart = await api.getCart();
      const count = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
      this.cartCount = count;
      document.querySelectorAll('.header__cart-badge').forEach(badge => {
        badge.textContent = count || '';
      });
    } catch (e) {
      // Корзина может быть пустой — это нормально
    }
  },

  /* === Добавить в корзину (глобальная функция) === */
  async addToCart(productId, quantity = 1) {
    try {
      await api.addToCart(productId, quantity);
      await this.updateCartCount();
      this.showToast('Товар добавлен в корзину', 'success');
      return true;
    } catch (e) {
      this.showToast('Ошибка при добавлении товара', 'error');
      return false;
    }
  },

  /* === Купить в 1 клик === */
  async buyOneClick(productId) {
    try {
      await api.addToCart(productId, 1);
      window.location.href = '/website/checkout.html';
    } catch (e) {
      this.showToast('Ошибка', 'error');
    }
  },

  /* === Toast уведомления === */
  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /* === FAQ аккордеон === */
  initFAQ() {
    document.querySelectorAll('.faq-item__question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasActive = item.classList.contains('active');

        // Закрыть все
        document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));

        // Открыть текущий если он был закрыт
        if (!wasActive) item.classList.add('active');
      });
    });
  },

  /* === Форматирование цены === */
  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' \u20BD';
  },

  /* === Генерация карточки товара === */
  renderProductCard(product) {
    const imageUrl = product.imageUrl || product.image || '/website/images/placeholder.jpg';
    const hasOldPrice = product.oldPrice && product.oldPrice > product.price;
    const badge = product.isHit ? '<span class="product-card__badge product-card__badge--hit">Хит</span>'
      : product.isNew ? '<span class="product-card__badge product-card__badge--new">Новинка</span>'
      : product.isSale || hasOldPrice ? '<span class="product-card__badge product-card__badge--sale">Скидка</span>'
      : '';

    return `
      <div class="product-card" data-product-id="${product.id}">
        <a href="/website/product.html?id=${product.id}" class="product-card__image-wrap">
          <img class="product-card__image" src="${imageUrl}" alt="${product.name}" loading="lazy"
               onerror="this.src='/website/images/placeholder.jpg'">
          ${badge}
        </a>
        <div class="product-card__body">
          <a href="/website/product.html?id=${product.id}" class="product-card__title">${product.name}</a>
          ${product.description ? `<p class="product-card__desc">${product.description}</p>` : ''}
          <div class="product-card__bottom">
            <div>
              <span class="product-card__price">${this.formatPrice(product.price)}</span>
              ${hasOldPrice ? `<span class="product-card__price-old">${this.formatPrice(product.oldPrice)}</span>` : ''}
            </div>
            <button class="product-card__add-btn" onclick="App.addToCart(${product.id})" title="В корзину">
              <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /* === Генерация карточки категории === */
  renderCategoryCard(category) {
    return `
      <a href="/website/catalog.html?category=${category.id}" class="category-card">
        ${category.imageUrl
          ? `<img class="category-card__image" src="${category.imageUrl}" alt="${category.name}" loading="lazy">`
          : `<span class="category-card__emoji">${category.emoji || '🌸'}</span>`
        }
        <span class="category-card__name">${category.name}</span>
      </a>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
