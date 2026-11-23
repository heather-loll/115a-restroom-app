"""
Tests the restroom API without requiring a live MongoDB server. MongoDB is replaced
with a small fake collection, so tests stay fast and reliable. The tests check
searches, user-submitted restrooms, validation, and duplicate handling.
Run with: `python -m unittest discover -s tests` in the virtual environment.
"""

import unittest
from operator import truediv

import mongomock_ng
from app import create_app
from app.limiter import limiter


class RestroomRateLimitTests(unittest.TestCase):
    def setUp(self):
        # use two in-memory collections so rating tests never require a running
        # MongoDB server or add test data to a real database.
        database = mongomock_ng.MongoClient().db
        self.collection = database.restrooms
        self.ratings_collection = database.restroom_ratings
        self.reports_collection = database.restroom_reports
        self.collection.create_index([("geometry", "2dsphere")])
        self.collection.create_index("restroomId")
        self.app = create_app(
            {
                "TESTING": True,
                "RESTROOMS_COLLECTION": self.collection,
                "RATINGS_COLLECTION": self.ratings_collection,
                "REPORTS_COLLECTION": self.reports_collection
            }
        )
        self.client = self.app.test_client()

    def test_s_4_us_4_t_2_rate_limiting_reports(self):
        add_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
            },
        )
        rid = add_response.get_json()["restroom"]["restroomId"]
        limiter.enabled = True
        for i in range(0, 3):
            report_response = self.client.post(
                f"/api/restrooms/{rid}/report",
                json={
                    "reports": {
                        "nonexistent": True
                    }
                },

            )
            self.assertEqual(report_response.status_code, 201)

        report_response = self.client.post(
            f"/api/restrooms/{rid}/report",
            json={
                "reports": {
                    "nonexistent": True
                }
            },

        )
        self.assertEqual(report_response.status_code, 429)

    def test_s_4_us_4_t_2_rate_limiting_ratings(self):
        add_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
            },
        )
        rid = add_response.get_json()["restroom"]["restroomId"]
        limiter.enabled = True
        for i in range(0, 5):
            rating_response = self.client.post(
                f"/api/restrooms/{rid}/ratings",
                json={"cleanliness": 3},
            )
            self.assertEqual(rating_response.status_code, 201)

        rating_response = self.client.post(
            f"/api/restrooms/{rid}/ratings",
            json={"cleanliness": 3},
        )
        self.assertEqual(rating_response.status_code, 429)

    def test_s_4_us_4_t_2_rate_limiting_amends(self):
        add_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
            },
        )
        rid = add_response.get_json()["restroom"]["restroomId"]
        limiter.enabled = True
        for i in range(0, 5):
            amend_response = self.client.post(
                "/api/restrooms/amend",
                json={
                    "restroomId": rid,
                    "name": "Updated restroom",
                    "amenities": {"accessible": False, "singleOccupancy": True},
                    "floor": "3",
                    "directions": "At the end of the north hallway.",
                },
            )
            self.assertEqual(amend_response.status_code, 200)

        amend_response = self.client.post(
            "/api/restrooms/amend",
            json={
                "restroomId": rid,
                "name": "Updated restroom",
                "amenities": {"accessible": False, "singleOccupancy": True},
                "floor": "3",
                "directions": "At the end of the north hallway.",
            },
        )
        self.assertEqual(amend_response.status_code, 429)

    def test_s_4_us_4_t_2_rate_limiting_new_restrooms(self):
        limiter.enabled = True
        for i in range(0,10):
            add_response = self.client.post(
                "/api/restrooms",
                json={
                    "name": f"New restroom{i}",
                    "latitude": 36.9910+i,
                    "longitude": -122.0600+i,
                },
            )
            self.assertEqual(add_response.status_code, 201)

        add_response = self.client.post(
            "/api/restrooms",
            json={
                "name": f"Newer restroom",
                "latitude": 36.9900,
                "longitude": -122.0500,
            },
        )
        self.assertEqual(add_response.status_code, 429)

    def test_s_4_us_4_t_2_not_rate_limiting_multiple_ratings(self):
        add_response1 = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
            },
        )
        rid1 = add_response1.get_json()["restroom"]["restroomId"]
        add_response2 = self.client.post(
            "/api/restrooms",
            json={
                "name": "Newer restroom",
                "latitude": 36.9920,
                "longitude": -122.0610,
            },
        )
        rid2 = add_response2.get_json()["restroom"]["restroomId"]
        limiter.enabled = True
        for i in range(0, 5):
            rating_response = self.client.post(
                f"/api/restrooms/{rid1}/ratings",
                json={"cleanliness": 3},
            )
            self.assertEqual(rating_response.status_code, 201)
            rating_response = self.client.post(
                f"/api/restrooms/{rid2}/ratings",
                json={"cleanliness": 3},
            )
            self.assertEqual(rating_response.status_code, 201)


        rating_response = self.client.post(
            f"/api/restrooms/{rid1}/ratings",
            json={"cleanliness": 3},
        )
        self.assertEqual(rating_response.status_code, 429)
        rating_response = self.client.post(
            f"/api/restrooms/{rid2}/ratings",
            json={"cleanliness": 3},
        )
        self.assertEqual(rating_response.status_code, 429)

    def test_s_4_us_4_t_2_not_rate_limiting_nearest(self):
        add_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom",
                "latitude": 36.9910,
                "longitude": -122.0600,
            },
        )
        limiter.enabled = True
        for i in range(0, 100):
            nearest_response = self.client.get(
                "/api/restrooms/nearest?latitude=36.9910&longitude=-122.0600"
            )
            self.assertEqual(nearest_response.status_code, 200)


if __name__ == "__main__":
    unittest.main()
