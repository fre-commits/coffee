import os
import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import DATABASE_URL

client = TestClient(app)

@pytest.fixture(scope="function")
def setup_database():
    if os.path.exists(DATABASE_URL):
        os.remove(DATABASE_URL)
    yield
    if os.path.exists(DATABASE_URL):
        os.remove(DATABASE_URL)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_database_creation_and_seeding(setup_database):
    # Start the FastAPI app, which triggers startup event to create/seed DB
    with TestClient(app) as client:
        # Verify database file exists
        assert os.path.exists(DATABASE_URL)

        # Connect to the database and verify table and data
        conn = sqlite3.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Verify coffees table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='coffees';")
        assert cursor.fetchone() is not None

        # Verify dummy coffee entry exists
        cursor.execute("SELECT name, description, image_url, votes FROM coffees WHERE name='Espresso';")
        coffee_data = cursor.fetchone()
        assert coffee_data is not None
        assert coffee_data[0] == "Espresso"
        assert coffee_data[1] == "A strong, concentrated coffee beverage."
        assert coffee_data[2] == "/static/espresso.jpg"
        assert coffee_data[3] == 0

        conn.close()

def test_list_coffees(setup_database):
    with TestClient(app) as client:
        response = client.get("/api/coffees")
        assert response.status_code == 200
        coffees = response.json()
        assert isinstance(coffees, list)
        assert len(coffees) == 1
        assert coffees[0]["name"] == "Espresso"
        assert coffees[0]["description"] == "A strong, concentrated coffee beverage."
        assert coffees[0]["image_url"] == "/static/espresso.jpg"
        assert coffees[0]["votes"] == 0

def test_vote_for_coffee(setup_database):
    with TestClient(app) as client:
        # Initial check of votes
        response = client.get("/api/coffees")
        initial_votes = response.json()[0]["votes"]

        # First vote
        response = client.post("/api/coffees/1/vote")
        assert response.status_code == 200
        assert response.json() == {"message": "Vote recorded successfully!"}
        assert "voted_for_1" in response.cookies

        # Verify vote count incremented
        response = client.get("/api/coffees")
        assert response.json()[0]["votes"] == initial_votes + 1

        # Attempt to vote again (duplicate vote)
        response = client.post("/api/coffees/1/vote")
        assert response.status_code == 400
        assert response.json() == {"detail": "You have already voted for this coffee."} 

        # Verify vote count did not increment further
        response = client.get("/api/coffees")
        assert response.json()[0]["votes"] == initial_votes + 1
