"""
Tests the restroom API without requiring live external services. OpenStreetMap and
MongoDB are replaced with small fake objects, so tests stay fast and reliable. The
tests check searches, user-submitted restrooms, validation, and duplicate handling.
Run with: `python -m unittest discover -s tests` in the virtual environment.
"""

import unittest
from copy import deepcopy
from unittest.mock import patch
from app import create_app


class FakeResponse:
    # minimal stand-in for a successful requests response.
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


class FakeRestroomsCollection:
    # small in-memory MongoDB substitute used by POST endpoint tests.

    def __init__(self):
        self.documents = []

    def find_one(self, query):
        coordinates = query.get("geometry.coordinates")
        for document in self.documents:
            if document["geometry"]["coordinates"] == coordinates:
                return deepcopy(document)
        return None

    def insert_one(self, document):
        self.documents.append(deepcopy(document))


class RestroomApiTests(unittest.TestCase):
    def setUp(self):
        self.collection = FakeRestroomsCollection()
        self.app = create_app(
            {"TESTING": True, "RESTROOMS_COLLECTION": self.collection}
        )
        self.client = self.app.test_client()

    @patch("app.openstreetmap.requests.get")
    def test_returns_closest_restroom(self, mock_get):
        # the way is closer than the node and uses `center`
        # covering both shapes that the live OpenStreetMap query can return.
        mock_get.return_value = FakeResponse(
            {
                "elements": [
                    {
                        "type": "node",
                        "id": 10,
                        "lat": 36.9800,
                        "lon": -122.0300,
                        "tags": {"amenity": "toilets", "name": "Far restroom"},
                    },
                    {
                        "type": "way",
                        "id": 20,
                        "center": {"lat": 36.9751, "lon": -122.0300},
                        "tags": {"amenity": "toilets", "wheelchair": "yes"},
                    },
                ]
            }
        )

        response = self.client.get(
            "/api/restrooms/nearest?latitude=36.9750&longitude=-122.0300"
        )

        self.assertEqual(response.status_code, 200)
        restroom = response.get_json()["restroom"]
        self.assertEqual(restroom["restroomId"], "osm-way-20")
        self.assertEqual(restroom["name"], "Public restroom")
        self.assertEqual(restroom["amenities"]["accessible"], True)

    @patch("app.openstreetmap.requests.get")
    def test_omits_unknown_amenities(self, mock_get):
        # "limited" is not the same as yes or no, so it must not become a boolean.
        mock_get.return_value = FakeResponse(
            {
                "elements": [
                    {
                        "type": "node",
                        "id": 30,
                        "lat": 36.9751,
                        "lon": -122.0300,
                        "tags": {"amenity": "toilets", "wheelchair": "limited"},
                    }
                ]
            }
        )

        response = self.client.get(
            "/api/restrooms/nearest?latitude=36.9750&longitude=-122.0300"
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("amenities", response.get_json()["restroom"])

    @patch("app.openstreetmap.requests.get")
    def test_returns_all_nearby_restrooms_closest_first(self, mock_get):
        # the endpoint should return one response item for every mapped restroom,
        # ordered so the frontend can render pins and identify the closest option.
        mock_get.return_value = FakeResponse(
            {
                "elements": [
                    {
                        "type": "node",
                        "id": 10,
                        "lat": 36.9800,
                        "lon": -122.0300,
                        "tags": {"amenity": "toilets", "name": "Far restroom"},
                    },
                    {
                        "type": "way",
                        "id": 20,
                        "center": {"lat": 36.9751, "lon": -122.0300},
                        "tags": {"amenity": "toilets", "wheelchair": "yes"},
                    },
                ]
            }
        )

        response = self.client.get(
            "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0300"
        )

        self.assertEqual(response.status_code, 200)
        response_body = response.get_json()
        self.assertEqual(response_body["search"]["radiusMeters"], 1_000)
        self.assertEqual(len(response_body["restrooms"]), 2)
        self.assertEqual(
            response_body["restrooms"][0]["restroomId"], "osm-way-20"
        )
        self.assertEqual(
            response_body["restrooms"][0]["amenities"]["accessible"], True
        )

    def test_rejects_missing_coordinates(self):
        response = self.client.get("/api/restrooms/nearest?latitude=36.9750")

        self.assertEqual(response.status_code, 400)
        self.assertIn("longitude", response.get_json()["error"])

    def test_nearby_rejects_missing_coordinates(self):
        response = self.client.get("/api/restrooms/nearby?latitude=36.9750")

        self.assertEqual(response.status_code, 400)
        self.assertIn("longitude", response.get_json()["error"])

    def test_adds_a_user_submitted_restroom(self):
        response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New Campus Restroom",
                "address": "1156 High St, Santa Cruz, CA",
                "latitude": 36.9910,
                "longitude": -122.0600,
                "amenities": {
                    "accessible": True,
                    "singleOccupancy": True,
                    "cleanliness": 4,
                },
            },
        )

        self.assertEqual(response.status_code, 201)
        restroom = response.get_json()["restroom"]
        self.assertTrue(restroom["restroomId"].startswith("user-"))
        self.assertEqual(restroom["name"], "New Campus Restroom")
        self.assertEqual(restroom["latitude"], 36.9910)
        self.assertEqual(restroom["longitude"], -122.0600)
        self.assertEqual(restroom["amenities"]["cleanliness"], 4)
        self.assertEqual(len(self.collection.documents), 1)
        self.assertEqual(
            self.collection.documents[0]["geometry"]["coordinates"],
            [-122.0600, 36.9910],
        )

    def test_rejects_duplicate_restroom_coordinates(self):
        request_body = {
            "name": "New Campus Restroom",
            "latitude": 36.9910,
            "longitude": -122.0600,
        }
        first_response = self.client.post("/api/restrooms", json=request_body)
        duplicate_response = self.client.post("/api/restrooms", json=request_body)

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertIn("already exists", duplicate_response.get_json()["error"])

    def test_rejects_invalid_submitted_restroom_data(self):
        response = self.client.post(
            "/api/restrooms",
            json={
                "name": "",
                "latitude": "not a number",
                "longitude": -122.0600,
                "amenities": {"accessible": "yes"},
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
