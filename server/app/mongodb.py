"""
MongoDB access for user-submitted restrooms.
This keeps database code outside Flask route functions. The routes validate
HTTP input, while these functions check for duplicate coordinates and save valid
restroom documents in MongoDB.
"""

from uuid import uuid4
from flask import current_app
from pymongo import MongoClient
from pymongo.errors import PyMongoError


class RestroomAlreadyExistsError(Exception):
    """ raised when a restroom already uses the submitted coordinates. """


class MongoDatabaseError(Exception):
    """ raised when MongoDB cannot complete a restroom database operation. """


def get_restrooms_collection():
    # return the configured restroom collection.
    """ 
    Tests provide an in-memory fake collection through the app configuration.
    During normal use, this function creates a MongoDB client from environment
    configuration only when a database operation is needed.
    """
    test_collection = current_app.config.get("RESTROOMS_COLLECTION")
    if test_collection is not None:
        return test_collection

    client = MongoClient(
        current_app.config["MONGODB_URI"],
        serverSelectionTimeoutMS=current_app.config["MONGODB_TIMEOUT_MS"],
    )
    database = client[current_app.config["MONGODB_DATABASE"]]
    return database[current_app.config["MONGODB_RESTROOMS_COLLECTION"]]


def build_restroom_document(name, latitude, longitude, address, amenities):
    # create one MongoDB document from already validated frontend data.
    document = {
        # a generated string ID works with the shared frontend Restroom type and
        # cannot collide with OpenStreetMap IDs such as "osm-node-123".
        "restroomId": f"user-{uuid4()}",
        "name": name,
        # GeoJSON coordinates must always be [longitude, latitude] for MongoDB.
        "geometry": {
            "type": "Point",
            "coordinates": [longitude, latitude],
        },
        "source": "user",
    }

    if address is not None:
        document["address"] = address
    if amenities:
        document["amenities"] = amenities

    return document


def document_to_restroom(document):
    # format a MongoDB document using the shared frontend Restroom JSON shape.
    longitude, latitude = document["geometry"]["coordinates"]
    restroom = {
        "restroomId": document["restroomId"],
        "name": document["name"],
        "latitude": latitude,
        "longitude": longitude,
    }

    # these fields are optional in the shared Restroom type, so omit absent data.
    if "address" in document:
        restroom["address"] = document["address"]
    if document.get("amenities"):
        restroom["amenities"] = document["amenities"]

    return restroom


def create_restroom(name, latitude, longitude, address, amenities):
    # save a new user-submitted restroom unless its coordinates already exist.
    collection = get_restrooms_collection()
    document = build_restroom_document(name, latitude, longitude, address, amenities)
    coordinates = document["geometry"]["coordinates"]

    try:
        # this matches the existing GeoJSON importer's duplicate-coordinate rule.
        duplicate = collection.find_one({"geometry.coordinates": coordinates})
        if duplicate is not None:
            raise RestroomAlreadyExistsError(
                "A restroom already exists at these coordinates."
            )

        collection.insert_one(document)
    except RestroomAlreadyExistsError:
        raise
    except PyMongoError as error:
        raise MongoDatabaseError("Could not save the restroom in MongoDB.") from error

    return document_to_restroom(document)
