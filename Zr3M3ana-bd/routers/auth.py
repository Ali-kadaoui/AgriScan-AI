import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import User
import schemas

router = APIRouter(tags=["Auth"])

@router.post("/signup")
async def signup(req: schemas.SignupRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user: return {"status": "error", "message": "Email already exists"}
    new_user = User(id=str(uuid.uuid4()), username=req.name, email=req.email, password=req.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user": {"id": new_user.id, "name": new_user.username}}

@router.post("/login")
async def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.password == req.password).first()
    if not user: return {"status": "error", "message": "Invalid email or password"}
    return {"status": "success", "user": {"id": user.id, "name": user.username}}

@router.post("/users/verify-password")
async def verify_password(req: schemas.UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or user.password != req.password: return {"status": "error", "message": "Incorrect password"}
    return {"status": "success"}

@router.post("/users/update")
async def update_user(req: schemas.UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    # 1. On vérifie que les champs ne sont pas vides avant de les modifier
    if req.username and req.username.strip() != "":
        user.username = req.username
        
    if req.email and req.email.strip() != "":
        user.email = req.email
        
    if req.password and req.password.strip() != "":
        user.password = req.password
        
    # 2. On essaie de sauvegarder, et on gère l'erreur d'email en double
    try:
        db.commit()
        return {"status": "success", "message": "Profile updated!"}
    except IntegrityError:
        # Si la base de données refuse (email déjà pris), on annule et on prévient le front
        db.rollback()
        return {"status": "error", "message": "Cet email est déjà utilisé par un autre compte."}