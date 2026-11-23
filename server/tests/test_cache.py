'''
Tests backend caching behavior without requiring a live mongodb server.
Run with: `python -m unittest discover -s tests` in the virtual environment.
'''

import unittest
from unittest.mock import patch

from app import create_app


class RestroomSearchCacheTests(unittest.TestCase):
    # test the cache through the existing flask routes so these tests verify
    # both the stored data and the behavior a frontend request receives.
    def setUp(self):
        self.app = create_app(
            {
                "TESTING": True,
                # cache tests must not be blocked by the separate rate-limit task.
                "RATELIMIT_ENABLED": False,
            }
        )
        self.client = self.app.test_client()

    def nearby_restroom(self):
        # return one already formatted restroom like the nearby database helper.
        return {
            "restroomId": "osm-cache-nearby",
            "name": "Cached nearby restroom",
            "latitude": 36.9749,
            "longitude": -122.0308,
            "distanceMeters": 100,
        }

    def nearest_restroom(self):
        # return one already formatted restroom like the nearest database helper.
        return {
            "restroomId": "osm-cache-nearest",
            "name": "Cached nearest restroom",
            "latitude": 36.9749,
            "longitude": -122.0308,
            "distanceMeters": 100,
        }

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_reuses_recent_nearby_search(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 1: an identical nearby request should use the result stored
        # by the first request instead of searching mongodb a second time.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_response = self.client.get(url)
        second_response = self.client.get(url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(first_response.get_json(), second_response.get_json())
        find_nearby_restrooms_mock.assert_called_once_with(
            latitude=36.9749,
            longitude=-122.0308,
            radius_meters=1_000,
        )

    @patch("app.routes.find_nearest_restroom")
    def test_s_4_us_1_t_2_reuses_recent_nearest_search(
        self,
        find_nearest_restroom_mock,
    ):
        # criterion 2: the nearest endpoint should also reuse a matching recent
        # result while keeping its existing response fields and status code.
        find_nearest_restroom_mock.return_value = self.nearest_restroom()
        url = "/api/restrooms/nearest?latitude=36.9749&longitude=-122.0308"

        first_response = self.client.get(url)
        second_response = self.client.get(url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(first_response.get_json(), second_response.get_json())
        find_nearest_restroom_mock.assert_called_once_with(
            latitude=36.9749,
            longitude=-122.0308,
            radius_meters=1_000,
        )

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_keeps_coordinate_searches_separate(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 3: a repeated location can use the cache, but a different
        # location needs a separate database search and cached result.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        first_location_url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"
        second_location_url = "/api/restrooms/nearby?latitude=36.9750&longitude=-122.0308"

        first_response = self.client.get(first_location_url)
        repeated_response = self.client.get(first_location_url)
        second_response = self.client.get(second_location_url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(repeated_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_keeps_radius_searches_separate(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 4: the radius changes which restrooms can be returned, so
        # requests with different radii must not share a cached result.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        default_radius_url = (
            "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"
        )
        larger_radius_url = (
            "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"
            "&radius_meters=1500"
        )

        first_response = self.client.get(default_radius_url)
        repeated_response = self.client.get(default_radius_url)
        larger_radius_response = self.client.get(larger_radius_url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(repeated_response.status_code, 200)
        self.assertEqual(larger_radius_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_keeps_preference_searches_separate(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 5: user preferences affect filtering and ordering, so a
        # preference search must not reuse an unfiltered cached result.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        no_preference_url = (
            "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"
        )
        accessible_url = (
            "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"
            "&accessible=true"
        )

        first_response = self.client.get(no_preference_url)
        repeated_response = self.client.get(no_preference_url)
        accessible_response = self.client.get(accessible_url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(repeated_response.status_code, 200)
        self.assertEqual(accessible_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)


if __name__ == "__main__":
    unittest.main()
