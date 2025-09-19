from pyairtable import Api
import os

AIRTABLE_API_TOKEN = os.environ.get("AIRTABLE_API_TOKEN")
AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID")
AIRTABLE_TABLE_ID = os.environ.get("AIRTABLE_TABLE_ID")

api = Api(AIRTABLE_API_TOKEN)
table = api.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

def get_all_coffees():
    records = table.all()
    coffees = []
    for record in records:
        coffees.append(
            {
                "id": record["id"],
                "name": record["fields"].get("name"),
                "description": record["fields"].get("description"),
                "image_url": record["fields"].get("image_url"),
                "votes": record["fields"].get("votes", 0),
            }
        )
    return coffees

def increment_coffee_vote(coffee_id):
    record = table.get(coffee_id)
    votes = record["fields"].get("votes", 0)
    table.update(coffee_id, {"votes": votes + 1})
    return True

def add_coffee(name, description, image_url):
    record = table.create(
        {
            "name": name,
            "description": description,
            "image_url": image_url,
            "votes": 0,
        }
    )
    return record["id"]

def delete_coffee(coffee_id):
    table.delete(coffee_id)
    return True

def update_coffee(coffee_id, name, description, image_url):
    table.update(
        coffee_id,
        {
            "name": name,
            "description": description,
            "image_url": image_url,
        },
    )
    return True