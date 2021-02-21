/**
 * A searcher that finds cities located within a circular geographic area.
 */
class WT_CitySearcher {
    constructor() {
        this._isReady = false;

        this._tempGeoPoint1 = new WT_GeoPoint(0, 0, 0);
        this._tempGeoPoint2 = new WT_GeoPoint(0, 0, 0);
        this._tempVector = new WT_GVector3(0, 0, 0);

        this._loadTreeJSON(WT_CitySearcher.DATA_FILE_PATH);
    }

    _loadData(data) {
        let json = JSON.parse(data);
        /**
         * @type {WT_GeoKDTree[]}
         */
        this._trees = [];
        for (let size = 0; size < json.roots.length; size++) {
            this._trees.push(new WT_GeoKDTree(json.cities, json.roots[size], {
                create(node) {
                    return new WT_City(node.name, new WT_GeoPoint(node.location[1], node.location[0]), node.size);
                }
            }));
        }
        this._isReady = true;
    }

    _loadTreeJSON(path) {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");

        request.addEventListener("load",
            (function() {
                this._loadData(request.responseText);
            }).bind(this)
        );
        request.open("GET", path);
        request.send();
    }

    /**
     * @readonly
     * @property {Boolean} isReady
     * @type {Boolean}
     */
    get isReady() {
        return this._isReady;
    }

    /**
     * Searches for all cities within a specified radius of a geographic point and returns them in an array in ascending order of
     * great-circle distance from the specified point.
     * @param {Number} size - the size category of the cities to be returned by the search.
     * @param {WT_GeoPoint} center - the center of the search ring.
     * @param {WT_NumberUnit} radius - the radius of the search ring.
     * @param {Iterable<WT_City>} [exclude] - cities to exclude from the search results.
     * @returns {WT_City[]} - an array of cities located in the search ring, sorted in ascending order of great-circle distance
     *                        from the center of the search ring.
     */
    search(size, center, radius, exclude) {
        if (!this.isReady) {
            return [];
        }

        return this._trees[size].search(center, radius, new WT_CitySearchHandler(exclude));
    }
}
WT_CitySearcher.DATA_FILE_PATH = "/Data/Cities/cities.json";

class WT_CitySearchHandler extends WT_GeoKDTreeSearchHandler {
    constructor(exclude) {
        super();

        this._exclude = new Set();
        if (exclude) {
            for (let city of exclude) {
                this._exclude.add(this._keyFromCity(city));
            }
        }
    }

    /**
     * Gets a unique string key from a city.
     * @param {WT_City} city
     * @returns {String} a unique string key.
     */
    _keyFromCity(city) {
        return city.uniqueID;
    }

    /**
     * Gets a unique string key from a tree node.
     * @param {WT_CityTreeNode} node
     * @returns {String} a unique string key.
     */
    _keyFromNode(node) {
        return `${node.name}: ${node.location[1].toFixed(2)} ${node.location[0].toFixed(2)}`;
    }

    /**
     *
     * @param {WT_GeoKDTreeNode} node
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     * @param {WT_City[]} results
     */
    onNodeFound(node, center, radius, results) {
        let nodeKey = this._keyFromNode(node);
        return this._exclude.has(nodeKey) ? WT_GeoKDTree.ResultResponse.EXCLUDE : WT_GeoKDTree.ResultResponse.INCLUDE;
    }

    /**
     *
     * @param {WT_City} object
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     */
    sortKey(object, center, radius) {
        return center.distance(object.location);
    }
}