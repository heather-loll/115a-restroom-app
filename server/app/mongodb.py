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
from math import asin, cos, radians, sin, sqrt


class RestroomAlreadyExistsError(Exception):
    """ raised when a restroom already uses the submitted coordinates. """

class RestroomDoesntExistError(Exception):
    """ raised when a restroom being edited doesn't exist. """


class MongoDatabaseError(Exception):
    """ raised when MongoDB cannot complete a restroom database operation. """

def distance_in_meters(first_latitude, first_longitude, second_latitude, second_longitude):
    # calculate straight-line distance with the Haversine formula.
    earth_radius_meters = 6_371_000
    latitude_difference = radians(second_latitude - first_latitude)
    longitude_difference = radians(second_longitude - first_longitude)
    start_latitude = radians(first_latitude)
    end_latitude = radians(second_latitude)

    haversine_value = (
        sin(latitude_difference / 2) ** 2
        + cos(start_latitude)
        * cos(end_latitude)
        * sin(longitude_difference / 2) ** 2
    )
    return 2 * earth_radius_meters * asin(sqrt(haversine_value))


def format_restroom(element, user_latitude, user_longitude):
    #don't have to do a lot of formatting since validation is done in the code to add restrooms

    restroom = {
        # the source/type prefix makes an ID unique across OpenStreetMap record types.
        "restroomId": element["restroomId"],
        "name": element["name"],
        "latitude": element["geometry"]["coordinates"][1],
        "longitude": element["geometry"]["coordinates"][0],
        "distanceMeters": round(
            distance_in_meters(user_latitude, user_longitude, element["geometry"]["coordinates"][1], element["geometry"]["coordinates"][0])
        ),
        "amenities": element.get("amenities", {}),
    }

    return restroom


def get_restrooms_collection():
    # return the configured restroom collection.
    # leftover from the old MongoDB code since creating a collection on each function call causes a weird crash
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

def amend_restroom(restroomId, name, amenities):
    collection = get_restrooms_collection()
    document = collection.find_one(
        {
            "restroomId": restroomId
        }
    )
    if document is None:
        raise RestroomDoesntExistError("Restroom doesn't exist.")
    document["name"] = name
    if amenities:
        document["amenities"] = amenities
    collection.replace_one({"restroomId": restroomId}, document)

def find_nearest_restroom(latitude, longitude, radius_meters):
    collection = get_restrooms_collection()
    document = collection.find_one(
        {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude],
                },
                "$maxDistance": radius_meters
            }
        }
    )
    #does the function actually return None if no restrooms are found?
    if document is None:
        return None
    return format_restroom(document, latitude, longitude)


def find_nearby_restrooms(latitude, longitude, radius_meters):
    collection = get_restrooms_collection()
    documents = collection.find(
        {
            "geometry": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude],
                    },
                    "$maxDistance": radius_meters
                }
            }
        }
    )
    restrooms = []
    for document in documents:
        formatted_restroom = format_restroom(document, latitude, longitude)
        restrooms.append(formatted_restroom)
    return restrooms