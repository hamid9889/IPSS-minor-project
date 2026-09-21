import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Order, Product, Activity, User
from backend.schemas import OrderCreate, OrderUpdate, OrderOut
from backend.auth import require_admin

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def generate_unique_order_id(db: Session) -> str:
    while True:
        candidate = f"ORD-{random.randint(100, 999)}"
        existing = db.query(Order).filter(Order.order_id == candidate).first()
        if not existing:
            return candidate


def find_order(db: Session, identifier: str) -> Optional[Order]:
    """Find order by either database integer ID or string order_id code (e.g. ORD-101)."""
    clean_id = str(identifier).strip()
    if clean_id.isdigit():
        order = db.query(Order).filter(Order.id == int(clean_id)).first()
        if order:
            return order
    return db.query(Order).filter(Order.order_id == clean_id).first()


@router.get("", response_model=List[OrderOut])
def get_orders(
    search: Optional[str] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(Order).join(Product, Order.product_id == Product.id, isouter=True)

    if search:
        pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            (Order.order_id.ilike(pattern)) | 
            (Product.product_name.ilike(pattern))
        )

    if priority and priority != "All":
        query = query.filter(Order.priority == priority)

    if status_filter and status_filter != "All":
        if status_filter == "Delayed":
            today = datetime.utcnow().strftime("%Y-%m-%d")
            query = query.filter(Order.deadline < today, Order.status != "Completed")
        else:
            query = query.filter(Order.status == status_filter)

    return query.order_by(Order.id.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    order = find_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    order_id = order_data.order_id.strip() if order_data.order_id else generate_unique_order_id(db)

    # Check for duplicate order_id
    existing = db.query(Order).filter(Order.order_id == order_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Order ID '{order_id}' already exists"
        )

    # Find or auto-create product
    p_name = order_data.product_name.strip()
    product = db.query(Product).filter(Product.product_name == p_name).first()
    if not product:
        product = Product(
            product_name=p_name,
            category="General",
            processing_time=order_data.processing_time or 0.05,
            preferred_line="All Machines"
        )
        db.add(product)
        db.flush()

    proc_time = order_data.processing_time or product.processing_time or 0.05

    new_order = Order(
        order_id=order_id,
        product_id=product.id,
        quantity=order_data.quantity,
        priority=order_data.priority or "Medium",
        deadline=order_data.deadline.strip(),
        processing_time=proc_time,
        status=order_data.status or "Pending",
        user_id=admin.id
    )
    db.add(new_order)

    activity = Activity(
        text=f'Order #{new_order.order_id} created',
        activity_type="info"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.post("/bulk", response_model=List[OrderOut], status_code=status.HTTP_201_CREATED)
def create_bulk_orders(
    orders_data: List[OrderCreate],
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not orders_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No orders provided")

    created_orders = []
    for item in orders_data:
        order_id = item.order_id.strip() if item.order_id else generate_unique_order_id(db)
        if db.query(Order).filter(Order.order_id == order_id).first():
            order_id = generate_unique_order_id(db)

        p_name = item.product_name.strip()
        product = db.query(Product).filter(Product.product_name == p_name).first()
        if not product:
            product = Product(
                product_name=p_name,
                category="General",
                processing_time=item.processing_time or 0.05,
                preferred_line="All Machines"
            )
            db.add(product)
            db.flush()

        proc_time = item.processing_time or product.processing_time or 0.05

        order = Order(
            order_id=order_id,
            product_id=product.id,
            quantity=item.quantity,
            priority=item.priority or "Medium",
            deadline=item.deadline.strip(),
            processing_time=proc_time,
            status=item.status or "Pending",
            user_id=admin.id
        )
        db.add(order)
        created_orders.append(order)

    activity = Activity(
        text=f'Imported {len(created_orders)} bulk orders to system',
        activity_type="success"
    )
    db.add(activity)

    db.commit()
    for o in created_orders:
        db.refresh(o)
    return created_orders


@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: str,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    order = find_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order_data.product_name is not None:
        p_name = order_data.product_name.strip()
        product = db.query(Product).filter(Product.product_name == p_name).first()
        if not product:
            product = Product(
                product_name=p_name,
                category="General",
                processing_time=order.processing_time or 0.05,
                preferred_line="All Machines"
            )
            db.add(product)
            db.flush()
        order.product_id = product.id

    if order_data.quantity is not None:
        order.quantity = order_data.quantity

    if order_data.priority is not None:
        order.priority = order_data.priority

    if order_data.deadline is not None:
        order.deadline = order_data.deadline.strip()

    if order_data.status is not None:
        order.status = order_data.status

    activity = Activity(
        text=f'Updated Order #{order.order_id}',
        activity_type="info"
    )
    db.add(activity)

    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}")
def delete_order(
    order_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    order = find_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    oid = order.order_id
    db.delete(order)

    activity = Activity(
        text=f'Deleted Order #{oid}',
        activity_type="danger"
    )
    db.add(activity)

    db.commit()
    return {"message": f'Order #{oid} deleted successfully'}
