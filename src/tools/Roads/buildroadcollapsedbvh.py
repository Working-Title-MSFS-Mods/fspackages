import os
import csv
import json
import math

import sys
import getopt

import multiprocessing
import functools

def cullFeaturesByLength(features, minLength):
    return list(filter(lambda f: f["properties"]["length"] >= minLength, features))

def sphericalToCartesian(coord):
    lat = math.radians(coord[1])
    lon = math.radians(coord[0])
    return [round(math.cos(lat) * math.cos(lon), 8), round(math.cos(lat) * math.sin(lon), 8), round(math.sin(lat), 8)]

def cartesianToSpherical(xyz):
    x = xyz[0]
    y = xyz[1]
    z = xyz[2]
    return [math.degrees(math.atan2(y, x)), math.degrees(math.atan2(z, math.sqrt(x * x + y * y)))]

def updateBounds(bbox, new):
    for i in range(3):
        bbox[0][i] = min(bbox[0][i], new[i])
        bbox[1][i] = max(bbox[1][i], new[i])

def calculateBBox(feature):
    line = feature["geometry"]["coordinates"]
    bbox = [[2, 2, 2], [-2, -2, -2]]
    for i in range(len(line)):
        coord = line[i]
        cartesian = sphericalToCartesian(coord)
        updateBounds(bbox, cartesian)

    feature["properties"]["bbox"] = bbox

def perimeter(bbox):
    dX = bbox[1][0] - bbox[0][0]
    dY = bbox[1][1] - bbox[0][1]
    dZ = bbox[1][2] - bbox[0][2]
    return 4 * (dX + dY + dZ)

def joinBBox(bbox1, bbox2):
    bbox = [[min(bbox1[0][0], bbox2[0][0]), min(bbox1[0][1], bbox2[0][1]), min(bbox1[0][2], bbox2[0][2])], [max(bbox1[1][0], bbox2[1][0]), max(bbox1[1][1], bbox2[1][1]), max(bbox1[1][2], bbox2[1][2])]]
    return bbox

def isLeaf(node):
    return "featureIndexes" in node

def createLeaf(feature, index):
    return {"bbox": feature["properties"]["bbox"], "featureIndexes": [index]}

def collapseLeafs(leafs):
    bbox = leafs[0]["bbox"]
    featureIndexes = leafs[0]["featureIndexes"].copy()
    for i in range(1, len(leafs)):
        bbox = joinBBox(bbox, leafs[i]["bbox"])
        featureIndexes.extend(leafs[i]["featureIndexes"])
    return {"bbox": bbox, "featureIndexes": featureIndexes}

def createNode(left, right):
    bbox = joinBBox(left["bbox"], right["bbox"])
    return {"bbox": bbox, "left": left, "right": right}

def findLeastPerimeter(nodes):
    best = None
    for node in nodes:
        if (best is None or perimeter(node["bbox"]) < perimeter(best["bbox"])):
            best = node
    return best

def findCandidateIndexHelper(cluster, indexRange, node1):
    best = None
    for i in indexRange:
        node2 = cluster[i]
        candidate = createNode(node1, node2)
        if node1 != node2 and (best is None or perimeter(candidate["bbox"]) < perimeter(best["bbox"])):
            best = candidate
    return [cluster.index(best["left"]), cluster.index(best["right"])]

def findCandidateIndex1(cluster, node1):
    return findCandidateIndexHelper(cluster, range(len(cluster)), node1)

def findCandidateIndex2(cluster, node1, indexRange):
    return findCandidateIndexHelper(cluster, indexRange, node1)

def indexesToNode(cluster, indexes):
    return createNode(cluster[indexes[0]], cluster[indexes[1]])

def initializeCandidates(cluster, threads):
    with multiprocessing.Pool(threads) as p:
        results = p.map(functools.partial(findCandidateIndex1, cluster), cluster, math.ceil(len(cluster) / threads))

    candidates = []
    candidates.extend(map(functools.partial(indexesToNode, cluster), results))
    return candidates

def splitList(l, numChunks):
    n = math.ceil(len(l) / numChunks)
    return list(l[i:i + n] for i in range(0, len(l), n))

def recalcNodes(cluster, needRecalc, threads):
    return map(functools.partial(indexesToNode, cluster), map(functools.partial(findCandidateIndex1, cluster), needRecalc))

def joinNode(cluster, candidates, toJoin, collapseLimit):
    candidates.remove(toJoin)
    left = toJoin["left"]
    right = toJoin["right"]
    if isLeaf(left) and isLeaf(right) and perimeter(toJoin["bbox"]) <= collapseLimit:
        toJoin = collapseLeafs([left, right])
    cluster.remove(left)
    cluster.remove(right)
    cluster.append(toJoin)
    return toJoin

def joinNodes(cluster, candidates, collapseLimit, threads):
    toJoin = findLeastPerimeter(candidates)
    joined = joinNode(cluster, candidates, toJoin, collapseLimit)

    while len(cluster) > 1:
        needRecalc = [joined]
        candidatesToRemove = []
        for candidate in candidates:
            toRemove = False
            left = candidate["left"]
            right = candidate["right"]
            if left == toJoin["left"] or left == toJoin["right"]:
                toRemove = True
                if (right != toJoin["left"] and right != toJoin["right"]):
                    needRecalc.append(right)
            if right == toJoin["left"] or right == toJoin["right"]:
                toRemove = True
                if (left != toJoin["left"] and left != toJoin["right"]):
                    needRecalc.append(left)
            if toRemove:
                candidatesToRemove.append(candidate)

        for candidate in candidatesToRemove:
            candidates.remove(candidate)

        results = recalcNodes(cluster, needRecalc, threads)
        candidates.extend(results)

        toJoin = findLeastPerimeter(candidates)
        joined = joinNode(cluster, candidates, toJoin, collapseLimit)

        print(len(cluster), " nodes left to join")

    return cluster[0]

def buildTree(features, collapseLimit, threads):
    cluster = []
    for i in range(len(features)):
        cluster.append(createLeaf(features[i], i))

    candidates = initializeCandidates(cluster, threads)
    root = joinNodes(cluster, candidates, collapseLimit, threads)

    return root

def combineFeatures(features):
    combined = {"type": "Feature", "properties": {}, "geometry": {"type": "MultiLineString", "coordinates": []}}
    centroidSum = [0, 0, 0]
    lengthSum = 0
    for feature in features:
        centroidCartesian = sphericalToCartesian([feature["properties"]["centroidX"], feature["properties"]["centroidY"]])
        length = max(feature["properties"]["length"], 0.001)
        lengthSum += length
        for i in range(3):
            centroidSum[i] += centroidCartesian[i] * length
        combined["geometry"]["coordinates"].append(feature["geometry"]["coordinates"])
    for i in range(3):
        centroidSum[i] /= lengthSum
    combinedCentroid = cartesianToSpherical(centroidSum)
    combined["properties"]["centroid"] = [round(combinedCentroid[0], 6), round(combinedCentroid[1], 6)]
    combined["properties"]["length"] = round(lengthSum, 3)
    return combined

def rebuildGeoJSONHelper(features, node, newGeoJSON):
    if (isLeaf(node)):
        newGeoJSON["features"].append(combineFeatures(map(lambda index: features[index], node["featureIndexes"])))
        del node["featureIndexes"]
        node["featureIndex"] = len(newGeoJSON["features"]) - 1
    else:
        rebuildGeoJSONHelper(features, node["left"], newGeoJSON)
        rebuildGeoJSONHelper(features, node["right"], newGeoJSON)

def rebuildGeoJSON(features, root):
    newGeoJSON = {"type": "FeatureCollection", "features": []}
    rebuildGeoJSONHelper(features, root, newGeoJSON)
    return newGeoJSON

def gatherStatsHelper(node, stats, depth):
    stats["size"] += 1
    if (isLeaf(node)):
        leafSize = len(node["featureIndexes"])
        stats["leafCount"] += 1
        stats["featureCount"] += leafSize
        stats["leafMax"] = max(stats["leafMax"], leafSize)
        stats["maxDepth"] = max(stats["maxDepth"], depth)
        stats["averageDepth"] = (stats["averageDepth"] * (stats["leafCount"] - 1) + depth) / stats["leafCount"]
    else:
        gatherStatsHelper(node["left"], stats, depth + 1)
        gatherStatsHelper(node["right"], stats, depth + 1)

def gatherStats(root):
    stats = {"size": 0, "maxDepth": 0, "averageDepth": 0, "leafCount": 0, "featureCount": 0, "leafMax": 0, "leafAverage": 0}
    gatherStatsHelper(root, stats, 1)
    stats["leafAverage"] = stats["featureCount"] / stats["leafCount"]
    return stats

if __name__ == '__main__':
    inputFile = ""
    outputBVHFile = ""
    outputGeoJSONFile = ""
    threads = 1
    collapseLimit = 0
    minLength = 0
    printStats = False
    try:
        opts, args = getopt.getopt(sys.argv[1:], "i:c:l:t:s", ["collapseLimit=", "minlength=", "threads=", "stats"])
    except getopt.GetoptError:
        print("buildroadcollapsedbvh.py -i <input> [options]")
        sys.exit(2)
    for opt, arg in opts:
        if opt == "-i":
            inputFile = arg
            dirName = os.path.dirname(inputFile)
            basename = os.path.splitext(os.path.basename(inputFile))[0]
            outputBVHFile = os.path.join(dirName, basename + "_bvh.json")
            outputGeoJSONFile = os.path.join(dirName, basename + "_mod.geojson")
        elif opt in ("-c", "--collapseLimit"):
            collapseLimit = float(arg)
        elif opt in ("-l", "--minlength"):
            minLength = float(arg)
        elif opt in ("-t", "--threads"):
            threads = int(arg)
        elif opt in ("-s", "--stats"):
            printStats = True

    with open(inputFile, newline='', encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    features = cullFeaturesByLength(features, minLength)

    for i in range(len(features)):
        calculateBBox(features[i])

    root = buildTree(features, collapseLimit, threads)

    if (printStats):
        stats = gatherStats(root)
        print("number of features processed: ", stats["featureCount"])
        print("tree size (number of nodes): ", stats["size"])
        print("maximum depth: ", stats["maxDepth"])
        print("average depth: ", stats["averageDepth"])
        print("number of leaf nodes: ", stats["leafCount"])
        print("maximum number of features merged per leaf: ", stats["leafMax"])
        print("average number of features merged per leaf: ", stats["leafAverage"])

    outputGeoJSON = rebuildGeoJSON(features, root)

    with open(outputBVHFile, "w") as json_file:
        json.dump(root, json_file, separators = [",", ":"])
    with open(outputGeoJSONFile, "w") as json_file:
        json.dump(outputGeoJSON, json_file, separators = [",", ":"])