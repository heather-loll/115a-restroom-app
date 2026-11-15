"""
MongoDB access for restroom data.
This keeps database code outside Flask route functions. The routes validate HTTP
input, while these functions search, create, update, and rate restroom documents.
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
    # add distance data while keeping the shared frontend Restroom JSON structure.

    restroom = {
        # the source/type prefix makes an ID unique across OpenStreetMap record types.
        "restroomId": element["restroomId"],
        "name": element["name"],
        "latitude": element["geometry"]["coordinates"][1],
        "longitude": element["geometry"]["coordinates"][0],
        "distanceMeters": round(
            distance_in_meters(user_latitude, user_longitude, element["geometry"]["coordinates"][1], element["geometry"]["coordinates"][0])
        ),
        # copy amenities so adding a calculated rating never changes the
        # MongoDB document that was read from the database.
        "amenities": stored_amenities(element),
    }

    add_cleanliness_average(restroom)
    add_location_details(restroom, element)

    return restroom


def add_location_details(restroom, document):
    # copy optional building-location details only when the database has them.
    # this keeps older imported restroom records compatible with the API shape.
    for field_name in ("floor", "directions"):
        value = document.get(field_name)
        if value is not None:
            restroom[field_name] = value


def stored_amenities(document):
    # return only the shared restroom details stored on the restroom document.
    # cleanliness is intentionally excluded because it is calculated from the
    # separate user-rating records instead of being one editable amenity value.
    amenities = document.get("amenities") or {}
    return {
        name: value
        for name, value in amenities.items()
        if name != "cleanliness"
    }


def get_restrooms_collection():
    # return the configured restroom collection.
    # tests provide an in-memory fake collection through app configuration.
    # during normal use, this creates a client only when an operation needs one.
    test_collection = current_app.config.get("RESTROOMS_COLLECTION")
    if test_collection is not None:
        return test_collection

    client = MongoClient(
        current_app.config["MONGODB_URI"],
        serverSelectionTimeoutMS=current_app.config["MONGODB_TIMEOUT_MS"],
    )
    database = client[current_app.config["MONGODB_DATABASE"]]
    return database[current_app.config["MONGODB_RESTROOMS_COLLECTION"]]


def get_ratings_collection():
    # return the collection containing individual cleanliness votes.
    # stores ratings beside restroom data in a separate collection so one vote
    # can never overwrite another person's vote.
    test_collection = current_app.config.get("RATINGS_COLLECTION")
    if test_collection is not None:
        return test_collection

    restrooms_collection = get_restrooms_collection()
    return restrooms_collection.database["restroom_ratings"]


def get_cleanliness_summary(restroom_id):
    # calculate the average and count for one restroom's saved votes.
    # returning None for the average follows the rule that missing
    # information is unknown instead of pretending a restroom has a rating.
    try:
        ratings = list(
            get_ratings_collection().find(
                {"restroomId": restroom_id},
                {"cleanliness": 1},
            )
        )
    except PyMongoError as error:
        raise MongoDatabaseError("Could not read cleanliness ratings.") from error

    if not ratings:
        return None, 0

    total = sum(rating["cleanliness"] for rating in ratings)
    return total / len(ratings), len(ratings)


def add_cleanliness_average(restroom, summary=None):
    # add the calculated rating to an API restroom response when votes exist.
    # the count is returned separately because only the rating endpoint exposes
    # it, while all endpoints share the same Restroom object shape.
    if summary is None:
        summary = get_cleanliness_summary(restroom["restroomId"])

    average, rating_count = summary
    if average is not None:
        amenities = dict(restroom.get("amenities") or {})
        amenities["cleanliness"] = average
        restroom["amenities"] = amenities

    return rating_count


def build_restroom_document(
    name,
    latitude,
    longitude,
    address,
    amenities,
    floor=None,
    directions=None,
):
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
    # these optional details help users locate a restroom inside a large building.
    # exclude missing values so older and imported restroom documents stay compatible.
    if floor is not None:
        document["floor"] = floor
    if directions is not None:
        document["directions"] = directions

    return document


def document_to_restroom(document, cleanliness_summary=None):
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
    amenities = stored_amenities(document)
    if amenities:
        restroom["amenities"] = amenities
    add_location_details(restroom, document)
    add_cleanliness_average(restroom, cleanliness_summary)

    return restroom


def create_restroom(
    name,
    latitude,
    longitude,
    address,
    amenities,
    floor=None,
    directions=None,
    cleanliness_rating=None,
):
    # save a new user-submitted restroom unless its coordinates already exist.
    collection = get_restrooms_collection()
    document = build_restroom_document(
        name,
        latitude,
        longitude,
        address,
        amenities,
        floor=floor,
        directions=directions,
    )
    coordinates = document["geometry"]["coordinates"]

    restroom_saved = False
    try:
        # this matches the existing GeoJSON importer's duplicate-coordinate rule.
        duplicate = collection.find_one({"geometry.coordinates": coordinates})
        if duplicate is not None:
            raise RestroomAlreadyExistsError(
                "A restroom already exists at these coordinates."
            )

        collection.insert_one(document)
        restroom_saved = True

        # a new restroom can include its first vote, but the vote remains a
        # separate record so later votes can be included in the average.
        if cleanliness_rating is not None:
            get_ratings_collection().insert_one(
                {
                    "restroomId": document["restroomId"],
                    "cleanliness": cleanliness_rating,
                }
            )
    except RestroomAlreadyExistsError:
        raise
    except PyMongoError as error:
        # don't leave a newly created restroom behind if its first rating could
        # not be saved. deleting it keeps this one request all-or-nothing.
        if restroom_saved:
            collection.delete_one({"restroomId": document["restroomId"]})
        raise MongoDatabaseError("Could not save the restroom in MongoDB.") from error

    return document_to_restroom(document)


def edit_restroom(restroomId, name, amenities, floor=None, directions=None):
    # update a known restroom and return its shared frontend JSON shape.
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
    # excluded location details leave previously saved information unchanged.
    if floor is not None:
        document["floor"] = floor
    if directions is not None:
        document["directions"] = directions
    collection.replace_one({"restroomId": restroomId}, document)
    return document_to_restroom(document)


def add_cleanliness_rating(restroom_id, cleanliness):
    # save one user's cleanliness vote and return the updated restroom summary.
    # ratings are append-only because the backend has no user accounts and
    # cannot safely identify which earlier vote should be edited.
    restroom_collection = get_restrooms_collection()

    try:
        document = restroom_collection.find_one({"restroomId": restroom_id})
        if document is None:
            raise RestroomDoesntExistError("Restroom doesn't exist.")

        get_ratings_collection().insert_one(
            {
                "restroomId": restroom_id,
                "cleanliness": cleanliness,
            }
        )
        summary = get_cleanliness_summary(restroom_id)
    except RestroomDoesntExistError:
        raise
    except PyMongoError as error:
        raise MongoDatabaseError("Could not save the cleanliness rating.") from error

    restroom = document_to_restroom(document, cleanliness_summary=summary)
    rating_count = summary[1]
    return restroom, rating_count


def find_nearest_restroom(latitude, longitude, radius_meters):
    collection = get_restrooms_collection()
    document = collection.find_one(
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
    # a search with no database match returns None for the API response.
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
