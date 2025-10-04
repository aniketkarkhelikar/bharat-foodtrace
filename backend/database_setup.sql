-- Bharat FoodTrace PostgreSQL Database Setup
-- Version: 1.0
-- This script will create all necessary tables and relationships for the application.

-- Drop tables in reverse order of dependency to ensure a clean setup
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS product_recalls;
DROP TABLE IF EXISTS traceability_log;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS manufacturers;
DROP TABLE IF EXISTS consumers;
DROP TABLE IF EXISTS fpos;
DROP TABLE IF EXISTS farmers;

-- Table for Farmers
-- Stores basic information about individual farmers.
CREATE TABLE farmers (
    farmer_id VARCHAR(255) PRIMARY KEY,
    fpo_id VARCHAR(255) NOT NULL,
    farmer_name VARCHAR(255) NOT NULL,
    agristack_id VARCHAR(255) UNIQUE, -- For future integration with India's AgriStack
    phone_number VARCHAR(20),
    village VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Farmer Producer Organizations (FPOs)
-- Manages FPOs, which act as aggregators for farmers.
CREATE TABLE fpos (
    fpo_id VARCHAR(255) PRIMARY KEY,
    fpo_name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Consumers (End Users)
-- Stores consumer login details and their Swasth Wallet profile as JSON.
CREATE TABLE consumers (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    profile_json TEXT, -- Stores the SwasthWallet Pydantic model as a JSON string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Manufacturers / Food Business Operators (FBOs)
-- Stores manufacturer login details and company information.
CREATE TABLE manufacturers (
    id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    fssai_license VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Products
-- This is the central table for all food products in the system.
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY, -- GS1 GTIN for finished products
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT,
    sub_category TEXT,
    image_url TEXT,
    ingredients TEXT,
    -- Nutritional Information
    sodium INTEGER,
    sugar INTEGER,
    calories_per_100g INTEGER,
    protein_g REAL,
    carbs_g REAL,
    fat_g REAL,
    fiber_g REAL,
    -- Allergen Information
    contains_peanuts BOOLEAN DEFAULT FALSE,
    contains_tree_nuts BOOLEAN DEFAULT FALSE,
    contains_milk BOOLEAN DEFAULT FALSE,
    contains_eggs BOOLEAN DEFAULT FALSE,
    contains_fish BOOLEAN DEFAULT FALSE,
    contains_shellfish BOOLEAN DEFAULT FALSE,
    contains_wheat BOOLEAN DEFAULT FALSE,
    contains_soy BOOLEAN DEFAULT FALSE,
    -- Certification Information
    organic_certified BOOLEAN DEFAULT FALSE,
    fssai_license TEXT,
    iso_certification TEXT,
    -- Manufacturing Details
    batch_number TEXT NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    mrp REAL,
    net_weight VARCHAR(50),
    -- Foreign Key to link to the manufacturer
    manufacturer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(manufacturer_id) REFERENCES manufacturers(id)
);

-- Table for Traceability Log (The Digital Ledger)
-- This is the core of the TraceChain, storing every event in a product's journey.
CREATE TABLE traceability_log (
    log_id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL, -- Could store a GS1 GLN
    stage VARCHAR(255) NOT NULL, -- e.g., 'Farming', 'Processing', 'Distribution'
    actor TEXT NOT NULL, -- Who performed the action
    status VARCHAR(255), -- e.g., 'In Transit', 'Received'
    notes TEXT,
    -- Blockchain / Digital Ledger Columns
    previous_hash TEXT NOT NULL, -- Hash of the previous entry in the chain for this product
    current_hash TEXT UNIQUE NOT NULL, -- Hash of the current entry's data + previous_hash
    blockchain_tx_id TEXT, -- To be used in Step 3
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Table for Product Recalls
-- Stores recall information linked to a specific batch number.
CREATE TABLE product_recalls (
    recall_id SERIAL PRIMARY KEY,
    batch_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    recall_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table for Consumer Reviews
-- Stores consumer feedback and ratings for a specific product.
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    consumer_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Add indexes for faster lookups on frequently queried columns
CREATE INDEX idx_traceability_product_id ON traceability_log(product_id);
CREATE INDEX idx_products_batch_number ON products(batch_number);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_recalls_batch_number ON product_recalls(batch_number);

-- End of script
