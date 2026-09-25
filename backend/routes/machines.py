from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from backend.database import supabase
from backend.schemas import MachineCreate, MachineUpdate, MachineOut
from backend.auth import get_current_user, require_admin, CurrentUser

router = APIRouter(prefix="/api/machines", tags=["Machines"])

@router.get("", response_model=List[MachineOut])
def get_machines(
    search: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    query = supabase.table("machines").select("*").order("id")
    response = query.execute()
    machines = response.data or []

    if search:
        term = search.strip().lower()
        machines = [
            m for m in machines
            if term in (m.get("machine_name") or "").lower()
        ]

    return machines

@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(
    machine_id: int,
    current_user: CurrentUser = Depends(get_current_user)
):
    response = supabase.table("machines").select("*").eq("id", machine_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    return response.data[0]

@router.post("", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
def create_machine(
    machine_data: MachineCreate,
    admin: CurrentUser = Depends(require_admin)
):
    name = machine_data.machine_name.strip()
    # Check duplicate machine name (case-insensitive)
    existing = supabase.table("machines").select("id").ilike("machine_name", name).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A machine with this name already exists"
        )

    new_machine = {
        "machine_name": name,
        "capacity": machine_data.capacity,
        "status": machine_data.status or "Available"
    }
    insert_res = supabase.table("machines").insert(new_machine).execute()
    if not insert_res.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create machine")

    try:
        supabase.table("activities").insert({
            "text": f'Added machine "{name}"',
            "activity_type": "success"
        }).execute()
    except Exception:
        pass

    return insert_res.data[0]

@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("machines").select("*").eq("id", machine_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    existing_machine = check.data[0]

    update_fields: Dict[str, Any] = {}
    if machine_data.machine_name is not None:
        name = machine_data.machine_name.strip()
        dup = supabase.table("machines").select("id").ilike("machine_name", name).neq("id", machine_id).execute()
        if dup.data:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Machine name already in use")
        update_fields["machine_name"] = name

    if machine_data.capacity is not None:
        update_fields["capacity"] = machine_data.capacity

    if machine_data.status is not None:
        update_fields["status"] = machine_data.status

    if update_fields:
        res = supabase.table("machines").update(update_fields).eq("id", machine_id).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update machine")
        updated = res.data[0]
    else:
        updated = existing_machine

    m_name = updated.get("machine_name", "Machine")
    m_status = updated.get("status", "")
    try:
        supabase.table("activities").insert({
            "text": f'Updated machine "{m_name}" ({m_status})',
            "activity_type": "warning"
        }).execute()
    except Exception:
        pass

    return updated

@router.delete("/{machine_id}")
def delete_machine(
    machine_id: int,
    admin: CurrentUser = Depends(require_admin)
):
    check = supabase.table("machines").select("machine_name").eq("id", machine_id).execute()
    if not check.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    name = check.data[0]["machine_name"]

    supabase.table("machines").delete().eq("id", machine_id).execute()

    try:
        supabase.table("activities").insert({
            "text": f'Deleted machine "{name}"',
            "activity_type": "danger"
        }).execute()
    except Exception:
        pass

    return {"message": f'Machine "{name}" deleted successfully'}
