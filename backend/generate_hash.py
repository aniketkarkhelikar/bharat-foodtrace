from passlib.context import CryptContext

# This uses the same settings as main.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_to_hash = "testpassword"
hashed_password = pwd_context.hash(password_to_hash)

print("\n--- NEW HASH ---\n")
print(hashed_password)
print("\n--- COPY THE LINE ABOVE ---\n")
