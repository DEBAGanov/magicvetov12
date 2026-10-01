/**
 * @file: ImageUploadServiceTest.java
 * @description: Проверка приёма и обработки загружаемых изображений.
 *
 * Это матрица из docs/ADMIN_PANEL_PLAN.md §4, переведённая в тест. Проверять
 * руками через curl неудобно и легко забыть: главное здесь — что переименованный
 * .exe и SVG со скриптом НЕ попадают в бакет, а такая регрессия снаружи не
 * видна (форма работает, файл «загрузился»).
 *
 * StorageService замокан: проверяем решение о приёме и результат обработки,
 * а не саму отправку в S3.
 */
package com.baganov.magicvetov.service;

import com.baganov.magicvetov.exception.InvalidImageException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ImageUploadServiceTest {

    private static final long MAX_SIZE = 5L * 1024 * 1024;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ImageUploadService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        // @Value не применяется вне контекста Spring — задаём лимит вручную.
        ReflectionTestUtils.setField(service, "maxFileSizeBytes", MAX_SIZE);
    }

    // ---------- Что принимаем ----------

    @ParameterizedTest(name = "настоящий {0} принимается")
    @ValueSource(strings = {"jpg", "png"})
    @DisplayName("Настоящее изображение загружается, ключ лежит в products/")
    void acceptsRealImage(String format) throws IOException {
        var file = new MockMultipartFile(
                "file", "buket." + format, "image/" + format, image(800, 600, format));

        String objectName = service.uploadProductImage(file);

        assertThat(objectName)
                .startsWith(ImageUploadService.PRODUCTS_PREFIX + "/")
                .endsWith(".jpg");
        verify(storageService).uploadFile(any(InputStream.class), anyString(), anyString(), anyLong());
    }

    @Test
    @DisplayName("Большая фотография сжимается до 1600 px по длинной стороне")
    void resizesLargePhoto() throws IOException {
        // Типичное фото с телефона: 4000x3000.
        var file = new MockMultipartFile("file", "foto.jpg", "image/jpeg", image(4000, 3000, "jpg"));

        service.uploadProductImage(file);

        BufferedImage stored = readStoredImage();
        assertThat(stored.getWidth()).isEqualTo(1600);
        assertThat(stored.getHeight()).isEqualTo(1200); // пропорции сохранены
    }

    @Test
    @DisplayName("Маленькая картинка не растягивается")
    void doesNotUpscaleSmallImage() throws IOException {
        var file = new MockMultipartFile("file", "small.jpg", "image/jpeg", image(500, 400, "jpg"));

        service.uploadProductImage(file);

        BufferedImage stored = readStoredImage();
        assertThat(stored.getWidth()).isEqualTo(500);
        assertThat(stored.getHeight()).isEqualTo(400);
    }

    @Test
    @DisplayName("PNG с прозрачностью не чернеет: подкладывается белый фон")
    void flattensTransparencyToWhite() throws IOException {
        BufferedImage transparent = new BufferedImage(200, 200, BufferedImage.TYPE_INT_ARGB);
        // Полностью прозрачное изображение: без подложки станет чёрным.
        var out = new ByteArrayOutputStream();
        ImageIO.write(transparent, "png", out);
        var file = new MockMultipartFile("file", "logo.png", "image/png", out.toByteArray());

        service.uploadProductImage(file);

        BufferedImage stored = readStoredImage();
        Color corner = new Color(stored.getRGB(0, 0));
        assertThat(corner).isEqualTo(Color.WHITE);
    }

    // ---------- Что отклоняем ----------

    @Test
    @DisplayName("EXE, переименованный в .png, отклоняется по сигнатуре")
    void rejectsExeRenamedToPng() {
        // MZ-заголовок исполняемого файла Windows. Расширение и Content-Type
        // присылает клиент, поэтому верить можно только байтам.
        byte[] exe = new byte[64];
        exe[0] = 'M';
        exe[1] = 'Z';
        var file = new MockMultipartFile("file", "virus.png", "image/png", exe);

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("не соответствует формату");

        verifyNothingUploaded();
    }

    @Test
    @DisplayName("SVG со <script> отклоняется: SVG не принимаем вовсе")
    void rejectsSvg() {
        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"
                .getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var file = new MockMultipartFile("file", "xss.svg", "image/svg+xml", svg);

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Недопустимый формат");

        verifyNothingUploaded();
    }

    @Test
    @DisplayName("Файл с расширением .exe отклоняется до чтения байтов")
    void rejectsExeExtension() {
        var file = new MockMultipartFile("file", "setup.exe", "application/octet-stream", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("Недопустимый формат");

        verifyNothingUploaded();
    }

    @Test
    @DisplayName("Файл больше лимита отклоняется")
    void rejectsOversizedFile() {
        byte[] big = new byte[(int) MAX_SIZE + 1];
        var file = new MockMultipartFile("file", "huge.jpg", "image/jpeg", big);

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("больше 5 МБ");

        verifyNothingUploaded();
    }

    @Test
    @DisplayName("Пустой файл отклоняется")
    void rejectsEmptyFile() {
        var file = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class);

        verifyNothingUploaded();
    }

    @Test
    @DisplayName("Картинка с верным расширением, но битым содержимым отклоняется")
    void rejectsTruncatedImage() {
        // Начало PNG есть, дальше мусор: сигнатура пройдёт, декодирование нет.
        byte[] truncated = new byte[]{
                (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 1, 2, 3};
        var file = new MockMultipartFile("file", "broken.png", "image/png", truncated);

        assertThatThrownBy(() -> service.uploadProductImage(file))
                .isInstanceOf(InvalidImageException.class);

        verifyNothingUploaded();
    }

    // ---------- Вспомогательное ----------

    /** Перехватывает отправленный в S3 поток и декодирует его обратно. */
    private BufferedImage readStoredImage() throws IOException {
        var captor = ArgumentCaptor.forClass(InputStream.class);
        verify(storageService).uploadFile(captor.capture(), anyString(), anyString(), anyLong());
        BufferedImage stored = ImageIO.read(captor.getValue());
        assertThat(stored).as("сохранённый файл должен быть читаемым изображением").isNotNull();
        return stored;
    }

    private void verifyNothingUploaded() {
        verify(storageService, never())
                .uploadFile(any(InputStream.class), anyString(), anyString(), anyLong());
    }

    private byte[] image(int width, int height, String format) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var g = img.createGraphics();
        g.setColor(new Color(220, 80, 120));
        g.fillRect(0, 0, width, height);
        g.dispose();

        var out = new ByteArrayOutputStream();
        ImageIO.write(img, format, out);
        return out.toByteArray();
    }
}
