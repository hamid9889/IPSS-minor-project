import os
import sys

# Ensure workspace root is in sys.path so 'backend' is discoverable regardless of working directory
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from backend.database import supabase
from backend.auth import hash_password

def seed_database():
    print("Connecting to Supabase to seed initial data...")

    try:
        # 1. Seed Users
        admin_check = supabase.table("users").select("id").eq("username", "admin").execute()
        if not admin_check.data:
            supabase.table("users").insert({
                "username": "admin",
                "email": "admin@ipss.com",
                "hashed_password": hash_password("admin123"),
                "full_name": "Admin User",
                "role": "ADMIN",
                "designation": "Production Manager",
                "department": "Production & Plant Management",
                "employee_id": "IPSS-ADM-01",
                "phone": "+91 9876543210",
                "dob": "1995-04-15",
                "gender": "Male",
                "address": "Industrial Area Unit 1, Lucknow"
            }).execute()
            print("Seeded 'admin' user.")

        user_check = supabase.table("users").select("id").eq("username", "user").execute()
        if not user_check.data:
            supabase.table("users").insert({
                "username": "user",
                "email": "user@ipss.com",
                "hashed_password": hash_password("user123"),
                "full_name": "Staff Operator",
                "role": "OPERATOR",
                "designation": "Machine & Line Operator",
                "department": "Shopfloor Operations",
                "employee_id": "IPSS-USR-104",
                "phone": "+91 9123456789",
                "dob": "1998-08-22",
                "gender": "Male",
                "address": "Assembly Section B, Floor 2, Lucknow"
            }).execute()
            print("Seeded 'user' operator.")

        # 2. Seed Products
        prod_check = supabase.table("products").select("id").execute()
        if not prod_check.data:
            supabase.table("products").insert([
                {"product_name": "Laptop Assembly", "category": "Electronics", "processing_time": 2.0, "preferred_line": "M-01"},
                {"product_name": "Mouse Housing", "category": "Peripherals", "processing_time": 1.5, "preferred_line": "M-02"},
                {"product_name": "Motor Shaft", "category": "Mechanical", "processing_time": 3.0, "preferred_line": "M-03"},
                {"product_name": "Control Panel Unit", "category": "Control Units", "processing_time": 4.0, "preferred_line": "M-04"}
            ]).execute()
            print("Seeded default products.")

        # 3. Seed Machines
        mach_check = supabase.table("machines").select("id").execute()
        if not mach_check.data:
            supabase.table("machines").insert([
                {"machine_name": "M-01", "capacity": 120, "status": "Available"},
                {"machine_name": "M-02", "capacity": 80, "status": "Working"},
                {"machine_name": "M-03", "capacity": 200, "status": "Available"},
                {"machine_name": "M-04", "capacity": 60, "status": "Maintenance"}
            ]).execute()
            print("Seeded default machines.")

        # 4. Seed Orders
        ord_check = supabase.table("orders").select("id").execute()
        if not ord_check.data:
            prods = supabase.table("products").select("id, product_name").execute().data or []
            prod_map = {p["product_name"]: p["id"] for p in prods}

            admins = supabase.table("users").select("id").eq("username", "admin").execute().data or []
            admin_id = admins[0]["id"] if admins else None

            supabase.table("orders").insert([
                {"order_id": "ORD-101", "product_id": prod_map.get("Laptop Assembly"), "quantity": 50, "priority": "High", "deadline": "2026-08-20", "status": "Pending", "user_id": admin_id},
                {"order_id": "ORD-102", "product_id": prod_map.get("Mouse Housing"), "quantity": 100, "priority": "Medium", "deadline": "2026-08-22", "status": "Pending", "user_id": admin_id},
                {"order_id": "ORD-103", "product_id": prod_map.get("Motor Shaft"), "quantity": 30, "priority": "Low", "deadline": "2026-08-25", "status": "Completed", "user_id": admin_id},
                {"order_id": "ORD-104", "product_id": prod_map.get("Control Panel Unit"), "quantity": 20, "priority": "High", "deadline": "2026-08-18", "status": "Pending", "user_id": admin_id}
            ]).execute()
            print("Seeded default orders.")

        # 5. Seed Schedules
        sched_check = supabase.table("schedules").select("id").execute()
        if not sched_check.data:
            machs = supabase.table("machines").select("id, machine_name").execute().data or []
            mach_map = {m["machine_name"]: m["id"] for m in machs}

            ords = supabase.table("orders").select("id, order_id").execute().data or []
            ord_map = {o["order_id"]: o["id"] for o in ords}

            supabase.table("schedules").insert([
                {"machine_id": mach_map.get("M-01"), "order_id": ord_map.get("ORD-101"), "start_time": "09:00", "end_time": "11:00", "priority": "High", "status": "Scheduled"},
                {"machine_id": mach_map.get("M-02"), "order_id": ord_map.get("ORD-102"), "start_time": "09:00", "end_time": "10:30", "priority": "Medium", "status": "Scheduled"}
            ]).execute()
            print("Seeded default schedules.")

        # 6. Seed Activities
        act_check = supabase.table("activities").select("id").execute()
        if not act_check.data:
            supabase.table("activities").insert([
                {"text": "Order #ORD-104 created", "activity_type": "info"},
                {"text": "Machine M-02 changed to Working", "activity_type": "warning"},
                {"text": "Schedule generated successfully", "activity_type": "success"}
            ]).execute()
            print("Seeded default activities.")

        print("Supabase database seeding completed successfully!")
    except Exception as e:
        print(f"Error during Supabase seeding: {e}")

if __name__ == "__main__":
    seed_database()
