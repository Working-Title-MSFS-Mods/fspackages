import csv
import json
import math

import sys
import getopt

def getKeyValue(e, points, axis):
    lat = math.radians(points[e]["location"][1])
    lon = math.radians(points[e]["location"][0])
    if axis == 0:
        key = math.cos(lat) * math.cos(lon)
    elif axis == 1:
        key = math.cos(lat) * math.sin(lon)
    else:
        key = math.sin(lat)
    return key

def buildTreeHelper(entries, indices, depth = 0):
    axis = depth % 3
    indices = sorted(indices, key = lambda e: getKeyValue(e, entries, axis))
    median = len(indices) // 2
    least = getKeyValue(indices[0], entries, axis)
    greatest = getKeyValue(indices[len(indices) - 1], entries, axis)

    lesser = -1
    greater = -1
    if median > 0:
        lesser = buildTreeHelper(entries, indices[:median], depth + 1)
    if median < len(indices) - 1:
        greater = buildTreeHelper(entries, indices[median + 1:], depth + 1)

    if axis == 0:
        axisText = "x"
    elif axis == 1:
        axisText = "y"
    else:
        axisText = "z"

    entry = entries[indices[median]]
    entry["axis"] = axisText
    entry["lesser"] = lesser
    entry["greater"] = greater
    entry["least"] = least
    entry["greatest"] = greatest
    entry["x"] = getKeyValue(indices[median], entries, 0)
    entry["y"] = getKeyValue(indices[median], entries, 1)
    entry["z"] = getKeyValue(indices[median], entries, 2)
    return indices[median]

def buildTree(entries):
    return buildTreeHelper(entries, range(len(entries)))

def createCandidate(feature):
    candidates = []
    properties = feature["properties"]
    names = properties["name"].split(",")
    for name in names:
        candidate = {}
        candidate["roadType"] = properties["roadType"]
        candidate["routeType"] = properties["routeType"]
        candidate["name"] = name
        candidate["location"] = feature["geometry"]["coordinates"]
        candidates.append(candidate)
    return candidates

def buildCandidateList(geojson):
    candidateList = []
    features = geojson["features"]
    for feature in features:
        candidateList.extend(createCandidate(feature))
    return candidateList

def createRestriction(feature):
    restriction = {}
    restriction["roadTypeBit"] = feature["properties"]["roadTypeBit"]
    restriction["location"] = feature["geometry"]["coordinates"]
    return restriction

def buildRestrictionList(geojson):
    restrictionList = []
    features = geojson["features"]
    for feature in features:
        restrictionList.append(createRestriction(feature))
    return restrictionList

candidatesFile = ""
restrictionsFile = ""
outputFile = ""
try:
    opts, args = getopt.getopt(sys.argv[1:], "r:c:o:")
except getopt.GetoptError:
    print("buildroadlabeltrees.py -c <candidates file> -r <restrictions file> -o <output>")
    sys.exit(2)
for opt, arg in opts:
    if opt == "-c":
        candidatesFile = arg
    elif opt == "-r":
        restrictionsFile = arg
    elif opt == "-o":
        outputFile = arg

output = {"candidates": {}, "restrictions": {}}

with open(candidatesFile, newline='', encoding="utf-8") as f:
    candidates = json.load(f)

with open(restrictionsFile, newline='', encoding="utf-8") as f:
    restrictions = json.load(f)

candidateList = buildCandidateList(candidates)
restrictionList = buildRestrictionList(restrictions)

candidateTree = buildTree(candidateList)
restrictionTree = buildTree(restrictionList)

output["candidates"]["list"] = candidateList
output["candidates"]["root"] = candidateTree
output["restrictions"]["list"] = restrictionList
output["restrictions"]["root"] = restrictionTree

with open(outputFile, "w") as json_file:
    json.dump(output, json_file, separators = [",", ":"])