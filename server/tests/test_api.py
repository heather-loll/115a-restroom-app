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
        self.assertEqual(restroom["id"], "osm-way-20")
        self.assertEqual(restroom["name"], "Public restroom")
        self.assertEqual(restroom["details"]["wheelchair"], "yes")

    def test_rejects_missing_coordinates(self):
        response = self.client.get("/api/restrooms/nearest?latitude=36.9750")

        self.assertEqual(response.status_code, 400)
        self.assertIn("longitude", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
