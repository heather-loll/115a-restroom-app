# Restroom Finder App

## Run Frontend Locally

1. [Install Node.js](https://nodejs.org/en/download)
1. `cd client`
1. `npm install`
1. Install [Expo Go](https://expo.dev/go) on your phone
1. Create an Expo account and log in on the app
1. Additionally, run `npx expo login` to log in on your terminal
1. Run `npm run start` while still in the `client` directory
1. Scan the QR code from the terminal on your mobile device to view the app on your mobile device
1. If you make changes, you may type `r` in the terminal to hot reload the app to reflect your changes


## Run Backend Locally

The Flask server supplies nearby restroom data from OpenStreetMap. It's separate
from the Expo client so the future MongoDB data layer can be added without mixing
Python code into the React Native application.

1. Open a terminal at the `115a-restroom-app` repository root
1. `cd server`
1. Create a local Python environment: `python3 -m venv .venv`
1. Activate the environment for your terminal:
   - macOS/Linux: `source .venv/bin/activate`
   - Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
   - Windows Command Prompt: `.venv\Scripts\activate.bat`
1. Install dependencies: `python -m pip install -r requirements.txt`
1. Start the API: `python run.py`
   - Keep this terminal running, it is your local backend server

The default backend port is `5001`. If it is already in use, stop the server with
`Control` + `C`, then start it on another port with `PORT=5002 python run.py`.
Keep that terminal running and use the selected port in the URL below.

### Nearest-restroom Endpoint

To find the closest restroom near a location, make the request from a second terminal in the virtual environment with:

`curl "http://127.0.0.1:5001/api/restrooms/nearest?latitude=36.9749&longitude=-122.0308"`

The required query parameters are `latitude` and `longitude`. The numbers in the
example URL are not fixed: replace them with the location you want to search. Later, the Expo app will get the phone’s current GPS coordinates and build this URL automatically, so users will not type coordinates themselves.

`radius_meters` is optional and defaults to 1000 (allowed range: 100 to 5000).
For example, add `&radius_meters=500` to search within 500 meters. The response
contains either the closest OpenStreetMap restroom or `"restroom": null` when
none is found.

### Nearby-restrooms Endpoint for Map Pins

To find every restroom within a search radius:

`curl "http://127.0.0.1:5001/api/restrooms/nearby?latitude=36.9749&longitude=-122.0308&radius_meters=1000"`

This response uses the same `Restroom` structure as the nearest-restroom endpoint,
but returns a `restrooms` list sorted from closest to farthest. The Expo map can
create one pin for each item in that list. If no restroom is found, `restrooms`
is an empty list (`[]`).

### Stop the Backend

1. In the terminal running `python run.py`, `Control` + `C` to stop the Flask server
1. `deactivate` to leave the Python virtual environment, you can close the terminal after that

## Test the Backend

With the virtual environment active, run this command from `server/`:
`python -m unittest discover -s tests`
