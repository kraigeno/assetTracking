import json
from json import JSONEncoder

class Asset:
    def __init__(self, id, name, agency, facility, project):
        self.id = id
        self.name = name
        self.agency = agency
        self.facility = facility
        self.project = project
        self.lastUpdate = None

class AssetEvent:
    def __init__(self, assetId, time, latitude, longitude, depth, status):
        self.assetId = assetId
        self.time = time
        self.latitude = latitude
        self.longitude = longitude
        self.depth = depth
        self.status = status

class ObjectEncoder(JSONEncoder):
        def default(self, o):
            return o.__dict__
