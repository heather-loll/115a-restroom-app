"""
A small, testable client for public restroom data in OpenStreetMap. Communicates with 
OpenStreetMap Overpass API. It requests nearby restroom locations, calculates which returned 
restroom is closest to the provided coordinates, and formats the result for the frontend.
"""

from math import asin, cos, radians, sin, sqrt
import requests


class OpenStreetMapError(Exception):
    """ raised when the Overpass API cannot provide usable data. """

def build_overpass_query(latitude, longitude, radius_meters):
    # create an Overpass QL query for toilets around a point.
    # OpenStreetMap can store a restroom as a node, way, or relation. 
    # `out center` asks Overpass to include a map coordinate for ways and relations as well.
    return f"""
        [out:json][timeout:25];
        (
          node[\"amenity\"=\"toilets\"](around:{radius_meters},{latitude},{longitude});
          way[\"amenity\"=\"toilets\"](around:{radius_meters},{latitude},{longitude});
          relation[\"amenity\"=\"toilets\"](around:{radius_meters},{latitude},{longitude});
        );
        out center tags;
    """

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

def element_coordinates(element):
    # return coordinates for either a node or a centered way/relation.
    if "lat" in element and "lon" in element:
        return element["lat"], element["lon"]

    center = element.get("center", {})
    if "lat" in center and "lon" in center:
        return center["lat"], center["lon"]

    # ignore incomplete OpenStreetMap records.
    return None

def format_restroom(element, user_latitude, user_longitude):
    # convert OpenStreetMap's flexible tags into a stable frontend response.
    coordinates = element_coordinates(element)
    if coordinates is None:
        return None

    latitude, longitude = coordinates
    tags = element.get("tags", {})
    osm_type = element.get("type", "unknown")

    return {
        # prefixing the ID prevents a node and way with the same numeric ID colliding.
        "id": f"osm-{osm_type}-{element['id']}",
        "name": tags.get("name", "Public restroom"),
        "latitude": latitude,
        "longitude": longitude,
        "distance_meters": round(
            distance_in_meters(user_latitude, user_longitude, latitude, longitude)
        ),
        "source": "openstreetmap",
        # optional OpenStreetMap tags. may be planned in later sprints.
        "details": {
            "wheelchair": tags.get("wheelchair"),
            "unisex": tags.get("unisex"),
            "changing_table": tags.get("changing_table"),
            "fee": tags.get("fee"),
        },
    }

def find_nearest_restroom(latitude, longitude, radius_meters, overpass_url, timeout_seconds):
    # fetch nearby restroom records and return the closest one, if any.
    try:
        response = requests.get(
            overpass_url,
            params={"data": build_overpass_query(latitude, longitude, radius_meters)},
            headers={"User-Agent": "restroom-finder-cse115a/1.0"},
            timeout=timeout_seconds,
        )
        response.raise_for_status()
        elements = response.json().get("elements", [])
    except (requests.RequestException, ValueError, TypeError) as error:
        raise OpenStreetMapError("Could not fetch OpenStreetMap restroom data.") from error

    # use a loop instead of a compact list comprehension so it's easy to read.
    restrooms = []
    for element in elements:
        formatted = format_restroom(element, latitude, longitude)
        if formatted is not None:
            restrooms.append(formatted)

    # sorting makes the selected result deterministic, even if two locations tie.
    return min(restrooms, key=lambda restroom: (restroom["distance_meters"], restroom["id"]), default=None)
