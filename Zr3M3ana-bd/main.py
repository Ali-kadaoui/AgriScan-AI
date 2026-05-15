import os
import urllib3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine
import models

# Import des routeurs que l'on vient de créer
from routers import auth, scanner, chat, wiki

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Création des tables dans la DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgriScan AI")

if not os.path.exists("assets"):
    os.makedirs("assets")

app.mount("/assets", StaticFiles(directory="assets"), name="assets")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs : ATTENTION, pas de 'prefix' ici !
# Cela garantit que les routes restent EXACTEMENT les mêmes pour le Frontend.
app.include_router(auth.router)
app.include_router(scanner.router)
app.include_router(chat.router)
app.include_router(wiki.router)