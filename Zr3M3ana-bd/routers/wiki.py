import uuid
import json
import random
import requests
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import PlantWiki, UserSavedPlant
import schemas
from config import client, PERENUAL_TOKEN

router = APIRouter(tags=["Wiki"])

@router.post("/wiki/save")
async def save_wiki_plant(req: schemas.SavePlantRequest, db: Session = Depends(get_db)):
    plant = db.query(PlantWiki).filter(PlantWiki.name == req.plant_name).first()
    if not plant:
        plant = PlantWiki(id=str(uuid.uuid4()), name=req.plant_name, image_url=req.plant_image)
        db.add(plant)
        db.commit()
        db.refresh(plant)
    existing_save = db.query(UserSavedPlant).filter(UserSavedPlant.user_id == req.user_id, UserSavedPlant.plant_id == plant.id).first()
    if existing_save: return {"status": "already_saved", "message": "Plant already in profile."}
    new_save = UserSavedPlant(user_id=req.user_id, plant_id=plant.id)
    db.add(new_save)
    db.commit()
    return {"status": "success", "message": f"{req.plant_name} saved!"}

@router.post("/wiki/unsave")
async def remove_wiki_plant(req: schemas.SavePlantRequest, db: Session = Depends(get_db)):
    plant = db.query(PlantWiki).filter(PlantWiki.name == req.plant_name).first()
    if plant:
        existing_save = db.query(UserSavedPlant).filter(UserSavedPlant.user_id == req.user_id, UserSavedPlant.plant_id == plant.id).first()
        if existing_save:
            db.delete(existing_save)
            db.commit()
            return {"status": "success", "message": "Removed from library."}
    return {"status": "error", "message": "Not found in library."}

@router.get("/users/{user_id}/wiki")
async def get_user_wiki_plants(user_id: str, db: Session = Depends(get_db)):
    saved_plants = db.query(UserSavedPlant).filter(UserSavedPlant.user_id == user_id).all()
    plant_list = []
    for saved in saved_plants:
        plant = db.query(PlantWiki).filter(PlantWiki.id == saved.plant_id).first()
        if plant: plant_list.append({"id": plant.id, "name": plant.name, "image": plant.image_url})
    return plant_list

@router.get("/wiki/suggestions")
async def get_wiki_suggestions(query: str, db: Session = Depends(get_db)):
    if not query.strip() or len(query.strip()) < 2: return []
    query_clean = query.strip().lower()
    suggestions = []
    seen_names = set()

    try:
        local_plants = db.query(PlantWiki).filter(PlantWiki.name.ilike(f"%{query_clean}%")).limit(3).all()
        for lp in local_plants:
            suggestions.append({"name": lp.name, "scientific_name": lp.scientific_name, "image": lp.image_url})
            seen_names.add(lp.name.lower())

        url = f"https://perenual.com/api/species-list?key={PERENUAL_TOKEN}&q={query_clean}"
        res = requests.get(url, timeout=5).json()
        api_plants = res.get("data", [])
        
        for p in api_plants:
            if len(suggestions) >= 8: break
            common_name = p.get("common_name", "").title()
            if not common_name or common_name.lower() in seen_names: continue
            
            img_url = "https://images.unsplash.com/photo-1599598425947-330026e16a69?auto=format&fit=crop&w=600&q=80" 
            img_obj = p.get("default_image")
            if isinstance(img_obj, dict):
                reg_url = img_obj.get("regular_url")
                if reg_url and "upgrade" not in reg_url:
                    img_url = reg_url
            
            sci_name_list = p.get("scientific_name", [])
            sci_name = sci_name_list[0] if sci_name_list else "Unknown"
            suggestions.append({"name": common_name, "scientific_name": sci_name, "image": img_url})
            seen_names.add(common_name.lower())
            
        suggestions.sort(key=lambda x: (0 if x["name"].lower() == query_clean else 1 if x["name"].lower().startswith(query_clean) else 2))
        return suggestions
    except Exception as e:
        print(f"Suggestions Error: {e}")
        return suggestions 

@router.get("/wiki/search")
async def search_wiki(query: str, image_url: str = None, db: Session = Depends(get_db)):
    if not query.strip(): return []
    existing_plants = db.query(PlantWiki).filter(PlantWiki.name.ilike(f"%{query}%")).all()
    if existing_plants: return [existing_plants[0]]

    try:
        final_image_url = image_url if image_url else "https://images.unsplash.com/photo-1599598425947-330026e16a69?auto=format&fit=crop&w=600&q=80" 
        if not image_url:
            try:
                wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query}"
                wiki_res = requests.get(wiki_url).json()
                if "thumbnail" in wiki_res: final_image_url = wiki_res["thumbnail"]["source"]
            except: pass
        
        prompt = f"Provide a JSON response for the plant '{query}'. Include EXACT keys: 'name', 'scientific_name', 'watering', 'sunlight', 'soil', 'temperature', 'harvest_time', 'fertilizer', 'diseases', 'description' (2 short sentences)."
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        ai_data = json.loads(response.choices[0].message.content)

        def clean_field(val):
            if isinstance(val, list): return ", ".join(str(v) for v in val)
            return str(val) if val else "N/A"

        new_plant = PlantWiki(
            id=str(uuid.uuid4()),
            name=clean_field(ai_data.get("name", query)).title(),
            scientific_name=clean_field(ai_data.get("scientific_name", "Unknown")),
            watering=clean_field(ai_data.get("watering", "N/A")),
            sunlight=clean_field(ai_data.get("sunlight", "N/A")),
            soil=clean_field(ai_data.get("soil", "N/A")),
            temperature=clean_field(ai_data.get("temperature", "N/A")),
            harvest_time=clean_field(ai_data.get("harvest_time", "N/A")),
            fertilizer=clean_field(ai_data.get("fertilizer", "N/A")),
            diseases=clean_field(ai_data.get("diseases", "N/A")),
            description=clean_field(ai_data.get("description", "A beautiful species of plant.")),
            image_url=final_image_url
        )
        db.add(new_plant)
        db.commit()
        db.refresh(new_plant)
        return [new_plant]
    except Exception as e:
        print(f"Groq Wiki Search Error: {e}")
        return []

@router.get("/wiki/random_facts")
async def get_random_facts():
    try:
        page = random.randint(1, 50) 
        url = f"https://perenual.com/api/species-list?key={PERENUAL_TOKEN}&page={page}"
        res = requests.get(url, timeout=10).json()
        plants = res.get("data", [])
        
        valid_plants = []
        for p in plants:
            img_obj = p.get("default_image")
            if isinstance(img_obj, dict):
                reg_url = img_obj.get("regular_url")
                if reg_url and "upgrade" not in reg_url:
                    valid_plants.append(p)

        if not valid_plants: raise Exception("No plants found")
        selected = random.sample(valid_plants, min(5, len(valid_plants)))
        
        results = []
        for p in selected:
            sunlight = p.get('sunlight')[0] if p.get('sunlight') else "various conditions"
            fact_text = f"Did you know? This plant thrives in {sunlight.lower()} sunlight."
            results.append({
                "title": p.get("common_name", "Unknown").title(), 
                "searchName": p.get("common_name", "Unknown"), 
                "subtitle": fact_text, 
                "image": p["default_image"]["regular_url"]
            })
        return results
    except Exception:
        return [{"title": "Tomato", "searchName": "Tomato", "subtitle": "Botanically a fruit!", "image": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80"}]