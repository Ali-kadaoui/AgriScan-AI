from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) 
    created_at = Column(DateTime, default=datetime.utcnow)

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    image_path = Column(String)
    disease_detected = Column(String)
    confidence_score = Column(String)
    treatment_recommended = Column(Text)
    scan_date = Column(DateTime, default=datetime.utcnow)

class PlantWiki(Base):
    __tablename__ = "plants_wiki"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    scientific_name = Column(String)
    watering = Column(String)
    sunlight = Column(String)
    soil = Column(String)
    temperature = Column(String)
    harvest_time = Column(String)
    fertilizer = Column(String)
    diseases = Column(String)
    description = Column(Text)
    image_url = Column(String)

class UserSavedPlant(Base):
    __tablename__ = "user_saved_plants"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    plant_id = Column(String, ForeignKey("plants_wiki.id"))
    saved_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    scan_id = Column(String, ForeignKey("scan_history.id"), nullable=True)
    sender = Column(String)
    message_text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)