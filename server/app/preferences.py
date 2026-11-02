"""
Removes restrooms with a confirmed amenity conflict, and 
keeps restrooms with missing/unknown amenity data. Also 
ranks restrooms using the amenity preferences selected by a user.
This does not access flask or mongodb, so a route can use it later
without duplicating the matching rules or changing the stored restroom data.
"""


# these are the boolean amenity fields a user can currently choose as preferences.
# cleanliness is not included because it needs a separate minimum-rating rule later.
preference_amenities = frozenset(
    {
        "paymentRequired",
        "accessible",
        "unisex",
        "singleOccupancy",
        "menstrualProductsAvailable",
        "babyChangingStation",
    }
)


def prioritize_restrooms(restrooms, preferences):
    # return a new ordered list without changing the original restroom list.
    # this lets the future nearby endpoint preserve its distance ordering when
    # two restrooms have the same preference priority.
    validated_preferences = validate_preferences(preferences)

    return sorted(
        restrooms,
        key=lambda restroom: preference_rank(restroom, validated_preferences),
    )


def filter_restrooms(restrooms, preferences):
    # return a new list that removes only restrooms with a known conflict.
    # a missing amenity remains in the results because unknown information is
    # not the same as a confirmed false value.
    validated_preferences = validate_preferences(preferences)

    return [
        restroom
        for restroom in restrooms
        if not has_known_preference_conflict(restroom, validated_preferences)
    ]


def has_known_preference_conflict(restroom, preferences):
    # check one restroom for an amenity that is present but disagrees with a
    # selected preference. the helper keeps filtering rules in one place for
    # a future api route to reuse.
    amenities = restroom.get("amenities") or {}

    for preference_name, preferred_value in preferences.items():
        has_conflict = (
            preference_name in amenities
            and amenities[preference_name] != preferred_value
        )
        if has_conflict:
            return True

    return False


def validate_preferences(preferences):
    # make sure the future frontend only sends supported boolean preferences.
    # route code can show these messages to the frontend if it later accepts
    # preferences as query parameters or a json request body.
    if not isinstance(preferences, dict):
        raise ValueError("Preferences must be a dictionary.")

    unknown_preferences = set(preferences) - preference_amenities
    if unknown_preferences:
        unknown_name = sorted(unknown_preferences)[0]
        raise ValueError(f"Unknown preference: '{unknown_name}'.")

    for preference_name, value in preferences.items():
        # python considers true and false to be numbers, so check bool directly.
        if not isinstance(value, bool):
            raise ValueError(f"Preference '{preference_name}' must be true or false.")

    return preferences


def preference_rank(restroom, preferences):
    # build a sort key for one restroom.
    # lower values are ranked first by python's sorted function.
    amenities = restroom.get("amenities") or {}
    confirmed_matches = 0
    unknown_values = 0
    known_conflicts = 0

    for preference_name, preferred_value in preferences.items():
        # a missing amenity is unknown, not false. it should not be treated as
        # a conflict or cause the restroom to disappear from the results.
        if preference_name not in amenities:
            unknown_values += 1
            continue

        if amenities[preference_name] == preferred_value:
            confirmed_matches += 1
        else:
            known_conflicts += 1

    # confirmed matches come first, then restrooms with unknown values, and
    # then restrooms that are known not to meet at least one preference.
    return (
        1 if known_conflicts else 0,
        -confirmed_matches,
        unknown_values,
    )
