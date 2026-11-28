"""
Here to make sure a hosted server is alive and well, set to skip automatically
"""
import os
import unittest
import requests
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure

TEST_REMOTE_URI=os.environ.get('TEST_REMOTE_URI', 'https://CallieLZ.pythonanywhere.com')
#needs to be a login URI for a nonexistent user, and the client needs to be on the IP whitelist
TEST_ATLAS_URI=os.environ.get('TEST_ATLAS_URI', 'mongodb+srv://baduser:badpassword@ji4iisy.mongodb.net/')


class HostedServerTests(unittest.TestCase):
    #all of these tests are skipped on GitHub Actions, if these fail it's a problem on pythonanywhere's end

    @unittest.skipIf(os.environ.get("CI") == "true", "Not intended to be automated")
    def test_s_4_us_3_t_3_health(self):
        response = requests.get(f"{TEST_REMOTE_URI}/api/health")
        self.assertEqual(response.status_code, 200)

    @unittest.skipIf(os.environ.get("CI") == "true", "Not intended to be automated")
    def test_s_4_us_3_t_3_health_atlas(self):
        client = MongoClient(TEST_ATLAS_URI, serverSelectionTimeoutMS=5000)
        try:
            client.admin.command('ping')
            client.close()
        except OperationFailure as e:
            assert("Authentication failed" in str(e))

    @unittest.skipIf(os.environ.get("CI") == "true", "Not intended to be automated")
    def test_s_4_us_3_t_3_request_restroom(self):
        #remote database must have Santa Cruz data for this to work
        response = requests.get(f"{TEST_REMOTE_URI}/api/restrooms/nearest?latitude=36.989304&longitude=-122.063217")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['restroom']['name'], "Oakes Café")

if __name__ == "__main__":
    unittest.main()
