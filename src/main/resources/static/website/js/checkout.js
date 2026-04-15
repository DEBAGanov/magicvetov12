/* ============================================
 * MagicCvetov — Checkout Page Logic
 * ============================================ */

const CheckoutPage = {
  cart: null,
  deliveryType: 'DELIVERY',
  paymentMethod: 'CASH',

  async init() {
    await this.loadCart();
    this.initDeliveryToggle();
    this.initPaymentToggle();
    this.initForm();
  },

  async loadCart() {
    try {
      this.cart = await api.getCart();
      const items = this.cart?.items || [];
      if (items.length === 0) {
        document.getElementById('checkout-container').innerHTML = `
          <div class="cart-empty">
            <div class="cart-empty__icon">🛒</div>
            <h2>Корзина пуста</h2>
            <p class="cart-empty__text">Добавьте товары перед оформлением заказа</p>
            <a href="/website/catalog.html" class="btn btn--primary btn--lg">Перейти в каталог</a>
          </div>
        `;
        return;
      }
      this.renderSummary(items);
    } catch (e) {
      // Продолжаем без корзины
    }
  },

  renderSummary(items) {
    const total = items.reduce((sum, item) => {
      const price = item.product?.price || item.price || 0;
      return sum + price * (item.quantity || 1);
    }, 0);

    const summaryEl = document.getElementById('checkout-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h3 style="margin-bottom:var(--space-lg)">Ваш заказ</h3>
        ${items.map(item => {
          const p = item.product || item;
          const name = p.name || item.name || 'Товар';
          const price = p.price || item.price || 0;
          return `
            <div style="display:flex;justify-content:space-between;padding:var(--space-xs) 0;font-size:var(--fs-sm)">
              <span>${name} x${item.quantity || 1}</span>
              <span>${App.formatPrice(price * (item.quantity || 1))}</span>
            </div>
          `;
        }).join('')}
        <div style="border-top:1px solid var(--color-border);margin-top:var(--space-md);padding-top:var(--space-md)">
          <div style="display:flex;justify-content:space-between;font-size:var(--fs-sm)">
            <span>Доставка</span>
            <span style="color:var(--color-secondary)">Бесплатно</span>
          </div>
        </div>
        <div class="cart-summary__total" style="margin-top:var(--space-md)">
          <span>Итого</span>
          <span>${App.formatPrice(total)}</span>
        </div>
      `;
    }
  },

  initDeliveryToggle() {
    document.querySelectorAll('[data-delivery]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-delivery]').forEach(c => c.classList.remove('radio-card--active'));
        card.classList.add('radio-card--active');
        this.deliveryType = card.dataset.delivery;

        const addressBlock = document.getElementById('address-block');
        if (addressBlock) {
          addressBlock.style.display = this.deliveryType === 'DELIVERY' ? 'block' : 'none';
        }
      });
    });
  },

  initPaymentToggle() {
    document.querySelectorAll('[data-payment]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-payment]').forEach(c => c.classList.remove('radio-card--active'));
        card.classList.add('radio-card--active');
        this.paymentMethod = card.dataset.payment;
      });
    });
  },

  initForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitOrder();
    });
  },

  async submitOrder() {
    const btn = document.getElementById('checkout-submit');
    if (!btn) return;

    const name = document.getElementById('checkout-name')?.value?.trim();
    const phone = document.getElementById('checkout-phone')?.value?.trim();
    const address = document.getElementById('checkout-address')?.value?.trim();
    const comment = document.getElementById('checkout-comment')?.value?.trim();

    // Валидация
    if (!name) { App.showToast('Укажите ваше имя', 'error'); return; }
    if (!phone) { App.showToast('Укажите номер телефона', 'error'); return; }
    if (this.deliveryType === 'DELIVERY' && !address) {
      App.showToast('Укажите адрес доставки', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Оформляем...';

    try {
      const orderData = {
        customerName: name,
        customerPhone: phone,
        deliveryAddress: this.deliveryType === 'DELIVERY' ? address : null,
        deliveryType: this.deliveryType,
        paymentMethod: this.paymentMethod === 'ONLINE' ? 'YOOKASSA' : this.paymentMethod,
        comment: comment || null
      };

      const order = await api.createOrder(orderData);

      // Если онлайн-оплата — перенаправляем на платёж
      if (this.paymentMethod === 'ONLINE' && order?.id) {
        try {
          const paymentData = await api.getPaymentUrl(order.id);
          if (paymentData?.paymentUrl || paymentData?.confirmationUrl) {
            window.location.href = paymentData.paymentUrl || paymentData.confirmationUrl;
            return;
          }
        } catch (e) {
          // Если не удалось получить URL оплаты — показываем номер заказа
        }
      }

      // Успех
      document.getElementById('checkout-container').innerHTML = `
        <div class="text-center" style="padding:4rem">
          <div style="font-size:4rem;margin-bottom:var(--space-lg)">✅</div>
          <h2>Заказ оформлен!</h2>
          <p class="text-secondary" style="margin-bottom:var(--space-xl)">
            ${order?.id ? `Номер заказа: <strong>#${order.id}</strong><br>` : ''}
            Мы свяжемся с вами для подтверждения заказа.
          </p>
          <a href="/website/" class="btn btn--primary btn--lg">На главную</a>
        </div>
      `;
    } catch (e) {
      App.showToast(e.message || 'Ошибка при оформлении заказа', 'error');
      btn.disabled = false;
      btn.textContent = 'Оформить заказ';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => CheckoutPage.init());
