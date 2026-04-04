/**
 * @file: TimeZoneConfig.java
 * @description: Конфигурация временной зоны для приложения
 * @dependencies: Spring Boot, TimeZoneUtils
 * @created: 2025-06-23
 */
package com.baganov.magicvetov.config;

import com.baganov.magicvetov.util.TimeZoneUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

/**
 * Конфигурация временной зоны для всего приложения.
 * Устанавливает московскую временную зону как системную по умолчанию.
 */
@Slf4j
@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // Устанавливаем московскую временную зону как системную по умолчанию
        TimeZone.setDefault(TimeZone.getTimeZone(TimeZoneUtils.MOSCOW_ZONE));

        log.info("🕐 Временная зона приложения установлена: Europe/Moscow");
        log.info("🕐 Системная временная зона: {}", TimeZone.getDefault().getID());

        // Логируем информацию о временных зонах для диагностики
        TimeZoneUtils.logTimeZoneInfo();
    }
}