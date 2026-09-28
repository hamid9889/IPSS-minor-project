import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
import jwt
from backend.database import supabase
from backend.schemas import UserRegister, UserLogin, UserOut, UserProfileUpdate, Token
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    CurrentUser,
    SECRET_KEY,
    ALGORITHM
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def verify_admin_authorization_key(key: str) -> bool:
    """
    Verify an Admin Authorization Key using Supabase RPC public.verify_admin_key.
    Returns True if key is valid and active, False otherwise.
    """
    clean_key = (key or "").strip()
    if not clean_key:
        return False
    try:
        res = supabase.rpc("verify_admin_key", {"input_key": clean_key}).execute()
        if bool(res.data):
            return True
        if clean_key.upper() != clean_key:
            res_upper = supabase.rpc("verify_admin_key", {"input_key": clean_key.upper()}).execute()
            if bool(res_upper.data):
                return True
        return False
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during authorization key verification: {str(e)}"
        )

def ensure_default_users():
    """Ensure default admin and operator accounts exist."""
    try:
        admin_check = supabase.table("users").select("id").ilike("username", "admin").execute()
        if not admin_check.data:
            admin_data = {
                "username": "admin",
                "email": "admin@ipss.com",
                "hashed_password": hash_password("admin123"),
                "full_name": "Chief Administrator",
                "role": "ADMIN",
                "designation": "Production Manager",
                "department": "Production & Plant Management",
                "employee_id": "IPSS-ADM-01",
                "phone": "+91 9876543210",
                "dob": "1995-04-15",
                "gender": "Male",
                "address": "Industrial Area Unit 1, Lucknow",
                "account_status": "Active"
            }
            supabase.table("users").insert(admin_data).execute()

        op_check = supabase.table("users").select("id").ilike("username", "user").execute()
        if not op_check.data:
            operator_data = {
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
                "address": "Assembly Section B, Floor 2, Lucknow",
                "account_status": "Active"
            }
            supabase.table("users").insert(operator_data).execute()
    except Exception:
        pass

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, authorization: Optional[str] = Header(None)):
    username_clean = user_data.username.strip()
    email_clean = user_data.email.strip().lower()
    full_name_clean = user_data.full_name.strip()

    if not username_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required.")
    if not email_clean or "@" not in email_clean or "." not in email_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid email is required.")
    if not full_name_clean:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name is required.")
    if not user_data.password or len(user_data.password.strip()) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 4 characters.")

    # Validate role - only ADMIN and OPERATOR allowed
    raw_role = (user_data.role or "OPERATOR").strip().upper()
    if raw_role not in ["ADMIN", "OPERATOR"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Allowed roles are ADMIN or OPERATOR."
        )

    # Protect ADMIN registration: require valid Supabase Admin Authorization Key
    if raw_role == "ADMIN":
        key_provided = (user_data.admin_key or user_data.admin_secret_key or "").strip()
        if not key_provided:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin Authorization Key is required for administrator registration."
            )
        if not verify_admin_authorization_key(key_provided):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Admin Authorization Key. Administrator registration denied."
            )

    # Check duplicate username
    res_user = supabase.table("users").select("id").ilike("username", username_clean).execute()
    if res_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered."
        )

    # Check duplicate email
    res_email = supabase.table("users").select("id").ilike("email", email_clean).execute()
    if res_email.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # Check duplicate employee_id if supplied
    emp_id_clean = user_data.employee_id.strip() if user_data.employee_id else ""
    if emp_id_clean:
        res_emp = supabase.table("users").select("id").ilike("employee_id", emp_id_clean).execute()
        if res_emp.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee ID already registered."
            )
    else:
        # Generate an auto employee ID if not provided
        timestamp_suffix = int(datetime.now(timezone.utc).timestamp()) % 100000
        emp_id_clean = f"IPSS-{'ADM' if raw_role == 'ADMIN' else 'USR'}-{timestamp_suffix:05d}"

    new_user_data = {
        "username": username_clean,
        "email": email_clean,
        "hashed_password": hash_password(user_data.password.strip()),
        "full_name": full_name_clean,
        "role": raw_role,
        "designation": user_data.designation.strip() if user_data.designation else ("Production Manager" if raw_role == "ADMIN" else "Machine & Line Operator"),
        "department": user_data.department.strip() if user_data.department else ("Production & Plant Management" if raw_role == "ADMIN" else "Shopfloor Operations"),
        "employee_id": emp_id_clean,
        "phone": user_data.phone.strip() if user_data.phone else "",
        "dob": user_data.dob.strip() if user_data.dob else "",
        "gender": user_data.gender if user_data.gender else "Male",
        "address": user_data.address.strip() if user_data.address else "",
        "joining_date": user_data.joining_date.strip() if user_data.joining_date else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "work_location": user_data.work_location.strip() if user_data.work_location else "Main Facility, Sector 1",
        "account_status": "Active"
    }

    insert_res = supabase.table("users").insert(new_user_data).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to register user")
    return insert_res.data[0]

@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    ensure_default_users()

    username_input = (credentials.username or "").strip()
    password_input = credentials.password or ""

    if not username_input or not password_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required."
        )

    # Support login with either username or email (case-insensitive)
    res = supabase.table("users").select("*").ilike("username", username_input).execute()
    if not res.data:
        res = supabase.table("users").select("*").ilike("email", username_input).execute()

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    user = res.data[0]
    if not verify_password(password_input, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Check account active status
    if (user.get("account_status") or "Active").lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended. Please contact administrator."
        )

    user_role = (user.get("role") or "").upper()
    req_role = (credentials.role or "").strip().upper()

    # Reject if Operator attempts to sign in through Admin portal
    if req_role == "ADMIN" and user_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Operator accounts cannot sign in through the Admin portal."
        )

    # Enforce Admin Authorization Key for Admin accounts
    if user_role == "ADMIN":
        admin_key = (credentials.admin_key or credentials.admin_secret_key or "").strip()
        if not admin_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin Authorization Key is required for administrator sign in."
            )
        if not verify_admin_authorization_key(admin_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Admin Authorization Key. Access denied."
            )

    # Update last_login timestamp upon successful login
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        supabase.table("users").update({"last_login": now_iso}).eq("id", user["id"]).execute()
        user["last_login"] = now_iso
    except Exception:
        pass

    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user)
):
    update_fields = {}
    if profile_data.full_name is not None:
        name_val = profile_data.full_name.strip()
        if not name_val:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Full name cannot be empty.")
        update_fields["full_name"] = name_val
    if profile_data.email is not None:
        new_email = profile_data.email.strip().lower()
        if not new_email or "@" not in new_email or "." not in new_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid email is required.")
        # Check if email is already taken by another user (case-insensitive)
        check = supabase.table("users").select("id").ilike("email", new_email).neq("id", current_user["id"]).execute()
        if check.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")
        update_fields["email"] = new_email
    if profile_data.phone is not None:
        update_fields["phone"] = profile_data.phone.strip()
    if profile_data.dob is not None:
        update_fields["dob"] = profile_data.dob.strip()
    if profile_data.gender is not None:
        update_fields["gender"] = profile_data.gender
    if profile_data.address is not None:
        update_fields["address"] = profile_data.address.strip()
    if profile_data.employee_id is not None:
        new_emp = profile_data.employee_id.strip()
        if new_emp:
            check_emp = supabase.table("users").select("id").ilike("employee_id", new_emp).neq("id", current_user["id"]).execute()
            if check_emp.data:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee ID already registered.")
        update_fields["employee_id"] = new_emp
    if profile_data.department is not None:
        update_fields["department"] = profile_data.department.strip()
    if profile_data.designation is not None:
        update_fields["designation"] = profile_data.designation.strip()
    if profile_data.joining_date is not None:
        update_fields["joining_date"] = profile_data.joining_date.strip()
    if profile_data.work_location is not None:
        update_fields["work_location"] = profile_data.work_location.strip()

    if update_fields:
        res = supabase.table("users").update(update_fields).eq("id", current_user["id"]).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile")
        updated_user = res.data[0]
    else:
        updated_user = current_user

    # Log activity
    name = updated_user.get("full_name") or current_user.get("full_name", "User")
    try:
        supabase.table("activities").insert({
            "text": f"Updated profile for {name}",
            "activity_type": "info"
        }).execute()
    except Exception:
        pass

    return updated_user
