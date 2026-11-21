---
id: S-3-US-3-T-1
story: US-3.3
sprint: 3
assignee: Callie Zwicker
estimate_hours: 2
---

# Delete frequently reported restrooms

## Description

Implements US 3.3 by deleting restrooms when they accumulate too many `nonexistent` reports. Endpoint will indicate that a deletion was made if it's the case. This only covers the deletion and any changes to US 3.1 interface for submitting reports is out of scope (although we are changing the return for that).

## Specs

- `POST /api/restrooms/<restroom_id>/report` will return a json message indicating a deleted restroom with an empty body except for the restroom id and HTTP `200` whenever a report deletes a restroom
- All associated objects will be deleted along with the restroom
- Reporting 5 instances of `nonexistent` in a row will trigger a restroom deletion
- Any activity on `POST /api/restrooms/<restroom_id>/ratings` or `POST /api/restrooms/amend` for a restroom will add a `false` report to recent nonexistent list

## Requirements

- Delete the restroom document from the database on 5 successive `nonexistent` reports
- Once main document is deleted, delete the associated rating and 
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. A restroom reported as nonexistent 5 times in a row will be deleted
2. Deleting a restroom will also delete all associated objects
3. Any edit activity will reset the 5 straight reports needed
4. Any rate activity will reset the 5 straight reports needed
