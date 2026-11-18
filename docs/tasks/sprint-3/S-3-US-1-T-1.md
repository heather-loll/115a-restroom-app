---
id: S-3-US-1-T-1
story: US-3.1
sprint: 3
assignee: Callie Zwicker
estimate_hours: 3
---

# Save reports and change restroom report field if enough reports have occured

## Description

Serves US-3.1, which helps users judge how good a restroom is before choosing it. This task replaces the existing one to five cleanliness amenity value with separate user votes using the agreed scale of 1 for filthy, 2 for average, and 3 for pristine. It saves each vote in MongoDB, calculates a rolling average, and returns that average with restroom data. Users may include a cleanliness vote when adding a new restroom or send a later vote through the rating endpoint. Reporting broken equipment, busy information, an overall good-restroom score, and a frontend rating screen are out of scope.

## Specs

- `POST /api/restrooms/<restroom_id>/report` accepts a JSON object `reports` with boolean keys `broken`, `busy`, and `nonexistent`.
- Each request creates an array entry with a timestamp and boolean values from `broken`, `busy`, and `nonexistent` in a separate object corresponding to each restroom.
- The restroom document, if a report is made, will contain a `busy`, `broken`, and `nonexistent` boolean field, as well as a reference to the objectid of the object with arrays
- Each reports array object will reference the restroomId of the restroom it corresponds to.
- The restroom document `broken` and `busy` fields will only be true if the last 5 reports made are true.
- A successful report returns HTTP `201` and the submitted restroom, with it's reports field updated
- Any requests that retrieve a restroom will also return the reports field if a report has been made in the past.
- Reports may skip boolean keys, meaning they won't affect the restroom document report scoring for that field
- Requests containing unknown or no keys will return HTTP `400` and an error message

## Requirements

- Allow existing database entries to update with `reports` field gracefully
- Store expensive array data for reports in a separate collection
- Add report field handling to existing restroom document/response generators
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A newly created restroom will not have a `reports` field.
2. Submitting a report for a new restroom will return http code 201, the restroom document will have a `reports` field, and a new report document will be created in the reports collection
3. Submitting a report with duplicate keys will skip the duplicate keys and return HTTP `201`
4. Submitting a report with no keys will return HTTP `400` and an error message
5. Submitting a report with unknown keys will return HTTP `400` and an error message
6. Submitting multiple reports for the same restroom will not make extra documents in the reports collection
7. Submitting 5 reports with a key set to `True` in a row will set the restroom's `reports` field for that key to `True`. Sending a new `False` report will set the key back to `False`. Sending 5 more reports will set it back to true.
8. Reports made to one restroom will not affect the flag calculation of another restroom.
