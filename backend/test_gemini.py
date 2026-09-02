import asyncio
import httpx
from app.config import settings

async def main():
    model = "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": "You are a food analyst. Respond with JSON: {\"status\": \"success\", \"message\": \"Gemini Vision is active!\"}"}]
        }],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload)
        print(f"Status: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    asyncio.run(main())
