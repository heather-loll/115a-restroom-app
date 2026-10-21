import geojson
from pymongo import MongoClient
from pymongo.collection import Collection

client = MongoClient('localhost', 27017)
main_json = geojson.load(open("export.geojson"))

#NOTE: Need to manually make a ToiletApp database and add a restrooms collection for this to work
database = client.get_database("ToiletApp")
restrooms = database.get_collection("restrooms")

for(feature) in main_json["features"]:
    bathroom_info = {
        "geometry":  {
            "type": "Point",
            "coordinates": [feature["geometry"]["coordinates"][0], feature["geometry"]["coordinates"][1]]
        }
    }
    result = restrooms.replace_one(bathroom_info, bathroom_info, upsert=True)