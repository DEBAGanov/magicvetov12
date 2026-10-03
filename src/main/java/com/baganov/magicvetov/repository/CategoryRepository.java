package com.baganov.magicvetov.repository;

import com.baganov.magicvetov.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    Optional<Category> findByName(String name);

    /**
     * Все категории для админки, включая отключённые.
     *
     * Витринный findAllByIsActiveTrue... отключённые не отдаёт — админ не смог
     * бы найти скрытую категорию, чтобы вернуть её.
     */
    List<Category> findAllByOrderByDisplayOrderAsc();

    boolean existsByName(String name);

    /** Наибольший порядок — чтобы новая категория встала в конец списка. */
    @Query("SELECT COALESCE(MAX(c.displayOrder), 0) FROM Category c")
    Integer findMaxDisplayOrder();
}