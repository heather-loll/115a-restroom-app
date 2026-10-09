"""
This is the executable to run the backend server. When running `python run.py`, it 
starts the Flask API on port 5001 so the frontend can send requests to it. Run this file 
from the server directory after installing requirements.
"""

import os
from app import create_app

# keep app in app/__init__.py, makes the API easier to test later
app = create_app()

if __name__ == "__main__":
    # host="0.0.0.0" lets an Expo Go app on the same Wi-Fi network reach this server.
    # debug=True is useful locally, but don't use for public deployment.
    # PORT lets another developer choose a free port without changing this file.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")), debug=True)
