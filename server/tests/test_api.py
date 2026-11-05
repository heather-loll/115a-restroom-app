"""
Tests the restroom API without requiring a live MongoDB server. MongoDB is replaced
with a small fake collection, so tests stay fast and reliable. The tests check
searches, user-submitted restrooms, validation, and duplicate handling.
Run with: `python -m unittest discover -s tests` in the virtual environment.
"""

import unittest
import mongomock_ng
from app import create_app


class RestroomApiTests(unittest.TestCase):
    def setUp(self):
        self.collection = mongomock_ng.MongoClient().db.collection
        self.collection.create_index([("geometry", "2dsphere")])
        self.collection.create_index("restroomId")
        self.app = create_app(
            {"TESTING": True, "RESTROOMS_COLLECTION": self.collection}
        )
        self.client = self.app.test_client()

    def test_returns_closest_restroom(self):
        # two database documents at different coordinates verify the nearest search.
        self.collection.insert_many(
            [
                {
                    "restroomId": "osm-10",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0300, 36.9800]
                    },
                    "name": "Near restroom",
                    "amenities": {"accessible": True},
                    "floor": "2",
                    "directions": "Near the elevators.",
                },
                {
                    "restroomId": "osm-20",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0301, 36.9800]
                    },
                    "name": "Far restroom",
                    "amenities": {"accessible": False},
                }
            ]
        )

        response = self.client.get(
            "/api/restrooms/nearest?latitude=36.9750&longitude=-122.0300"
        )

        self.assertEqual(response.status_code, 200)
        restroom = response.get_json()["restroom"]
        self.assertEqual(restroom["restroomId"], "osm-10")
        self.assertEqual(restroom["name"], "Near restroom")
        self.assertEqual(restroom["amenities"]["accessible"], True)
        self.assertEqual(restroom["floor"], "2")
        self.assertEqual(restroom["directions"], "Near the elevators.")


    def test_returns_all_nearby_restrooms_closest_first(self):
        # the endpoint should return one response item for every mapped restroom,
        # ordered so the frontend can render pins and identify the closest option.
        self.collection.insert_many(
            [
                {
                    "restroomId": "osm-10",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0300, 36.9800]
                    },
                    "name": "Near restroom",
                    "amenities": {"accessible": True},
                    "floor": "1",
                    "directions": "Enter through the main lobby.",
                },
                {
                    "restroomId": "osm-20",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0301, 36.9800]
                    },
                    "name": "Far restroom",
                    "amenities": {"accessible": False},
                }
            ]
        )


        response = self.client.get(
            "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0300"
        )

        self.assertEqual(response.status_code, 200)
        response_body = response.get_json()
        self.assertEqual(response_body["search"]["radiusMeters"], 1_000)
        self.assertEqual(len(response_body["restrooms"]), 2)
        self.assertEqual(
            response_body["restrooms"][0]["restroomId"], "osm-10"
        )
        self.assertEqual(
            response_body["restrooms"][0]["amenities"]["accessible"], True
        )
        self.assertEqual(response_body["restrooms"][0]["floor"], "1")
        self.assertEqual(
            response_body["restrooms"][0]["directions"],
            "Enter through the main lobby.",
        )

    def test_nearby_preferences_filter_conflicts_and_prioritize_matches(self):
        # known conflicts are removed. among the restrooms that remain, a
        # restroom matching both preferences is returned before a partial match
        # and a restroom with unknown amenity information.
        self.collection.insert_many(
            [
                {
                    "restroomId": "partial-match",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0300, 36.9800],
                    },
                    "name": "Partial match restroom",
                    "amenities": {"accessible": True},
                },
                {
                    "restroomId": "full-match",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0301, 36.9801],
                    },
                    "name": "Full match restroom",
                    "amenities": {"accessible": True, "unisex": True},
                },
                {
                    "restroomId": "unknown",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0302, 36.9802],
                    },
                    "name": "Unknown restroom",
                },
                {
                    "restroomId": "conflict",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [-122.0303, 36.9803],
                    },
                    "name": "Conflicting restroom",
                    "amenities": {"accessible": False, "unisex": True},
                },
            ]
        )

        response = self.client.get(
            "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0300"
            "&accessible=true&unisex=true"
        )

        self.assertEqual(response.status_code, 200)
        restroom_ids = [
            restroom["restroomId"] for restroom in response.get_json()["restrooms"]
        ]
        self.assertEqual(restroom_ids, ["full-match", "partial-match", "unknown"])

    def test_nearby_rejects_invalid_preference_query_parameter(self):
        # preference values must be literal true or false, not arbitrary text.
        response = self.client.get(
            "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0300"
            "&accessible=yes"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("accessible", response.get_json()["error"])

    def test_nearby_rejects_unknown_preference_query_parameter(self):
        # unsupported names should report a typo instead of being silently ignored.
        response = self.client.get(
            "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0300"
            "&hasCoffee=true"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("hasCoffee", response.get_json()["error"])

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
                "floor": "B1",
                "directions": "Go downstairs from the main entrance.",
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
        self.assertEqual(restroom["floor"], "B1")
        self.assertEqual(
            restroom["directions"],
            "Go downstairs from the main entrance.",
        )
        self.assertEqual(restroom["amenities"]["cleanliness"], 4)
        self.assertEqual(self.collection.count_documents({}), 1)
        document = self.collection.find_one()
        self.assertEqual(
            document["geometry"]["coordinates"],
            [-122.0600, 36.9910],
        )
        self.assertEqual(document["floor"], "B1")
        self.assertEqual(
            document["directions"],
            "Go downstairs from the main entrance.",
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

    def test_rejects_invalid_floor_and_directions(self):
        # floor and directions are optional, but supplied values must be valid
        # short text so they are useful and safe to display in the app.
        invalid_floor_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "Invalid floor restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
                "floor": 2,
            },
        )
        long_directions_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "Long directions restroom",
                "latitude": 36.9920,
                "longitude": -122.0600,
                "directions": "a" * 301,
            },
        )

        self.assertEqual(invalid_floor_response.status_code, 400)
        self.assertIn("floor", invalid_floor_response.get_json()["error"])
        self.assertEqual(long_directions_response.status_code, 400)
        self.assertIn("directions", long_directions_response.get_json()["error"])

    def test_amends_an_existing_restroom(self):
        # create one record first, then verify amend returns and stores its changes.
        create_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "Original restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
                "amenities": {"accessible": True},
            },
        )
        restroom_id = create_response.get_json()["restroom"]["restroomId"]

        response = self.client.post(
            "/api/restrooms/amend",
            json={
                "restroomId": restroom_id,
                "name": "Updated restroom",
                "amenities": {"accessible": False, "singleOccupancy": True},
                "floor": "3",
                "directions": "At the end of the north hallway.",
            },
        )

        self.assertEqual(response.status_code, 200)
        restroom = response.get_json()["restroom"]
        self.assertEqual(restroom["name"], "Updated restroom")
        self.assertEqual(restroom["amenities"]["accessible"], False)
        self.assertEqual(restroom["amenities"]["singleOccupancy"], True)
        self.assertEqual(restroom["floor"], "3")
        self.assertEqual(
            restroom["directions"],
            "At the end of the north hallway.",
        )
        document = self.collection.find_one({"restroomId": restroom_id})
        self.assertEqual(document["floor"], "3")
        self.assertEqual(
            document["directions"],
            "At the end of the north hallway.",
        )


if __name__ == "__main__":
    unittest.main()
