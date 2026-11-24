---
id: S-4-US-1-T-2
story: US-4.1
sprint: 4
assignee: Thalia Eischeid
estimate_hours: 5
---

# Cache recent restroom searches on the backend

## Description

Serves US 4.1 by avoiding repeated MongoDB searches when the backend has recently returned the same restroom search result. This task caches the `GET /api/restrooms/nearby` map results and `GET /api/restrooms/nearest` result for five minutes. Five minutes is long enough for recent searches to be helpful, but short enough that restroom information does not stay outdated for long. Successful create, amend, rating, and report requests also clear the cache so normal changes appear sooner. Frontend device caching, offline map use, MongoDB geospatial indexes, and deployment caching are out of scope.

## Specs

- `server/app/cache.py` provides the backend cache used by the restroom-search routes. Its `RestroomSearchCache.store(key, result)` method saves JSON-ready results from successful HTTP `200` search responses in memory for five minutes, and `RestroomSearchCache.get(key)` returns a matching unexpired result or `None`.
- `GET /api/restrooms/nearby` caches and reuses its complete successful response data, including the `search` object and `restrooms` list. Its existing query parameters, HTTP status codes, and response field names do not change.
- `GET /api/restrooms/nearest` caches and reuses its complete successful response data, including the `search` object and `restroom` value. Its existing query parameters, HTTP status codes, and response field names do not change.
- A cache key includes the route name, `latitude`, `longitude`, `radius_meters`, and every valid nearby preference parameter with its boolean value. Requests with different search values or preferences must not reuse each other's results.
- Only successful HTTP `200` search responses are cached. Invalid search requests and database-error responses are not cached.
- A cached entry expires five minutes after it is stored. The next identical valid request after expiration performs a new MongoDB search and stores a fresh result.
- A successful `POST /api/restrooms`, `POST /api/restrooms/amend`, `POST /api/restrooms/<restroom_id>/ratings`, or `POST /api/restrooms/<restroom_id>/report` clears cached search results so later searches can include changed restroom data.
- Tests in `server/tests/test_cache.py` cover the cache helper and route-level behavior through the existing Flask API routes.

## Requirements

- Use only the Python standard library and existing project dependencies.
- Keep cached results in backend process memory. Do not add another database collection, or a new external service.
- Do not change the existing MongoDB search queries, their geospatial indexes or the shared frontend response structure.
- Do not cache invalid requests, `503` database-error responses, or mutation responses.
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A second identical valid `GET /api/restrooms/nearby` request made within five minutes returns HTTP `200` with the same `search` and `restrooms` fields without performing another MongoDB nearby-restroom search.
2. A second identical valid `GET /api/restrooms/nearest` request made within five minutes returns HTTP `200` with the same `search` and `restroom` fields without performing another MongoDB nearest-restroom search.
3. A nearby-search request with different coordinates does not reuse another search's cached result.
4. A nearby-search request with a different radius value does not reuse another search's cached result.
5. A nearby-search request with different selected preference values does not reuse another search's cached result.
6. An identical valid search made after its five-minute cache lifetime performs a new MongoDB search and returns a newly stored result.
7. An invalid search request that returns HTTP `400` is not cached, so a later valid request performs one normal MongoDB search and then caches its successful response.
8. A database-error search request that returns HTTP `503` is not cached, so after the database recovers, a successful request performs one normal MongoDB search and then caches its result.
9. After a successful `POST /api/restrooms` request, the next matching restroom search performs a new MongoDB search instead of returning the previous cached search result.
10. After a successful `POST /api/restrooms/amend` request, the next matching restroom search performs a new MongoDB search instead of returning the previous cached search result.
11. After a successful `POST /api/restrooms/<restroom_id>/ratings` request, the next matching restroom search performs a new MongoDB search instead of returning the previous cached search result.
12. After a successful `POST /api/restrooms/<restroom_id>/report` request, the next matching restroom search performs a new MongoDB search instead of returning the previous cached search result.
13. `RestroomSearchCache.get(key)` returns a stored result before its five-minute lifetime ends and returns `None` after that lifetime expires.
