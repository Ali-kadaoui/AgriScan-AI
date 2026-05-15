import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessage
import schemas
from config import client, MOCK_AI

router = APIRouter(tags=["Chat"])

@router.post("/chat")
async def chat_bot(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    try:
        if req.user_id:
            db.add(ChatMessage(id=str(uuid.uuid4()), user_id=req.user_id, scan_id=req.scan_id, sender="user", message_text=req.message))
            db.commit()

        if MOCK_AI:
            ai_reply = f"(Mock Mode) You said: '{req.message}'"
        else:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": f"You are AgriBot, an expert Moroccan agronomist. IMPORTANT: You must automatically detect the language the user is speaking (English, Arabic, or French) and reply entirely in that EXACT same language. Provide detailed, helpful answers and step-by-step instructions. USER CONTEXT: {req.plant_context}."},
                    {"role": "user", "content": req.message}
                ]
            )
            ai_reply = response.choices[0].message.content
        
        if req.user_id:
            db.add(ChatMessage(id=str(uuid.uuid4()), user_id=req.user_id, scan_id=req.scan_id, sender="ai", message_text=ai_reply))
            db.commit()
        return {"reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))