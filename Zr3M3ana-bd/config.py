import os
import json
from groq import Groq

# --- API KEY PLACES ---
# When you want to run this in the future, just paste your real keys inside the quotes below.
GROQ_API_KEY = "PASTE_YOUR_GROQ_API_KEY_HERE"
PERENUAL_TOKEN = "PASTE_YOUR_PERENUAL_TOKEN_HERE"
# -----------------------

# Initialize the Groq client
client = Groq(api_key=GROQ_API_KEY)

MOCK_AI = False

def enforce_string(val):
    if isinstance(val, list):
        return "\n".join(str(v) for v in val)
    if isinstance(val, dict):
        return json.dumps(val)
    return str(val).strip() if val else "N/A"