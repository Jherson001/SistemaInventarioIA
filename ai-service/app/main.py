from fastapi import FastAPI
from fastapi.responses import Response
from .schemas import PredictRequest, PredictResponse, Prediction
from .rules import score_low_rotation

app = FastAPI(title="Low Rotation AI", version="1.0.0")

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/score-low-rotation", response_model=PredictResponse)
def score(payload: PredictRequest):
    out = []
    for p in payload.products:
        r = score_low_rotation(p.dict())
        out.append(Prediction(product_id=p.product_id, **r))
    return PredictResponse(predictions=out)
