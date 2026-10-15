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


def optional_boolean(osm_value):
    """ convert known OpenStreetMap yes/no tags to booleans.
    OpenStreetMap can use other values such as ``limited`` or ``unknown``. those
    must not be treated as True or False, so this function returns None for them.
    the response formatter then leaves that amenity out of the JSON response.
    """
    if osm_value == "yes":
        return True
    if osm_value == "no":
        return False
    return None


def format_restroom(element, user_latitude, user_longitude):
    # convert OpenStreetMap's flexible tags into the agreed frontend response.
    coordinates = element_coordinates(element)
    if coordinates is None:
        return None

    latitude, longitude = coordinates
    tags = element.get("tags", {})
    osm_type = element.get("type", "unknown")

    # only include amenity fields when OpenStreetMap provides a clear yes/no value.
    # omitting unknown values prevents the frontend from assuming false information.
    amenities = {}
    osm_amenity_mapping = {
        "accessible": tags.get("wheelchair"),
        "unisex": tags.get("unisex"),
        "babyChangingStation": tags.get("changing_table"),
        "paymentRequired": tags.get("fee"),
    }
    for frontend_name, osm_value in osm_amenity_mapping.items():
        value = optional_boolean(osm_value)
        if value is not None:
            amenities[frontend_name] = value

    restroom = {
        # the source/type prefix makes an ID unique across OpenStreetMap record types.
        "restroomId": f"osm-{osm_type}-{element['id']}",
        "name": tags.get("name", "Public restroom"),
        "latitude": latitude,
        "longitude": longitude,
        "distanceMeters": round(
            distance_in_meters(user_latitude, user_longitude, latitude, longitude)
        ),
    }

    # the shared frontend type makes amenities optional, so omit an empty object.
    if amenities:
        restroom["amenities"] = amenities

    return restroom

def find_nearby_restrooms(latitude, longitude, radius_meters, overpass_url, timeout_seconds):
    # return all OpenStreetMap restrooms in the search radius, closest first.
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

    # sorting gives the frontend a predictable order and puts the closest pin first.
    return sorted(
        restrooms,
        key=lambda restroom: (restroom["distanceMeters"], restroom["restroomId"]),
    )


def find_nearest_restroom(latitude, longitude, radius_meters, overpass_url, timeout_seconds):
    # return the closest restroom in the search radius, or None when none exist.
    restrooms = find_nearby_restrooms(
        latitude,
        longitude,
        radius_meters,
        overpass_url,
        timeout_seconds,
    )
    return restrooms[0] if restrooms else None
