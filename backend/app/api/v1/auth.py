from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole, OfficerAssignment
from app.models.authority import Department, Office
from app.schemas.user import UserCreate, UserLogin, UserOut, Token, OfficerAssignmentOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_citizen(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new Citizen account.
    Security Enforcement: Citizens cannot self-assign privileged roles (Officer or Admin).
    """
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone_number=user_in.phone_number,
        preferred_language=user_in.preferred_language or "en",
        role=UserRole.CITIZEN,  # Strictly locked to CITIZEN
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id, role=new_user.role.value)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(new_user)
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates citizen, authority officer, or platform administrator."""
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )

    token = create_access_token(subject=user.id, role=user.role.value)
    
    # Load officer assignments if applicable
    assignments_out = []
    if user.role == UserRole.AUTHORITY_OFFICER:
        assignments = db.query(OfficerAssignment).filter(
            OfficerAssignment.officer_id == user.id,
            OfficerAssignment.is_active == True
        ).all()
        for a in assignments:
            dept = db.query(Department).filter(Department.id == a.department_id).first()
            office = db.query(Office).filter(Office.id == a.office_id).first()
            assignments_out.append(OfficerAssignmentOut(
                id=a.id,
                department_id=a.department_id,
                department_name=dept.name_en if dept else None,
                office_id=a.office_id,
                office_name=office.name if office else None,
                designation=a.designation
            ))

    user_out = UserOut.model_validate(user)
    user_out.assignments = assignments_out

    return Token(
        access_token=token,
        token_type="bearer",
        user=user_out
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns authenticated user profile and jurisdictional assignments."""
    assignments_out = []
    if current_user.role == UserRole.AUTHORITY_OFFICER:
        assignments = db.query(OfficerAssignment).filter(
            OfficerAssignment.officer_id == current_user.id,
            OfficerAssignment.is_active == True
        ).all()
        for a in assignments:
            dept = db.query(Department).filter(Department.id == a.department_id).first()
            office = db.query(Office).filter(Office.id == a.office_id).first()
            assignments_out.append(OfficerAssignmentOut(
                id=a.id,
                department_id=a.department_id,
                department_name=dept.name_en if dept else None,
                office_id=a.office_id,
                office_name=office.name if office else None,
                designation=a.designation
            ))
            
    user_out = UserOut.model_validate(current_user)
    user_out.assignments = assignments_out
    return user_out
