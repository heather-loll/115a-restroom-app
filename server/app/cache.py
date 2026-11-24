"""
Temporary in-memory caching for recently retrieved restroom search results.
The Flask routes use this helper to avoid duplicate MongoDB searches.
"""

from copy import deepcopy
from time import monotonic


CACHE_LIFETIME_SECONDS = 5 * 60  # five minutes


class RestroomSearchCache:
    # store search results temporarily inside one running backend process.
    # this cache is intentionally simple and does not replace database storage.
    def __init__(self, lifetime_seconds=CACHE_LIFETIME_SECONDS, time_function=None):
        if lifetime_seconds <= 0:
            raise ValueError("Cache lifetime must be greater than zero.")

        self.lifetime_seconds = lifetime_seconds
        # tests can provide their own clock. otherwise, monotonic measures
        # elapsed seconds with a timer that only moves forward, not calendar time.
        self.time_function = time_function or monotonic
        self.entries = {}

    def get(self, key):
        # return a saved result only while it remains within the cache lifetime.
        # removing expired entries keeps the in-memory cache from growing with
        # old searches that are no longer useful.
        entry = self.entries.get(key)
        if entry is None:
            return None

        stored_at, result = entry
        is_expired = self.time_function() - stored_at >= self.lifetime_seconds
        if is_expired:
            del self.entries[key]
            return None

        # callers receive a copy so they cannot accidentally change the
        # cached result that later requests should receive.
        return deepcopy(result)

    def store(self, key, result):
        # save a copy of a successful JSON-ready result with its current time.
        self.entries[key] = (self.time_function(), deepcopy(result))

    def clear(self):
        # remove every saved search after restroom data changes.
        # clearing all entries keeps invalidation simple and avoids stale map pins.
        self.entries.clear()
