/**
 * @file: TelegramRateLimitService.java
 * @description: Сервис для управления лимитами отправки сообщений в Telegram
 * @dependencies: TelegramRateLimitConfig, Spring Scheduling
 * @created: 2025-01-15
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.config.TelegramRateLimitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramRateLimitService {

    private final TelegramRateLimitConfig rateLimitConfig;
    
    // Счетчики для отслеживания лимитов
    private final AtomicInteger messagesThisSecond = new AtomicInteger(0);
    private final AtomicInteger messagesThisMinute = new AtomicInteger(0);
    private final AtomicLong lastSecondReset = new AtomicLong(System.currentTimeMillis());
    private final AtomicLong lastMinuteReset = new AtomicLong(System.currentTimeMillis());
    
    // Отслеживание статуса рассылок
    private final ConcurrentHashMap<String, BroadcastProgress> activeBroadcasts = new ConcurrentHashMap<>();

    /**
     * Проверяет, можно ли отправить сообщение сейчас
     */
    public boolean canSendMessage() {
        resetCountersIfNeeded();
        
        return messagesThisSecond.get() < rateLimitConfig.getMessagesPerSecond() &&
               messagesThisMinute.get() < rateLimitConfig.getMessagesPerMinute();
    }

    /**
     * Регистрирует отправку сообщения
     */
    public void registerMessageSent() {
        resetCountersIfNeeded();
        messagesThisSecond.incrementAndGet();
        messagesThisMinute.incrementAndGet();
    }

    /**
     * Получает рекомендуемую задержку перед следующей отправкой
     */
    public long getRecommendedDelay() {
        if (canSendMessage()) {
            return rateLimitConfig.getDelayBetweenMessages();
        }
        
        // Если достигнут лимит в секунду, ждем до следующей секунды
        if (messagesThisSecond.get() >= rateLimitConfig.getMessagesPerSecond()) {
            long timeSinceLastReset = System.currentTimeMillis() - lastSecondReset.get();
            return Math.max(1000 - timeSinceLastReset, 0) + rateLimitConfig.getDelayBetweenMessages();
        }
        
        // Если достигнут лимит в минуту, ждем до следующей минуты
        if (messagesThisMinute.get() >= rateLimitConfig.getMessagesPerMinute()) {
            long timeSinceLastReset = System.currentTimeMillis() - lastMinuteReset.get();
            return Math.max(60000 - timeSinceLastReset, 0);
        }
        
        return rateLimitConfig.getDelayBetweenMessages();
    }

    /**
     * Создает новую рассылку и возвращает ID для отслеживания
     */
    public String createBroadcast(int totalUsers) {
        String broadcastId = "broadcast_" + System.currentTimeMillis();
        BroadcastProgress progress = new BroadcastProgress(totalUsers);
        activeBroadcasts.put(broadcastId, progress);
        
        log.info("📢 Создана новая рассылка {}: {} пользователей", broadcastId, totalUsers);
        return broadcastId;
    }

    /**
     * Обновляет прогресс рассылки
     */
    public void updateBroadcastProgress(String broadcastId, boolean success) {
        BroadcastProgress progress = activeBroadcasts.get(broadcastId);
        if (progress != null) {
            if (success) {
                progress.incrementSuccess();
            } else {
                progress.incrementFailure();
            }
            
            if (rateLimitConfig.isEnableDetailedLogging()) {
                log.debug("📊 Рассылка {}: успешно={}, ошибок={}, всего={}", 
                    broadcastId, progress.getSuccessCount(), progress.getFailureCount(), progress.getTotalUsers());
            }
        }
    }

    /**
     * Завершает рассылку и возвращает финальную статистику
     */
    public BroadcastProgress finalizeBroadcast(String broadcastId) {
        BroadcastProgress progress = activeBroadcasts.remove(broadcastId);
        if (progress != null) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());
            
            log.info("✅ Рассылка {} завершена: успешно={}, ошибок={}, время={}мин", 
                broadcastId, 
                progress.getSuccessCount(), 
                progress.getFailureCount(),
                ChronoUnit.MINUTES.between(progress.getStartedAt(), progress.getCompletedAt()));
        }
        return progress;
    }

    /**
     * Получает текущий прогресс рассылки
     */
    public BroadcastProgress getBroadcastProgress(String broadcastId) {
        return activeBroadcasts.get(broadcastId);
    }

    /**
     * Сбрасывает счетчики если прошло достаточно времени
     */
    private void resetCountersIfNeeded() {
        long currentTime = System.currentTimeMillis();
        
        // Сброс счетчика секунд
        if (currentTime - lastSecondReset.get() >= 1000) {
            messagesThisSecond.set(0);
            lastSecondReset.set(currentTime);
        }
        
        // Сброс счетчика минут
        if (currentTime - lastMinuteReset.get() >= 60000) {
            messagesThisMinute.set(0);
            lastMinuteReset.set(currentTime);
        }
    }

    /**
     * Класс для отслеживания прогресса рассылки
     */
    public static class BroadcastProgress {
        private final int totalUsers;
        private final AtomicInteger successCount = new AtomicInteger(0);
        private final AtomicInteger failureCount = new AtomicInteger(0);
        private final LocalDateTime startedAt = LocalDateTime.now();
        private LocalDateTime completedAt;
        private boolean completed = false;

        public BroadcastProgress(int totalUsers) {
            this.totalUsers = totalUsers;
        }

        public void incrementSuccess() {
            successCount.incrementAndGet();
        }

        public void incrementFailure() {
            failureCount.incrementAndGet();
        }

        // Getters and setters
        public int getTotalUsers() { return totalUsers; }
        public int getSuccessCount() { return successCount.get(); }
        public int getFailureCount() { return failureCount.get(); }
        public int getProcessedCount() { return successCount.get() + failureCount.get(); }
        public LocalDateTime getStartedAt() { return startedAt; }
        public LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }
    }
}
