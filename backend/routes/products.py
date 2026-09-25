from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database import supabase
from backend.schemas import ProductCreate, ProductUpdate, ProductOut
from backend.auth import get_current_user, require_admin, CurrentUser

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[ProductOut])
def get_products(
    search: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    query = supabase.table("products").select("*").order("id")
    response = query.execute()
    products = response.data or []

    if search:
        term = search.strip().lower()
        products = [
            p for p in products
            if term in (p.get("product_name") or "").lower() or term in (p.get("category") or "").lower()
        ]

    return products

@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    current_user: CurrentUser = Depends(get_current_user)
):
    response = supabase.table("products").select("*").eq("id", product_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return response.data[0]

@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    admin: CurrentUser = Depends(require_admin)
):
    name = product_data.product_name.strip()
    # Check duplicate product name (case-insensitive)
    existing = supabase.table("products").select("id").ilike("product_name", name).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this name already exists"
        )

    new_prod = {
        "product_name": name,
        "category": product_data.category.strip(),
        "processing_time": product_data.processing_time,
        "preferred_line": product_data.preferred_line or "All Machines"
    }
    insert_res = supabase.table("products").insert(new_prod).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create product")

    # Activity log
    try:
        supabase.table("activities").insert({
            "text": f'Created Product Master "{name}"',
            "activity_type": "success"
        }).execute()
    except Exception:
        pass

    return insert_res.data[0]

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("products").select("*").eq("id", product_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    existing_product = check.data[0]

    update_fields: Dict[str, Any] = {}
    if product_data.product_name is not None:
        renamed = product_data.product_name.strip()
        dup = supabase.table("products").select("id").ilike("product_name", renamed).neq("id", product_id).execute()
        if dup.data:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product name already in use")
        update_fields["product_name"] = renamed

    if product_data.category is not None:
        update_fields["category"] = product_data.category.strip()
    if product_data.processing_time is not None:
        update_fields["processing_time"] = product_data.processing_time
    if product_data.preferred_line is not None:
        update_fields["preferred_line"] = product_data.preferred_line

    if update_fields:
        res = supabase.table("products").update(update_fields).eq("id", product_id).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product")
        updated = res.data[0]
    else:
        updated = existing_product

    # Activity log
    p_name = updated.get("product_name", "Product")
    try:
        supabase.table("activities").insert({
            "text": f'Updated Product Master "{p_name}"',
            "activity_type": "info"
        }).execute()
    except Exception:
        pass

    return updated

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("products").select("product_name").eq("id", product_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    name = check.data[0]["product_name"]

    supabase.table("products").delete().eq("id", product_id).execute()

    try:
        supabase.table("activities").insert({
            "text": f'Deleted Product Master "{name}"',
            "activity_type": "danger"
        }).execute()
    except Exception:
        pass

    return {"message": f'Product "{name}" deleted successfully'}
