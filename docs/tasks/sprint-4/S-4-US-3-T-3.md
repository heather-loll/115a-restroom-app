---
id: S-4-US-3-T-3
story: US-4.3
sprint: 4
assignee: Callie Zwicker
estimate_hours: 2
---

# Host the backend

## Description

Delivers US 4.3 by providing a backend available to any app user or developer. This covers making it smooth to host it on python everywhere and mongodb atlas.
Out of scope is rate limiting and caching for performance, which are covered in other tasks.

## Specs

- Allow external mongodb URI for both the server and the overpass import script
- Add code to add python anywhere IP to mongodb access list with an API key
- Previous dev environment behavior remains the same

## Requirements

- Uses environment variables to specify mongodb url, python anywhere deployment status, and API keys for mongodb atlas
- Server hosted on python anywhere supports https connections without a custom certificate
- Flask app is compatible with pythonanywhere WSGI
- Keep all existing backend tests passing.
- Add at least one test for every acceptance criterion.

## Acceptance criteria

1. Health check to external hosting server is true
2. Health check to external mongodb hosting server is true
3. Local Server connected to external mongodb hosting server successfully pulls nearby restrooms
