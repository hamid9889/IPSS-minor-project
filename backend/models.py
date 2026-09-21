from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="OPERATOR")
    designation = Column(String(100), default="Staff")
    department = Column(String(100), default="Production")
    employee_id = Column(String(50), default="IPSS-001")
    phone = Column(String(30), default="")
    dob = Column(String(30), default="")
    gender = Column(String(20), default="Male")
    address = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)
    processing_time = Column(Float, nullable=False)
    preferred_line = Column(String(50), default="All Machines")
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="product", cascade="all, delete-orphan")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    machine_name = Column(String(100), unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="Available")
    created_at = Column(DateTime, default=datetime.utcnow)

    schedules = relationship("Schedule", back_populates="machine", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")
    deadline = Column(String(50), nullable=False)
    processing_time = Column(Float, default=0.05)
    status = Column(String(50), nullable=False, default="Pending")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="orders")
    user = relationship("User", back_populates="orders")
    schedules = relationship("Schedule", back_populates="order", cascade="all, delete-orphan")

    @property
    def product_name(self) -> str:
        return self.product.product_name if self.product else ""


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    priority = Column(String(20), default="Medium")
    status = Column(String(50), default="Scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

    machine = relationship("Machine", back_populates="schedules")
    order = relationship("Order", back_populates="schedules")

    @property
    def machine_name(self) -> str:
        return self.machine.machine_name if self.machine else ""

    @property
    def order_code(self) -> str:
        return self.order.order_id if self.order else ""

    @property
    def product_name(self) -> str:
        return self.order.product.product_name if (self.order and self.order.product) else ""


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(255), nullable=False)
    activity_type = Column(String(20), default="info")
    created_at = Column(DateTime, default=datetime.utcnow)
