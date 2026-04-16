/**
 * @file: TelegramAdminNotificationService.java
 * @description: Интерфейс для отправки уведомлений администраторам
 * @dependencies: Telegram API
 * @created: 2025-01-13
 */
package com.baganov.magicvetov.service;

import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;

public interface TelegramAdminNotificationService {

    /**
     * Отправка сообщения с кнопками
     */
    void sendMessageWithButtons(Long chatId, String message, InlineKeyboardMarkup keyboard);

    /**
     * Отправка простого сообщения
     */
    void sendMessage(Long chatId, String message, boolean parseMarkdown);

    /**
     * Отправка фото с подписью
     */
    void sendPhoto(Long chatId, String photoUrl, String caption);

    /**
     * Создание клавиатуры для управления заказом
     */
    InlineKeyboardMarkup createOrderManagementKeyboard(Long orderId);
}