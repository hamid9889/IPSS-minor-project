from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

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

    class Config:
        from_attributes = True

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
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


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
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


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
    id: int
    order_id: str
    product_name: str
    product_id: Optional[int] = None
    quantity: int
    priority: str
    deadline: str
    processing_time: Optional[float] = 0.05
    status: str
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Schedule Schemas ---
class ScheduleOut(BaseModel):
    id: int
    machine_name: str
    order_id: str
    product_name: str
    start_time: str
    end_time: str
    priority: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Activity Schema ---
class ActivityOut(BaseModel):
    id: int
    text: str
    activity_type: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
