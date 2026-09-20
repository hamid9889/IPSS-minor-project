from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Product, Activity, User
from backend.schemas import ProductCreate, ProductUpdate, ProductOut
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[ProductOut])
def get_products(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            (Product.product_name.ilike(search_pattern)) | 
            (Product.category.ilike(search_pattern))
        )
    return query.order_by(Product.id.asc()).all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Check for duplicate product name
    existing = db.query(Product).filter(Product.product_name == product_data.product_name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this name already exists"
        )

    new_product = Product(
        product_name=product_data.product_name.strip(),
        category=product_data.category.strip(),
        processing_time=product_data.processing_time,
        preferred_line=product_data.preferred_line or "All Machines"
    )
    db.add(new_product)

    # Activity log
    activity = Activity(
        text=f'Created Product Master "{new_product.product_name}"',
        activity_type="success"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product_data.product_name is not None:
        # Check duplicate name if renamed
        renamed = product_data.product_name.strip()
        existing = db.query(Product).filter(Product.product_name == renamed, Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product name already in use")
        product.product_name = renamed

    if product_data.category is not None:
        product.category = product_data.category.strip()
    if product_data.processing_time is not None:
        product.processing_time = product_data.processing_time
    if product_data.preferred_line is not None:
        product.preferred_line = product_data.preferred_line

    activity = Activity(
        text=f'Updated Product Master "{product.product_name}"',
        activity_type="info"
    )
    db.add(activity)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    name = product.product_name
    db.delete(product)

    activity = Activity(
        text=f'Deleted Product Master "{name}"',
        activity_type="danger"
    )
    db.add(activity)

    db.commit()
    return {"message": f'Product "{name}" deleted successfully'}
