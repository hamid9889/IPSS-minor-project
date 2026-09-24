import random
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database import supabase
from backend.schemas import OrderCreate, OrderUpdate, OrderOut
from backend.auth import require_admin, CurrentUser

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def get_product_map() -> Dict[Any, str]:
    """Return dictionary of product_id -> product_name."""
    try:
        res = supabase.table("products").select("id, product_name").execute()
        return {p["id"]: p.get("product_name", "") for p in (res.data or [])}
    except Exception:
        return {}

def generate_unique_order_id() -> str:
    while True:
        candidate = f"ORD-{random.randint(100, 999)}"
        res = supabase.table("orders").select("id").eq("order_id", candidate).execute()
        if not res.data:
            return candidate

def find_order_record(identifier: str) -> Optional[dict]:
    clean_id = identifier.strip()
    if clean_id.isdigit():
        res = supabase.table("orders").select("*").eq("id", int(clean_id)).execute()
        if res.data:
            return res.data[0]
    res = supabase.table("orders").select("*").eq("order_id", clean_id).execute()
    if res.data:
        return res.data[0]
    return None

def resolve_or_create_product(product_name: str, processing_time: Optional[float] = 0.05) -> dict:
    p_name = product_name.strip()
    res = supabase.table("products").select("*").eq("product_name", p_name).execute()
    if res.data:
        return res.data[0]

    # Create missing product automatically
    new_prod = {
        "product_name": p_name,
        "category": "General",
        "processing_time": processing_time or 0.05,
        "preferred_line": "All Machines"
    }
    insert_res = supabase.table("products").insert(new_prod).execute()
    if insert_res.data:
        return insert_res.data[0]
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to resolve product")

@router.get("", response_model=List[OrderOut])
def get_orders(
    search: Optional[str] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = None,
    admin: CurrentUser = Depends(require_admin)
):
    prod_map = get_product_map()
    res = supabase.table("orders").select("*").order("id", desc=True).execute()
    orders = res.data or []

    for o in orders:
        o["product_name"] = prod_map.get(o.get("product_id"), "")

    if search:
        pattern = search.strip().lower()
        orders = [
            o for o in orders
            if pattern in (o.get("order_id") or "").lower() or pattern in (o.get("product_name") or "").lower()
        ]

    if priority and priority != "All":
        orders = [o for o in orders if o.get("priority") == priority]

    if status_filter and status_filter != "All":
        if status_filter == "Delayed":
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            orders = [
                o for o in orders
                if (o.get("deadline") or "") < today and o.get("status") != "Completed"
            ]
        else:
            orders = [o for o in orders if o.get("status") == status_filter]

    return orders

@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    order = find_order_record(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    prod_map = get_product_map()
    order["product_name"] = prod_map.get(order.get("product_id"), "")
    return order

@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    admin: CurrentUser = Depends(require_admin)
):
    order_id = order_data.order_id.strip() if order_data.order_id else generate_unique_order_id()

    # Check for duplicate order_id
    existing = supabase.table("orders").select("id").eq("order_id", order_id).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Order ID '{order_id}' already exists"
        )

    product = resolve_or_create_product(order_data.product_name, order_data.processing_time)
    proc_time = order_data.processing_time or product.get("processing_time") or 0.05

    new_order = {
        "order_id": order_id,
        "product_id": product["id"],
        "quantity": order_data.quantity,
        "priority": order_data.priority or "Medium",
        "deadline": order_data.deadline.strip(),
        "processing_time": proc_time,
        "status": order_data.status or "Pending",
        "user_id": admin.get("id")
    }

    insert_res = supabase.table("orders").insert(new_order).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order")

    created = insert_res.data[0]
    created["product_name"] = product.get("product_name", order_data.product_name)

    try:
        supabase.table("activities").insert({
            "text": f'Order #{order_id} created',
            "activity_type": "info"
        }).execute()
    except Exception:
        pass

    return created

@router.post("/bulk", response_model=List[OrderOut], status_code=status.HTTP_201_CREATED)
def create_bulk_orders(
    orders_data: List[OrderCreate],
    admin: CurrentUser = Depends(require_admin)
):
    if not orders_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No orders provided")

    rows_to_insert = []
    prod_name_map = {}

    for item in orders_data:
        order_id = item.order_id.strip() if item.order_id else generate_unique_order_id()
        existing = supabase.table("orders").select("id").eq("order_id", order_id).execute()
        if existing.data:
            order_id = generate_unique_order_id()

        product = resolve_or_create_product(item.product_name, item.processing_time)
        proc_time = item.processing_time or product.get("processing_time") or 0.05
        prod_name_map[order_id] = product.get("product_name", item.product_name)

        rows_to_insert.append({
            "order_id": order_id,
            "product_id": product["id"],
            "quantity": item.quantity,
            "priority": item.priority or "Medium",
            "deadline": item.deadline.strip(),
            "processing_time": proc_time,
            "status": item.status or "Pending",
            "user_id": admin.get("id")
        })

    insert_res = supabase.table("orders").insert(rows_to_insert).execute()
    created_orders = insert_res.data or []

    for o in created_orders:
        o["product_name"] = prod_name_map.get(o.get("order_id"), "")

    try:
        supabase.table("activities").insert({
            "text": f'Imported {len(created_orders)} bulk orders to system',
            "activity_type": "success"
        }).execute()
    except Exception:
        pass

    return created_orders

@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: str,
    order_data: OrderUpdate,
    admin: CurrentUser = Depends(require_admin)
):
    order = find_order_record(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    update_fields: Dict[str, Any] = {}
    product_name = None

    if order_data.product_name is not None:
        product = resolve_or_create_product(order_data.product_name)
        update_fields["product_id"] = product["id"]
        product_name = product.get("product_name")

    if order_data.quantity is not None:
        update_fields["quantity"] = order_data.quantity

    if order_data.priority is not None:
        update_fields["priority"] = order_data.priority

    if order_data.deadline is not None:
        update_fields["deadline"] = order_data.deadline.strip()

    if order_data.status is not None:
        update_fields["status"] = order_data.status

    if update_fields:
        res = supabase.table("orders").update(update_fields).eq("id", order["id"]).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update order")
        updated = res.data[0]
    else:
        updated = order

    prod_map = get_product_map()
    updated["product_name"] = product_name or prod_map.get(updated.get("product_id"), "")

    oid = updated.get("order_id", order_id)
    try:
        supabase.table("activities").insert({
            "text": f'Updated Order #{oid}',
            "activity_type": "info"
        }).execute()
    except Exception:
        pass

    return updated

@router.delete("/{order_id}")
def delete_order(
    order_id: str,
    admin: CurrentUser = Depends(require_admin)
):
    order = find_order_record(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    oid = order["order_id"]
    supabase.table("orders").delete().eq("id", order["id"]).execute()

    try:
        supabase.table("activities").insert({
            "text": f'Deleted Order #{oid}',
            "activity_type": "danger"
        }).execute()
    except Exception:
        pass

    return {"message": f'Order #{oid} deleted successfully'}
