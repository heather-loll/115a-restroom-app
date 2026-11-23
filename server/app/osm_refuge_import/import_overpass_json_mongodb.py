"""
Imports the sample OpenStreetMap restroom GeoJSON data into the local MongoDB
restrooms collection used during development.
"""

import geojson
from pymongo import MongoClient

from app.mongodb import build_restroom_document


def amenities_from_osm(properties):
    # convert OSM tags to the shared API amenity names. cleanliness and
    # singleOccupancy do not have equivalent OSM tags, so the importer omits them.
    amenities = {}
    if "toilets:menstrual_products" in properties:
        if properties.get("toilets:menstrual_products") in {"yes", "limited"}:
            amenities["menstrualProductsAvailable"] = True
        else:
            amenities["menstrualProductsAvailable"] = False
    if "changing_table" in properties:
        if properties.get("changing_table") in {"yes", "limited"}:
            amenities["babyChangingStation"] = True
        else:
            amenities["babyChangingStation"] = False
    if "unisex" in properties:
        amenities["unisex"] = True
    if "fee" in properties:
        if properties.get("fee") == "yes":
            amenities["paymentRequired"] = True
        else:
            amenities["paymentRequired"] = False
    if "wheelchair" in properties:
        if properties.get("wheelchair") == "yes" or properties.get("wheelchair") == "limited":
            amenities["accessible"] = True
        else:
            amenities["accessible"] = False

    return amenities


def address_from_osm(properties):
    # join complete OSM address fields when the imported record provides all of them.
    try:
        return (
            properties.get("addr:housenumber")
            + " "
            + properties.get("addr:street")
            + ", "
            + properties.get("addr:city")
            + ", "
            + properties.get("addr:state")
            + " "
            + properties.get("addr:postcode")
        )
    except:
        return None


client = MongoClient("localhost", 27017)
main_json = geojson.load(open("export.geojson"))

# NOTE: Need to manually make a ToiletApp database and add a restrooms collection for this to work
database = client.get_database("ToiletApp")
restrooms = database.get_collection("restrooms")

for feature in main_json["features"]:
    amenities = amenities_from_osm(feature["properties"])
    address = address_from_osm(feature["properties"])
    osm_type = feature.get("type", "unknown")
    document = build_restroom_document(
        feature["properties"].get("name"),
        feature["geometry"]["coordinates"][1],
        feature["geometry"]["coordinates"][0],
        address,
        amenities,
    )
    # use the OSM numeric ID and an "osm-" prefix for imported restroom IDs.
    id = feature["id"].split("/")[1]
    document["restroomId"] = f"osm-{id}"
    restroom_filter = {"geometry": document["geometry"]}
    restrooms.replace_one(restroom_filter, document, upsert=True)

# rebuild indexes after all imported records are saved.
restrooms.drop_indexes()
restrooms.create_index([("geometry", "2dsphere")])
restrooms.create_index("restroomId")
