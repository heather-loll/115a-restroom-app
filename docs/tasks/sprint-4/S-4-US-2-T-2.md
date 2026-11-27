---
id: S-4-US-2-T-2
story: US-4.2
sprint: 3
assignee: Callie Zwicker
estimate_hours: 2
---

# Implement rate-limiting for reports to prevent bad data from going through.

## Description

Add rate limiting to the API for all editing operations on restrooms, helping to prevent excessive reports from going through and messing up the data.
When combined with task 1 of this user story, this will make spam to delete or poorly mark a restroom difficult to achieve. Out of scope is 
weighing reports less based on time.

## Specs

- Limit by IPv6 /64 subnet first (should be per device), fallback to IPv4 otherwise
- `POST /api/restrooms/<restroom_id>/report` only accepts 3 reports per restroom per IP per hour
- `POST /api/restrooms/<restroom_id>/ratings` only accepts 5 ratings per restroom per IP per hour
- `POST /api/restrooms/<restroom_id>/amend` only accepts 5 amends per restroom per IP per hour
- `POST /api/restroom` only accepts 10 new restrooms per IP per hour
- When rate-limited, the endpoint will return http code 429

## Requirements

- Uses flask-limiter with a specially configured key function to find the IPv6 subnet for rate limiting
- Endpoints using restroom_id will include that ID in the flask-limiter key function
- Unit Tests disable rate limiting unless explicitly enabled by the test
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. Rate limiting on `POST /api/restrooms/<restroom_id>/report` triggers on the 4th report
2. Rate limiting on `POST /api/restrooms/<restroom_id>/ratings` triggers on the 6th rating
3. Rate limiting on `POST /api/restrooms/<restroom_id>/amend` triggers on the 6th amend
4. Rate limiting on `POST /api/restroom` triggers on the 11th new restroom
5. Rate limiting on `POST /api/restrooms/<restroom_id>/ratings` does not trigger when making 5 ratings for multiple restrooms
6. Rate limiting does not trigger on `GET /api/restrooms/nearest`
