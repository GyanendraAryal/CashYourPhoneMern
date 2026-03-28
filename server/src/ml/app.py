from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import engine

app = FastAPI(title="CashYourPhone ML Service")

class PriceRequest(BaseModel):
    brand: str
    model: str
    condition: str
    base_price: float = Field(..., ge=0, description="Base price must be greater than or equal to 0")

@app.get("/")
async def root():
    return {"status": "online", "message": "ML Service for CashYourPhone is active."}

@app.post("/predict-price")
async def predict_price(req: PriceRequest):
    try:
        estimated = engine.estimate_value(req.base_price, req.condition)
        return {"estimated_price": estimated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
