"""
Creates and configures the Flask app. It stores MongoDB and CORS settings,
enables frontend-to-backend requests during development, and connects the API
routes to the app.
"""

import os
from flask import Flask
from flask_cors import CORS
from .routes import api


def create_app(test_config=None):
    # build the Flask app. keeps configuration in one place.
    # lets automated tests create an isolated app without starting a real web server.
    app = Flask(__name__)

    app.config.from_mapping(
        # retained for the OpenStreetMap helper, although current search routes
        # read restroom data from MongoDB.
        OVERPASS_URL=os.environ.get("OVERPASS_URL", "https://overpass-api.de/api/interpreter"),
        # prevents a slow optional OpenStreetMap request from waiting forever.
        OVERPASS_TIMEOUT_SECONDS=15,
        # MongoDB stores imported and user-submitted restroom records.
        MONGODB_URI=os.environ.get("MONGODB_URI", "mongodb://localhost:27017"),
        MONGODB_DATABASE=os.environ.get("MONGODB_DATABASE", "ToiletApp"),
        MONGODB_RESTROOMS_COLLECTION=os.environ.get(
            "MONGODB_RESTROOMS_COLLECTION", "restrooms"
        ),
        MONGODB_TIMEOUT_MS=5_000,
        # tests can replace MongoDB with a small in-memory fake collection.
        RESTROOMS_COLLECTION=None,
    )

    if test_config:
        app.config.update(test_config)

    # the Expo app and this server use different local ports during development.
    # restrict allowed origins before product deployment.
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(api, url_prefix="/api")

    return app
