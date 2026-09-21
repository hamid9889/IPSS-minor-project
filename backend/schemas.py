from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: Optional[str] = "OPERATOR"
    designation: Optional[str] = "Staff"
    department: Optional[str] = "Production"
    employee_id: Optional[str] = "IPSS-001"
    phone: Optional[str] = ""
    dob: Optional[str] = ""
    gender: Optional[str] = "Male"
    address: Optional[str] = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    role: str
    designation: Optional[str] = ""
    department: Optional[str] = ""
    employee_id: Optional[str] = ""
    phone: Optional[str] = ""
    dob: Optional[str] = ""
    gender: Optional[str] = ""
    address: Optional[str] = ""
    created_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# --- Product Schemas ---
class ProductBase(BaseModel):
    product_name: str
    category: str
    processing_time: float
    preferred_line: Optional[str] = "All Machines"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    processing_time: Optional[float] = None
    preferred_line: Optional[str] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None


# --- Machine Schemas ---
class MachineBase(BaseModel):
    machine_name: str
    capacity: int
    status: Optional[str] = "Available"


class MachineCreate(MachineBase):
    pass


class MachineUpdate(BaseModel):
    machine_name: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None


class MachineOut(MachineBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None


# --- Order Schemas ---
class OrderBase(BaseModel):
    order_id: Optional[str] = None
    product_name: str
    quantity: int
    priority: Optional[str] = "Medium"
    deadline: str
    processing_time: Optional[float] = 0.05
    status: Optional[str] = "Pending"


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: str
    product_id: int
    product_name: str
    quantity: int
    priority: str
    deadline: str
    processing_time: Optional[float] = 0.05
    status: str
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None


# --- Schedule Schemas ---
class ScheduleCreate(BaseModel):
    machine_id: int
    order_id: int
    start_time: str
    end_time: str
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Scheduled"


class ScheduleUpdate(BaseModel):
    machine_id: Optional[int] = None
    order_id: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    machine_id: int
    order_id: int
    order_code: Optional[str] = ""
    machine_name: Optional[str] = ""
    product_name: Optional[str] = ""
    start_time: str
    end_time: str
    priority: str
    status: str
    created_at: Optional[datetime] = None


# --- Activity Schema ---
class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    activity_type: str
    created_at: Optional[datetime] = None
