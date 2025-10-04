# main.py
# Bharat FoodTrace Backend - Final Version (Step 1)
# This file contains the complete FastAPI application logic.

import uvicorn
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, conint
from typing import List, Optional
import datetime
import uuid
import json
import hashlib
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

# --- 0. Configuration ---
# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = Settings()

# --- Database Connection ---
def get_db_connection():
    conn = psycopg2.connect(settings.DATABASE_URL)
    return conn

# --- 1. Security & Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_hash(data: str):
    """Creates a SHA-256 hash of the input string."""
    return hashlib.sha256(data.encode()).hexdigest()

# --- 2. Pydantic Data Models ---

# Base Models
class ProductNutrition(BaseModel):
    sodium: int
    sugar: int
    calories_per_100g: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float

class AllergenInfo(BaseModel):
    contains_peanuts: bool = False
    contains_tree_nuts: bool = False
    contains_milk: bool = False
    contains_eggs: bool = False
    contains_fish: bool = False
    contains_shellfish: bool = False
    contains_wheat: bool = False
    contains_soy: bool = False

class CertificationInfo(BaseModel):
    organic_certified: bool = False
    fssai_license: str
    iso_certification: Optional[str] = None

# Response Models
class TraceabilityEntry(BaseModel):
    log_id: int
    product_id: str
    timestamp: datetime.datetime
    location: str
    stage: str
    actor: str
    status: Optional[str] = None
    notes: Optional[str] = None
    previous_hash: str
    current_hash: str
    blockchain_tx_id: Optional[str] = None

class ProductRecall(BaseModel):
    recall_id: int
    batch_number: str
    reason: str
    recall_date: datetime.datetime

class Review(BaseModel):
    review_id: int
    product_id: str
    consumer_email: str
    rating: int
    comment: Optional[str] = None
    review_date: datetime.datetime

class Product(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    sub_category: str
    image_url: str
    ingredients: List[str]
    nutrition: ProductNutrition
    allergens: AllergenInfo
    certifications: CertificationInfo
    traceability: List[TraceabilityEntry] = []
    batch_number: str
    manufacturing_date: datetime.date
    expiry_date: datetime.date
    mrp: float
    net_weight: str
    manufacturer_id: str
    recalls: List[ProductRecall] = []
    reviews: List[Review] = []

# Create/Input Models
class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    sub_category: str
    image_url: str
    ingredients: List[str]
    nutrition: ProductNutrition
    allergens: AllergenInfo
    certifications: CertificationInfo
    batch_number: str
    manufacturing_date: datetime.date
    expiry_date: datetime.date
    mrp: float
    net_weight: str

class SwasthWallet(BaseModel):
    allergies: List[str] = []
    diet: List[str] = []
    conditions: List[str] = []
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    goals: List[str] = []

class User(BaseModel):
    email: str
    profile: SwasthWallet

class UserRegister(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LocationUpdate(BaseModel):
    product_id: str
    location: str
    stage: str
    status: Optional[str] = None
    notes: Optional[str] = None
    actor: str = "Supply Chain Partner"

class ProductRecallCreate(BaseModel):
    batch_number: str
    reason: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: conint(ge=1, le=5)
    comment: Optional[str] = None


# --- 3. FastAPI App Initialization ---
app = FastAPI(
    title="Bharat FoodTrace API",
    description="The complete backend for the Bharat FoodTrace ecosystem.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 4. Authentication & User Management ---

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except (jwt.PyJWTError, AttributeError):
        raise credentials_exception

@app.post("/token", response_model=Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Provides a JWT token for a manufacturer.
    Uses OAuth2PasswordRequestForm, so username is the email.
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, hashed_password FROM manufacturers WHERE email = %s", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": form_data.username, "scope": "manufacturer"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/register", response_model=User, status_code=status.HTTP_201_CREATED, tags=["Consumer Management"])
async def register_consumer(form_data: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id FROM consumers WHERE email = %s", (form_data.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(form_data.password)
    empty_profile = SwasthWallet().model_dump_json()
    
    cursor.execute(
        "INSERT INTO consumers (id, email, hashed_password, profile_json) VALUES (%s, %s, %s, %s)",
        (user_id, form_data.email, hashed_password, empty_profile)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return User(email=form_data.email, profile=json.loads(empty_profile))

@app.post("/users/token", response_model=Token, tags=["Authentication"])
async def login_consumer_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, hashed_password FROM consumers WHERE email = %s", (form_data.username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": form_data.username, "scope": "consumer"})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User, tags=["Consumer Management"])
async def read_users_me(current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT profile_json FROM consumers WHERE email = %s", (current_user_email,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile_data = json.loads(row['profile_json'])
    return User(email=current_user_email, profile=profile_data)

@app.put("/users/me", response_model=User, tags=["Consumer Management"])
async def update_users_me(wallet: SwasthWallet, current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    wallet_json = wallet.model_dump_json()
    cursor.execute("UPDATE consumers SET profile_json = %s WHERE email = %s", (wallet_json, current_user_email))
    conn.commit()
    cursor.close()
    conn.close()
    return User(email=current_user_email, profile=wallet)

# --- 5. Product & Traceability Endpoints ---

async def _get_full_product_details(product_id: str, conn) -> Optional[Product]:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch Product
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product_row = cursor.fetchone()
    if not product_row:
        return None

    # Fetch Traceability
    cursor.execute("SELECT * FROM traceability_log WHERE product_id = %s ORDER BY timestamp ASC", (product_id,))
    log_rows = cursor.fetchall()
    traceability_log = [TraceabilityEntry(**row) for row in log_rows]

    # Fetch Recalls
    cursor.execute("SELECT * FROM product_recalls WHERE batch_number = %s", (product_row['batch_number'],))
    recall_rows = cursor.fetchall()
    recalls = [ProductRecall(**row) for row in recall_rows]

    # Fetch Reviews
    cursor.execute("SELECT * FROM reviews WHERE product_id = %s ORDER BY review_date DESC", (product_id,))
    review_rows = cursor.fetchall()
    reviews = [Review(**row) for row in review_rows]

    cursor.close()

    # Assemble the final Product object
    product_data = dict(product_row)
    product_data['ingredients'] = [i.strip() for i in product_row['ingredients'].split(',')]
    product_data['nutrition'] = ProductNutrition(
        sodium=product_row['sodium'], sugar=product_row['sugar'], calories_per_100g=product_row['calories_per_100g'],
        protein_g=product_row['protein_g'], carbs_g=product_row['carbs_g'], fat_g=product_row['fat_g'], fiber_g=product_row['fiber_g']
    )
    product_data['allergens'] = AllergenInfo(
        contains_peanuts=product_row['contains_peanuts'], contains_tree_nuts=product_row['contains_tree_nuts'],
        contains_milk=product_row['contains_milk'], contains_eggs=product_row['contains_eggs'],
        contains_fish=product_row['contains_fish'], contains_shellfish=product_row['contains_shellfish'],
        contains_wheat=product_row['contains_wheat'], contains_soy=product_row['contains_soy']
    )
    product_data['certifications'] = CertificationInfo(
        organic_certified=product_row['organic_certified'], fssai_license=product_row['fssai_license'], iso_certification=product_row['iso_certification']
    )
    product_data['traceability'] = traceability_log
    product_data['recalls'] = recalls
    product_data['reviews'] = reviews
    
    return Product(**product_data)


@app.post("/products/add", response_model=Product, status_code=status.HTTP_201_CREATED, tags=["Products"])
async def add_product(product_data: ProductCreate, current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM manufacturers WHERE email = %s", (current_user_email,))
    manufacturer_id_tuple = cursor.fetchone()
    if not manufacturer_id_tuple:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Invalid manufacturer credentials")
    
    manufacturer_id = manufacturer_id_tuple['id']
    product_id = f"BFT_{product_data.batch_number.replace(' ','')}_{uuid.uuid4().hex[:6].upper()}"

    try:
        cursor.execute(
            """
            INSERT INTO products (
                id, name, brand, category, sub_category, image_url, ingredients,
                sodium, sugar, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g,
                contains_peanuts, contains_tree_nuts, contains_milk, contains_eggs,
                contains_fish, contains_shellfish, contains_wheat, contains_soy,
                organic_certified, fssai_license, iso_certification,
                batch_number, manufacturing_date, expiry_date, mrp, net_weight, manufacturer_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                product_id, product_data.name, product_data.brand, product_data.category, product_data.sub_category,
                product_data.image_url, ','.join(product_data.ingredients),
                product_data.nutrition.sodium, product_data.nutrition.sugar, product_data.nutrition.calories_per_100g,
                product_data.nutrition.protein_g, product_data.nutrition.carbs_g, product_data.nutrition.fat_g,
                product_data.nutrition.fiber_g,
                product_data.allergens.contains_peanuts, product_data.allergens.contains_tree_nuts,
                product_data.allergens.contains_milk, product_data.allergens.contains_eggs,
                product_data.allergens.contains_fish, product_data.allergens.contains_shellfish,
                product_data.allergens.contains_wheat, product_data.allergens.contains_soy,
                product_data.certifications.organic_certified, product_data.certifications.fssai_license,
                product_data.certifications.iso_certification,
                product_data.batch_number, product_data.manufacturing_date, product_data.expiry_date,
                product_data.mrp, product_data.net_weight, manufacturer_id
            )
        )

        # Create the genesis traceability log
        timestamp = datetime.datetime.now(datetime.timezone.utc)
        first_event_location = f"Manufacturing Unit, {product_data.brand}"
        genesis_hash_data = f"{product_id}{timestamp.isoformat()}{first_event_location}manufacturing{current_user_email}0"
        genesis_hash = create_hash(genesis_hash_data)
        
        cursor.execute(
            'INSERT INTO traceability_log (product_id, timestamp, location, stage, actor, status, notes, previous_hash, current_hash) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)',
            (product_id, timestamp, first_event_location, "manufacturing", current_user_email, "Completed", "Product created.", "0", genesis_hash)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()

    product_details = await _get_full_product_details(product_id, conn)
    conn.close()
    return product_details


@app.get("/product/{product_id}", response_model=Product, tags=["Products"])
async def get_product(product_id: str):
    conn = get_db_connection()
    product = await _get_full_product_details(product_id, conn)
    conn.close()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/manufacturer/products", response_model=List[Product], tags=["Products"])
async def get_manufacturer_products(current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM manufacturers WHERE email = %s", (current_user_email,))
    manufacturer_id_tuple = cursor.fetchone()
    if not manufacturer_id_tuple:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Invalid manufacturer")
    
    manufacturer_id = manufacturer_id_tuple['id']
    cursor.execute("SELECT id FROM products WHERE manufacturer_id = %s", (manufacturer_id,))
    product_ids = [row['id'] for row in cursor.fetchall()]
    cursor.close()
    
    products = []
    for product_id in product_ids:
        product = await _get_full_product_details(product_id, conn)
        if product:
            products.append(product)
            
    conn.close()
    return products

@app.post("/traceability/add", response_model=TraceabilityEntry, status_code=status.HTTP_201_CREATED, tags=["Traceability"])
async def add_traceability_event(update_data: LocationUpdate):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT current_hash FROM traceability_log WHERE product_id = %s ORDER BY log_id DESC LIMIT 1", (update_data.product_id,))
    last_hash_row = cursor.fetchone()
    if not last_hash_row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product ID not found or has no initial log.")
    
    previous_hash = last_hash_row['current_hash']
    timestamp = datetime.datetime.now(datetime.timezone.utc)
    
    hash_data = f"{update_data.product_id}{timestamp.isoformat()}{update_data.location}{update_data.stage}{update_data.actor}{previous_hash}"
    current_hash = create_hash(hash_data)

    try:
        cursor.execute(
            'INSERT INTO traceability_log (product_id, timestamp, location, stage, actor, status, notes, previous_hash, current_hash) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING log_id',
            (update_data.product_id, timestamp, update_data.location, update_data.stage, update_data.actor, update_data.status, update_data.notes, previous_hash, current_hash)
        )
        log_id = cursor.fetchone()['log_id']
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

    return TraceabilityEntry(
        log_id=log_id,
        product_id=update_data.product_id,
        timestamp=timestamp,
        location=update_data.location,
        stage=update_data.stage,
        actor=update_data.actor,
        status=update_data.status,
        notes=update_data.notes,
        previous_hash=previous_hash,
        current_hash=current_hash
    )

# --- 6. Recalls and Reviews Endpoints ---

@app.post("/recalls/add", response_model=ProductRecall, status_code=status.HTTP_201_CREATED, tags=["Recalls"])
async def add_recall(recall_data: ProductRecallCreate, current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute('''
        SELECT p.id FROM products p
        JOIN manufacturers m ON p.manufacturer_id = m.id
        WHERE p.batch_number = %s AND m.email = %s
    ''', (recall_data.batch_number, current_user_email))
    product = cursor.fetchone()
    if not product:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=403, detail="You can only recall products linked to your manufacturer account.")

    recall_date = datetime.datetime.now(datetime.timezone.utc)
    try:
        cursor.execute(
            'INSERT INTO product_recalls (batch_number, reason, recall_date) VALUES (%s, %s, %s) RETURNING recall_id',
            (recall_data.batch_number, recall_data.reason, recall_date)
        )
        recall_id = cursor.fetchone()['recall_id']
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

    return ProductRecall(recall_id=recall_id, batch_number=recall_data.batch_number, reason=recall_data.reason, recall_date=recall_date)

@app.post("/reviews/add", response_model=Review, status_code=status.HTTP_201_CREATED, tags=["Reviews"])
async def add_review(review_data: ReviewCreate, current_user_email: str = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    review_date = datetime.datetime.now(datetime.timezone.utc)

    try:
        cursor.execute(
            'INSERT INTO reviews (product_id, consumer_email, rating, comment, review_date) VALUES (%s, %s, %s, %s, %s) RETURNING review_id',
            (review_data.product_id, current_user_email, review_data.rating, review_data.comment, review_date)
        )
        review_id = cursor.fetchone()['review_id']
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        cursor.close()
        conn.close()

    return Review(
        review_id=review_id,
        product_id=review_data.product_id,
        consumer_email=current_user_email,
        rating=review_data.rating,
        comment=review_data.comment,
        review_date=review_date,
    )

@app.get("/reviews/{product_id}", response_model=List[Review], tags=["Reviews"])
async def get_reviews_for_product(product_id: str):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM reviews WHERE product_id = %s ORDER BY review_date DESC", (product_id,))
    review_rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [Review(**row) for row in review_rows]


# --- Main Execution ---
if __name__ == "__main__":
    # Note: The database setup is handled by the `database_setup.sql` script now.
    print("Starting Bharat FoodTrace API Server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
