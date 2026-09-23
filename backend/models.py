from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    id: Optional[int] = None
    username: str = ""
    email: str = ""
    hashed_password: str = ""
    full_name: str = ""
    role: str = "OPERATOR"
    designation: str = "Staff"
    department: str = "Production"
    employee_id: str = "IPSS-001"
    phone: str = ""
    dob: str = ""
    gender: str = "Male"
    address: str = ""
    created_at: Optional[datetime] = None


@dataclass
class Product:
    id: Optional[int] = None
    product_name: str = ""
    category: str = ""
    processing_time: float = 0.0
    preferred_line: str = "All Machines"
    created_at: Optional[datetime] = None


@dataclass
class Machine:
    id: Optional[int] = None
    machine_name: str = ""
    capacity: int = 0
    status: str = "Available"
    created_at: Optional[datetime] = None


@dataclass
class Order:
    id: Optional[int] = None
    order_id: str = ""
    product_id: int = 0
    quantity: int = 0
    priority: str = "Medium"
    deadline: str = ""
    processing_time: float = 0.05
    status: str = "Pending"
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None


@dataclass
class Schedule:
    id: Optional[int] = None
    machine_id: int = 0
    order_id: int = 0
    start_time: str = ""
    end_time: str = ""
    priority: str = "Medium"
    status: str = "Scheduled"
    created_at: Optional[datetime] = None


@dataclass
class Activity:
    id: Optional[int] = None
    text: str = ""
    activity_type: str = "info"
    created_at: Optional[datetime] = None
