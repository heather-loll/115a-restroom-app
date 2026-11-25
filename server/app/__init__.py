"""
Creates and configures the Flask app. It stores MongoDB and CORS settings,
enables frontend-to-backend requests during development, and connects the API
routes to the app.
"""

import os

from flask import Flask
from flask_cors import CORS
from .limiter import limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
from requests.auth import HTTPDigestAuth


#snippet taken from python anywhere
def get_public_ip():
    response = requests.get("https://api.ipify.org")
    return response.text

def add_atlas_ip(pubkey, privkey, group_id):
    ip = get_public_ip()

    resp = requests.post(
        "https://cloud.mongodb.com/api/atlas/v1.0/groups/{atlas_group_id}/accessList".format(
            atlas_group_id=group_id),
        auth=HTTPDigestAuth(pubkey, privkey),
        json=[{'ipAddress': ip, 'comment': 'From PythonAnywhere'}]  # the comment is optional
    )
    if resp.status_code in (200, 201):
        print("MongoDB Atlas accessList request successful", flush=True)
    else:
        raise EnvironmentError("MongoDB Atlas accessList request problem: status code was {status_code}, content was {content}".format(
                status_code=resp.status_code, content=resp.content
            ))


from .routes import api


def create_app(test_config=None):
    # build the Flask app. keeps configuration in one place.
    # lets automated tests create an isolated app without starting a real web server.
    app = Flask(__name__)

    PYTHON_ANYWHERE = os.environ.get("PYTHON_ANYWHERE", None)
    #this key should have project owner access
    ATLAS_PUBKEY = os.environ.get("ATLAS_PUBKEY", None)
    ATLAS_PRIVKEY = os.environ.get("ATLAS_PRIVKEY", None)
    #atlas project ID
    ATLAS_PID = os.environ.get("ATLAS_PID", None)

    if PYTHON_ANYWHERE is not None:
        add_atlas_ip(ATLAS_PUBKEY, ATLAS_PRIVKEY, ATLAS_PID)

    app.config.from_mapping(
        # retained for the OpenStreetMap helper, although current search routes
        # read restroom data from MongoDB.
        OVERPASS_URL=os.environ.get(
            "OVERPASS_URL",
            "https://overpass-api.de/api/interpreter",
        ),
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
        RATELIMIT_STORAGE_URI="memory://",
        RATELIMIT_HEADERS_ENABLED=True,
        RATELIMIT_DEFAULT=""
    )

    if test_config:
        app.config.update(test_config)


    limiter.init_app(app)

    # the Expo app and this server use different local ports during development.
    # restrict allowed origins before product deployment.
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(api, url_prefix="/api")

    return app
