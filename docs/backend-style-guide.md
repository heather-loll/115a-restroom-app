# Backend Style Guide

This guide keeps the Python backend simple and consistent as more people add to it.
It applies to files in `server/app/` and backend tests in `server/tests/`.

## Files and Responsibilities

- Put Flask routes and request validation in `server/app/routes.py`.
- Put MongoDB reads and writes in `server/app/mongodb.py`.
- Put reusable logic that does not need Flask or MongoDB in its own small module,
  such as `preferences.py`.
- Put automated backend tests in `server/tests/`.
- Add a short header block at the top of a new Python file explaining its purpose.

## Python Code

- Use four spaces for indentation.
- Use `snake_case` for variables and functions, such as `find_nearby_restrooms`.
- Use `PascalCase` for classes and exception names, such as `MongoDatabaseError`.
- Use clear names that describe the data being used. Avoid shortened names unless
  they are already common, such as `id` in a small validation function.
- Keep functions focused on one job. For example, route functions handle HTTP
  requests, while MongoDB helper functions handle database work.
- Avoid adding a package unless the existing Python standard library or current
  dependencies cannot do the job.

## Comments and Documentation

- Use `#` comments inside functions.
- Explain why a decision exists, especially for validation, missing data, or a
  database rule. Do not repeat what an obvious line of code already says.
- Update `README.md` when an endpoint, request field, response field, or local
  setup instruction changes.
- Keep example API requests in `server/tests/santaCruzTest.http` consistent with
  the current backend behavior.

## API and Data Rules

- Use camelCase for JSON fields sent to or returned to the frontend, such as
  `restroomId`, `distanceMeters`, and `singleOccupancy`.
- Keep Python names in `snake_case` and translate only at the API boundary when
  needed.
- Validate all request data before it reaches MongoDB. Return a clear JSON error
  and HTTP `400` when client input is invalid.
- Return `409` for a known conflict, such as a duplicate restroom or an unknown
  restroom being amended.
- Keep unknown amenity information absent instead of treating it as `false`.
- Reuse the existing `Restroom` response structure so frontend code does not need
  a different shape for each endpoint.

## Tests

- Add or update tests whenever backend behavior changes.
- Keep tests independent by using the in-memory MongoDB collection already set up
  in `server/tests/test_api.py`.
- Use descriptive test names beginning with `test_`.
- For Repo Metrics tasks, use the Python-safe task ID after `test_`, such as
  `test_us_1_t_2_returns_a_rating_average`.
- Run backend tests from `server/` before pushing:
  `python -m unittest discover -s tests`
