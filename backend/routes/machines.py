from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Machine, Activity, User
from backend.schemas import MachineCreate, MachineUpdate, MachineOut
from backend.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/machines", tags=["Machines"])

@router.get("", response_model=List[MachineOut])
def get_machines(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Machine)
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(Machine.machine_name.ilike(search_pattern))
    return query.order_by(Machine.id.asc()).all()

@router.get("/{machine_id}", response_model=MachineOut)
def get_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")
    return machine

@router.post("", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
def create_machine(
    machine_data: MachineCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Check duplicate machine name
    name = machine_data.machine_name.strip()
    existing = db.query(Machine).filter(Machine.machine_name == name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A machine with this name already exists"
        )

    new_machine = Machine(
        machine_name=name,
        capacity=machine_data.capacity,
        status=machine_data.status or "Available"
    )
    db.add(new_machine)

    activity = Activity(
        text=f'Added machine "{new_machine.machine_name}"',
        activity_type="success"
    )
    db.add(activity)

    db.commit()
    db.refresh(new_machine)
    return new_machine

@router.put("/{machine_id}", response_model=MachineOut)
def update_machine(
    machine_id: int,
    machine_data: MachineUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")

    if machine_data.machine_name is not None:
        name = machine_data.machine_name.strip()
        existing = db.query(Machine).filter(Machine.machine_name == name, Machine.id != machine_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Machine name already in use")
        machine.machine_name = name

    if machine_data.capacity is not None:
        machine.capacity = machine_data.capacity

    if machine_data.status is not None:
        machine.status = machine_data.status

    activity = Activity(
        text=f'Updated machine "{machine.machine_name}" ({machine.status})',
        activity_type="warning"
    )
    db.add(activity)

    db.commit()
    db.refresh(machine)
    return machine

@router.delete("/{machine_id}")
def delete_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    machine = db.query(Machine).filter(Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine not found")

    name = machine.machine_name
    db.delete(machine)

    activity = Activity(
        text=f'Deleted machine "{name}"',
        activity_type="danger"
    )
    db.add(activity)

    db.commit()
    return {"message": f'Machine "{name}" deleted successfully'}
