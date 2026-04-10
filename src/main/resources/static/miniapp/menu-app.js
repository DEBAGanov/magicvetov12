/**
 * PizzaNat Mini App - Menu Page
 * Full product catalog like @DurgerKingBot
 */

// Функции для отслеживания электронной коммерции в Яндекс.Метрике
function trackEcommerce(eventType, data) {
    try {
        if (typeof ym !== 'undefined') {
            console.log('📊 YM E-commerce tracking:', eventType, data);
            ym(108401065, 'reachGoal', eventType, data);
            
            // Отправляем данные в dataLayer для электронной коммерции
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: eventType,
                ecommerce: data
            });
        }
    } catch (error) {
        console.error('❌ YM E-commerce tracking error:', error);
    }
}

// Функции для отслеживания событий VK пикселя (Top.Mail.Ru)
function trackVKEcommerce(goal, data) {
    try {
        if (typeof _tmr !== 'undefined' && Array.isArray(_tmr)) {
            console.log('📊 VK E-commerce tracking:', goal, data);
            _tmr.push({
                type: "reachGoal",
                id: "3756511",
                goal: goal,
                value: data.value || undefined,
                params: data.params || {}
            });
        }
    } catch (error) {
        console.error('❌ VK E-commerce tracking error:', error);
    }
}

function trackPurchase(orderData, items) {
    const ecommerceData = {
        purchase: {
            transaction_id: orderData.id || orderData.orderId,
            value: orderData.totalAmount,
            currency: 'RUB',
            items: items.map(item => ({
                item_id: item.productId?.toString(),
                item_name: item.name,
                category: item.category || 'Еда',
                quantity: item.quantity,
                price: item.price
            }))
        }
    };
    
    // Яндекс Метрика
    trackEcommerce('purchase', ecommerceData);
    
    // VK пиксель
    const productIds = items.map(item => item.productId?.toString());
    trackVKEcommerce('purchase', {
        value: orderData.totalAmount,
        params: {
            product_id: productIds.length === 1 ? productIds[0] : productIds
        }
    });
}

function trackAddToCart(item) {
    const ecommerceData = {
        add_to_cart: {
            currency: 'RUB',
            value: item.price * item.quantity,
            items: [{
                item_id: item.productId?.toString(),
                item_name: item.name,
                category: item.category || 'Еда',
                quantity: item.quantity,
                price: item.price
            }]
        }
    };
    
    // Яндекс Метрика
    trackEcommerce('add_to_cart', ecommerceData);
    
    // VK пиксель
    trackVKEcommerce('add_to_cart', {
        params: {
            product_id: item.productId?.toString()
        }
    });
}

function trackViewItem(item) {
    const ecommerceData = {
        view_item: {
            currency: 'RUB',
            value: item.price,
            items: [{
                item_id: item.productId?.toString(),
                item_name: item.name,
                category: item.category || 'Еда',
                quantity: 1,
                price: item.price
            }]
        }
    };
    
    // Яндекс Метрика
    trackEcommerce('view_item', ecommerceData);
    
    // VK пиксель
    trackVKEcommerce('view_item', {
        params: {
            product_id: item.productId?.toString()
        }
    });
}

class PizzaNatMenuApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.api = window.PizzaAPI;
        this.cart = { items: [], totalAmount: 0 };
        this.products = [];
        this.authToken = null;
        this.currentViewerProduct = null;
        this.currentProductImages = [];
        this.currentImageIndex = 0;

        // Load cart from localStorage
        this.loadCartFromStorage();

        // Initialize app
        this.init();
    }

    /**
     * Склонение слова "товар" в зависимости от количества
     */
    getProductWord(count) {
        if (count === 1) {
            return 'ТОВАР';
        } else if (count >= 2 && count <= 4) {
            return 'ТОВАРА';
        } else {
            return 'ТОВАРОВ';
        }
    }

    /**
     * Инициализация приложения
     */
    async init() {
        console.log('🚀 Initializing PizzaNat Menu...');
        
        try {
            // Настройка Telegram WebApp
            this.setupTelegramWebApp();
            
            // Авторизация
            await this.authenticate();
            
            // Загрузка товаров
            await this.loadProducts();
            
            // Настройка UI
            this.setupUI();
            
            // Показываем приложение
            this.showApp();
            
            console.log('✅ Menu initialized successfully');
            
        } catch (error) {
            console.error('❌ Menu initialization failed:', error);
            this.showError('Ошибка загрузки меню');
        }
    }

    /**
     * Настройка Telegram WebApp
     */
    setupTelegramWebApp() {
        if (!this.tg) {
            console.warn('⚠️ Telegram WebApp API not available');
            return;
        }

        console.log('📱 Setting up Telegram WebApp...');

        // Разворачиваем приложение
        this.tg.expand();
        
        // Настраиваем тему
        this.applyTelegramTheme();
        
        // Настраиваем back button
        if (this.tg.BackButton) {
            this.tg.BackButton.show();
            this.tg.BackButton.onClick(() => {
                this.tg.close();
            });
        }
        
        // Подписываемся на события
        this.tg.onEvent('themeChanged', () => this.applyTelegramTheme());
        this.tg.onEvent('contactRequested', (data) => this.handleContactReceived(data));
        
        console.log('✅ Telegram WebApp configured');
    }

    /**
     * Применение темы Telegram
     */
    applyTelegramTheme() {
        if (!this.tg?.themeParams) return;

        const themeParams = this.tg.themeParams;
        const root = document.documentElement;

        // Применяем цвета темы
        if (themeParams.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
        }
        if (themeParams.button_color) {
            root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
        }
        if (themeParams.button_text_color) {
            root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
        }
    }

    /**
     * Авторизация пользователя
     */
    async authenticate() {
        if (!this.tg?.initData) {
            console.warn('⚠️ No Telegram initData available - using demo mode');
            return;
        }

        console.log('🔐 Authenticating user...');
        console.log('InitData:', this.tg.initData);

        try {
            const response = await this.api.authenticateWebApp(this.tg.initData);
            this.authToken = response.token;
            
            // Устанавливаем токен в API
            this.api.setAuthToken(this.authToken);
            
            console.log('✅ User authenticated');
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            console.error('Error details:', error);
            // Продолжаем без авторизации для демонстрации
        }
    }

    /**
     * Загрузка всех товаров
     */
    async loadProducts() {
        console.log('📦 Loading products...');

        try {
            // Загружаем все товары через основной эндпоинт с увеличенным размером страницы
            let allProducts = [];
            let page = 0;
            const pageSize = 100;
            let hasMore = true;

            while (hasMore) {
                console.log(`📄 Loading page ${page} with size ${pageSize}...`);
                const response = await this.api.getProducts(null, page, pageSize);
                
                if (response && response.length > 0) {
                    allProducts.push(...response);
                    page++;
                    
                    // Если получили меньше товаров чем размер страницы, это последняя страница
                    if (response.length < pageSize) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            // Если не получили товары через основной API, пробуем загрузить по категориям
            if (allProducts.length === 0) {
                console.log('🔄 Fallback to category-based loading...');
                const categories = await this.api.getCategories();
                
                for (const category of categories) {
                    let categoryPage = 0;
                    let categoryHasMore = true;
                    
                    while (categoryHasMore) {
                        const products = await this.api.getProductsByCategory(category.id);
                        if (products && products.length > 0) {
                            allProducts.push(...products);
                            categoryPage++;
                            
                            if (products.length < pageSize) {
                                categoryHasMore = false;
                            }
                        } else {
                            categoryHasMore = false;
                        }
                    }
                }
            }

            this.products = allProducts;
            this.renderProducts();
            
            console.log(`✅ Loaded ${this.products.length} products`);
        } catch (error) {
            console.error('❌ Failed to load products:', error);
            this.showError('Ошибка загрузки товаров');
        }
    }

    /**
     * Отображение товаров в сетке
     */
    renderProducts() {
        const grid = document.getElementById('menu-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.products.forEach(product => {
            const cartItem = this.cart.items.find(item => item.productId === product.id);
            const quantity = cartItem ? cartItem.quantity : 0;

            const productElement = document.createElement('div');
            productElement.className = 'menu-item';
            productElement.innerHTML = `
                <img src="${product.imageUrl || '/static/images/products/pizza_4_chees.png'}" 
                     alt="${product.name}" 
                     class="menu-item-image">
                ${quantity > 0 ? `<div class="quantity-display">${quantity}</div>` : ''}
                <div class="menu-item-info">
                    <div class="menu-item-title">${product.name}</div>
                    <div class="menu-item-price">₽${product.price}</div>
                    <div class="menu-item-actions">
                        ${quantity === 0 ?
                            `<button class="add-button ${product.isPreorder ? 'preorder-button' : ''}" data-product-id="${product.id}">${product.isPreorder ? 'под заказ' : 'добавить'}</button>` :
                            `<div class="quantity-controls active">
                                <button class="quantity-btn minus" data-product-id="${product.id}">−</button>
                                <button class="quantity-btn plus" data-product-id="${product.id}">+</button>
                            </div>`
                        }
                    </div>
                </div>
            `;

            grid.appendChild(productElement);
        });

        // Обновляем корзину
        this.updateCartUI();
    }

    /**
     * Настройка UI и обработчиков событий
     */
    setupUI() {
        // Обработчик клика на карточку товара для просмотра
        document.addEventListener('click', (e) => {
            // Игнорируем клики на кнопки
            if (e.target.classList.contains('add-button') ||
                e.target.classList.contains('quantity-btn') ||
                e.target.classList.contains('minus') ||
                e.target.classList.contains('plus')) {
                return;
            }

            // Клик на карточку товара (весь блок)
            const productElement = e.target.closest('.menu-item');
            if (productElement) {
                const productId = productElement.querySelector('[data-product-id]')?.dataset.productId;
                if (productId) {
                    const product = this.products.find(p => p.id === parseInt(productId));
                    if (product) {
                        this.openImageViewer(product);
                        return;
                    }
                }
            }
        });

        // Закрытие модального окна просмотра изображения
        document.getElementById('image-viewer-close')?.addEventListener('click', () => {
            this.closeImageViewer();
        });

        document.querySelector('.image-viewer-overlay')?.addEventListener('click', () => {
            this.closeImageViewer();
        });

        // Кнопка "Добавить в корзину" в модальном окне
        document.getElementById('image-viewer-add-btn')?.addEventListener('click', () => {
            if (this.currentViewerProduct) {
                this.addToCart(this.currentViewerProduct, 1);
                this.closeImageViewer();
            }
        });

        // Кнопки навигации слайдера
        document.getElementById('image-slider-prev')?.addEventListener('click', () => {
            this.prevImage();
        });

        document.getElementById('image-slider-next')?.addEventListener('click', () => {
            this.nextImage();
        });

        // Свайп для слайдера
        let touchStartX = 0;
        const sliderWrapper = document.querySelector('.image-slider-wrapper');
        sliderWrapper?.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        sliderWrapper?.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextImage();
                } else {
                    this.prevImage();
                }
            }
        });

        // Кнопки товаров (только для карточек товаров, не для корзины)
        document.addEventListener('click', (e) => {
            // Проверяем, что это не кнопка в корзине
            if (e.target.classList.contains('cart-quantity-btn')) return;
            
            const productId = e.target.dataset.productId;
            if (!productId) return;

            console.log('Product button clicked:', e.target.className, 'Product ID:', productId);

            const product = this.products.find(p => p.id === parseInt(productId));
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }

            if (e.target.classList.contains('add-button')) {
                console.log('Adding product via ADD button');
                // Add shake animation
                e.target.classList.add('shake');
                setTimeout(() => e.target.classList.remove('shake'), 400);
                this.addToCart(product, 1);
            } else if (e.target.classList.contains('plus') && !e.target.classList.contains('cart-quantity-btn')) {
                console.log('Adding product via PLUS button');
                // Add shake animation
                e.target.classList.add('shake');
                setTimeout(() => e.target.classList.remove('shake'), 400);
                this.addToCart(product, 1);
            } else if (e.target.classList.contains('minus') && !e.target.classList.contains('cart-quantity-btn')) {
                console.log('Removing product via MINUS button');
                this.removeFromCart(product.id, 1);
            }

            // Haptic feedback
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.impactOccurred('light');
            }
        });

        // Корзина
        document.getElementById('cart-button')?.addEventListener('click', () => {
            this.openCart();
        });

        document.getElementById('view-order-button')?.addEventListener('click', () => {
            this.openCart();
        });

        document.getElementById('cart-close')?.addEventListener('click', () => {
            this.closeCart();
        });

        document.getElementById('pay-button')?.addEventListener('click', () => {
            this.proceedToCheckout();
        });

        // Overlay click
        document.getElementById('cart-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') {
                this.closeCart();
            }
        });

        // Обработчики кнопок в корзине
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-quantity-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = parseInt(e.target.dataset.productId);
                if (!productId) return;

                console.log('Cart button clicked:', e.target.className, 'Product ID:', productId);

                if (e.target.classList.contains('plus')) {
                    console.log('Increasing quantity from cart controls');
                    const existingItem = this.cart.items.find(item => item.productId === productId);
                    if (existingItem) {
                        existingItem.quantity += 1;
                        existingItem.subtotal = existingItem.quantity * existingItem.price;
                        this.updateCartTotals();
                        this.saveCartToStorage();
                        this.renderProducts(); // Перерисовываем продукты чтобы обновить количество
                        console.log(`📈 Increased quantity to ${existingItem.quantity}`);
                    }
                } else if (e.target.classList.contains('minus')) {
                    console.log('Removing product from cart controls');
                    this.removeFromCart(productId, 1);
                }

                // Haptic feedback
                if (this.tg?.HapticFeedback) {
                    this.tg.HapticFeedback.impactOccurred('light');
                }
            }
        });

        // Clear cart button
        document.getElementById('clear-cart-button')?.addEventListener('click', () => {
            this.clearCart();
        });

        // Retry button
        document.getElementById('retry-button')?.addEventListener('click', () => {
            location.reload();
        });
    }

    /**
     * Добавление товара в корзину
     */
    addToCart(product, quantity = 1) {
        console.log(`➕ Adding ${quantity}x ${product.name} to cart`);

        const existingItem = this.cart.items.find(item => item.productId === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
        } else {
            this.cart.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity,
                imageUrl: product.imageUrl
            });
        }

        // Отслеживание добавления в корзину в Яндекс.Метрике
        const itemForTracking = existingItem || this.cart.items[this.cart.items.length - 1];
        trackAddToCart({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            category: 'Еда'
        });
        
        this.updateCartTotals();
        this.saveCartToStorage();
        this.renderProducts(); // Обновляем отображение с правильными количествами
        
        console.log('Cart after adding:', this.cart);
    }

    /**
     * Удаление товара из корзины
     */
    removeFromCart(productId, quantity = 1) {
        console.log(`➖ Removing ${quantity}x product ${productId} from cart`);

        const itemIndex = this.cart.items.findIndex(item => item.productId === productId);
        if (itemIndex === -1) return;

        const item = this.cart.items[itemIndex];
        item.quantity -= quantity;

        if (item.quantity <= 0) {
            this.cart.items.splice(itemIndex, 1);
        } else {
            item.subtotal = item.quantity * item.price;
        }

        this.updateCartTotals();
        this.saveCartToStorage();
        this.updateCartUI(); // Обновляем отображение корзины
    }

    /**
     * Очистка корзины
     */
    clearCart() {
        if (this.cart.items.length === 0) return;
        
        // Подтверждение очистки
        if (this.tg?.showConfirm) {
            this.tg.showConfirm('Очистить корзину?', (confirmed) => {
                if (confirmed) {
                    this.performClearCart();
                }
            });
        } else if (confirm('Очистить корзину?')) {
            this.performClearCart();
        }
    }

    /**
     * Выполнение очистки корзины
     */
    performClearCart() {
        console.log('🗑️ Clearing cart');
        this.cart.items = [];
        this.cart.totalAmount = 0;
        this.saveCartToStorage();
        this.updateCartUI();
        this.closeCart();
        
        // Haptic feedback
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('medium');
        }
    }

    /**
     * Обновление общих сумм корзины
     */
    updateCartTotals() {
        this.cart.totalAmount = this.cart.items.reduce((total, item) => total + item.subtotal, 0);
        this.updateCartUI();
    }

    /**
     * Обновление UI корзины
     */
    updateCartUI() {
        const cartCount = this.cart.items.reduce((total, item) => total + item.quantity, 0);
        const totalAmount = this.cart.totalAmount;

        // Обновляем счетчики в header (если есть)
        const cartCountElements = document.querySelectorAll('#cart-count');
        cartCountElements.forEach(el => el.textContent = cartCount);

        const cartTotalElements = document.querySelectorAll('#cart-total');
        cartTotalElements.forEach(el => el.textContent = `₽${totalAmount}`);

        // Обновляем bottom bar с правильным склонением
        const bottomCountElement = document.getElementById('bottom-count');
        const bottomTotalElement = document.getElementById('bottom-total');
        if (bottomCountElement) bottomCountElement.textContent = cartCount;
        if (bottomTotalElement) bottomTotalElement.textContent = `₽${totalAmount}`;
        
        // Обновляем текст кнопки с правильным склонением
        const viewOrderButton = document.getElementById('view-order-button');
        if (viewOrderButton && cartCount > 0) {
            viewOrderButton.innerHTML = `<span id="bottom-count">${cartCount}</span> ${this.getProductWord(cartCount)} НА <span id="bottom-total">₽${totalAmount}</span>`;
        }

        // Показываем/скрываем bottom bar
        const bottomBar = document.getElementById('bottom-bar');
        if (bottomBar) {
            bottomBar.style.display = cartCount > 0 ? 'block' : 'none';
        }

        // Обновляем содержимое корзины
        this.renderCartItems();
    }

    /**
     * Отображение товаров в корзине
     */
    renderCartItems() {
        const cartContent = document.getElementById('cart-content');
        if (!cartContent) return;

        cartContent.innerHTML = '';

        this.cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.imageUrl || '/static/images/products/pizza_4_chees.png'}" 
                     alt="${item.name}" 
                     class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="cart-quantity-btn minus" data-product-id="${item.productId}">−</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="cart-quantity-btn plus" data-product-id="${item.productId}">+</button>
                </div>
                <div class="cart-item-price">₽${item.subtotal}</div>
            `;
            cartContent.appendChild(itemElement);
        });
    }

    /**
     * Открытие корзины
     */
    openCart() {
        if (this.cart.items.length === 0) {
            this.showError('Корзина пуста');
            return;
        }

        document.getElementById('cart-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('medium');
        }
    }

    /**
     * Закрытие корзины
     */
    closeCart() {
        document.getElementById('cart-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * Оформление заказа
     */
    async proceedToCheckout() {
        if (this.cart.items.length === 0) {
            this.showError('Корзина пуста');
            return;
        }

        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('heavy');
        }

        // Сохраняем корзину в localStorage
        this.saveCartToStorage();
        
        // Переходим на страницу оформления заказа
        window.location.href = 'checkout.html';
    }

    /**
     * Запрос контактной информации пользователя
     */
    async requestUserContact() {
        if (!this.tg?.requestContact) {
            throw new Error('requestContact не поддерживается');
        }

        console.log('📞 Запрашиваем контактную информацию...');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Таймаут запроса контакта'));
            }, 30000);

            this.contactPromise = { resolve, reject, timeout };
            this.tg.requestContact();
        });
    }

    /**
     * Обработка полученной контактной информации
     */
    handleContactReceived(data) {
        console.log('📞 Получена контактная информация:', data);

        if (this.contactPromise) {
            clearTimeout(this.contactPromise.timeout);
            
            if (data.status === 'sent') {
                const contactData = {
                    deliveryAddress: 'г. Волжск, адрес будет уточнен',
                    deliveryType: 'Доставка курьером',
                    contactName: data.contact?.first_name || this.tg?.initDataUnsafe?.user?.first_name || 'Пользователь',
                    contactPhone: data.contact?.phone_number || '+79999999999',
                    comment: 'Заказ через Telegram Mini App',
                    paymentMethod: 'SBP'
                };

                this.createOrderWithData(contactData);
                this.contactPromise.resolve(contactData);
            } else {
                this.contactPromise.reject(new Error('Контакт не предоставлен'));
            }
            
            this.contactPromise = null;
        }
    }

    /**
     * Создание заказа с данными
     */
    async createOrderWithData(orderData) {
        try {
            console.log('📝 Создаем заказ с данными:', orderData);

            // Подготавливаем данные заказа
            const orderRequest = {
                ...orderData,
                items: this.cart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            // Создаем заказ
            const order = await this.api.createOrder(orderRequest);
            
            // Создаем платеж
            const payment = await this.api.createPayment(order.id, 'SBP');
            
            if (payment.success && payment.confirmationUrl) {
                // Отслеживание покупки в Яндекс.Метрике
                trackPurchase(order, this.cart.items);
                
                // Открываем страницу оплаты
                this.tg?.openLink(payment.confirmationUrl);
                
                // Очищаем корзину
                this.cart = { items: [], totalAmount: 0 };
                this.saveCartToStorage();
                this.updateCartUI();
                this.closeCart();
                
                // Показываем уведомление
                this.tg?.showAlert('Заказ создан! Переходим к оплате...');
                
            } else {
                throw new Error(payment.message || 'Ошибка создания платежа');
            }
            
        } catch (error) {
            console.error('❌ Checkout failed:', error);
            this.showError('Ошибка оформления заказа: ' + error.message);
        }
    }

    /**
     * Сохранение корзины в localStorage
     */
    saveCartToStorage() {
        try {
            localStorage.setItem('pizzanat_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.warn('Failed to save cart to localStorage:', error);
        }
    }

    /**
     * Загрузка корзины из localStorage
     */
    loadCartFromStorage() {
        try {
            const saved = localStorage.getItem('pizzanat_cart');
            if (saved) {
                this.cart = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load cart from localStorage:', error);
            this.cart = { items: [], totalAmount: 0 };
        }
    }

    /**
     * Открыть просмотр изображения товара
     */
    openImageViewer(product) {
        this.currentViewerProduct = product;
        this.currentImageIndex = 0;

        // Собираем все изображения товара
        this.currentProductImages = [product.imageUrl];
        if (product.additionalImages && product.additionalImages.length > 0) {
            this.currentProductImages = this.currentProductImages.concat(
                product.additionalImages.map(img => img.imageUrl || img)
            );
        }

        const viewer = document.getElementById('image-viewer');
        const img = document.getElementById('image-viewer-img');
        const title = document.getElementById('image-viewer-title');
        const price = document.getElementById('image-viewer-price');
        const indicators = document.getElementById('image-slider-indicators');
        const prevBtn = document.getElementById('image-slider-prev');
        const nextBtn = document.getElementById('image-slider-next');

        if (viewer && img && title && price) {
            // Показываем первое изображение
            img.src = this.currentProductImages[0];
            img.alt = product.name;
            title.textContent = product.name;
            price.textContent = `₽${product.price}`;

            // Обновляем текст кнопки в карточке
            const addBtn = document.getElementById('image-viewer-add-btn');
            if (addBtn) {
                addBtn.textContent = product.isPreorder ? 'Под заказ' : 'Добавить в корзину';
            }

            // Создаём индикаторы
            this.updateSliderIndicators();

            // Показываем/скрываем кнопки навигации
            if (prevBtn && nextBtn) {
                prevBtn.style.display = this.currentProductImages.length > 1 ? 'flex' : 'none';
                nextBtn.style.display = this.currentProductImages.length > 1 ? 'flex' : 'none';
            }

            viewer.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Haptic feedback
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.impactOccurred('light');
            }
        }
    }

    /**
     * Обновить индикаторы слайдера
     */
    updateSliderIndicators() {
        const indicators = document.getElementById('image-slider-indicators');
        if (!indicators) return;

        indicators.innerHTML = '';

        this.currentProductImages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `slider-indicator ${index === this.currentImageIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => this.goToImage(index));
            indicators.appendChild(dot);
        });
    }

    /**
     * Перейти к изображению по индексу
     */
    goToImage(index) {
        if (index < 0 || index >= this.currentProductImages.length) return;

        this.currentImageIndex = index;
        const img = document.getElementById('image-viewer-img');
        if (img) {
            img.src = this.currentProductImages[index];
        }
        this.updateSliderIndicators();

        // Haptic feedback
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('light');
        }
    }

    /**
     * Следующее изображение
     */
    nextImage() {
        if (this.currentImageIndex < this.currentProductImages.length - 1) {
            this.goToImage(this.currentImageIndex + 1);
        }
    }

    /**
     * Предыдущее изображение
     */
    prevImage() {
        if (this.currentImageIndex > 0) {
            this.goToImage(this.currentImageIndex - 1);
        }
    }

    /**
     * Закрыть просмотр изображения
     */
    closeImageViewer() {
        const viewer = document.getElementById('image-viewer');
        if (viewer) {
            viewer.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.currentViewerProduct = null;
            this.currentProductImages = [];
            this.currentImageIndex = 0;
        }
    }

    /**
     * Показать приложение
     */
    showApp() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        document.getElementById('error-message').textContent = message;
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('error-screen').style.display = 'flex';
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new PizzaNatMenuApp();
});
