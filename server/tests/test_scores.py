"""
Tests cleanliness-score ordering without Flask or MongoDB.
These tests make sure nearby restroom ranking stays predictable before the API
route uses the same helper.
Run with: `python -m unittest discover -s tests` in the virtual environment.
"""

import unittest
from app.scores import prioritize_by_cleanliness_score


class CleanlinessScoreTests(unittest.TestCase):
    def test_us_2_t_1_places_higher_scores_before_lower_scores(self):
        # a farther restroom with a higher known score should be listed before
        # a closer restroom with a lower score when choosing a better option.
        restrooms = [
            {
                "restroomId": "low-score",
                "amenities": {"cleanliness": 1},
            },
            {
                "restroomId": "high-score",
                "amenities": {"cleanliness": 3},
            },
        ]

        prioritized_restrooms = prioritize_by_cleanliness_score(restrooms)

        restroom_ids = [
            restroom["restroomId"] for restroom in prioritized_restrooms
        ]
        self.assertEqual(restroom_ids, ["high-score", "low-score"])

    def test_us_2_t_1_keeps_unrated_restrooms_after_scored_restrooms(self):
        # missing cleanliness information is unknown, not a score of zero.
        # the restroom remains available after restrooms with known scores.
        restrooms = [
            {
                "restroomId": "unrated",
                "amenities": {"accessible": True},
            },
            {
                "restroomId": "rated",
                "amenities": {"cleanliness": 2},
            },
        ]

        prioritized_restrooms = prioritize_by_cleanliness_score(restrooms)

        restroom_ids = [
            restroom["restroomId"] for restroom in prioritized_restrooms
        ]
        self.assertEqual(restroom_ids, ["rated", "unrated"])

    def test_us_2_t_1_preserves_order_for_equal_scores(self):
        # python's stable ordering lets existing distance and preference ranking
        # stay as the tie breaker when two restrooms have the same score.
        restrooms = [
            {
                "restroomId": "first-equal-score",
                "amenities": {"cleanliness": 2.5},
            },
            {
                "restroomId": "second-equal-score",
                "amenities": {"cleanliness": 2.5},
            },
        ]

        prioritized_restrooms = prioritize_by_cleanliness_score(restrooms)

        restroom_ids = [
            restroom["restroomId"] for restroom in prioritized_restrooms
        ]
        self.assertEqual(
            restroom_ids,
            ["first-equal-score", "second-equal-score"],
        )


if __name__ == "__main__":
    unittest.main()
