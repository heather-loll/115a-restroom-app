---
id: US-2.3-T-3
story: US-2.3
sprint: 2
assignee: Thalia Eischeid
estimate_hours: 3
---

# Exclude restrooms with known preference conflicts

## Description
Serves US-2.3 by removing nearby restrooms that are known not to fit a user's selected amenity preferences. This task builds on the ranking helper from US-2.3-T-2, which is already in main before this task begins. Unknown amenities remain available because missing data is not proof of a conflict. API-route integration, MongoDB query changes, and the frontend preferences screen are out of scope.

## Specs
- `server/app/preferences.py` adds `filter_restrooms(restrooms, preferences)`.
- The function returns a new list and does not change the input list.
- A restroom is excluded when it has a requested amenity with a known value that differs from the selected preference.
- A restroom with a missing requested amenity remains in the returned list.
- Boolean `false` is a valid preference. For example, `paymentRequired: false` excludes restrooms known to require payment.
- The remaining restrooms keep their original order.
- The returned list can be passed to `prioritize_restrooms()` from US-2.3-T-2.

## Requirements
- Reuse `validate_preferences()` from US-2.3-T-2.
- Reuse the existing restroom and amenity field names.
- Do not change Flask routes, MongoDB code, the importer, or frontend files.
- Do not add runtime dependencies.
- Keep existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria
1. A restroom with a confirmed conflicting amenity is excluded.
2. A restroom with a missing requested amenity remains in the returned list.
3. A false preference excludes a restroom with the conflicting true value.
4. The remaining restrooms preserve their original order.
5. Filtering results can be passed to `prioritize_restrooms()` and confirmed matches are ranked first.
