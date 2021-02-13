/**
 * A K-D Tree used for searching for points on earth's surface.
 */
class WT_GeoKDTree {
    /**
     * @param {WT_GeoKDTreeNode[]} nodes - the nodes of the new tree.
     * @param {Number} root - the index of the root node of the new tree.
     * @param {{create(node:WT_GeoKDTreeNode):Object}} [objectFactory] - a factory which which to create objects from the new tree's nodes to be returned by tree
     *                                                                   searches. If this argument is not supplied, then tree searches will directly return the
     *                                                                   new tree's nodes.
     * @param {Boolean} [cacheObjects] - whether to cache objects created by the new tree's object factory within the tree structure.
     *                                   This argument is ignored if objectFactory is null. False by default.
     */
    constructor(nodes, root, objectFactory = null, cacheObjects = false) {
        this._nodes = nodes;
        this._root = root;
        this._objectFactory = objectFactory;
        this._cacheObjects = cacheObjects;

        this._tempVector = new WT_GVector3(0, 0, 0);
    }

    /**
     * @param {Object} object
     * @param {WT_GeoPoint} center
     * @param {Object[]} array
     */
    _insertInOrder(object, center, radius, searchHandler, array) {
        let sortKey = searchHandler.sortKey(object, center, radius);
        if (sortKey === undefined) {
            array.push(object);
        } else {
            let min = 0;
            let max = array.length;
            let index = Math.floor((max + min) / 2);
            while (min < max) {
                let compareKey = searchHandler.sortKey(array[index], center, radius);
                if (sortKey < compareKey) {
                    max = index;
                } else if (sortKey > compareKey) {
                    min = index + 1;
                } else {
                    break;
                }
                index = Math.floor((max + min) / 2);
            }
            array.splice(index, 0, object);
        }
    }

    /**
     *
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     * @param {Number} radiusGAR
     * @param {WT_GVector3} centerCartesian
     * @param {Number} radiusCartesian
     * @param {WT_GeoKDTreeSearchHandler} searchHandler
     * @param {Number} index
     * @param {Object[]} results
     */
    _searchHelper(center, radius, radiusGAR, centerCartesian, radiusCartesian, searchHandler, index, results) {
        let node = this._nodes[index];

        if ((centerCartesian[node.axis] + radiusCartesian < node.least) || (centerCartesian[node.axis] - radiusCartesian > node.greatest)) {
            return true;
        }

        let distance = center.distance(node.location[1], node.location[0]);
        if (distance <= radiusGAR) {
            let response = searchHandler.onNodeFound(node, center, radius, results);
            let continueSearch = true;
            switch (response) {
                case WT_GeoKDTree.ResultResponse.INCLUDE_AND_STOP:
                    continueSearch = false;
                case WT_GeoKDTree.ResultResponse.INCLUDE:
                    if (results) {
                        let result = this._objectFactory ? node.object : node;
                        if (!result) {
                            result = this._objectFactory.create(node);
                            if (this._cacheObjects) {
                                node.object = result;
                            }
                        }
                        this._insertInOrder(result, center, radius, searchHandler, results);
                    }
                    break;
                case WT_GeoKDTree.ResultResponse.EXCLUDE_AND_STOP:
                    continueSearch = false;
                    break;
            }
            if (!continueSearch) {
                return false;
            }
        }

        if (node.lesser >= 0) {
            let continueSearch = this._searchHelper(center, radius, radiusGAR, centerCartesian, radiusCartesian, searchHandler, node.lesser, results);
            if (!continueSearch) {
                return false;
            }
        }
        if (node.greater >= 0) {
            let continueSearch = this._searchHelper(center, radius, radiusGAR, centerCartesian, radiusCartesian, searchHandler, node.greater, results);
            if (!continueSearch) {
                return false;
            }
        }

        return true;
    }

    /**
     * Searches this tree for objects located within a circular area.
     * @param {WT_GeoPoint} center - the center of the search area.
     * @param {WT_NumberUnit} radius - the radius of the search area.
     * @param {WT_GeoKDTreeSearchHandler} searchHandler
     * @param {Boolean} [getResults] - whether to return the results of the search in an array. True by default.
     * @param {Array} [results] - an array in which to store the results of the search. If this argument is not
     *                            supplied, then a new array will be created and returned (unless getResults = false,
     *                            in which case a value of null is returned).
     * @returns {Object[]} the results of the search, or null if the search was initiated with getResults = false.
     */
    search(center, radius, searchHandler, getResults = true, results = null) {
        let radiusGAR = radius.asUnit(WT_Unit.GA_RADIAN);
        let centerCartesian = center.cartesian(this._tempVector);
        let radiusCartesian = Math.sqrt(2 * (1 - Math.cos(radiusGAR)));
        if (getResults && !results) {
            results = [];
        }
        this._searchHelper(center, radius, radiusGAR, centerCartesian, radiusCartesian, searchHandler, this._root, results);
        return results;
    }
}
/**
 * @enum {Number}
 */
WT_GeoKDTree.ResultResponse = {
    INCLUDE: 0,
    INCLUDE_AND_STOP: 1,
    EXCLUDE: 2,
    EXCLUDE_AND_STOP: 3
}

/**
 * @typedef WT_GeoKDTreeNode
 * @property {Number[]} location - the location of this node expressed as a [long, lat] pair.
 * @property {String} axis - the axis on which this node was split (either x, y, or z).
 * @property {Number} x - the x-coordinate of this node in the geographic cartesian coordinate system.
 * @property {Number} y - the y-coordinate of this node in the geographic cartesian coordinate system.
 * @property {Number} z - the z-coordinate of this node in the geographic cartesian coordinate system.
 * @property {Number} lesser - the index of this node's lesser child node.
 * @property {Number} greater - the index of this node's greater child node.
 * @property {Number} least - the minimum coordinate value, in the axis on which this node was split, of
 *                            all nodes contained in the subtree with this node as the root.
 * @property {Number} greatest - the maximum coordinate value, in the axis on which this node was split, of
 *                               all nodes contained in the subtree with this node as the root.
 */

class WT_GeoKDTreeSearchHandler {
    /**
     * This method is called when a tree node within the search area is found and returns a response code
     * which determines how the search should proceed. Valid responses to a search result are to include the
     * result in the array of search results and continue the search, include the result and terminate the search,
     * exclude the result and continue, or exclude the result and terminate the search. If the search was
     * initiated with getResults = false, then the result will not be included regardless of which response code
     * is returned.
     * @param {WT_GeoKDTreeNode} node - a tree node within the search area.
     * @param {WT_GeoPoint} center - the center of the search area.
     * @param {WT_NumberUnit} radius - the radius of the search area.
     * @param {Object[]} results - an array storing all previously included search results, or null if the
     *                             search was initiated with getResults = false.
     * @returns {WT_GeoKDTree.ResultResponse} a response code which determines how the search should proceed.
     */
    onNodeFound(node, center, radius, results) {
        return WT_GeoKDTree.ResultResponse.INCLUDE;
    }

    /**
     * Gets the key by which search results are sorted. Objects with lower key values will be sorted in front of
     * objects with higher key values. If no sorting is desired, then this method should return undefined.
     * @param {Object} object - a search result.
     * @param {WT_GeoPoint} center - the center of the search area.
     * @param {WT_NumberUnit} radius - the radius of the search area.
     * @returns {Number} the key by which the search result will be sorted, or undefined if the result should remain
     *                   unsorted.
     */
    sortKey(object, center, radius) {
        return undefined;
    }
}