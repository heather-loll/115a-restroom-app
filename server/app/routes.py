"""
HTTP routes for the API. 
/api/restrooms/nearest returns the closest OpenStreetMap restroom, 
/api/restrooms/nearby returns nearby map pins, and 
POST /api/restrooms saves a user-submitted restroom in MongoDB. 
/api/health confirms that the backend is running. 
This file defines the API URLs that the frontend can call.
"""

from flask import Blueprint, current_app, jsonify, request
from .openstreetmap import (
    OpenStreetMapError,
    find_nearby_restrooms,
    find_nearest_restroom,
)
from .mongodb import (
    MongoDatabaseError,
    RestroomAlreadyExistsError,
    create_restroom,
)


api = Blueprint("api", __name__)

def get_number_argument(name, minimum, maximum, default=None):
    # read and validate one numeric query parameter.
    # returning an error message instead of raising an exception lets each API
    # response explain exactly what the frontend sent incorrectly.
    raw_value = request.args.get(name)
    if raw_value is None:
        if default is not None:
            return default, None
        return None, f"Missing required query parameter: {name}."

    try:
        value = float(raw_value)
    except ValueError:
        return None, f"Query parameter '{name}' must be a number."

    if not minimum <= value <= maximum:
        return None, f"Query parameter '{name}' must be between {minimum} and {maximum}."

    return value, None


def get_search_arguments():
    # read the coordinate and radius parameters shared by restroom searches.
    latitude, error = get_number_argument("latitude", -90, 90)
    if error:
        return None, error

    longitude, error = get_number_argument("longitude", -180, 180)
    if error:
        return None, error

    # a bounded radius avoids accidentally sending an expensive world-scale query.
    radius_meters, error = get_number_argument(
        "radius_meters", 100, 5_000, default=1_000
    )
    if error:
        return None, error

    return (latitude, longitude, radius_meters), None


def search_metadata(latitude, longitude, radius_meters):
    # return the common response data that describes one restroom search.
    return {
        "latitude": latitude,
        "longitude": longitude,
        "radiusMeters": radius_meters,
    }


def get_json_number(data, name, minimum, maximum):
    # read and validate a number from a JSON request body.
    value = data.get(name)
    # bool is a Python number type, but it is not a valid coordinate value.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None, f"JSON field '{name}' must be a number."

    value = float(value)
    if not minimum <= value <= maximum:
        return None, f"JSON field '{name}' must be between {minimum} and {maximum}."

    return value, None


def get_new_restroom_data():
    # validate the JSON body accepted by POST /api/restrooms.
    # The frontend submits user-entered data without an ID or distance.
    # Backend generates the ID, and distance is calculated only during a location search.
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object."

    name = data.get("name")
    if not isinstance(name, str) or not name.strip():
        return None, "JSON field 'name' must be a non-empty string."
    name = name.strip()
    if len(name) > 120:
        return None, "JSON field 'name' must be 120 characters or fewer."

    latitude, error = get_json_number(data, "latitude", -90, 90)
    if error:
        return None, error

    longitude, error = get_json_number(data, "longitude", -180, 180)
    if error:
        return None, error

    address = data.get("address")
    if address is not None:
        if not isinstance(address, str) or not address.strip():
            return None, "JSON field 'address' must be a non-empty string when provided."
        address = address.strip()
        if len(address) > 200:
            return None, "JSON field 'address' must be 200 characters or fewer."

    amenities = data.get("amenities", {})
    if not isinstance(amenities, dict):
        return None, "JSON field 'amenities' must be an object when provided."

    allowed_boolean_amenities = {
        "paymentRequired",
        "accessible",
        "unisex",
        "singleOccupancy",
        "menstrualProductsAvailable",
        "babyChangingStation",
    }
    allowed_amenities = allowed_boolean_amenities | {"cleanliness"}
    unknown_amenities = set(amenities) - allowed_amenities
    if unknown_amenities:
        unknown_name = sorted(unknown_amenities)[0]
        return None, f"Unknown amenity field: '{unknown_name}'."

    validated_amenities = {}
    for amenity_name, value in amenities.items():
        if amenity_name == "cleanliness":
            if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 5:
                return None, "Amenity 'cleanliness' must be a whole number from 1 to 5."
        elif not isinstance(value, bool):
            return None, f"Amenity '{amenity_name}' must be true or false."
        validated_amenities[amenity_name] = value

    return {
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "address": address,
        "amenities": validated_amenities,
    }, None


@api.get("/health")
def health_check():
    # quick way to confirm that the Flask server is running.
    return jsonify({"status": "ok"})

@api.get("/restrooms/nearest")
def nearest_restroom():
    # return the closest OpenStreetMap restroom to the supplied coordinates.
    # example: /api/restrooms/nearest?latitude=36.9749&longitude=-122.0308
    # radius_meters is optional and defaults to 1,000 meters.
    search_arguments, error = get_search_arguments()
    if error:
        return jsonify({"error": error}), 400

    latitude, longitude, radius_meters = search_arguments

    try:
        restroom = find_nearest_restroom(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius_meters,
            overpass_url=current_app.config["OVERPASS_URL"],
            timeout_seconds=current_app.config["OVERPASS_TIMEOUT_SECONDS"],
        )
    except OpenStreetMapError:
        # keep implementation details out of the response while telling the client
        # this is a temporary upstream-data problem, not invalid user input.
        return jsonify({"error": "OpenStreetMap data is temporarily unavailable."}), 502

    return jsonify(
        {
            "search": search_metadata(latitude, longitude, radius_meters),
            "restroom": restroom,
        }
    )


@api.get("/restrooms/nearby")
def nearby_restrooms():
    # return all nearby restroom pins in the agreed frontend JSON structure.
    # example: /api/restrooms/nearby?latitude=36.9749&longitude=-122.0308
    # the optional radius_meters query parameter defaults to 1,000 meters.
    search_arguments, error = get_search_arguments()
    if error:
        return jsonify({"error": error}), 400

    latitude, longitude, radius_meters = search_arguments

    try:
        restrooms = find_nearby_restrooms(
            latitude=latitude,
            longitude=longitude,
            radius_meters=radius_meters,
            overpass_url=current_app.config["OVERPASS_URL"],
            timeout_seconds=current_app.config["OVERPASS_TIMEOUT_SECONDS"],
        )
    except OpenStreetMapError:
        return jsonify({"error": "OpenStreetMap data is temporarily unavailable."}), 502

    return jsonify(
        {
            "search": search_metadata(latitude, longitude, radius_meters),
            # an empty list when the selected area has no mapped restrooms.
            "restrooms": restrooms,
        }
    )


@api.post("/restrooms")
def add_restroom():
    # save a user-submitted restroom in MongoDB.
    # The request body uses the shared Restroom fields except restroomId and
    # distanceMeters, because the server creates the ID and no search occurred.
    restroom_data, error = get_new_restroom_data()
    if error:
        return jsonify({"error": error}), 400

    try:
        restroom = create_restroom(**restroom_data)
    except RestroomAlreadyExistsError as error:
        return jsonify({"error": str(error)}), 409
    except MongoDatabaseError:
        return jsonify({"error": "Restroom database is temporarily unavailable."}), 503

    return jsonify({"restroom": restroom}), 201
