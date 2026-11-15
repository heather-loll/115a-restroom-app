---
id: US-1-T-2
story: US-3.1
sprint: 3
assignee: Thalia Eischeid
estimate_hours: 5
---

# Save cleanliness votes and return a rolling average

## Description

Serves US-3.1, which helps users judge how good a restroom is before choosing it. This task replaces the existing one to five cleanliness amenity value with separate user votes using the agreed scale of 1 for filthy, 2 for average, and 3 for pristine. It saves each vote in MongoDB, calculates a rolling average, and returns that average with restroom data. Users may include a cleanliness vote when adding a new restroom or send a later vote through the rating endpoint. Reporting broken equipment, busy information, an overall good-restroom score, and a frontend rating screen are out of scope.

## Specs

- `POST /api/restrooms/<restroom_id>/ratings` accepts a JSON object with `cleanliness` as a whole number of `1`, `2`, or `3`.
- A valid request creates a separate MongoDB rating document containing the restroom ID and cleanliness vote. Existing votes are not replaced.
- A successful request returns HTTP `201` with the updated restroom under `restroom` and its `ratingCount`. The returned restroom uses the existing `Restroom` JSON structure, and `restroom.amenities.cleanliness` is the rolling average of all saved cleanliness votes for that restroom.
- `GET /api/restrooms/nearest` and `GET /api/restrooms/nearby` return the same rolling cleanliness average for a restroom that has saved votes. They exclude `amenities.cleanliness` when no cleanliness votes exist.
- A missing, non-integer, boolean, or out-of-range cleanliness value returns HTTP `400` and creates no rating document. Ratings for an unknown restroom ID return HTTP `409`.
- `POST /api/restrooms` may include `amenities.cleanliness` as a whole number of `1`, `2`, or `3`. It saves the new restroom and one separate cleanliness rating when that value is supplied.
- `POST /api/restrooms/amend` does not accept `amenities.cleanliness`. Without user accounts, the backend cannot tell which earlier vote belongs to the current user. A later vote uses the rating endpoint and is added to the average instead of overwriting another vote.

## Requirements

- Use the existing Flask application, MongoDB helpers, and shared `Restroom` response structure.
- Store individual ratings separately from restroom documents so a later feature can use the original votes.
- Keep the existing boolean amenity names and preference behavior unchanged.
- Do not add runtime dependencies.
- Do not modify frontend files as part of this backend task.
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A valid cleanliness vote of `1`, `2`, or `3` creates a separate rating document and returns HTTP `201` with the submitted restroom, its cleanliness average, and a rating count of `1`.
2. A request with a missing, boolean, non-integer, or out-of-range cleanliness value returns HTTP `400` and does not create a rating document.
3. A rating request for an unknown restroom ID returns HTTP `409` and does not create a rating document.
4. Two saved votes for the same restroom remain separate and return their arithmetic rolling average with the correct rating count.
5. The nearest and nearby restroom responses include the rolling cleanliness average only for restrooms with saved cleanliness votes.
6. Add-restroom requests may save one valid one through three cleanliness vote, amend-restroom requests reject cleanliness votes, and the README documents the new rating system.
