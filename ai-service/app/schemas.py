from typing import List, Optional
from pydantic import BaseModel, Field

class ProductFeature(BaseModel):
    product_id: int
    stock: float = 0
    price: float = 0
    sales_7d: float = 0
    sales_30d: float = 0
    sales_90d: float = 0
    days_since_last_sale: float = 0
    category: Optional[str] = None

class PredictRequest(BaseModel):
    products: List[ProductFeature] = Field(default_factory=list)

class Prediction(BaseModel):
    product_id: int
    score: float
    label: str
    reason: str
    days_since_last_sale: int
    days_of_inventory: Optional[float]
    weekly_90: float
    used: str = "rules"

class PredictResponse(BaseModel):
    predictions: List[Prediction]
