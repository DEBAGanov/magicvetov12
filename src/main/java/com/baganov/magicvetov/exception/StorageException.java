/**
 * @file: StorageException.java
 * @description: Ошибка работы с объектным хранилищем (S3/MinIO).
 *
 * Отдельный тип нужен, чтобы отличать сбой хранилища от ошибки валидации
 * запроса: первое — это 503 (наша инфраструктура недоступна, имеет смысл
 * повторить), второе — 400 (виноват запрос). Раньше и то и другое улетало
 * как RuntimeException и превращалось в 500.
 *
 * @created: 2026-09-30
 */
package com.baganov.magicvetov.exception;

public class StorageException extends RuntimeException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public StorageException(String message) {
        super(message);
    }
}
