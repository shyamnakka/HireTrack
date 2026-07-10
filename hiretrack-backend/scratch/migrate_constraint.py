import sys
sys.path.append(r"c:\Users\abc\Desktop\Hire Track\hiretrack-backend")

from app.database import engine
from sqlalchemy import text, inspect

print("--- RUNNING DATABASE CONSTRAINT ALIGNMENT ---")

with engine.connect() as conn:
    trans = conn.begin()
    try:
        # Check if the foreign key exists and drop it
        conn.execute(text("ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_application_id_fkey;"))
        print("Dropped old constraint reminders_application_id_fkey.")
        
        # Add the new constraint with ON DELETE SET NULL
        conn.execute(text("""
            ALTER TABLE reminders 
            ADD CONSTRAINT reminders_application_id_fkey 
            FOREIGN KEY (application_id) 
            REFERENCES applications(id) 
            ON DELETE SET NULL;
        """))
        print("Created new constraint with ON DELETE SET NULL.")
        
        trans.commit()
        print("Transaction committed successfully.")
    except Exception as e:
        trans.rollback()
        print("Error during migration, rolled back:", e)
        sys.exit(1)

# Verify constraint
inspector = inspect(engine)
fks = inspector.get_foreign_keys('reminders')
print("Verification of foreign keys on 'reminders':")
for fk in fks:
    print(f"Name: {fk['name']}, Columns: {fk['constrained_columns']}, Referred Table: {fk['referred_table']}, Options: {fk['options']}")
