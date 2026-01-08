CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    public_id TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

-- Ensure only one primary image per product
CREATE UNIQUE INDEX one_primary_image_per_product
ON product_images(product_id)
WHERE is_primary = TRUE;
