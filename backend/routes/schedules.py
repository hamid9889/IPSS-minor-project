import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Schedule, Order, Machine, Activity, User
from backend.schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut
from backend.auth import get_current_user, require_admin

router = APIRouter(tags=["Scheduling"])


@router.get("", response_model=List[ScheduleOut])
def get_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Schedule).order_by(Schedule.id.asc()).all()


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    data: ScheduleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    machine = db.query(Machine).filter(Machine.id == data.machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")

    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    new_schedule = Schedule(
        machine_id=data.machine_id,
        order_id=data.order_id,
        start_time=data.start_time,
        end_time=data.end_time,
        priority=data.priority or order.priority or "Medium",
        status=data.status or "Scheduled"
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule


@router.post("/generate", response_model=List[ScheduleOut])
def generate_schedule(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # 1. Fetch pending orders
    pending_orders = db.query(Order).filter(
        Order.status.in_(["Pending", "In Progress"])
    ).all()

    if not pending_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending orders available to schedule"
        )

    # 2. Fetch operational machines
    machines = db.query(Machine).filter(
        Machine.status.in_(["Available", "Working"])
    ).all()

    if not machines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No operational machines currently available"
        )

    # 3. Sort orders by Priority (High -> Medium -> Low), then Earliest Deadline
    priority_weights = {"High": 3, "Medium": 2, "Low": 1}

    def sort_key(order):
        weight = priority_weights.get(order.priority, 1)
        deadline = order.deadline or "9999-12-31"
        return (-weight, deadline)

    sorted_orders = sorted(pending_orders, key=sort_key)

    # 4. Clear existing schedules to regenerate optimal schedule
    db.query(Schedule).delete()

    # 5. Allocate orders to machines round-robin
    new_schedules = []
    start_hour = 9

    for i, order in enumerate(sorted_orders):
        assigned_machine = machines[i % len(machines)]
        product = order.product

        if product:
            duration_hours = max(1, math.ceil(product.processing_time * (order.quantity / 50.0)))
        else:
            duration_hours = 2

        start_time_str = f"{start_hour:02d}:00"
        end_hour = start_hour + duration_hours
        end_time_str = f"{end_hour:02d}:00"

        schedule_item = Schedule(
            machine_id=assigned_machine.id,
            order_id=order.id,
            start_time=start_time_str,
            end_time=end_time_str,
            priority=order.priority,
            status="Scheduled"
        )
        db.add(schedule_item)
        new_schedules.append(schedule_item)

        start_hour += duration_hours

    activity = Activity(
        text="Generated production schedule",
        activity_type="success"
    )
    db.add(activity)

    db.commit()
    for s in new_schedules:
        db.refresh(s)

    return new_schedules


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    if data.machine_id is not None:
        schedule.machine_id = data.machine_id
    if data.order_id is not None:
        schedule.order_id = data.order_id
    if data.start_time is not None:
        schedule.start_time = data.start_time
    if data.end_time is not None:
        schedule.end_time = data.end_time
    if data.priority is not None:
        schedule.priority = data.priority
    if data.status is not None:
        schedule.status = data.status

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    db.delete(schedule)
    db.commit()
    return {"message": "Schedule entry deleted successfully"}


@router.delete("/clear")
def clear_schedules(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    db.query(Schedule).delete()
    db.commit()
    return {"message": "All schedule entries cleared"}
