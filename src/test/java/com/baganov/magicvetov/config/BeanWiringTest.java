/**
 * @file: BeanWiringTest.java
 * @description: Проверка, что зависимости на УСЛОВНЫЕ бины не обязательны.
 *
 * Почему этот тест существует. 2026-10-03 прод не поднялся:
 *
 *   APPLICATION FAILED TO START
 *   No qualifying bean of type 'com.baganov.magicvetov.util.ImageUploader'
 *   Parameter 2 of constructor in InitService required a bean of type
 *   'ImageUploader' that could not be found.
 *
 * Причина: ImageUploader получил @ConditionalOnProperty и по умолчанию больше
 * не создаётся, а InitService требовал его обязательным параметром
 * конструктора. Компиляция такое не ловит — класс на месте, типы совпадают;
 * ломается только сборка контекста при запуске.
 *
 * Тест проверяет именно это свойство статически, без поднятия Spring: у всех
 * условных бинов не должно быть обязательных инъекций. Полноценный
 * @SpringBootTest здесь не годится — он требует Postgres, Redis, S3 и токены
 * ботов, которых в тестовой среде нет.
 */
package com.baganov.magicvetov.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class BeanWiringTest {

    private static final Path SOURCE_ROOT = Path.of("src/main/java");

    /** Поля вида `private final <Тип> имя;` — обязательные инъекции Lombok. */
    private static final Pattern FINAL_FIELD =
            Pattern.compile("private\\s+final\\s+([A-Za-z0-9_.<>,\\s]+?)\\s+\\w+\\s*;");

    @Test
    @DisplayName("Условные бины не внедряются как обязательные зависимости")
    void conditionalBeansAreNotRequiredDependencies() throws IOException {
        List<String> conditionalTypes = findConditionalBeanTypes();
        // Если список пуст, тест ничего не проверяет — значит, он сломан.
        assertThat(conditionalTypes)
                .as("не найдено ни одного @ConditionalOnProperty — проверьте путь к исходникам")
                .isNotEmpty();

        List<String> violations = new ArrayList<>();

        for (Path file : javaFiles()) {
            String source = Files.readString(file);
            String fileName = file.getFileName().toString();
            String ownType = fileName.replace(".java", "");

            Matcher matcher = FINAL_FIELD.matcher(source);
            while (matcher.find()) {
                String declaredType = matcher.group(1).trim();

                // ObjectProvider<X> / Optional<X> — как раз правильный способ
                // зависеть от условного бина, их пропускаем.
                if (declaredType.startsWith("ObjectProvider")
                        || declaredType.startsWith("Optional")
                        || declaredType.startsWith("List")
                        || declaredType.startsWith("Map")) {
                    continue;
                }

                // Сам условный бин может иметь обязательные зависимости —
                // проверяем только тех, КТО на него ссылается.
                if (conditionalTypes.contains(ownType)) {
                    continue;
                }

                if (conditionalTypes.contains(declaredType)) {
                    violations.add(String.format(
                            "%s требует условный бин %s обязательным — используйте ObjectProvider<%s>",
                            ownType, declaredType, declaredType));
                }
            }
        }

        assertThat(violations)
                .as("обязательная зависимость на условный бин не даст контексту подняться, "
                        + "когда бин отключён (так прод упал 2026-10-03)")
                .isEmpty();
    }

    /** Имена классов, помеченных @ConditionalOnProperty. */
    private List<String> findConditionalBeanTypes() throws IOException {
        List<String> types = new ArrayList<>();
        for (Path file : javaFiles()) {
            String source = Files.readString(file);
            if (!source.contains("@ConditionalOnProperty")) {
                continue;
            }
            // Аннотация может стоять и на @Bean-методе внутри @Configuration;
            // нас интересует случай, когда помечен сам класс.
            String name = file.getFileName().toString().replace(".java", "");
            int annotationAt = source.indexOf("@ConditionalOnProperty");
            int classAt = source.indexOf("class " + name);
            if (classAt > annotationAt) {
                types.add(name);
            }
        }
        return types;
    }

    private List<Path> javaFiles() throws IOException {
        try (Stream<Path> paths = Files.walk(SOURCE_ROOT)) {
            return paths.filter(p -> p.toString().endsWith(".java")).toList();
        }
    }
}
