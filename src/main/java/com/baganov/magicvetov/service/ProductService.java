package com.baganov.magicvetov.service;

import com.baganov.magicvetov.dto.ProductDto;
import com.baganov.magicvetov.entity.Product;
import com.baganov.magicvetov.mapper.ProductMapper;
import com.baganov.magicvetov.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    // createProduct убран вместе с POST /api/v1/products (см. ProductController).
    //
    // Заодно это выводит из использования S3Service (дефект 3.8 плана): в
    // проекте было два хранилища параллельно — StorageService (MinIO SDK,
    // ключ prefix/uuid.ext, возвращает objectName) и S3Service (AWS SDK,
    // ключ folder/uuid_имя, возвращает полный URL). Из-за второго в БД
    // попадали абсолютные URL, а админка работает с относительными ключами.
    // Остаётся один StorageService.

    @Cacheable(value = "products", key = "'product:' + #id")
    public ProductDto getProductById(Integer id) {
        Product product = productRepository.findByIdWithImages(id)
                .orElseThrow(() -> new IllegalArgumentException("Продукт не найден с ID: " + id));
        return productMapper.toDto(product);
    }

    public Page<ProductDto> getAllProducts(Pageable pageable) {
        return productRepository.findAllByIsAvailableTrue(pageable)
                .map(productMapper::toDto);
    }

    public Page<ProductDto> getProductsByCategory(Integer categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable)
                .map(productMapper::toDto);
    }

    @Cacheable(value = "products", key = "'products:special'")
    public List<ProductDto> getSpecialOffers() {
        return productRepository.findByIsSpecialOfferTrue()
                .stream()
                .map(productMapper::toDto)
                .toList();
    }

    public Page<ProductDto> searchProducts(String query, Integer categoryId, Pageable pageable) {
        if (categoryId != null) {
            return productRepository.findByCategoryIdAndNameContainingIgnoreCase(categoryId, query, pageable)
                    .map(productMapper::toDto);
        }
        return productRepository.findByNameContainingIgnoreCase(query, pageable)
                .map(productMapper::toDto);
    }
}