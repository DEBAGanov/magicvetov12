/**
 * @file: InvalidImageException.java
 * @description: Загружаемый файл не прошёл проверку (формат, размер, сигнатура).
 *
 * Это ошибка запроса, а не сбой сервера: отвечаем 400 с понятным админу
 * текстом, который можно показать прямо в форме («Содержимое файла не
 * соответствует формату»). Отличается от StorageException, который означает
 * недоступность самого хранилища.
 *
 * @created: 2026-09-30
 */
package com.baganov.magicvetov.exception;

public class InvalidImageException extends RuntimeException {

    public InvalidImageException(String message) {
        super(message);
    }
}
