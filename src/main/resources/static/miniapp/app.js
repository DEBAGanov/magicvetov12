/**
 * PizzaNat Mini App Main Application
 * Telegram WebApp integration and UI management
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

class PizzaNatMiniApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.api = window.PizzaAPI;
        this.cart = { items: [], totalAmount: 0 };
        this.currentCategory = null;
        this.categories = [];
        this.products = [];
        
        // Initialize app
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        console.log('🚀 Initializing PizzaNat Mini App...');
        
        try {
            // Настройка Telegram WebApp
            this.setupTelegramWebApp();
            
            // Авторизация
            await this.authenticate();
            
            // Загрузка категорий
            await this.loadCategories();
            
            // Настройка UI
            this.setupUI();
            
            // Показываем приложение
            this.showApp();
            
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Ошибка инициализации приложения');
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
        
        // Включаем закрытие по свайпу
        this.tg.enableClosingConfirmation();
        
        // Настраиваем тему
        this.applyTelegramTheme();
        
        // Настраиваем главную кнопку
        this.setupMainButton();
        
        // Настраиваем back button
        this.setupBackButton();
        
        // Подписываемся на события
        this.tg.onEvent('themeChanged', () => this.applyTelegramTheme());
        this.tg.onEvent('viewportChanged', () => this.handleViewportChange());
        this.tg.onEvent('contactRequested', (data) => this.handleContactReceived(data));
        
        console.log('✅ Telegram WebApp configured');
    }

    /**
     * Применение темы Telegram
     */
    applyTelegramTheme() {
        if (!this.tg) return;

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

        console.log('🎨 Theme applied:', themeParams);
    }

    /**
     * Авторизация пользователя
     */
    async authenticate() {
        if (!this.tg?.initData) {
            console.warn('⚠️ No Telegram initData available, using guest mode');
            return;
        }

        try {
            console.log('🔐 Authenticating user...');
            
            const authResult = await this.api.authenticateWebApp(this.tg.initData);
            
            if (authResult && authResult.token) {
                console.log('✅ User authenticated:', authResult.firstName, authResult.lastName);
                
                // Показываем приветствие
                if (this.tg.HapticFeedback) {
                    this.tg.HapticFeedback.notificationOccurred('success');
                }
            }
            
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            // Продолжаем работу в гостевом режиме
        }
    }

    /**
     * Загрузка категорий
     */
    async loadCategories() {
        console.log('📊 Loading categories...');

        try {
            // Загружаем только категории
            this.categories = await this.api.getCategories();

            console.log('✅ Categories loaded:', this.categories.length);

        } catch (error) {
            console.error('❌ Failed to load categories:', error);
            throw error;
        }
    }

    /**
     * Настройка UI
     */
    setupUI() {
        console.log('🎨 Setting up UI...');

        // Отображаем категории
        this.renderCategories();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        console.log('✅ UI setup complete');
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопка корзины
        document.getElementById('cart-button')?.addEventListener('click', () => {
            this.openCart();
        });

        // Кнопка просмотра корзины в bottom bar
        document.getElementById('view-cart-button')?.addEventListener('click', () => {
            this.openCart();
        });

        // Закрытие корзины
        document.getElementById('cart-close')?.addEventListener('click', () => {
            this.closeCart();
        });

        // Оформление заказа
        document.getElementById('checkout-button')?.addEventListener('click', () => {
            this.proceedToCheckout();
        });

        // Кнопка "Назад"
        document.getElementById('back-button')?.addEventListener('click', () => {
            this.goBack();
        });

        // Повторная попытка при ошибке
        document.getElementById('retry-button')?.addEventListener('click', () => {
            this.init();
        });

        // Закрытие корзины по клику вне области
        document.getElementById('cart-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') {
                this.closeCart();
            }
        });
    }

    /**
     * Отображение категорий
     */
    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Добавляем категорию "Все товары"
        const allCategoryCard = this.createCategoryCard({
            id: null,
            name: 'Все товары',
            description: 'Полный каталог',
            imageUrl: '/static/images/categories/pizza.png'
        });
        grid.appendChild(allCategoryCard);

        // Добавляем остальные категории
        this.categories.forEach(category => {
            const card = this.createCategoryCard(category);
            grid.appendChild(card);
        });
    }

    /**
     * Создание карточки категории
     */
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => this.selectCategory(category.id);

        card.innerHTML = `
            <img src="${category.imageUrl || '/static/images/categories/pizza.png'}" 
                 alt="${category.name}" 
                 class="category-icon"
                 onerror="this.src='/static/images/categories/pizza.png'">
            <div class="category-name">${category.name}</div>
            <div class="category-description">${category.description || ''}</div>
        `;

        return card;
    }

    /**
     * Выбор категории
     */
    async selectCategory(categoryId) {
        console.log('📂 Selecting category:', categoryId);

        // Haptic feedback
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('medium');
        }

        try {
            this.currentCategory = categoryId;
            
            // Показываем загрузку
            this.showLoading();
            
            // Загружаем продукты
            const products = await this.api.getProducts(categoryId);
            this.products = Array.isArray(products) ? products : (products.content || []);
            
            // Отображаем продукты
            this.renderProducts();
            
            // Обновляем заголовок
            const category = this.categories.find(c => c.id === categoryId);
            const title = category ? category.name : 'Все товары';
            document.getElementById('products-title').textContent = title;
            
            // Показываем секцию продуктов и кнопку назад
            this.showProductsSection();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Failed to load products:', error);
            this.hideLoading();
            this.showError('Ошибка загрузки товаров');
        }
    }

    /**
     * Отображение продуктов
     */
    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🍕</div>
                    <div class="empty-state-text">Товары не найдены</div>
                </div>
            `;
            return;
        }

        this.products.forEach(product => {
            const card = this.createProductCard(product);
            grid.appendChild(card);
        });
    }

    /**
     * Создание карточки продукта
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const cartItem = this.cart.items?.find(item => item.productId === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        const discountBadge = product.isSpecialOffer && product.discountPercent ? 
            `<span class="discount-badge">-${product.discountPercent}%</span>` : '';
        
        const originalPrice = product.discountedPrice && product.discountedPrice < product.price ?
            `<span class="original-price">${this.api.formatPrice(product.price)}</span>` : '';
        
        const currentPrice = product.discountedPrice && product.discountedPrice < product.price ?
            product.discountedPrice : product.price;

        card.innerHTML = `
            <img src="${product.imageUrl || '/static/images/products/pizza_cheese.png'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='/static/images/products/pizza_cheese.png'">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description || ''}</div>
                <div class="product-footer">
                    <div class="product-price">
                        <div class="current-price">${this.api.formatPrice(currentPrice)}</div>
                        ${originalPrice}
                        ${discountBadge}
                    </div>
                    <div class="product-actions">
                        ${quantity === 0 ? 
                            `<button class="add-button" onclick="app.addToCart(${product.id})">Добавить</button>` :
                            `<div class="quantity-controls">
                                <button class="quantity-btn" onclick="app.decreaseQuantity(${product.id})">−</button>
                                <span class="quantity-value">${quantity}</span>
                                <button class="quantity-btn" onclick="app.increaseQuantity(${product.id})">+</button>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Добавление товара в корзину
     */
    async addToCart(productId, quantity = 1) {
        console.log('➕ Adding to cart:', productId);

        try {
            // Haptic feedback
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.impactOccurred('light');
            }

            // Анимация добавления
            const productCard = event?.target?.closest('.product-card');
            if (productCard) {
                productCard.classList.add('adding');
                setTimeout(() => productCard.classList.remove('adding'), 600);
            }

            const result = await this.api.addToCart(productId, quantity);
            this.cart = result;
            
            // Отслеживание добавления в корзину в Яндекс.Метрике
            const addedItem = result.items.find(item => item.productId === productId);
            if (addedItem) {
                trackAddToCart(addedItem);
            }
            
            this.updateCartUI();
            this.renderProducts(); // Обновляем отображение продуктов
            
        } catch (error) {
            console.error('❌ Failed to add to cart:', error);
            this.showError('Ошибка добавления в корзину');
        }
    }

    /**
     * Увеличение количества товара
     */
    async increaseQuantity(productId) {
        const cartItem = this.cart.items?.find(item => item.productId === productId);
        if (cartItem) {
            await this.updateCartItemQuantity(productId, cartItem.quantity + 1);
        }
    }

    /**
     * Уменьшение количества товара
     */
    async decreaseQuantity(productId) {
        const cartItem = this.cart.items?.find(item => item.productId === productId);
        if (cartItem) {
            if (cartItem.quantity === 1) {
                await this.removeFromCart(productId);
            } else {
                await this.updateCartItemQuantity(productId, cartItem.quantity - 1);
            }
        }
    }

    /**
     * Обновление количества товара в корзине
     */
    async updateCartItemQuantity(productId, quantity) {
        try {
            const result = await this.api.updateCartItem(productId, quantity);
            this.cart = result;
            
            this.updateCartUI();
            this.renderProducts();
            
        } catch (error) {
            console.error('❌ Failed to update cart item:', error);
            this.showError('Ошибка обновления корзины');
        }
    }

    /**
     * Удаление товара из корзины
     */
    async removeFromCart(productId) {
        try {
            const result = await this.api.removeFromCart(productId);
            this.cart = result;
            
            this.updateCartUI();
            this.renderProducts();
            
        } catch (error) {
            console.error('❌ Failed to remove from cart:', error);
            this.showError('Ошибка удаления из корзины');
        }
    }

    /**
     * Обновление UI корзины
     */
    updateCartUI() {
        const itemCount = this.cart.items?.length || 0;
        const totalAmount = this.cart.totalAmount || 0;

        // Обновляем счетчики
        document.getElementById('cart-count').textContent = itemCount;
        document.getElementById('bottom-count').textContent = itemCount;
        
        // Обновляем суммы
        document.getElementById('cart-total').textContent = this.api.formatPrice(totalAmount);
        document.getElementById('bottom-total').textContent = this.api.formatPrice(totalAmount);

        // Показываем/скрываем bottom bar
        const bottomBar = document.getElementById('bottom-bar');
        if (itemCount > 0) {
            bottomBar.style.display = 'block';
        } else {
            bottomBar.style.display = 'none';
        }

        // Обновляем содержимое корзины
        this.renderCartItems();
    }

    /**
     * Отображение товаров в корзине
     */
    renderCartItems() {
        const content = document.getElementById('cart-content');
        if (!content) return;

        content.innerHTML = '';

        if (!this.cart.items || this.cart.items.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-text">Корзина пуста</div>
                </div>
            `;
            return;
        }

        this.cart.items.forEach(item => {
            const itemElement = this.createCartItem(item);
            content.appendChild(itemElement);
        });
    }

    /**
     * Создание элемента корзины
     */
    createCartItem(item) {
        const element = document.createElement('div');
        element.className = 'cart-item';

        element.innerHTML = `
            <img src="${item.productImageUrl || '/static/images/products/pizza_cheese.png'}" 
                 alt="${item.productName}" 
                 class="cart-item-image"
                 onerror="this.src='/static/images/products/pizza_cheese.png'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.productName}</div>
                <div class="cart-item-price">${this.api.formatPrice(item.totalPrice)}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="app.decreaseQuantity(${item.productId})">−</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" onclick="app.increaseQuantity(${item.productId})">+</button>
            </div>
        `;

        return element;
    }

    /**
     * Открытие корзины
     */
    openCart() {
        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('medium');
        }

        document.getElementById('cart-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
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
        if (!this.cart.items || this.cart.items.length === 0) {
            this.showError('Корзина пуста');
            return;
        }

        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.impactOccurred('heavy');
        }

        // Сохраняем корзину в localStorage для передачи на страницу оформления заказа
        this.saveCartToStorage();

        // Переходим на страницу оформления заказа
        window.location.href = 'checkout.html';
    }

    /**
     * Сохранение корзины в localStorage
     */
    saveCartToStorage() {
        try {
            localStorage.setItem('pizzanat_cart', JSON.stringify(this.cart));
            console.log('✅ Cart saved to localStorage:', this.cart);
        } catch (error) {
            console.warn('Failed to save cart to localStorage:', error);
        }
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
            // Устанавливаем таймаут на случай если пользователь не ответит
            const timeout = setTimeout(() => {
                reject(new Error('Таймаут запроса контакта'));
            }, 30000); // 30 секунд

            // Временно сохраняем промис для обработки в handleContactReceived
            this.contactPromise = { resolve, reject, timeout };
            
            // Запрашиваем контакт
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
                // Данные контакта получены
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
                // Пользователь отменил или произошла ошибка
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

            // Создаем заказ
            const order = await this.api.createOrder(orderData);
            
            // Создаем платеж
            const payment = await this.api.createPayment(order.id, 'SBP');
            
            if (payment.success && payment.confirmationUrl) {
                // Отслеживание покупки в Яндекс.Метрике
                trackPurchase(order, this.cart.items);
                
                // Открываем страницу оплаты
                this.tg?.openLink(payment.confirmationUrl);
                
                // Очищаем корзину
                this.cart = { items: [], totalAmount: 0 };
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
     * Возврат назад
     */
    goBack() {
        if (this.currentCategory !== null) {
            this.currentCategory = null;
            this.hideProductsSection();
            
            if (this.tg?.HapticFeedback) {
                this.tg.HapticFeedback.impactOccurred('light');
            }
        }
    }

    /**
     * Показать секцию продуктов
     */
    showProductsSection() {
        document.getElementById('categories-section').style.display = 'none';
        document.getElementById('products-section').style.display = 'block';
        document.getElementById('back-button').style.display = 'block';
        
        // Настраиваем back button в Telegram
        if (this.tg?.BackButton) {
            this.tg.BackButton.show();
            this.tg.BackButton.onClick(() => this.goBack());
        }
    }

    /**
     * Скрыть секцию продуктов
     */
    hideProductsSection() {
        document.getElementById('categories-section').style.display = 'block';
        document.getElementById('products-section').style.display = 'none';
        document.getElementById('back-button').style.display = 'none';
        
        // Скрываем back button в Telegram
        if (this.tg?.BackButton) {
            this.tg.BackButton.hide();
        }
    }

    /**
     * Настройка главной кнопки
     */
    setupMainButton() {
        if (!this.tg?.MainButton) return;

        // Скрываем по умолчанию
        this.tg.MainButton.hide();
    }

    /**
     * Настройка кнопки назад
     */
    setupBackButton() {
        if (!this.tg?.BackButton) return;

        this.tg.BackButton.hide();
    }

    /**
     * Обработка изменения viewport
     */
    handleViewportChange() {
        // Адаптируем интерфейс под изменения viewport
        console.log('📱 Viewport changed:', this.tg?.viewportHeight);
    }

    /**
     * Показать приложение
     */
    showApp() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('error-screen').style.display = 'none';
    }

    /**
     * Показать загрузку
     */
    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        document.getElementById('error-screen').style.display = 'none';
    }

    /**
     * Скрыть загрузку
     */
    hideLoading() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('error-screen').style.display = 'none';
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app').style.display = 'none';
        document.getElementById('error-screen').style.display = 'flex';
        document.getElementById('error-message').textContent = message;

        if (this.tg?.HapticFeedback) {
            this.tg.HapticFeedback.notificationOccurred('error');
        }
    }
}

// Инициализация приложения
let app;

// Ждем загрузки Telegram WebApp
function initApp() {
    console.log('🍕 PizzaNat Mini App starting...');
    app = new PizzaNatMiniApp();
}

// Инициализация при готовности DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Экспорт для глобального доступа
window.app = app;
