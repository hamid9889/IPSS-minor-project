from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Product, Machine, Order, Activity, User
from backend.auth import get_current_user

router = APIRouter(prefix="", tags=["Reports & Dashboard"])

@router.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    total_products = db.query(Product).count()
    total_machines = db.query(Machine).count()
    total_orders = db.query(Order).count()

    pending_orders = db.query(Order).filter(Order.status == "Pending").count()
    completed_orders = db.query(Order).filter(Order.status == "Completed").count()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    delayed_orders = db.query(Order).filter(
        Order.deadline < today_str,
        Order.status != "Completed"
    ).count()

    completion_percentage = round((completed_orders / total_orders) * 100) if total_orders > 0 else 0

    # Machine status list
    machines = db.query(Machine).all()
    machine_status_list = []
    maintenance_count = 0

    for m in machines:
        if m.status == "Working":
            util = "70%"
            badge_class = "badge-warning"
        elif m.status == "Maintenance":
            util = "0%"
            badge_class = "badge-danger"
            maintenance_count += 1
        else:
            util = "85%"
            badge_class = "badge-success"

        machine_status_list.append({
            "id": m.id,
            "machineName": m.machine_name,
            "capacity": m.capacity,
            "status": m.status,
            "utilization": util,
            "badgeClass": badge_class
        })

    # Upcoming pending deadlines (top 4)
    upcoming_orders = db.query(Order).filter(
        Order.status == "Pending"
    ).order_by(Order.deadline.asc()).limit(4).all()

    upcoming_list = [
        {
            "orderId": o.order_id,
            "productName": o.product_name,
            "deadline": o.deadline,
            "status": "Approaching"
        }
        for o in upcoming_orders
    ]

    # Recent activities (top 8)
    activities = db.query(Activity).order_by(Activity.id.desc()).limit(8).all()
    activity_list = [
        {
            "id": a.id,
            "text": a.text,
            "time": "Recent",
            "type": a.activity_type
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    total_orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(Order.status == "Completed").count()
    pending_orders = db.query(Order).filter(Order.status == "Pending").count()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    delayed_orders = db.query(Order).filter(
        Order.deadline < today_str,
        Order.status != "Completed"
    ).count()

    machines = db.query(Machine).all()
    total_machines = len(machines)
    available_machines = sum(1 for m in machines if m.status == "Available")
    working_machines = sum(1 for m in machines if m.status == "Working")

    utilization = round((working_machines / total_machines) * 100) if total_machines > 0 else 0

    comp_pct = round((completed_orders / total_orders) * 100) if total_orders > 0 else 0
    pend_pct = round((pending_orders / total_orders) * 100) if total_orders > 0 else 0
    del_pct = round((delayed_orders / total_orders) * 100) if total_orders > 0 else 0

    machine_usage_list = []
    for m in machines:
        if m.status == "Working":
            usage = "95%"
        elif m.status == "Maintenance":
            usage = "0%"
        else:
            usage = "80%"
        machine_usage_list.append({
            "machineName": m.machine_name,
            "status": m.status,
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
