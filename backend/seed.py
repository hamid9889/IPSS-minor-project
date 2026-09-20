from backend.database import SessionLocal, engine, Base
from backend.models import User, Product, Machine, Order, Schedule, Activity
from backend.auth import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users if not present
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@ipss.com",
                hashed_password=hash_password("admin123"),
                full_name="Admin User",
                role="ADMIN",
                designation="Production Manager",
                department="Production & Plant Management",
                employee_id="IPSS-ADM-01",
                phone="+91 9876543210",
                dob="1995-04-15",
                gender="Male",
                address="Industrial Area Unit 1, Lucknow"
            )
            db.add(admin_user)

        operator_user = db.query(User).filter(User.username == "user").first()
        if not operator_user:
            operator_user = User(
                username="user",
                email="user@ipss.com",
                hashed_password=hash_password("user123"),
                full_name="Staff Operator",
                role="OPERATOR",
                designation="Machine & Line Operator",
                department="Shopfloor Operations",
                employee_id="IPSS-USR-104",
                phone="+91 9123456789",
                dob="1998-08-22",
                gender="Male",
                address="Assembly Section B, Floor 2, Lucknow"
            )
            db.add(operator_user)

        db.commit()

        # 2. Seed Products
        if db.query(Product).count() == 0:
            default_products = [
                Product(product_name="Laptop Assembly", category="Electronics", processing_time=2.0, preferred_line="M-01"),
                Product(product_name="Mouse Housing", category="Peripherals", processing_time=1.5, preferred_line="M-02"),
                Product(product_name="Motor Shaft", category="Mechanical", processing_time=3.0, preferred_line="M-03"),
                Product(product_name="Control Panel Unit", category="Control Units", processing_time=4.0, preferred_line="M-04")
            ]
            db.add_all(default_products)
            db.commit()

        # 3. Seed Machines
        if db.query(Machine).count() == 0:
            default_machines = [
                Machine(machine_name="M-01", capacity=120, status="Available"),
                Machine(machine_name="M-02", capacity=80, status="Working"),
                Machine(machine_name="M-03", capacity=200, status="Available"),
                Machine(machine_name="M-04", capacity=60, status="Maintenance")
            ]
            db.add_all(default_machines)
            db.commit()

        # 4. Seed Orders
        if db.query(Order).count() == 0:
            prod_map = {p.product_name: p.id for p in db.query(Product).all()}
            admin = db.query(User).filter(User.username == "admin").first()

            default_orders = [
                Order(order_id="ORD-101", product_name="Laptop Assembly", product_id=prod_map.get("Laptop Assembly"), quantity=50, priority="High", deadline="2026-08-20", status="Pending", user_id=admin.id if admin else None),
                Order(order_id="ORD-102", product_name="Mouse Housing", product_id=prod_map.get("Mouse Housing"), quantity=100, priority="Medium", deadline="2026-08-22", status="Pending", user_id=admin.id if admin else None),
                Order(order_id="ORD-103", product_name="Motor Shaft", product_id=prod_map.get("Motor Shaft"), quantity=30, priority="Low", deadline="2026-08-25", status="Completed", user_id=admin.id if admin else None),
                Order(order_id="ORD-104", product_name="Control Panel Unit", product_id=prod_map.get("Control Panel Unit"), quantity=20, priority="High", deadline="2026-08-18", status="Pending", user_id=admin.id if admin else None)
            ]
            db.add_all(default_orders)
            db.commit()

        # 5. Seed Schedules
        if db.query(Schedule).count() == 0:
            mach_map = {m.machine_name: m.id for m in db.query(Machine).all()}
            ord_map = {o.order_id: o.id for o in db.query(Order).all()}

            default_schedules = [
                Schedule(machine_name="M-01", machine_id=mach_map.get("M-01"), order_id="ORD-101", order_fk=ord_map.get("ORD-101"), product_name="Laptop Assembly", start_time="09:00", end_time="11:00", priority="High", status="Scheduled"),
                Schedule(machine_name="M-02", machine_id=mach_map.get("M-02"), order_id="ORD-102", order_fk=ord_map.get("ORD-102"), product_name="Mouse Housing", start_time="09:00", end_time="10:30", priority="Medium", status="Scheduled")
            ]
            db.add_all(default_schedules)
            db.commit()

        # 6. Seed Activities
        if db.query(Activity).count() == 0:
            default_activities = [
                Activity(text="Order #ORD-104 created", activity_type="info"),
                Activity(text="Machine M-02 changed to Working", activity_type="warning"),
                Activity(text="Schedule generated successfully", activity_type="success")
            ]
            db.add_all(default_activities)
            db.commit()

        print("Seed data successfully inserted into MySQL!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
