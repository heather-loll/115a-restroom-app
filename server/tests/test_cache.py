'''
Tests backend caching behavior without requiring a live MongoDB server.
Run with: `python -m unittest discover -s tests` in the virtual environment.
'''

import unittest
from unittest.mock import patch

import mongomock_ng
from app import create_app
from app.cache import RestroomSearchCache
from app.mongodb import MongoDatabaseError


class RestroomSearchCacheTests(unittest.TestCase):
    # test the cache through the existing flask routes so these tests verify
    # both the stored data and the behavior a frontend request receives.
    def setUp(self):
        # use in-memory collections so mutation tests never add data to a real
        # MongoDB database and stay independent from one another.
        database = mongomock_ng.MongoClient().db
        self.collection = database.restrooms
        self.ratings_collection = database.restroom_ratings
        self.reports_collection = database.restroom_reports
        self.collection.create_index([("geometry", "2dsphere")])
        self.collection.create_index("restroomId")
        self.app = create_app(
            {
                "TESTING": True,
                # cache tests must not be blocked by the separate rate-limit task.
                "RATELIMIT_ENABLED": False,
                "RESTROOMS_COLLECTION": self.collection,
                "RATINGS_COLLECTION": self.ratings_collection,
                "REPORTS_COLLECTION": self.reports_collection,
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

    def create_test_restroom(self):
        # add one real in-memory restroom for amend, rating, and report requests.
        response = self.client.post(
            "/api/restrooms",
            json={
                "name": "Restroom changed by a cache test",
                "latitude": 36.9749,
                "longitude": -122.0308,
                "amenities": {"accessible": True},
            },
        )

        self.assertEqual(response.status_code, 201)
        return response.get_json()["restroom"]["restroomId"]

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

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_refreshes_an_expired_search(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 6: use a controlled clock so this test can move past the
        # five-minute lifetime immediately instead of waiting in real time.
        # an expired entry searches MongoDB again and returns a new stored result.
        current_time = [0]
        self.app.config["RESTROOM_SEARCH_CACHE"] = RestroomSearchCache(
            time_function=lambda: current_time[0],
        )
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_response = self.client.get(url)
        current_time[0] = 301  # seconds, past 5 mins.
        expired_response = self.client.get(url)
        # the expired request performs the second search and saves a fresh
        # result, so this immediate third request does not search again.
        refreshed_response = self.client.get(url)

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(expired_response.status_code, 200)
        self.assertEqual(refreshed_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_does_not_cache_invalid_searches(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 7: an invalid request returns 400. a later valid request
        # must still search normally once, then cache its successful response.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        invalid_url = "/api/restrooms/nearby?latitude=not-a-number&longitude=-122.0308"
        valid_url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        invalid_response = self.client.get(invalid_url)
        first_valid_response = self.client.get(valid_url)
        repeated_valid_response = self.client.get(valid_url)

        self.assertEqual(invalid_response.status_code, 400)
        self.assertEqual(first_valid_response.status_code, 200)
        self.assertEqual(repeated_valid_response.status_code, 200)
        find_nearby_restrooms_mock.assert_called_once_with(
            latitude=36.9749,
            longitude=-122.0308,
            radius_meters=1_000,
        )

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_does_not_cache_database_errors(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 8: a temporary database failure returns 503 but is not
        # saved. after the database recovers, a successful result can be cached.
        find_nearby_restrooms_mock.side_effect = MongoDatabaseError(
            "Database is temporarily unavailable."
        )
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        error_response = self.client.get(url)
        find_nearby_restrooms_mock.side_effect = None
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        first_valid_response = self.client.get(url)
        repeated_valid_response = self.client.get(url)

        self.assertEqual(error_response.status_code, 503)
        self.assertEqual(first_valid_response.status_code, 200)
        self.assertEqual(repeated_valid_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_clears_searches_after_creating_a_restroom(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 9: after a restroom is created, next matching restroom search
        # performs new search instead of returning previous cached result.
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_search_response = self.client.get(url)
        cached_search_response = self.client.get(url)

        create_response = self.client.post(
            "/api/restrooms",
            json={
                "name": "New restroom after cached search",
                "latitude": 36.9750,
                "longitude": -122.0308,
            },
        )
        refreshed_response = self.client.get(url)

        self.assertEqual(first_search_response.status_code, 200)
        self.assertEqual(cached_search_response.status_code, 200)
        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(refreshed_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_clears_searches_after_amending_a_restroom(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 10: after an amendment, next matching restroom search
        # performs new search instead of returning previous cached result.
        restroom_id = self.create_test_restroom()
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_search_response = self.client.get(url)
        cached_search_response = self.client.get(url)

        amend_response = self.client.post(
            "/api/restrooms/amend",
            json={
                "restroomId": restroom_id,
                "name": "Amended restroom name",
                "amenities": {"accessible": True},
            },
        )
        refreshed_response = self.client.get(url)

        self.assertEqual(first_search_response.status_code, 200)
        self.assertEqual(cached_search_response.status_code, 200)
        self.assertEqual(amend_response.status_code, 200)
        self.assertEqual(refreshed_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_clears_searches_after_rating_a_restroom(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 11: after a new cleanliness vote, next matching restroom
        # search performs new search instead of returning previous cached result.
        restroom_id = self.create_test_restroom()
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_search_response = self.client.get(url)
        cached_search_response = self.client.get(url)

        rating_response = self.client.post(
            f"/api/restrooms/{restroom_id}/ratings",
            json={"cleanliness": 3},
        )
        refreshed_response = self.client.get(url)

        self.assertEqual(first_search_response.status_code, 200)
        self.assertEqual(cached_search_response.status_code, 200)
        self.assertEqual(rating_response.status_code, 201)
        self.assertEqual(refreshed_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    @patch("app.routes.find_nearby_restrooms")
    def test_s_4_us_1_t_2_clears_searches_after_reporting_a_restroom(
        self,
        find_nearby_restrooms_mock,
    ):
        # criterion 12: after new report info, next matching restroom search
        # performs new search instead of returning previous cached result.
        restroom_id = self.create_test_restroom()
        find_nearby_restrooms_mock.return_value = [self.nearby_restroom()]
        url = "/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308"

        first_search_response = self.client.get(url)
        cached_search_response = self.client.get(url)

        report_response = self.client.post(
            f"/api/restrooms/{restroom_id}/report",
            json={"reports": {"broken": True}},
        )
        refreshed_response = self.client.get(url)

        self.assertEqual(first_search_response.status_code, 200)
        self.assertEqual(cached_search_response.status_code, 200)
        self.assertEqual(report_response.status_code, 201)
        self.assertEqual(refreshed_response.status_code, 200)
        self.assertEqual(find_nearby_restrooms_mock.call_count, 2)

    def test_s_4_us_1_t_2_returns_only_unexpired_cache_results(self):
        # criterion 13: the helper returns a stored result before the lifetime
        # ends and returns none after five minutes have passed.
        current_time = [0]
        cache = RestroomSearchCache(time_function=lambda: current_time[0])
        cache_key = ("nearby", 36.9749, -122.0308, 1_000, ())
        stored_result = {"restrooms": [self.nearby_restroom()]}

        cache.store(cache_key, stored_result)
        self.assertEqual(cache.get(cache_key), stored_result)

        current_time[0] = 301  # seconds, past the 5 mins.
        self.assertIsNone(cache.get(cache_key))


if __name__ == "__main__":
    unittest.main()
