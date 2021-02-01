import csv
import json
import math
import numpy as np

import sys
import getopt

def parseCity(row, array, large, medium):
    entry = {}
    entry["name"] = row["city_ascii"]
    entry["lat"] = float(row["lat"])
    entry["long"] = float(row["lng"])
    if not row["population"]:
        entry["size"] = 2
    elif float(row["population"]) >= large:
        entry["size"] = 0
    elif float(row["population"]) >= medium:
        entry["size"] = 1
    else:
        entry["size"] = 2
    array.append(entry)
        
def getKeyValue(e, cityList, axis):
    lat = np.deg2rad(cityList[e]["lat"])
    long = np.deg2rad(cityList[e]["long"])
    if axis == 0:
        key = math.cos(lat) * math.cos(long)
    elif axis == 1:
        key = math.cos(lat) * math.sin(long)
    else:
        key = math.sin(lat)
    return key
    
def buildTreeHelper(cityList, indices, depth = 0):   
    axis = depth % 3
    indices = sorted(indices, key = lambda e: getKeyValue(e, cityList, axis))
    median = len(indices) // 2
    least = getKeyValue(indices[0], cityList, axis)
    greatest = getKeyValue(indices[len(indices) - 1], cityList, axis)
    
    lesser = -1
    greater = -1
    if median > 0:
        lesser = buildTreeHelper(cityList, indices[:median], depth + 1)
    if median < len(indices) - 1:
        greater = buildTreeHelper(cityList, indices[median + 1:], depth + 1)
        
    if axis == 0:
        axisText = "x"
    elif axis == 1:
        axisText = "y"
    else:
        axisText = "z"
        
    cityList[indices[median]]["axis"] = axisText
    cityList[indices[median]]["lesser"] = lesser
    cityList[indices[median]]["greater"] = greater
    cityList[indices[median]]["least"] = least
    cityList[indices[median]]["greatest"] = greatest
    cityList[indices[median]]["x"] = getKeyValue(indices[median], cityList, 0)
    cityList[indices[median]]["y"] = getKeyValue(indices[median], cityList, 1)
    cityList[indices[median]]["z"] = getKeyValue(indices[median], cityList, 2)
    return indices[median]
    
def buildTree(cityList, size):
    indices = []
    for i in range(len(cityList)):
        if cityList[i]["size"] == size:
            indices.append(i)
    
    return buildTreeHelper(cityList, indices)
    

inputFile = ""
outputFile = ""
large = 500000
medium = 50000
try:
    opts, args = getopt.getopt(sys.argv[1:], "i:o:l:m:", ["large=", "medium="])
except getopt.GetoptError:
    print("buildcitylist.py -i <input> -o <output> [options]")
    sys.exit(2)
for opt, arg in opts:
    if opt == "-i":
        inputFile = arg
    elif opt == "-o":
        outputFile = arg
    elif opt in ("-l", "--large"):
        large = arg
    elif opt in ("-m", "--medium"):
        medium = arg

cities = {"cities": []}

with open(inputFile, newline='', encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        parseCity(row, cities["cities"], large, medium)
    
cityList = cities["cities"]
roots = []
for i in range(3):
    roots.append(buildTree(cityList, i))

cities["roots"] = roots

with open(outputFile, "w") as json_file:
    json.dump(cities, json_file, indent = 4)