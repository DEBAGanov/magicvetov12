/* ============================================
 * MagicCvetov — Catalog Page Logic
 * ============================================ */

const CatalogPage = {
  currentCategory: null,
  currentPage: 0,
  pageSize: 12,
  totalPages: 0,
  sortBy: 'default',

  async init() {
    // Читаем параметры URL
    const params = new URLSearchParams(window.location.search);
    this.currentCategory = params.get('category');
    const filter = params.get('filter');

    if (filter === 'special') {
      await this.loadSpecialOffers();
    } else {
      await this.loadCategories();
      await this.loadProducts();
    }

    this.initSort();
  },

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      const sidebar = document.getElementById('catalog-filters');
      if (sidebar && categories.length > 0) {
        sidebar.innerHTML = `
          <div class="catalog__filter-item ${!this.currentCategory ? 'catalog__filter-item--active' : ''}"
               onclick="CatalogPage.filterCategory(null)">
            Все цветы
          </div>
        ` + categories.map(c => `
          <div class="catalog__filter-item ${this.currentCategory == c.id ? 'catalog__filter-item--active' : ''}"
               onclick="CatalogPage.filterCategory(${c.id})">
            ${c.name}
          </div>
        `).join('');
      }
    } catch (e) {
      // Без категорий продолжаем
    }
  },

  async loadProducts() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '<div class="loading-placeholder"><div class="loader"></div></div>';

    try {
      let data;
      if (this.currentCategory) {
        data = await api.getProductsByCategory(this.currentCategory, this.currentPage, this.pageSize);
      } else {
        data = await api.getProducts(this.currentPage, this.pageSize);
      }

      const products = data.content || data || [];
      this.totalPages = data.totalPages || 1;

      if (products.length > 0) {
        grid.innerHTML = products.map(p => App.renderProductCard(p)).join('');
      } else {
        grid.innerHTML = '<p class="text-secondary text-center" style="grid-column:1/-1;padding:3rem">В этой категории пока нет товаров</p>';
      }

      this.updateCount(data.totalElements || products.length);
      this.renderPagination();
    } catch (e) {
      grid.innerHTML = '<p class="text-secondary text-center" style="grid-column:1/-1;padding:3rem">Не удалось загрузить товары</p>';
    }
  },

  async loadSpecialOffers() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '<div class="loading-placeholder"><div class="loader"></div></div>';

    try {
      const products = await api.getSpecialOffers();
      if (products && products.length > 0) {
        grid.innerHTML = products.map(p => App.renderProductCard(p)).join('');
      } else {
        grid.innerHTML = '<p class="text-secondary text-center" style="grid-column:1/-1;padding:3rem">Акций пока нет</p>';
      }
      this.updateCount(products.length);
      // Скрываем пагинацию для акций
      document.getElementById('catalog-pagination').innerHTML = '';
    } catch (e) {
      grid.innerHTML = '<p class="text-secondary text-center" style="grid-column:1/-1;padding:3rem">Не удалось загрузить акции</p>';
    }
  },

  async filterCategory(categoryId) {
    this.currentCategory = categoryId;
    this.currentPage = 0;

    // Обновить активный фильтр
    document.querySelectorAll('.catalog__filter-item').forEach(item => {
      item.classList.remove('catalog__filter-item--active');
    });
    event.target.classList.add('catalog__filter-item--active');

    // Обновить URL без перезагрузки
    const url = new URL(window.location);
    if (categoryId) {
      url.searchParams.set('category', categoryId);
    } else {
      url.searchParams.delete('category');
    }
    url.searchParams.delete('filter');
    history.pushState({}, '', url);

    await this.loadProducts();
  },

  initSort() {
    const sortSelect = document.getElementById('catalog-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.currentPage = 0;
        this.loadProducts();
      });
    }
  },

  updateCount(total) {
    const countEl = document.getElementById('catalog-count');
    if (countEl) {
      countEl.textContent = `${total} ${this.pluralize(total, 'товар', 'товара', 'товаров')}`;
    }
  },

  renderPagination() {
    const container = document.getElementById('catalog-pagination');
    if (!container || this.totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let html = '';
    // Назад
    html += `<button class="pagination__btn ${this.currentPage === 0 ? 'pagination__btn--disabled' : ''}"
              onclick="CatalogPage.goToPage(${this.currentPage - 1})">&laquo;</button>`;

    // Страницы
    for (let i = 0; i < this.totalPages && i < 7; i++) {
      const page = i;
      html += `<button class="pagination__btn ${page === this.currentPage ? 'pagination__btn--active' : ''}"
                onclick="CatalogPage.goToPage(${page})">${page + 1}</button>`;
    }

    // Вперёд
    html += `<button class="pagination__btn ${this.currentPage >= this.totalPages - 1 ? 'pagination__btn--disabled' : ''}"
              onclick="CatalogPage.goToPage(${this.currentPage + 1})">&raquo;</button>`;

    container.innerHTML = html;
  },

  async goToPage(page) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    await this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  pluralize(n, one, two, five) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return two;
    return five;
  }
};

document.addEventListener('DOMContentLoaded', () => CatalogPage.init());
