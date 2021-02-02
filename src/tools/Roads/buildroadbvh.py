import csv
import json
import math
import numpy as np

import sys
import getopt

import multiprocessing
import functools

def sphericalToCartesian(coord):
    lat = math.radians(coord[1])
    lon = math.radians(coord[0])
    return [round(math.cos(lat) * math.cos(lon), 8), round(math.cos(lat) * math.sin(lon), 8), round(math.sin(lat), 8)]

def updateBounds(bbox, new):
    for i in range(3):
        bbox[0][i] = min(bbox[0][i], new[i])

    for i in range(3):
        bbox[1][i] = max(bbox[1][i], new[i])

def calculateBBox(feature):
    multiline = feature["geometry"]["coordinates"]
    bbox = [[2, 2, 2], [-2, -2, -2]]
    for i in range(len(multiline)):
        coords = multiline[i]
        for j in range(len(coords)):
            coord = coords[j]
            cartesian = sphericalToCartesian(coord)
            updateBounds(bbox, cartesian)

    feature["properties"]["bbox"] = bbox

def volume(bbox):
    dX = bbox[1][0] - bbox[0][0]
    dY = bbox[1][1] - bbox[0][1]
    dZ = bbox[1][2] - bbox[0][2]
    return dX * dY * dZ

def joinBBox(bbox1, bbox2):
    bbox = [bbox1[0].copy(), bbox1[1].copy()]
    updateBounds(bbox, bbox2[0])
    updateBounds(bbox, bbox2[1])
    return bbox

def createLeaf(feature, index):
    return {"bbox": feature["properties"]["bbox"], "featureIndex": index}

def createNode(left, right):
    bbox = joinBBox(left["bbox"], right["bbox"])
    return {"bbox": bbox, "left": left, "right": right}

def findLowestVolume(nodes):
    best = None
    for node in nodes:
        if (best is None or volume(node["bbox"]) < volume(best["bbox"])):
            best = node
    return best

def findCandidateIndexHelper(cluster, indexRange, node1):
    best = None
    for i in indexRange:
        node2 = cluster[i]
        candidate = createNode(node1, node2)
        if node1 != node2 and (best is None or volume(candidate["bbox"]) < volume(best["bbox"])):
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

def recalcNodesParallel(cluster, threads, node1):
    chunks = splitList(range(len(cluster)), threads)
    with multiprocessing.Pool(len(chunks)) as p:
        results = p.map(functools.partial(findCandidateIndex2, cluster, node1), chunks, 1)

    candidates = map(functools.partial(indexesToNode, cluster), results)
    return findLowestVolume(candidates)

def recalcNodes(cluster, needRecalc, threads):
    threads = min(threads, 2)
    if (len(cluster) > threads * 100000):
        results = map(functools.partial(recalcNodesParallel, cluster, threads), needRecalc)
    else:
        results = map(functools.partial(indexesToNode, cluster), map(functools.partial(findCandidateIndex1, cluster), needRecalc))

    return results

def joinNodes(cluster, candidates, threads):
    toJoin = findLowestVolume(candidates)
    cluster.remove(toJoin["left"])
    cluster.remove(toJoin["right"])
    cluster.append(toJoin)

    while len(cluster) > 1:
        needRecalc = [toJoin]
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

        toJoin = findLowestVolume(candidates)
        cluster.remove(toJoin["left"])
        cluster.remove(toJoin["right"])
        cluster.append(toJoin)

        print(len(cluster), " nodes left to join")

    return cluster[0]

def buildTree(features, threads):
    cluster = []
    for i in range(len(features)):
        cluster.append(createLeaf(features[i], i))

    candidates = initializeCandidates(cluster, threads)
    root = joinNodes(cluster, candidates, threads)

    return root

if __name__ == '__main__':
    inputFile = ""
    outputFile = ""
    threads = 1
    try:
        opts, args = getopt.getopt(sys.argv[1:], "i:o:t:", ["threads="])
    except getopt.GetoptError:
        print("buildroadbvh.py -i <input> -o <output> [options]")
        sys.exit(2)
    for opt, arg in opts:
        if opt == "-i":
            inputFile = arg
        elif opt == "-o":
            outputFile = arg
        elif opt in ("-t", "--threads"):
            threads = int(arg)

    cities = {"cities": []}

    with open(inputFile, newline='', encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    for i in range(len(features)):
        calculateBBox(features[i])

    root = buildTree(features, threads)

    with open(outputFile, "w") as json_file:
        json.dump(root, json_file, separators = [",", ":"])