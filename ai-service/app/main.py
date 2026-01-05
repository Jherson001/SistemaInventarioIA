from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
import mysql.connector
from openai import OpenAI
import os
from dotenv import load_dotenv
from pathlib import Path

# 1. CARGA DE VARIABLES
BASE_DIR = Path(__file__).resolve().parent.parent 
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)

# 2. CONFIGURACIÓN GROQ
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# 3. IMPORTACIONES
from .schemas import PredictRequest, PredictResponse, Prediction
from .rules import score_low_rotation

app = FastAPI(title="Sistema de Ventas AI (Groq Edition)", version="3.2.0")

# --- ENDPOINTS ---
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

@app.get("/health")
def health():
    return {"status": "ok", "system": "operational"}

@app.post("/score-low-rotation", response_model=PredictResponse)
def score(payload: PredictRequest):
    out = []
    for p in payload.products:
        r = score_low_rotation(p.dict())
        out.append(Prediction(product_id=p.product_id, **r))
    return PredictResponse(predictions=out)

# --- CHAT CON ESQUEMA CORREGIDO ---
class QuestionRequest(BaseModel):
    question: str

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "inventorydb")
    )

@app.post("/ask")
async def ask_database(request: QuestionRequest):
    if not client.api_key:
        raise HTTPException(status_code=500, detail="ERROR: No se encontró la API Key en .env")

    question = request.question
    
    # --- AQUÍ ESTÁ LA CORRECCIÓN BASADA EN TU FOTO ---
    schema_context = """
    Eres un experto en SQL MySQL.
    
    TABLA DISPONIBLE:
    - vw_stock_current (Columnas: product_id, sku, name, stock)
    
    INSTRUCCIONES:
    - La columna del nombre del producto es 'name'.
    - La columna de la cantidad es 'stock'.
    - Genera SOLO el SQL query. Sin markdown.
    """

    try:
        # A. GENERAR SQL
        response_ai = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": schema_context},
                {"role": "user", "content": f"Pregunta: {question}\nSQL Query:"}
            ],
            temperature=0
        )
        
        sql_query = response_ai.choices[0].message.content.strip()
        sql_query = sql_query.replace("```sql", "").replace("```", "").split(";")[0] + ";"
        
        # B. CONSULTAR BD
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql_query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        # C. RESPUESTA FINAL
        if not results:
            return {"answer": "No encontré datos relacionados con tu pregunta.", "sql": sql_query}

        summary_prompt = f"Pregunta: {question}\nDatos: {results}\nResponde muy brevemente en español indicando el nombre y la cantidad:"
        
        final_resp = client.chat.completions.create(
             model="llama-3.3-70b-versatile",
             messages=[{"role": "user", "content": summary_prompt}]
        )
        
        return {
            "question": question,
            "sql": sql_query,
            "answer": final_resp.choices[0].message.content,
            "data": results
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)