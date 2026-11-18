"""
Ranks restroom dictionaries using their known cleanliness averages.
This module has no Flask or MongoDB code, so routes can reuse the same ordering
rules without changing stored restroom data.
"""


def prioritize_by_cleanliness_score(restrooms):
    # return a new list with known higher scores first. Python's sorted function
    # is stable, so equal and unknown scores keep the incoming distance order
    # that the nearby endpoint already created.
    return sorted(restrooms, key=cleanliness_score_sort_key)


def cleanliness_score_sort_key(restroom):
    # create a sort key for one restroom. lower key values come first, so a
    # negative known score sorts highest-to-lowest. unknown scores use a larger
    # first value and remain after all restrooms with known scores.
    amenities = restroom.get("amenities") or {}
    score = amenities.get("cleanliness")

    # bool is a Python number type, but it is not a valid cleanliness average.
    # unexpected or out-of-range values are treated as unknown rather than as a
    # low score, which keeps the unknown data rule consistent.
    if (
        isinstance(score, bool)
        or not isinstance(score, (int, float))
        or not 1 <= score <= 3
    ):
        return (1, 0)  # 1 puts unknown scores after known scores, 0 is a placeholder

    return (0, -score)  # 0 puts known scores first
