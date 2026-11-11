---
id: US-2-T-1
story: US-3.2
sprint: 3
assignee: Thalia Eischeid
estimate_hours: 3
---

# Prioritize nearby restrooms by cleanliness score

## Description

Serves US-3.2, which helps users choose a better restroom when they are not in a huge hurry. This task updates the nearby-restrooms backend response so restrooms with higher known cleanliness averages appear before lower-rated restrooms. The existing nearest-restroom endpoint remains based on distance. Creating ratings, calculating rating averages, busy information, and a future overall good-restroom score are out of scope.

## Specs

- `server/app/scores.py` adds `prioritize_by_cleanliness_score(restrooms)` for an already provided list of restroom dictionaries using the shared `Restroom` JSON structure.
- The helper returns a new list and does not change the input list.
- A restroom's current score is `amenities.cleanliness`, which is a known numeric cleanliness average of `1` for filthy, `2` for average, and `3` for pristine.
- Restrooms with higher known cleanliness scores are returned before restrooms with lower known scores.
- Restrooms without a known numeric cleanliness score remain in the list after scored restrooms. Their existing relative order is preserved.
- Equal scores preserve the incoming order. This retains the existing nearby order as a tie breaker.
- `GET /api/restrooms/nearby` filters known preference conflicts, applies the score helper, then applies its current preference ranking. Confirmed user preferences are the main ordering rule, and cleanliness score orders restrooms with the same preference rank. Its URL, query parameters, and JSON response shape do not change.
- `GET /api/restrooms/nearest` remains a distance-based search and is not changed by this task.
- The README explains that nearby results are prioritized by known cleanliness score and that unrated restrooms remain available after rated results.

## Requirements

- Reuse the existing `amenities.cleanliness` average returned by the rating feature.
- Do not change how cleanliness ratings are saved or calculated.
- Keep unknown cleanliness information separate from a score of `0` or a confirmed low score.
- Do not add runtime dependencies.
- Keep existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A restroom with a higher known cleanliness score is returned before a restroom with a lower known cleanliness score.
2. A restroom without `amenities.cleanliness` remains in the result list after restrooms with known scores.
3. Restrooms with equal known scores preserve their incoming order.
4. The score helper returns a new ordered list without changing its input list.
5. The nearby-restrooms endpoint returns higher-rated restrooms before lower-rated restrooms while keeping unknown-score restrooms available.
6. The nearest-restroom endpoint remains distance based, and the README documents the nearby score-ordering behavior.
7. When preferences are selected, a restroom with a confirmed matching preference is returned before a higher-scored restroom with unknown preference information.
