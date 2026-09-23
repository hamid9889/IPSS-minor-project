import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database import supabase
from backend.schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut
from backend.auth import get_current_user, require_admin, CurrentUser

router = APIRouter(tags=["Scheduling"])

def enrich_schedules(schedules: List[dict]) -> List[dict]:
    if not schedules:
        return []

    try:
        mach_res = supabase.table("machines").select("id, machine_name").execute()
        mach_map = {m["id"]: m.get("machine_name", "") for m in (mach_res.data or [])}
    except Exception:
        mach_map = {}

    try:
        prod_res = supabase.table("products").select("id, product_name").execute()
        prod_map = {p["id"]: p.get("product_name", "") for p in (prod_res.data or [])}
    except Exception:
        prod_map = {}

    try:
        order_res = supabase.table("orders").select("id, order_id, product_id").execute()
        order_data = order_res.data or []
        order_code_map = {o["id"]: o.get("order_id", "") for o in order_data}
        order_prod_map = {o["id"]: prod_map.get(o.get("product_id"), "") for o in order_data}
    except Exception:
        order_code_map = {}
        order_prod_map = {}

    for s in schedules:
        s["machine_name"] = mach_map.get(s.get("machine_id"), "")
        s["order_code"] = order_code_map.get(s.get("order_id"), "")
        s["product_name"] = order_prod_map.get(s.get("order_id"), "")

    return schedules

@router.get("", response_model=List[ScheduleOut])
def get_schedules(current_user: CurrentUser = Depends(get_current_user)):
    res = supabase.table("schedules").select("*").order("id").execute()
    schedules = res.data or []
    return enrich_schedules(schedules)

@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    data: ScheduleCreate,
    admin: CurrentUser = Depends(require_admin)
):
    # Verify machine exists
    mach_check = supabase.table("machines").select("id").eq("id", data.machine_id).execute()
    if not mach_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")

    # Verify order exists
    order_check = supabase.table("orders").select("id, priority").eq("id", data.order_id).execute()
    if not order_check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order = order_check.data[0]
    new_item = {
        "machine_id": data.machine_id,
        "order_id": data.order_id,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "priority": data.priority or order.get("priority") or "Medium",
        "status": data.status or "Scheduled"
    }

    insert_res = supabase.table("schedules").insert(new_item).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create schedule")

    enriched = enrich_schedules([insert_res.data[0]])
    return enriched[0]

@router.post("/generate", response_model=List[ScheduleOut])
def generate_schedule(admin: CurrentUser = Depends(require_admin)):
    # 1. Fetch pending orders
    orders_res = supabase.table("orders").select("*").in_("status", ["Pending", "In Progress"]).execute()
    pending_orders = orders_res.data or []

    if not pending_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending orders available to schedule"
        )

    # 2. Fetch operational machines
    mach_res = supabase.table("machines").select("*").in_("status", ["Available", "Working"]).execute()
    machines = mach_res.data or []

    if not machines:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No operational machines currently available"
        )

    # 3. Sort orders by Priority (High -> Medium -> Low), then Earliest Deadline
    priority_weights = {"High": 3, "Medium": 2, "Low": 1}

    def sort_key(order):
        weight = priority_weights.get(order.get("priority", "Medium"), 1)
        deadline = order.get("deadline") or "9999-12-31"
        return (-weight, deadline)

    sorted_orders = sorted(pending_orders, key=sort_key)

    # Fetch product processing times
    try:
        prod_res = supabase.table("products").select("id, processing_time").execute()
        prod_proc_map = {p["id"]: p.get("processing_time", 0.05) for p in (prod_res.data or [])}
    except Exception:
        prod_proc_map = {}

    # 4. Clear existing schedules to regenerate optimal schedule
    try:
        supabase.table("schedules").delete().neq("id", 0).execute()
    except Exception:
        pass

    # 5. Allocate orders to machines
    rows_to_insert = []
    start_hour = 9

    for i, order in enumerate(sorted_orders):
        assigned_machine = machines[i % len(machines)]
        proc_time = prod_proc_map.get(order.get("product_id"), 0.05)
        qty = order.get("quantity", 50)
        duration_hours = max(1, math.ceil(proc_time * (qty / 50.0)))

        start_time_str = f"{start_hour:02d}:00"
        end_hour = start_hour + duration_hours
        end_time_str = f"{end_hour:02d}:00"

        rows_to_insert.append({
            "machine_id": assigned_machine["id"],
            "order_id": order["id"],
            "start_time": start_time_str,
            "end_time": end_time_str,
            "priority": order.get("priority", "Medium"),
            "status": "Scheduled"
        })

        start_hour += duration_hours

    insert_res = supabase.table("schedules").insert(rows_to_insert).execute()
    new_schedules = insert_res.data or []

    try:
        supabase.table("activities").insert({
            "text": "Generated production schedule",
            "activity_type": "success"
        }).execute()
    except Exception:
        pass

    return enrich_schedules(new_schedules)

@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("schedules").select("*").eq("id", schedule_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    update_fields = {}
    if data.machine_id is not None:
        update_fields["machine_id"] = data.machine_id
    if data.order_id is not None:
        update_fields["order_id"] = data.order_id
    if data.start_time is not None:
        update_fields["start_time"] = data.start_time
    if data.end_time is not None:
        update_fields["end_time"] = data.end_time
    if data.priority is not None:
        update_fields["priority"] = data.priority
    if data.status is not None:
        update_fields["status"] = data.status

    if update_fields:
        res = supabase.table("schedules").update(update_fields).eq("id", schedule_id).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update schedule")
        updated = res.data[0]
    else:
        updated = check.data[0]

    enriched = enrich_schedules([updated])
    return enriched[0]

@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("schedules").select("id").eq("id", schedule_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found")

    supabase.table("schedules").delete().eq("id", schedule_id).execute()
    return {"message": "Schedule entry deleted successfully"}

@router.delete("/clear")
def clear_schedules(admin: CurrentUser = Depends(require_admin)):
    supabase.table("schedules").delete().neq("id", 0).execute()
    return {"message": "All schedule entries cleared"}
