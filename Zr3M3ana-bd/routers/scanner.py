import os
import uuid
import json
import shutil
import base64
import io
import re
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ScanHistory, ChatMessage
import schemas
from config import client, MOCK_AI, enforce_string

router = APIRouter(tags=["Scanner"])

@router.post("/predict")
async def predict(file: UploadFile = File(...), user_id: str = Form(...), db: Session = Depends(get_db)):
    scan_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    saved_filename = f"{scan_id}.{file_extension}"
    file_location = f"assets/{saved_filename}"

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    plant_name, condition, confidence_score, dynamic_treatment = "Unknown Plant", "Unknown Condition", "0%", "Could not analyze the image."

    try:
        if MOCK_AI:
            plant_name, condition, confidence_score, dynamic_treatment = "Sample Plant", "Healthy", "99%", "Mock Mode Active."
        else:
            with Image.open(file_location) as img:
                img = img.convert("RGB")
                img.thumbnail((800, 800))
                buffered = io.BytesIO()
                img.save(buffered, format="JPEG", quality=85)
                base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            response = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct", 
                messages=[
                    {"role": "user", "content": [
                        {"type": "text", "text": "Analyze this plant image. Provide the plant name, disease condition, confidence percentage, and highly detailed step-by-step treatment instructions along with necessary background information. Return ONLY valid JSON format with exactly these string keys: 'plant_name', 'condition', 'confidence', 'treatment'. Do not return arrays, only strings."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]}
                ]
            )
            
            raw_text = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match: raw_text = json_match.group(0)

            ai_data = json.loads(raw_text)
            plant_name = enforce_string(ai_data.get("plant_name", "Unknown Plant"))
            condition = enforce_string(ai_data.get("condition", "Unknown Condition"))
            confidence_score = enforce_string(ai_data.get("confidence", "85%"))
            dynamic_treatment = enforce_string(ai_data.get("treatment", "Consult local agricultural guidelines."))
            
    except Exception as e:
        print(f"Groq Vision Error: {e}")
        dynamic_treatment = f"API Error: {str(e)}"
    
    return {"id": scan_id, "user_id": user_id, "image_url": file_location, "plantName": plant_name, "disease": condition, "confidence": confidence_score, "treatment": dynamic_treatment}

@router.post("/scans/save")
async def save_scan(req: schemas.SaveScanRequest, db: Session = Depends(get_db)):
    new_scan = ScanHistory(id=str(uuid.uuid4()), user_id=req.user_id, image_path=req.image_url, disease_detected=req.disease, confidence_score=req.confidence, treatment_recommended=req.treatment)
    db.add(new_scan)
    db.commit()
    return {"status": "success", "id": new_scan.id}

@router.get("/users/{user_id}/scans")
async def get_scans(user_id: str, db: Session = Depends(get_db)):
    scans = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).all()
    results = []
    for s in scans:
        p_name, d_name = s.disease_detected.split(" - ", 1) if " - " in s.disease_detected else ("Unknown Plant", s.disease_detected)
        results.append({"id": s.id, "user_id": s.user_id, "image_url": s.image_path, "plantName": p_name, "disease": d_name, "confidence": s.confidence_score, "treatment": s.treatment_recommended})
    return results

@router.delete("/scans/{scan_id}")
async def delete_user_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
    if not scan: raise HTTPException(status_code=404, detail="Scan not found")
    db.query(ChatMessage).filter(ChatMessage.scan_id == scan_id).delete(synchronize_session=False)
    try:
        if scan.image_path and os.path.exists(scan.image_path): os.remove(scan.image_path)
    except: pass
    db.delete(scan)
    db.commit()
    return {"status": "success", "message": "Scan deleted permanently."}