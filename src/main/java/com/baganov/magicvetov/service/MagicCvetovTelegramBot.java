/**
 * @file: MagicCvetovTelegramBot.java
 * @description: Основной класс Telegram бота для MagicCvetov с поддержкой команд и inline кнопок
 * @dependencies: TelegramBots API, Spring Boot, TelegramWebhookService
 * @created: 2025-01-11
 * @updated: 2025-01-15 - добавлена поддержка условного включения через переменные окружения
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.config.TelegramConfig;
import com.baganov.magicvetov.entity.TelegramAuthToken;
import com.baganov.magicvetov.model.dto.telegram.TelegramUpdate;
import com.baganov.magicvetov.model.dto.telegram.TelegramUserData;
import com.baganov.magicvetov.repository.TelegramAuthTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Contact;
import org.telegram.telegrambots.meta.api.objects.Message;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.User;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardRemove;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.InlineKeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardButton;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@ConditionalOnProperty(name = "telegram.bot.enabled", havingValue = "true", matchIfMissing = false)
public class MagicCvetovTelegramBot extends TelegramLongPollingBot {

    private final TelegramConfig.TelegramBotProperties telegramBotProperties;
    private final TelegramBotIntegrationService integrationService;
    private final TelegramAuthTokenRepository tokenRepository;

    // Хранение токенов авторизации для пользователей
    private final Map<Long, String> userAuthTokens = new HashMap<>();

    @Autowired
    public MagicCvetovTelegramBot(TelegramConfig.TelegramBotProperties telegramBotProperties,
            TelegramBotIntegrationService integrationService,
            TelegramAuthTokenRepository tokenRepository) {
        this.telegramBotProperties = telegramBotProperties;
        this.integrationService = integrationService;
        this.tokenRepository = tokenRepository;

        // ДИАГНОСТИКА: Логируем токен для отладки
        String token = telegramBotProperties.getBotToken();
        log.info("🔍 ДИАГНОСТИКА: Основной бот использует токен: {}...",
                token != null && token.length() > 10 ? token.substring(0, 10) : "NULL");
        log.info("🤖 MagicCvetov Telegram Bot инициализирован для Long Polling");
    }

    @Override
    public String getBotUsername() {
        return telegramBotProperties.getBotUsername();
    }

    @Override
    public String getBotToken() {
        return telegramBotProperties.getBotToken();
    }

    @Override
    public void onUpdateReceived(Update update) {
        try {
            if (update.hasMessage()) {
                handleMessage(update.getMessage());
            }
        } catch (Exception e) {
            log.error("Ошибка обработки обновления: {}", e.getMessage(), e);
        }
    }

    /**
     * Обработка входящих сообщений
     */
    private void handleMessage(Message message) {
        Long chatId = message.getChatId();
        User user = message.getFrom();

        log.debug("Получено сообщение от пользователя {} (ID: {})", user.getFirstName(), user.getId());

        // Обработка контакта
        if (message.hasContact()) {
            handleContactMessage(message);
            return;
        }

        // Обработка текстовых команд
        if (message.hasText()) {
            String messageText = message.getText().trim();

            // Обработка команды /start (с токеном или без)
            if (messageText.equals("/start") || messageText.startsWith("/start ")) {
                handleStartCommand(chatId, user, messageText);
            }
            // Обработка других команд
            else if (messageText.equals("/help")) {
                handleHelpCommand(chatId);
            } else if (messageText.equals("/menu")) {
                handleMenuCommand(chatId);
            } else {
                handleUnknownCommand(chatId);
            }
        }
    }

    /**
     * Обработка команды /start (с токеном или без)
     */
    private void handleStartCommand(Long chatId, User user, String fullCommand) {
        log.info("Команда /start от пользователя: {} (ID: {}), команда: {}", user.getFirstName(), user.getId(),
                fullCommand);

        // Создаем данные пользователя
        TelegramUserData userData = TelegramUserData.builder()
                .id(user.getId().longValue())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUserName())
                .build();

        // Проверяем, есть ли токен в команде
        if (fullCommand.startsWith("/start ")) {
            String potentialToken = fullCommand.substring(7).trim(); // 7 = длина "/start "

            // Проверяем, является ли это токеном аутентификации от мобильного приложения
            if (potentialToken.startsWith("tg_auth_") && potentialToken.length() > 8) {
                log.info("Получен токен аутентификации от мобильного приложения: {}", potentialToken);
                handleMobileAuthToken(chatId, userData, potentialToken);
                return;
            }
        }

        // Обычный запуск бота без токена - отправляем приветствие
        sendWelcomeMessage(chatId, userData);
    }

    /**
     * Обработка токена аутентификации от мобильного приложения
     */
    private void handleMobileAuthToken(Long chatId, TelegramUserData userData, String authToken) {
        log.info("Обработка токена аутентификации от мобильного приложения для пользователя: {}", userData.getId());

        try {
            // Сохраняем токен для пользователя
            userAuthTokens.put(userData.getId(), authToken);

            // Создаем/обновляем пользователя в БД
            integrationService.createOrUpdateUser(userData);
            log.info("Пользователь {} создан/обновлен в БД", userData.getId());

            // Отправляем сообщение с запросом контакта
            sendContactRequestMessage(chatId, authToken, userData);

        } catch (Exception e) {
            log.error("Ошибка обработки токена аутентификации для пользователя {}: {}", userData.getId(),
                    e.getMessage());
            sendErrorMessage(chatId, "Ошибка обработки токена: " + e.getMessage());
        }
    }

    /**
     * Отправка сообщения с запросом контакта (с кнопкой отправки телефона)
     */
    private void sendContactRequestMessage(Long chatId, String authToken, TelegramUserData userData) {
        String message = String.format(
                "🍕 *Добро пожаловать в ДИМБО ПИЦЦА!*\n\n" +
                        "Привет, %s!\n\n" +
                        "Для завершения авторизации нажмите кнопку ниже и поделитесь номером телефона:",
                userData.getDisplayName());

        SendMessage sendMessage = new SendMessage();
        sendMessage.setChatId(chatId);
        sendMessage.setText(message);
        sendMessage.setParseMode("Markdown");

        // Создаем обычную клавиатуру с кнопкой отправки контакта
        ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow row = new KeyboardRow();
        KeyboardButton contactButton = new KeyboardButton("📱 Отправить телефон");
        contactButton.setRequestContact(true);
        row.add(contactButton);

        keyboard.add(row);
        keyboardMarkup.setKeyboard(keyboard);
        keyboardMarkup.setResizeKeyboard(true);
        keyboardMarkup.setOneTimeKeyboard(true);

        sendMessage.setReplyMarkup(keyboardMarkup);

        try {
            execute(sendMessage);
            log.info("Сообщение с запросом контакта отправлено пользователю {}", userData.getId());

        } catch (TelegramApiException e) {
            log.error("Ошибка отправки сообщения с запросом контакта: {}", e.getMessage());
        }
    }

    /**
     * Отправка приветственного сообщения (обычный запуск бота)
     */
    private void sendWelcomeMessage(Long chatId, TelegramUserData userData) {
        String message = String.format(
                "🍕 *%s, добро пожаловать в Магия Цветов Волжск!*\n\n" +
                        // "Привет, %s!\n\n" +
                        "Это официальный бот Магия Цветов.\n\n" +
                        "Для заказа букета используйте\n" +
                        "t.me/magiacvetov12_bot\n\n" +
                        //  наше мобильное приложение\n" +
                        // "https://www.rustore.ru/catalog/app/com.magicvetov.app\n\n" +
                        "наш веб-сайт https://magiacvetov12.ru/\n\n" +
                        "или используйте кнопку '🍕 Заказать букет' в меню телеграмма. \n\n",
                        // "Команды:\n" +
                        // "• /help - помощь\n",
                userData.getDisplayName());

        SendMessage sendMessage = new SendMessage();
        sendMessage.setChatId(chatId);
        sendMessage.setText(message);
        sendMessage.setParseMode("Markdown");

        try {
            execute(sendMessage);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки приветственного сообщения: {}", e.getMessage());
        }
    }

    /**
     * Обработка контактного сообщения
     */
    private void handleContactMessage(Message message) {
        Contact contact = message.getContact();
        Long userId = message.getFrom().getId().longValue();
        Long chatId = message.getChatId();

        log.info("Получен контакт от пользователя {}: {}", userId, contact.getPhoneNumber());

        // Получаем токен авторизации для пользователя
        String authToken = userAuthTokens.get(userId);
        if (authToken == null) {
            log.warn("Токен авторизации не найден для пользователя {}", userId);
            sendErrorMessage(chatId, "Токен авторизации не найден. Пожалуйста, начните заново с команды /start");
            return;
        }

        try {
            // Создаем данные пользователя с номером телефона
            TelegramUserData userData = TelegramUserData.builder()
                    .id(userId)
                    .firstName(contact.getFirstName())
                    .lastName(contact.getLastName())
                    .phoneNumber(contact.getPhoneNumber())
                    .build();

            // ИСПРАВЛЕНИЕ: Сначала обновляем пользователя с номером телефона
            integrationService.updateUserWithPhone(userData);
            log.info("Пользователь {} обновлен с номером телефона", userId);

            // ИСПРАВЛЕНИЕ: Обновляем токен в БД с telegramId пользователя
            try {
                // Находим токен в БД и обновляем его с telegramId
                Optional<TelegramAuthToken> tokenOpt = tokenRepository.findByAuthToken(authToken);
                if (tokenOpt.isPresent()) {
                    TelegramAuthToken token = tokenOpt.get();
                    token.setTelegramId(userId);
                    token.setTelegramUsername(message.getFrom().getUserName());
                    token.setTelegramFirstName(contact.getFirstName());
                    token.setTelegramLastName(contact.getLastName());
                    tokenRepository.save(token);
                    log.info("Токен {} обновлен с данными пользователя {}", authToken, userId);
                } else {
                    log.error("Токен {} не найден в БД для обновления", authToken);
                    sendErrorMessage(chatId, "Ошибка обновления токена. Попробуйте заново с команды /start");
                    return;
                }
            } catch (Exception e) {
                log.error("Ошибка обновления токена {} с данными пользователя: {}", authToken, e.getMessage());
                sendErrorMessage(chatId, "Ошибка обновления данных. Попробуйте заново с команды /start");
                return;
            }

            // Используем прямое подтверждение авторизации (без webhook)
            log.info("Подтверждаем авторизацию для токена: {}", authToken);

            try {
                // Подтверждаем авторизацию с данными пользователя
                integrationService.confirmAuth(authToken, userData);

                // Отправляем сообщение об успехе
                removeKeyboard(chatId);
                sendPhoneReceivedMessage(chatId, contact.getPhoneNumber(), userData.getDisplayName());

                log.info("Авторизация успешна для пользователя {}", userId);
            } catch (Exception e) {
                log.error("Ошибка подтверждения авторизации: {}", e.getMessage());
                sendErrorMessage(chatId, "Ошибка завершения авторизации. Попробуйте позже.");
            }

            // Удаляем токен из памяти в любом случае
            userAuthTokens.remove(userId);

        } catch (Exception e) {
            log.error("Ошибка обработки контакта для пользователя {}: {}", userId, e.getMessage());
            sendErrorMessage(chatId, "Произошла ошибка при обработке номера телефона. Попробуйте позже.");
        }
    }

    /**
     * Отправка сообщения об успешном получении номера телефона
     */
    private void sendPhoneReceivedMessage(Long chatId, String phoneNumber, String userName) {
        // Маскируем номер для безопасности
        String maskedPhone = phoneNumber.replaceAll("(\\d{1,3})(\\d{3})(\\d{3})(\\d+)", "$1***$2***$4");

        String message = String.format(
                "✅ *Номер телефона получен!*\n\n" +
                        "Спасибо, %s!\n\n" +
                        "Ваш номер: %s\n\n" +
                        "Теперь можете вернуться в приложение для завершения авторизации.",
                userName, maskedPhone);

        SendMessage sendMessage = new SendMessage();
        sendMessage.setChatId(chatId);
        sendMessage.setText(message);
        sendMessage.setParseMode("Markdown");

        try {
            execute(sendMessage);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки сообщения о получении номера: {}", e.getMessage());
        }
    }

    /**
     * Удаление клавиатуры
     */
    private void removeKeyboard(Long chatId) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText("🔄 Обработка...");

        ReplyKeyboardRemove keyboardRemove = new ReplyKeyboardRemove();
        keyboardRemove.setRemoveKeyboard(true);
        message.setReplyMarkup(keyboardRemove);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Ошибка удаления клавиатуры: {}", e.getMessage());
        }
    }

    /**
     * Отправка сообщения об успешной автоматической авторизации
     */
    private void sendAutoAuthSuccessMessage(Long chatId, TelegramUserData user) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        // message.setText(String.format(
        // "✅ *Авторизация завершена!*\n\n" +
        // "Добро пожаловать, %s!\n" +
        // "Теперь вы можете пользоваться всеми функциями MagicCvetov.\n\n" +
        // "🍕 Приятного аппетита!",
        // user.getDisplayName()));
        message.setParseMode("Markdown");

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки сообщения об успешной авторизации: {}", e.getMessage());
        }
    }

    /**
     * Обработка команды /help
     */
    private void handleHelpCommand(Long chatId) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(
                "🤖 *Помощь по боту MagicCvetov*\n\n" +
                        "Доступные команды:\n" +
                        "/start - Начать работу с ботом\n" +
                        "/help - Показать эту справку\n" +
                        "/menu - Показать меню\n\n" +
                        "Для авторизации используйте команду /start и следуйте инструкциям.");
        message.setParseMode("Markdown");

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки справки: {}", e.getMessage());
        }
    }

        /**
     * Обработка команды /menu
     */
    private void handleMenuCommand(Long chatId) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText("🍕 *Добро пожаловать в DIMBO Pizza!*\n\n" +
                "Откройте наше меню для заказа 🚀\n\n" +
                "_Для лучшего опыта используйте мобильную версию Telegram_");
        message.setParseMode("Markdown");

        // Создаем кнопки для меню и заказа
        InlineKeyboardMarkup keyboard = new InlineKeyboardMarkup();
        
        // Кнопка меню
        InlineKeyboardButton menuButton = InlineKeyboardButton.builder()
                .text("🍕 Открыть меню")
                .url("https://api.dimbopizza.ru/miniapp/menu")
                .build();
                
        // Кнопка заказа (главная для кросс-платформенной авторизации)
        InlineKeyboardButton orderButton = InlineKeyboardButton.builder()
                .text("🛒 Заказать")
                .url("https://api.dimbopizza.ru/miniapp/checkout.html")
                .build();

        keyboard.setKeyboard(List.of(
            List.of(orderButton),  // Первая строка - главная кнопка "Заказать"
            List.of(menuButton)    // Вторая строка - кнопка "Открыть меню"
        ));
        message.setReplyMarkup(keyboard);

        try {
            execute(message);
            log.info("Отправлено меню с URL кнопкой для чата: {}", chatId);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки меню: {}", e.getMessage());
        }
    }

    /**
     * Обработка неизвестных команд
     */
    private void handleUnknownCommand(Long chatId) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(
                "❓ Неизвестная команда.\n\n" +
                        "Используйте /help для просмотра доступных команд.");

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки сообщения о неизвестной команде: {}", e.getMessage());
        }
    }

    /**
     * Отправка сообщения об ошибке
     */
    private void sendErrorMessage(Long chatId, String errorText) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText("❌ " + errorText);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            log.error("Ошибка отправки сообщения об ошибке: {}", e.getMessage());
        }
    }
}