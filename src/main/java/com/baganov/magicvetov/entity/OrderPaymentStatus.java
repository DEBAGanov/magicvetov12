package com.baganov.magicvetov.entity;

/**
 * Статусы оплаты заказа
 */
public enum OrderPaymentStatus {
    /**
     * Ожидает оплаты (по умолчанию)
     */
    UNPAID,
    
    /**
     * Оплачен
     */
    PAID,
    
    /**
     * Оплата отменена
     */
    CANCELLED,
    
    /**
     * Оплата не удалась
     */
    FAILED
} 