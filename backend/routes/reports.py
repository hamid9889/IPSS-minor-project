from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends
from backend.database import supabase
from backend.auth import get_current_user, CurrentUser

router = APIRouter(prefix="", tags=["Reports & Dashboard"])

@router.get("/api/dashboard/stats")
def get_dashboard_stats(
    current_user: CurrentUser = Depends(get_current_user)
) -> Dict[str, Any]:
    try:
        p_res = supabase.table("products").select("id, product_name").execute()
        products = p_res.data or []
        prod_map = {p["id"]: p.get("product_name", "") for p in products}
    except Exception:
        products = []
        prod_map = {}

    try:
        m_res = supabase.table("machines").select("*").order("id").execute()
        machines = m_res.data or []
    except Exception:
        machines = []

    try:
        o_res = supabase.table("orders").select("*").order("id", desc=True).execute()
        orders = o_res.data or []
    except Exception:
        orders = []

    total_products = len(products)
    total_machines = len(machines)
    total_orders = len(orders)

    pending_orders = sum(1 for o in orders if o.get("status") == "Pending")
    completed_orders = sum(1 for o in orders if o.get("status") == "Completed")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    delayed_orders = sum(
        1 for o in orders
        if (o.get("deadline") or "") < today_str and o.get("status") != "Completed"
    )

    completion_percentage = round((completed_orders / total_orders) * 100) if total_orders > 0 else 0

    machine_status_list = []
    maintenance_count = 0

    for m in machines:
        st = m.get("status", "Available")
        if st == "Working":
            util = "70%"
            badge_class = "badge-warning"
        elif st == "Maintenance":
            util = "0%"
            badge_class = "badge-danger"
            maintenance_count += 1
        else:
            util = "85%"
            badge_class = "badge-success"

        machine_status_list.append({
            "id": m["id"],
            "machineName": m.get("machine_name", ""),
            "capacity": m.get("capacity", 0),
            "status": st,
            "utilization": util,
            "badgeClass": badge_class
        })

    # Upcoming pending deadlines (top 4 earliest deadlines)
    pending_list = [o for o in orders if o.get("status") == "Pending"]
    pending_sorted = sorted(pending_list, key=lambda x: x.get("deadline") or "9999-12-31")[:4]

    upcoming_list = [
        {
            "orderId": o.get("order_id", ""),
            "productName": prod_map.get(o.get("product_id"), "Product"),
            "deadline": o.get("deadline", ""),
            "status": "Approaching"
        }
        for o in pending_sorted
    ]

    # Recent activities (top 8)
    try:
        act_res = supabase.table("activities").select("*").order("id", desc=True).limit(8).execute()
        activities = act_res.data or []
    except Exception:
        activities = []

    activity_list = [
        {
            "id": a["id"],
            "text": a.get("text", ""),
            "time": "Recent",
            "type": a.get("activity_type", "info")
        }
        for a in activities
    ]

    return {
        "totalProducts": total_products,
        "totalMachines": total_machines,
        "totalOrders": total_orders,
        "pendingOrders": pending_orders,
        "completedOrders": completed_orders,
        "delayedOrders": delayed_orders,
        "completionPercentage": completion_percentage,
        "maintenanceCount": maintenance_count,
        "machineStatuses": machine_status_list,
        "upcomingDeadlines": upcoming_list,
        "recentActivities": activity_list
    }

@router.get("/api/reports/summary")
def get_reports_summary(
    current_user: CurrentUser = Depends(get_current_user)
) -> Dict[str, Any]:
    try:
        o_res = supabase.table("orders").select("*").execute()
        orders = o_res.data or []
    except Exception:
        orders = []

    try:
        m_res = supabase.table("machines").select("*").execute()
        machines = m_res.data or []
    except Exception:
        machines = []

    total_orders = len(orders)
    completed_orders = sum(1 for o in orders if o.get("status") == "Completed")
    pending_orders = sum(1 for o in orders if o.get("status") == "Pending")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    delayed_orders = sum(
        1 for o in orders
        if (o.get("deadline") or "") < today_str and o.get("status") != "Completed"
    )

    total_machines = len(machines)
    available_machines = sum(1 for m in machines if m.get("status") == "Available")
    working_machines = sum(1 for m in machines if m.get("status") == "Working")

    utilization = round((working_machines / total_machines) * 100) if total_machines > 0 else 0

    comp_pct = round((completed_orders / total_orders) * 100) if total_orders > 0 else 0
    pend_pct = round((pending_orders / total_orders) * 100) if total_orders > 0 else 0
    del_pct = round((delayed_orders / total_orders) * 100) if total_orders > 0 else 0

    machine_usage_list = []
    for m in machines:
        st = m.get("status", "Available")
        if st == "Working":
            usage = "95%"
        elif st == "Maintenance":
            usage = "0%"
        else:
            usage = "80%"
        machine_usage_list.append({
            "machineName": m.get("machine_name", ""),
            "status": st,
            "usagePct": usage
        })

    return {
        "totalOrders": total_orders,
        "completedOrders": completed_orders,
        "pendingOrders": pending_orders,
        "delayedOrders": delayed_orders,
        "totalMachines": total_machines,
        "availableMachines": available_machines,
        "machineUtilization": utilization,
        "distribution": {
            "completedPct": comp_pct,
            "pendingPct": pend_pct,
            "delayedPct": del_pct
        },
        "machineUsage": machine_usage_list,
        "completionRate": f"{comp_pct}%",
        "operationalEfficiency": "88%",
        "averageDelay": "0.5 Days"
    }
