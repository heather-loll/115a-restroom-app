"""
HTTP routes for the API. Defines the API endpoints. /api/restrooms/nearest accepts latitude 
and longitude, validates them, calls the OpenStreetMap logic, and returns the nearest restroom 
as JSON. /api/health confirms that the backend is running. This file defines the API URLs 
that the frontend can call.
"""

from flask import Blueprint, current_app, jsonify, request
from .openstreetmap import OpenStreetMapError, find_nearest_restroom


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

@api.get("/health")
def health_check():
    # quick way to confirm that the Flask server is running.
    return jsonify({"status": "ok"})

@api.get("/restrooms/nearest")
def nearest_restroom():
    # return the closest OpenStreetMap restroom to the supplied coordinates.
    # example: /api/restrooms/nearest?latitude=36.9749&longitude=-122.0308
    # radius_meters is optional and defaults to 1,000 meters.
    latitude, error = get_number_argument("latitude", -90, 90)
    if error:
        return jsonify({"error": error}), 400

    longitude, error = get_number_argument("longitude", -180, 180)
    if error:
        return jsonify({"error": error}), 400

    # a bounded radius avoids accidentally sending an expensive world-scale query.
    radius_meters, error = get_number_argument(
        "radius_meters", 100, 5_000, default=1_000
    )
    if error:
        return jsonify({"error": error}), 400

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
            "search": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_meters": radius_meters,
            },
            "restroom": restroom,
        }
    )
