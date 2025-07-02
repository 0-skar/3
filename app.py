import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Configuration ---
# Read the secret API token from an environment variable
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
# You can change the model here if you want
MODEL_API_URL = "https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0"
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# Initialize the FastAPI app
app = FastAPI()

# --- CORS Middleware ---
# This is crucial! It allows your frontend (on a different domain)
# to make requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simplicity. For production, you'd list your frontend's URL.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)

# Define the data structure for incoming requests from the frontend
class ChatRequest(BaseModel):
    prompt: str

@app.post("/chat")
def query_model(request: ChatRequest):
    """
    Receives a prompt from the frontend, queries the real Hugging Face API,
    and returns the response.
    """
    # Prepare the payload for the Hugging Face Inference API
    payload = {
        "inputs": request.prompt,
        "parameters": {
            "return_full_text": False, # Set to false for chat models to avoid repeating the prompt
            "max_new_tokens": 250
        }
    }

    # Make the request to the real HF API
    response = requests.post(MODEL_API_URL, headers=HEADERS, json=payload)
    
    # Return the response (or an error message)
    return response.json()

@app.get("/")
def root():
    return {"status": "Backend proxy is running"}