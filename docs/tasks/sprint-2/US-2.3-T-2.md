---
id: US-2.3-T-2
story: US-2.3
sprint: 2
assignee: Thalia Eischeid
estimate_hours: 3
---

# Prioritize nearby restrooms by selected preferences

## Description

Serves US-2.3, which helps users find restrooms that fit their preferences. This task adds standalone backend logic that ranks an already provided list of nearby restrooms by known amenity matches. Filtering out incompatible restrooms is covered by US-2.3-T-3. Connecting preferences to an API route, MongoDB queries, and the frontend preferences screen are out of scope.

## Specs

- `server/app/preferences.py` adds `prioritize_restrooms(restrooms, preferences)`.
- `restrooms` is a list of restroom dictionaries using the existing `amenities` object. The function returns a new ordered list and does not change the input list.
- Supported boolean preference fields are `paymentRequired`, `accessible`, `unisex`, `singleOccupancy`, `menstrualProductsAvailable`, and `babyChangingStation`.
- A restroom with a confirmed matching amenity is ranked before one with an unknown amenity or a confirmed conflicting amenity.
- A restroom matching more selected preferences is ranked before one matching fewer selected preferences.
- Missing amenities are unknown, not false, and remain in the returned list.
- With no selected preferences, the original nearby-restroom order is preserved.
- Unsupported preference fields and non-boolean preference values raise `ValueError`.

## Requirements

- Reuse the existing restroom and amenity field names.
- Do not change Flask routes, MongoDB code, the importer, or frontend files.
- Do not add runtime dependencies.
- Keep existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A restroom with a confirmed matching amenity is ranked before restrooms with an unknown or conflicting value for that amenity.
2. A restroom matching more selected preferences is ranked before a restroom matching fewer selected preferences.
3. A restroom with a missing requested amenity remains in the returned list.
4. Empty preferences preserve the input restroom order.
5. An unsupported preference field raises `ValueError`.
6. A non-boolean preference value raises `ValueError`.
