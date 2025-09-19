from fastapi import FastAPI, Response, Request, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.database import get_db_connection, create_tables, seed_database, get_all_coffees, increment_coffee_vote, add_coffee, delete_coffee, update_coffee

class Coffee(BaseModel):
    id: int | None = None
    name: str
    description: str | None = None
    image_url: str | None = None
    votes: int = 0

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    conn = get_db_connection()
    create_tables(conn)
    seed_database(conn)
    conn.close()

@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.get("/api/coffees", response_model=list[Coffee])
def list_coffees():
    conn = get_db_connection()
    coffees = get_all_coffees(conn)
    conn.close()
    return coffees

@app.post("/api/coffees", response_model=Coffee, status_code=status.HTTP_201_CREATED)
def create_coffee(coffee: Coffee):
    conn = get_db_connection()
    coffee_id = add_coffee(conn, coffee.name, coffee.description, coffee.image_url)
    conn.close()
    if coffee_id:
        coffee.id = coffee_id
        return coffee
    raise HTTPException(status_code=500, detail="Failed to create coffee.")

@app.put("/api/coffees/{coffee_id}", response_model=Coffee)
def update_coffee_details(coffee_id: int, coffee: Coffee):
    conn = get_db_connection()
    if not update_coffee(conn, coffee_id, coffee.name, coffee.description, coffee.image_url):
        conn.close()
        raise HTTPException(status_code=404, detail="Coffee not found.")
    conn.close()
    coffee.id = coffee_id
    return coffee

@app.delete("/api/coffees/{coffee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_coffee(coffee_id: int):
    conn = get_db_connection()
    if not delete_coffee(conn, coffee_id):
        conn.close()
        raise HTTPException(status_code=404, detail="Coffee not found.")
    conn.close()
    return

@app.post("/api/coffees/{coffee_id}/vote")
def vote_for_coffee(coffee_id: int, request: Request, response: Response):
    cookie_name = f"voted_for_{coffee_id}"
    if request.cookies.get(cookie_name):
        raise HTTPException(status_code=400, detail="You have already voted for this coffee.")

    conn = get_db_connection()
    if not increment_coffee_vote(conn, coffee_id):
        conn.close()
        raise HTTPException(status_code=404, detail="Coffee not found.")
    conn.close()

    response.set_cookie(key=cookie_name, value="true", httponly=True, max_age=31536000) # 1 year
    return {"message": "Vote recorded successfully!"}

# Mount static files
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("frontend/index.html")

@app.get("/admin-secret-panel")
async def read_admin_panel():
    return FileResponse("frontend/admin.html")
