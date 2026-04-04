/**
 * @file: ScheduledNotificationService.java
 * @description: Сервис для планирования и отправки отложенных уведомлений (реферальные сообщения, напоминания)
 * @dependencies: ScheduledNotificationRepository, TelegramUserNotificationService, Order, User
 * @created: 2025-06-13
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.entity.Order;
import com.baganov.magicvetov.entity.ScheduledNotification;
import com.baganov.magicvetov.entity.ScheduledNotification.NotificationStatus;
import com.baganov.magicvetov.entity.ScheduledNotification.NotificationType;
import com.baganov.magicvetov.entity.User;
import com.baganov.magicvetov.repository.ScheduledNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Сервис для управления отложенными уведомлениями.
 * Следует принципам SOLID - Single Responsibility и Dependency Inversion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledNotificationService {

    private final ScheduledNotificationRepository scheduledNotificationRepository;
    private final TelegramUserNotificationService telegramUserNotificationService;

    @Value("${app.url:https://t.me/DIMBOpizzaBot/menu}")
    private String appUrl;

    @Value("${app.referral.delay.hours:1}")
    private int referralDelayHours;

    /**
     * Планирование реферального уведомления после доставки заказа
     *
     * @param order доставленный заказ
     */
    @Transactional
    public void scheduleReferralReminder(Order order) {
        // Проверяем, что у пользователя есть Telegram ID
        if (order.getUser() == null || order.getUser().getTelegramId() == null) {
            log.debug("Пропускаем планирование реферального уведомления для заказа #{} - нет Telegram ID",
                    order.getId());
            return;
        }

        // Проверяем, что уведомление еще не запланировано
        Optional<ScheduledNotification> existing = scheduledNotificationRepository
                .findByOrderIdAndNotificationType(order.getId(), NotificationType.REFERRAL_REMINDER);

        if (existing.isPresent()) {
            log.debug("Реферальное уведомление для заказа #{} уже запланировано", order.getId());
            return;
        }

        // Создаем сообщение
        String message = createReferralMessage(order);

        // Планируем отправку через указанное количество часов
        LocalDateTime scheduledAt = LocalDateTime.now().plusHours(referralDelayHours);

        ScheduledNotification notification = ScheduledNotification.builder()
                .order(order)
                .user(order.getUser())
                .telegramId(order.getUser().getTelegramId())
                .notificationType(NotificationType.REFERRAL_REMINDER)
                .message(message)
                .scheduledAt(scheduledAt)
                .status(NotificationStatus.PENDING)
                .build();

        scheduledNotificationRepository.save(notification);

        log.info("Запланировано реферальное уведомление для заказа #{} пользователю {} на {}",
                order.getId(), order.getUser().getUsername(), scheduledAt);
    }

    /**
     * Создание текста реферального сообщения
     *
     * @param order заказ
     * @return текст сообщения
     */
    private String createReferralMessage(Order order) {
        return String.format(
                "🍕 <b>Спасибо за заказ в ДИМБО ПИЦЦА!</b>\n\n" +
                        "Надеемся, вам понравилась наша пицца! 😊\n\n" +
                        "Если вам понравилось, отправьте пожалуйста друзьям ссылку на наше приложение:\n" +
                        "👉 <a href=\"%s\">%s</a>\n\n" +
                        "Спасибо большое! ❤️\n\n" +
                        "<i>Команда DIMBO PIZZA</i>",
                appUrl, appUrl);
    }

    /**
     * Планировщик для отправки готовых уведомлений
     * Запускается каждые 5 минут
     */
    @Scheduled(fixedRate = 300000) // 5 минут = 300,000 мс
    @Transactional
    public void processScheduledNotifications() {
        LocalDateTime now = LocalDateTime.now();

        // Получаем уведомления готовые к отправке
        List<ScheduledNotification> readyNotifications = scheduledNotificationRepository.findReadyToSend(now,
                NotificationStatus.PENDING);

        if (readyNotifications.isEmpty()) {
            log.debug("Нет уведомлений готовых к отправке");
            return;
        }

        log.info("Найдено {} уведомлений готовых к отправке", readyNotifications.size());

        for (ScheduledNotification notification : readyNotifications) {
            processNotification(notification);
        }

        // Обрабатываем неудачные уведомления для повтора
        List<ScheduledNotification> failedNotifications = scheduledNotificationRepository.findFailedForRetry(now,
                NotificationStatus.FAILED);

        if (!failedNotifications.isEmpty()) {
            log.info("Найдено {} неудачных уведомлений для повтора", failedNotifications.size());

            for (ScheduledNotification notification : failedNotifications) {
                processNotification(notification);
            }
        }
    }

    /**
     * Обработка отдельного уведомления
     *
     * @param notification уведомление для обработки
     */
    @Async
    @Transactional
    public void processNotification(ScheduledNotification notification) {
        try {
            log.debug("Обрабатываем уведомление #{} типа {} для пользователя {}",
                    notification.getId(), notification.getNotificationType(),
                    notification.getUser() != null ? notification.getUser().getUsername() : "unknown");

            // Отправляем уведомление в зависимости от типа
            boolean sent = sendNotification(notification);

            if (sent) {
                notification.markAsSent();
                log.info("Уведомление #{} успешно отправлено", notification.getId());
            } else {
                notification.markAsFailed("Не удалось отправить уведомление");
                log.warn("Не удалось отправить уведомление #{}", notification.getId());
            }

        } catch (Exception e) {
            notification.markAsFailed("Ошибка: " + e.getMessage());
            log.error("Ошибка при отправке уведомления #{}: {}", notification.getId(), e.getMessage(), e);
        } finally {
            scheduledNotificationRepository.save(notification);
        }
    }

    /**
     * Отправка уведомления в зависимости от типа
     *
     * @param notification уведомление
     * @return true если отправлено успешно
     */
    private boolean sendNotification(ScheduledNotification notification) {
        try {
            switch (notification.getNotificationType()) {
                case REFERRAL_REMINDER:
                    return sendReferralReminder(notification);
                case ORDER_FEEDBACK:
                    return sendOrderFeedback(notification);
                case LOYALTY_REMINDER:
                    return sendLoyaltyReminder(notification);
                case SPECIAL_OFFER:
                    return sendSpecialOffer(notification);
                default:
                    log.warn("Неизвестный тип уведомления: {}", notification.getNotificationType());
                    return false;
            }
        } catch (Exception e) {
            log.error("Ошибка отправки уведомления #{}: {}", notification.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Отправка реферального напоминания
     */
    private boolean sendReferralReminder(ScheduledNotification notification) {
        if (notification.getTelegramId() == null) {
            log.warn("Нет Telegram ID для отправки реферального уведомления #{}", notification.getId());
            return false;
        }

        try {
            telegramUserNotificationService.sendPersonalMessage(
                    notification.getTelegramId(),
                    notification.getMessage());
            return true;
        } catch (Exception e) {
            log.error("Ошибка отправки реферального уведомления #{}: {}", notification.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Отправка запроса обратной связи
     */
    private boolean sendOrderFeedback(ScheduledNotification notification) {
        // Пока просто логируем, в будущем можно добавить реальную отправку
        log.info("Отправка запроса обратной связи для уведомления #{}", notification.getId());
        return true;
    }

    /**
     * Отправка напоминания о программе лояльности
     */
    private boolean sendLoyaltyReminder(ScheduledNotification notification) {
        // Пока просто логируем, в будущем можно добавить реальную отправку
        log.info("Отправка напоминания о программе лояльности для уведомления #{}", notification.getId());
        return true;
    }

    /**
     * Отправка специального предложения
     */
    private boolean sendSpecialOffer(ScheduledNotification notification) {
        // Пока просто логируем, в будущем можно добавить реальную отправку
        log.info("Отправка специального предложения для уведомления #{}", notification.getId());
        return true;
    }

    /**
     * Отмена всех ожидающих уведомлений для заказа
     *
     * @param orderId ID заказа
     */
    @Transactional
    public void cancelNotificationsForOrder(Integer orderId) {
        scheduledNotificationRepository.cancelPendingNotificationsByOrderId(orderId, LocalDateTime.now(),
                NotificationStatus.CANCELLED, NotificationStatus.PENDING);
        log.info("Отменены все ожидающие уведомления для заказа #{}", orderId);
    }

    /**
     * Очистка старых уведомлений (запускается каждый день в 3:00)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30); // Удаляем уведомления старше 30 дней

        try {
            // Удаляем старые отправленные уведомления
            scheduledNotificationRepository.deleteOldSentNotifications(cutoff, NotificationStatus.SENT);

            // Удаляем старые неудачные уведомления
            scheduledNotificationRepository.deleteOldFailedNotifications(cutoff, NotificationStatus.FAILED);

            log.info("Очистка старых уведомлений завершена");
        } catch (Exception e) {
            log.error("Ошибка при очистке старых уведомлений: {}", e.getMessage(), e);
        }
    }

    /**
     * Получение статистики по уведомлениям
     *
     * @param from начало периода
     * @param to   конец периода
     * @return статистика
     */
    public List<Object[]> getStatistics(LocalDateTime from, LocalDateTime to) {
        return scheduledNotificationRepository.getStatistics(from, to);
    }

    /**
     * Получение количества уведомлений по типу и статусу
     *
     * @param type   тип уведомления
     * @param status статус уведомления
     * @return количество уведомлений
     */
    public long getNotificationCount(NotificationType type, NotificationStatus status) {
        return scheduledNotificationRepository.countByNotificationTypeAndStatus(type, status);
    }
}