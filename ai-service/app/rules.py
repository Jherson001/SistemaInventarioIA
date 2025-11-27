from typing import Dict, Tuple

def _safe(v, d=0.0):
    try:
        return float(v)
    except:
        return d

def compute_features(row: Dict) -> Tuple[float, float, float]:
    sales_30d = max(_safe(row.get("sales_30d"), 0), 0)
    stock = max(_safe(row.get("stock"), 0), 0)
    dsl = max(_safe(row.get("days_since_last_sale"), 0), 0)

    daily_30 = sales_30d / 30.0
    days_of_inventory = 9999.0 if daily_30 == 0 else stock / daily_30

    sales_90d = max(_safe(row.get("sales_90d"), 0), 0)
    weekly_90 = sales_90d / 12.86  # 90 días ≈ 12.86 semanas

    return dsl, days_of_inventory, weekly_90

def score_low_rotation(row: Dict) -> Dict:
    dsl, doi, weekly_90 = compute_features(row)

    c1 = min(1.0, dsl / 60.0)
    c2 = min(1.0, doi / 90.0)
    c3 = 1.0 if weekly_90 <= 0 else max(0.0, 1.0 - weekly_90 / 1.0)

    score = 0.45*c1 + 0.40*c2 + 0.15*c3
    label = "low_rotation" if score >= 0.6 else "normal"

    reasons = []
    if dsl >= 45: reasons.append("≥45 días sin venta")
    if doi >= 60: reasons.append("≥60 días de inventario")
    if weekly_90 < 1: reasons.append("<1 u/sem (90d)")

    return {
        "score": round(score, 3),
        "label": label,
        "reason": ", ".join(reasons) if reasons else "n/a",
        "days_since_last_sale": int(dsl),
        "days_of_inventory": None if doi == 9999 else round(doi, 1),
        "weekly_90": round(weekly_90, 2),
    }
