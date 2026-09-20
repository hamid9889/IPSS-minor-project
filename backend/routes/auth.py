from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Activity
from backend.schemas import UserRegister, UserLogin, UserOut, UserProfileUpdate, Token
from backend.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Normalize role
    role = user_data.role.upper() if user_data.role else "OPERATOR"
    if role not in ["ADMIN", "OPERATOR"]:
        role = "OPERATOR"

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=role,
        designation=user_data.designation or ("Production Manager" if role == "ADMIN" else "Machine & Line Operator"),
        department=user_data.department or ("Production & Plant Management" if role == "ADMIN" else "Shopfloor Operations"),
        employee_id=user_data.employee_id or ("IPSS-ADM-01" if role == "ADMIN" else "IPSS-USR-101"),
        phone=user_data.phone or "",
        dob=user_data.dob or "",
        gender=user_data.gender or "Male",
        address=user_data.address or ""
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    username_input = credentials.username.strip().lower()
    # Support login with either username or email
    user = db.query(User).filter(
        (User.username == username_input) | (User.email == username_input)
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name.strip()
    if profile_data.email is not None:
        # Check if new email is taken by someone else
        existing = db.query(User).filter(User.email == profile_data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
        current_user.email = profile_data.email
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone.strip()
    if profile_data.dob is not None:
        current_user.dob = profile_data.dob
    if profile_data.gender is not None:
        current_user.gender = profile_data.gender
    if profile_data.address is not None:
        current_user.address = profile_data.address.strip()

    # Log activity
    log = Activity(text=f"Updated profile for {current_user.full_name}", activity_type="info")
    db.add(log)

    db.commit()
    db.refresh(current_user)
    return current_user
