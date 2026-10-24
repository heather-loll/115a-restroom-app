"""
Tests the restroom preference-ranking and preference-filering helpers without flask, 
mongodb, or a live database. run with: `python -m unittest discover -s tests` in venv.
"""

import unittest
from app.preferences import filter_restrooms, prioritize_restrooms


class preference_matching_tests(unittest.TestCase):
    # confirmed amenity matches should be shown before unknown or conflicting data.
    def test_prioritizes_confirmed_matches_before_unknown_and_conflicting_restrooms(self):
        restrooms = [
            {
                "restroomId": "unknown-accessibility",
                "amenities": {},
            },
            {
                "restroomId": "not-accessible",
                "amenities": {"accessible": False},
            },
            {
                "restroomId": "accessible",
                "amenities": {"accessible": True},
            },
        ]

        prioritized_restrooms = prioritize_restrooms(
            restrooms,
            {"accessible": True},
        )

        restroom_ids = [restroom["restroomId"] for restroom in prioritized_restrooms]
        self.assertEqual(
            restroom_ids,
            ["accessible", "unknown-accessibility", "not-accessible"],
        )

    # a restroom with missing information stays in the list because unknown is
    # different from a confirmed false value.
    def test_keeps_restrooms_with_unknown_amenities(self):
        restrooms = [
            {"restroomId": "unknown", "amenities": {}},
            {"restroomId": "match", "amenities": {"singleOccupancy": True}},
        ]

        prioritized_restrooms = prioritize_restrooms(
            restrooms,
            {"singleOccupancy": True},
        )

        self.assertEqual(len(prioritized_restrooms), 2)
        self.assertEqual(prioritized_restrooms[1]["restroomId"], "unknown")

    # matching more selected preferences should rank a restroom higher.
    def test_prioritizes_restrooms_with_more_confirmed_matches(self):
        restrooms = [
            {
                "restroomId": "one-match-one-unknown",
                "amenities": {"accessible": True},
            },
            {
                "restroomId": "two-matches",
                "amenities": {"accessible": True, "singleOccupancy": True},
            },
        ]

        prioritized_restrooms = prioritize_restrooms(
            restrooms,
            {"accessible": True, "singleOccupancy": True},
        )

        self.assertEqual(prioritized_restrooms[0]["restroomId"], "two-matches")

    # empty preferences should leave the nearby endpoint's original distance order alone.
    def test_preserves_original_order_when_no_preferences_are_selected(self):
        restrooms = [
            {"restroomId": "closest", "amenities": {"accessible": False}},
            {"restroomId": "farther", "amenities": {"accessible": True}},
        ]

        prioritized_restrooms = prioritize_restrooms(restrooms, {})

        restroom_ids = [restroom["restroomId"] for restroom in prioritized_restrooms]
        self.assertEqual(restroom_ids, ["closest", "farther"])

    # restrooms with a confirmed conflict are removed, but missing information
    # remains available because the app does not know that it is a mismatch.
    def test_filters_known_conflicts_but_keeps_unknown_amenities(self):
        restrooms = [
            {"restroomId": "match", "amenities": {"accessible": True}},
            {"restroomId": "unknown", "amenities": {}},
            {"restroomId": "conflict", "amenities": {"accessible": False}},
        ]

        filtered_restrooms = filter_restrooms(restrooms, {"accessible": True})

        restroom_ids = [restroom["restroomId"] for restroom in filtered_restrooms]
        self.assertEqual(restroom_ids, ["match", "unknown"])

    # false is also a valid preference. this checks that a user who wants a
    # free restroom can remove restrooms known to require payment.
    def test_filters_conflicts_for_false_preferences(self):
        restrooms = [
            {"restroomId": "free", "amenities": {"paymentRequired": False}},
            {"restroomId": "paid", "amenities": {"paymentRequired": True}},
        ]

        filtered_restrooms = filter_restrooms(
            restrooms,
            {"paymentRequired": False},
        )

        self.assertEqual(filtered_restrooms[0]["restroomId"], "free")
        self.assertEqual(len(filtered_restrooms), 1)

    # filtering can run before ranking, which is how a later nearby endpoint
    # can remove confirmed conflicts and prioritize the remaining results.
    def test_can_filter_before_prioritizing_restrooms(self):
        restrooms = [
            {"restroomId": "unknown", "amenities": {}},
            {"restroomId": "conflict", "amenities": {"accessible": False}},
            {"restroomId": "match", "amenities": {"accessible": True}},
        ]

        filtered_restrooms = filter_restrooms(restrooms, {"accessible": True})
        prioritized_restrooms = prioritize_restrooms(
            filtered_restrooms,
            {"accessible": True},
        )

        restroom_ids = [restroom["restroomId"] for restroom in prioritized_restrooms]
        self.assertEqual(restroom_ids, ["match", "unknown"])

    # rejecting unsupported fields keeps future api requests aligned with the
    # shared restroom amenity names.
    def test_rejects_unknown_preference_names(self):
        with self.assertRaisesRegex(ValueError, "Unknown preference"):
            prioritize_restrooms([], {"hasCoffee": True})


if __name__ == "__main__":
    unittest.main()
