from pydantic import BaseModel

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    plant_context: str
    user_id: str = None
    scan_id: str = None

class SavePlantRequest(BaseModel):
    user_id: str
    plant_name: str
    plant_image: str

class SaveScanRequest(BaseModel):
    user_id: str
    image_url: str
    disease: str
    confidence: str
    treatment: str

class UpdateProfileRequest(BaseModel):
    user_id: str
    username: str
    email: str
    password: str = None