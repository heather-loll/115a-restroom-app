"""
Tests the API using fake restroom data rather than making a real OpenStreetMap request.
These tests mock OpenStreetMap, so they're fast and don't depend on Wi-Fi. It checks that 
the closest restroom is returned and that invalid or missing coordinates are handled safely.
Run with: `python -m unittest discover -s tests` in the virtual environment.
"""

import unittest
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

class NearestRestroomApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True})
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


if __name__ == "__main__":
    unittest.main()
