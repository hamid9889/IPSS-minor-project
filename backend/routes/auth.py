from fastapi import APIRouter, Depends, HTTPException, status
from backend.database import supabase
from backend.schemas import UserRegister, UserLogin, UserOut, UserProfileUpdate, Token
from backend.auth import hash_password, verify_password, create_access_token, get_current_user, CurrentUser

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def ensure_default_users():
    """Seed default demo accounts if users table is empty."""
    try:
        check = supabase.table("users").select("id").limit(1).execute()
        if not check.data:
            admin_data = {
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
            }
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
                "address": "Assembly Section B, Floor 2, Lucknow"
            }
            supabase.table("users").insert([admin_data, operator_data]).execute()
    except Exception as e:
        print(f"User seed check notice: {e}")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister):
    # Check if username or email already exists
    res = supabase.table("users").select("id").or_(f"username.eq.{user_data.username},email.eq.{user_data.email}").execute()
    if res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    role = user_data.role.upper() if user_data.role else "OPERATOR"
    if role not in ["ADMIN", "OPERATOR"]:
        role = "OPERATOR"

    new_user_data = {
        "username": user_data.username.strip(),
        "email": user_data.email.strip().lower(),
        "hashed_password": hash_password(user_data.password),
        "full_name": user_data.full_name.strip(),
        "role": role,
        "designation": user_data.designation or ("Production Manager" if role == "ADMIN" else "Machine & Line Operator"),
        "department": user_data.department or ("Production & Plant Management" if role == "ADMIN" else "Shopfloor Operations"),
        "employee_id": user_data.employee_id or ("IPSS-ADM-01" if role == "ADMIN" else "IPSS-USR-101"),
        "phone": user_data.phone or "",
        "dob": user_data.dob or "",
        "gender": user_data.gender or "Male",
        "address": user_data.address or ""
    }

    insert_res = supabase.table("users").insert(new_user_data).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to register user")
    return insert_res.data[0]

@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    ensure_default_users()

    username_input = credentials.username.strip().lower()
    # Support login with either username or email
    res = supabase.table("users").select("*").eq("username", username_input).execute()
    if not res.data:
        res = supabase.table("users").select("*").eq("email", username_input).execute()

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    user = res.data[0]
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

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
        update_fields["full_name"] = profile_data.full_name.strip()
    if profile_data.email is not None:
        new_email = profile_data.email.strip().lower()
        # Check if email is already taken by another user
        check = supabase.table("users").select("id").eq("email", new_email).neq("id", current_user["id"]).execute()
        if check.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        update_fields["email"] = new_email
    if profile_data.phone is not None:
        update_fields["phone"] = profile_data.phone.strip()
    if profile_data.dob is not None:
        update_fields["dob"] = profile_data.dob
    if profile_data.gender is not None:
        update_fields["gender"] = profile_data.gender
    if profile_data.address is not None:
        update_fields["address"] = profile_data.address.strip()

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
