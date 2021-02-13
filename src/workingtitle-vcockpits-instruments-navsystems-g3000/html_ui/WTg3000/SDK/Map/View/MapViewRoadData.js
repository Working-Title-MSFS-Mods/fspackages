/**
 * A collection of road feature data.
 */
class WT_MapViewRoadFeatureCollection {
    constructor(regions, types, maxQualityLOD) {
        this._regions = regions;
        this._types = types;
        this._maxQualityLOD = Math.max(0, Math.min(WT_MapViewRoadFeatureCollection.LOD_COUNT - 1, maxQualityLOD));
        this._features = [];
        this._bvh = [];
        this._loadCountTotal = this._regions.length * this._types.length * (WT_MapViewRoadFeatureCollection.LOD_COUNT - this._maxQualityLOD);
        this._bvhLoadCount = 0;
        this._lodDataLoadCount = 0;
        this._loadStarted = false;
        this._isReady = false;
        this._initArrays();

        this._tempBoundingBox = [[0, 0, 0], [0, 0, 0]];
        this._tempVector = new WT_GVector3(0, 0, 0);
        this._tempNM = new WT_NumberUnit(0, WT_Unit.NMILE);
    }

    _initArrays() {
        for (let region of this._regions) {
            this._features[region] = [];
            this._bvh[region] = [];
            for (let type of this._types) {
                this._features[region][type] = [];
                this._bvh[region][type] = [];
            }
        }
    }

    /**
     * Checks whether loading of road feature data has started.
     * @returns {Boolean} whether loading of road feature data has started.
     */
    hasLoadStarted() {
        return this._loadStarted;
    }

    /**
     * Checks whether all road feature data have been loaded and processed.
     * @returns {Boolean} whether road feature data have been loaded and processed.
     */
    isReady() {
        return this._isReady;
    }

    _checkReady() {
        if (this._bvhLoadCount === this._loadCountTotal && this._lodDataLoadCount === this._loadCountTotal) {
            this._isReady = true;
        }
    }

    _setLOD(lodArray, lod, data) {
        lodArray[lod] = data;
        if (lod === this._maxQualityLOD) {
            for (let i = lod - 1; i >= 0; i--) {
                lodArray[i] = data;
            }
        }
    }

    _loadFeatureData(region, type, lod, data) {
        let json = JSON.parse(data);
        this._setLOD(this._features[region][type], lod, json.features);
        this._lodDataLoadCount++;
        this._checkReady();
    }

    _loadBVHData(region, type, lod, data) {
        let bvh = JSON.parse(data);
        this._setLOD(this._bvh[region][type], lod, bvh);
        this._bvhLoadCount++;
        this._checkReady();
    }

    async _onZipOpened(region, type, entries) {
        let fileRoot = `${WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING[region]}_${WT_MapViewRoadFeatureCollection.DATA_FILE_TYPE_STRING[type]}`;

        for (let i = 0; i < WT_MapViewRoadFeatureCollection.LOD_COUNT; i++) {
            let fileName = `${fileRoot}_lod${i}.json`;
            let entry = entries.find(e => e.filename === fileName);
            let data = await entry.getData(new zip.TextWriter());
            this._loadFeatureData(region, type, i, data);
        }

        let fileName = `${fileRoot}_bvh.json`;
        let entry = entries.find(e => e.filename === fileName);
        let data = await entry.getData(new zip.TextWriter());
        this._loadBVHData(region, type, data);
    }

    _openZipForType(dir, region, type) {
        let path = `${dir}/${WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING[region]}_${WT_MapViewRoadFeatureCollection.DATA_FILE_TYPE_STRING[type]}.zip`;
        let request = new XMLHttpRequest();
        request.responseType = "arraybuffer";

        request.addEventListener("load",
            (async function() {
                let zipReader = new zip.ZipReader(new zip.Uint8ArrayReader(new Uint8Array(request.response)));
                let entries = await zipReader.getEntries();
                this._onZipOpened(region, type, entries);
            }).bind(this)
        );
        request.open("GET", path);
        request.send();
    }

    _openZipsForRegion(region) {
        let dir = `${WT_MapViewRoadFeatureCollection.DATA_FILE_DIR}/${WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING[region]}`;
        for (let type of this._types) {
            this._openZipForType(dir, region, type);
        }
    }

    _openZips() {
        for (let region of this._regions) {
            this._openZipsForRegion(region);
        }
    }

    _openFile(path, loadFunc) {
        return new Promise(resolve => {
            let request = new XMLHttpRequest();
            request.overrideMimeType("application/json");

            request.addEventListener("load",
                function() {
                    loadFunc(request.responseText);
                    resolve();
                }
            );
            request.open("GET", path);
            request.send();
        });
    }

    async _openFilesForType(dir, region, type) {
        let file = `${WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING[region]}_${WT_MapViewRoadFeatureCollection.DATA_FILE_TYPE_STRING[type]}`;

        for (let i = this._maxQualityLOD; i < WT_MapViewRoadFeatureCollection.LOD_COUNT; i++) {
            await this._openFile(`${dir}/${file}_lod${i}.geojson`, this._loadFeatureData.bind(this, region, type, i));
            await this._openFile(`${dir}/${file}_lod${i}_bvh.json`, this._loadBVHData.bind(this, region, type, i));
        }
    }

    async _openFilesForRegion(region) {
        let dir = `${WT_MapViewRoadFeatureCollection.DATA_FILE_DIR}/${WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING[region]}`;
        for (let type of this._types) {
            await this._openFilesForType(dir, region, type);
        }
    }

    _openFiles() {
        for (let region of this._regions) {
            this._openFilesForRegion(region);
        }
    }

    /**
     * Checks whether this collection contains data for a specific region.
     * @param {WT_MapViewRoadFeatureCollection.Region} region - the region to check.
     * @returns {Boolean} whether this collection contains data for the region.
     */
    hasRegion(region) {
        return this._regions.indexOf(region) >= 0;
    }

    /**
     * Checks whether this collection contains data for a specific road type.
     * @param {WT_MapViewRoadFeatureCollection.Type} type - the road type to check.
     * @returns {Boolean} whether this collection contains data for the road type.
     */
    hasType(type) {
        return this._types.indexOf(type) >= 0;
    }

    /**
     * Counts the number of LOD levels encoded in this collection.
     * @returns {Number} the number of LOD levels encoded in this collection.
     */
    countLODLevels() {
        if (!this.isReady()){
            return undefined;
        }
        return this._features.length;
    }

    /**
     * Starts the process of loading data. Once all data have been successfully loaded, the isReady() method
     * will return true and this collection can be searched. If loading has previously been started, calling
     * this method again has no effect.
     */
    startLoad() {
        if (this.hasLoadStarted()) {
            return;
        }

        this._loadStarted = true;
        this._openFiles();
    }

    /**
     *
     * @param {WT_GVector3} center
     * @param {Number} radius
     * @param {Number[][]} bbox
     * @returns {Boolean}
     */
    _doesIntersect(center, radius, bbox) {
        let x = Math.max(bbox[0][0], Math.min(center.x, bbox[1][0]));
        let y = Math.max(bbox[0][1], Math.min(center.y, bbox[1][1]));
        let z = Math.max(bbox[0][2], Math.min(center.z, bbox[1][2]));

        let dx = x - center.x;
        let dy = y - center.y;
        let dz = z - center.z;
        return dx * dx + dy * dy + dz * dz < radius * radius;
    }

    /**
     *
     * @param {WT_MapViewRoadFeature[]} array
     * @param {WT_MapViewRoadFeature} feature
     * @param {WT_GeoPoint} center
     */
    _insertInOrder(array, feature, center) {
        let low = 0;
        let high = array.length;
        let target = 0;

        let distance = center.distance(feature.properties.centroid[1], feature.properties.centroid[0]);
        while (high > low) {
            target = Math.floor((low + high) / 2);
            let comparison = array[target];
            let compareDistance = center.distance(comparison.properties.centroid[1], comparison.properties.centroid[0]);
            if (distance < compareDistance) {
                high = target;
            } else if (distance > compareDistance) {
                low = target + 1;
            } else {
                break;
            }
        }
        array.splice(target, 0, feature);
    }

    /**
     *
     * @param {WT_MapViewRoadDataBVHNode} leaf
     * @param {WT_MapViewRoadFeature[]} features
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} minLength
     * @param {WT_MapViewRoadFeature[]} results
     */
    _searchLeaf(leaf, features, center, minLength, results) {
        let feature = features[leaf.featureIndex];
        if (minLength.compare(feature.properties.length) <= 0) {
            this._insertInOrder(results, feature, center);
        }
    }

    /**
     *
     * @param {WT_MapViewRoadFeature[]} features
     * @param {WT_GeoPoint} center
     * @param {WT_GVector3} centerCartesian
     * @param {Number} radiusCartesian
     * @param {WT_NumberUnit} minLength
     * @param {WT_MapViewRoadFeature[]} results
     * @param {WT_MapViewRoadDataBVHNode} node
     */
    _searchBVHHelper(features, center, centerCartesian, radiusCartesian, minLength, results, node) {
        if (this._doesIntersect(centerCartesian, radiusCartesian, node.bbox)) {
            if (node.featureIndex !== undefined) {
                this._searchLeaf(node, features, center, minLength, results);
            } else {
                this._searchBVHHelper(features, center, centerCartesian, radiusCartesian, minLength, results, node.left);
                this._searchBVHHelper(features, center, centerCartesian, radiusCartesian, minLength, results, node.right);
            }
        }
    }

    /**
     *
     * @param {WT_MapViewRoadFeature[]} features
     * @param {WT_GeoPoint} center
     * @param {Number} radius
     * @param {WT_NumberUnit} minLength
     * @param {WT_MapViewRoadFeature[]} results
     */
    _searchBVH(region, type, lod, center, radius, minLength, results) {
        let centerCartesian = center.cartesian(this._tempVector);
        let radiusCartesian = Math.sqrt(2 * (1 - Math.cos(radius.asUnit(WT_Unit.GA_RADIAN))));

        let features = this._features[region][type][lod];
        this._searchBVHHelper(features, center, centerCartesian, radiusCartesian, minLength, results, this._bvh[region][type][lod]);
    }

    /**
     * Gets all road features located within a circular area.
     * @param {WT_MapViewRoadFeatureCollection.Type} type - the type of road feature for which to search.
     * @param {Number} lod - an LOD level.
     * @param {WT_GeoPoint} center - the center of the area to search.
     * @param {WT_NumberUnit} radius - the radius of the area to search.
     * @param {WT_NumberUnit} [minLength] - if this argument is supplied, enforces a minimum length on the road features
     *                                      returned by the search.
     * @returns {WT_MapViewRoadFeature[]} an array of feature border data.
     */
    search(type, lod, center, radius, minLength) {
        if (!this.isReady()) {
            return undefined;
        }

        if (minLength) {
            this._tempNM.set(minLength);
        } else {
            this._tempNM.set(0);
        }

        let results = [];
        if (this.hasType(type)) {
            for (let region of this._regions) {
                this._searchBVH(region, type, lod, center, radius, this._tempNM, results);
            }
        }
        return results;
    }
}
/**
 * @enum {Number}
 */
WT_MapViewRoadFeatureCollection.Region = {
    NA: 0,  // North America
    CA: 1,  // Mexico and Central America
    SA: 2,  // South America
    EI: 3,  // European Isles (GB, Ireland, Iceland)
    EN: 4,  // Northern Europe
    EW: 5,  // Western Europe
    EC: 6,  // Central Europe
    EE: 7,  // Eastern Europe
    AF: 8,  // Africa
    ME: 9,  // Middle East
    RU: 10, // Russia
    AC: 11, // Central Asia
    CH: 12, // China and Mongolia
    AE: 13, // East Asia
    AS: 14, // South Asia
    OC: 15  // Oceania
};
/**
 * @enum {Number}
 */
WT_MapViewRoadFeatureCollection.Type = {
    HIGHWAY: 0,
    PRIMARY: 1
}
WT_MapViewRoadFeatureCollection.LOD_COUNT = 4;
WT_MapViewRoadFeatureCollection.DATA_FILE_DIR = "/WTg3000/SDK/Assets/Data/Roads/Features";
WT_MapViewRoadFeatureCollection.DATA_FILE_REGION_STRING = [
    "NA",
    "CA",
    "SA",
    "EI",
    "EN",
    "EW",
    "EC",
    "EE",
    "AF",
    "ME",
    "RU",
    "AC",
    "CH",
    "AE",
    "AS",
    "OC"
];
WT_MapViewRoadFeatureCollection.DATA_FILE_TYPE_STRING = [
    "highway",
    "primary"
];

/**
 * @typedef WT_MapViewRoadDataBVHNode
 * @property {Number[][]} bbox
 * @property {Number[]} [featureIndexes]
 * @property {WT_MapViewRoadDataBVHNode} [left]
 * @property {WT_MapViewRoadDataBVHNode} [right]
 */

/**
 * @typedef WT_MapViewRoadFeature
 * @property {String} type
 * @property {{centroid:Number[], length:Number}} properties
 * @property {{type:String, coordinates:Number[][][]}} geometry
 */

class WT_MapViewRoadLabelCollection {
    /**
     * @param {String} path - the path to the road label data file with which to initialize the new collection.
     *                        The file should contain a K-D tree of candidate label positions and a K-D tree of
     *                        restricted points around which labels should not be placed.
     * @param {{createLabel(roadType:Number, routeType:String, location:WT_GeoPointReadOnly, name:String):WT_MapViewRoadLabel}} labelFactory - a factory with which to create WT_MapViewRoadLabel objects from the data in the new collection.
     */
    constructor(path, labelFactory) {
        this._filePath = path;
        this._labelFactory = labelFactory;
        this._candidatePruneHandler = new WT_MapViewRoadLabelCandidatePruneHandler();

        this._nextSearchID = 0;
        this._searchesToCancel = new Set();

        this._loadStarted = false;
        this._isReady = false;

        this._tempVector = new WT_GVector3(0, 0, 0);
        this._tempNM = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _loadData(data) {
        let json = JSON.parse(data);
        this._candidates = json.candidates;
        this._restrictions = json.restrictions;
        this._candidatesTree = new WT_GeoKDTree(this._candidates.list, this._candidates.root);
        this._restrictionsTree = new WT_GeoKDTree(this._restrictions.list, this._restrictions.root);

        this._isReady = true;
    }

    _openFile(path) {
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
     * Checks whether loading of road label data has started.
     * @returns {Boolean} whether loading of road label data has started.
     */
    hasLoadStarted() {
        return this._loadStarted;
    }

    /**
     * Checks whether all road label data have been loaded and processed.
     * @returns {Boolean} whether road label data have been loaded and processed.
     */
    isReady() {
        return this._isReady;
    }

    /**
     * Starts the process of loading data. Once all data have been successfully loaded, the isReady() method
     * will return true and this collection can be searched. If loading has previously been started, calling
     * this method again has no effect.
     */
    startLoad() {
        if (this.hasLoadStarted()) {
            return;
        }

        this._loadStarted = true;
        this._openFile(this._filePath);
    }

    _pruneCandidatesLoop(id, candidates, head, map, toKeep, searchRadius, labelDistance, repeatDistance, resolve, reject) {
        if (this._searchesToCancel.has(id)) {
            this._searchesToCancel.delete(id);
            reject(new Error(`Search (ID: ${id}) was canceled.`));
        }

        let t0 = performance.now();
        while (head < candidates.length && performance.now() - t0 < WT_MapViewRoadLabelCollection.PRUNE_TIME_BUDGET) {
            let candidate = candidates[head];
            let searchCenter = this._tempGeoPoint.set(candidate.location[1], candidate.location[0]);
            this._candidatePruneHandler.setContext(candidate, map, toKeep, labelDistance, repeatDistance);
            this._candidatesTree.search(searchCenter, searchRadius, this._candidatePruneHandler, false);
            map.delete(candidate);
            do {
                head++;
            } while (head < candidates.length && !toKeep.has(head))
        }
        if (head < candidates.length) {
            requestAnimationFrame(this._pruneCandidatesLoop.bind(this, id, candidates, head, map, toKeep, searchRadius, labelDistance, repeatDistance, resolve, reject));
        } else {
            let results = [];
            for (let index of toKeep) {
                results.push(candidates[index]);
            }
            resolve(results);
        }
    }

    /**
     *
     * @param {WT_MapViewRoadLabel[]} candidates
     * @param {WT_NumberUnit} labelDistance
     */
    _pruneCandidates(id, candidates, labelDistance, repeatDistance) {
        let map = new Map();
        let toKeep = new Set();
        for (let i = 0; i < candidates.length; i++) {
            map.set(candidates[i], i);
            toKeep.add(i);
        }

        let labelDistanceGreater = labelDistance.compare(repeatDistance) > 0
        let searchRadius = labelDistanceGreater ? labelDistance : repeatDistance;
        repeatDistance = labelDistanceGreater ? labelDistance : repeatDistance;

        return new Promise((resolve, reject) => {
            this._pruneCandidatesLoop(id, candidates, 0, map, toKeep, searchRadius, labelDistance, repeatDistance, resolve, reject);
        });
    }

    async _doSearch(id, center, radius, typeBit, restrictionDistance, labelDistance, repeatDistance) {
        let candidates = this._candidatesTree.search(center, radius, new WT_MapViewRoadLabelCandidateSearchHandler(this._restrictionsTree, typeBit, restrictionDistance));
        let results = await this._pruneCandidates(id, candidates, labelDistance, repeatDistance);
        for (let i = 0; i < results.length; i++) {
            let node = results[i];
            results[i] = this._labelFactory.createLabel(node.roadType, node.routeType, this._tempGeoPoint.set(node.location[1], node.location[0]).readonly(), node.name);
        }
        return results;
    }

    /**
     * Searches for labels in a circular area.
     * @param {WT_GeoPoint} center - the center of the search area.
     * @param {WT_NumberUnit} radius - the radius of the search area.
     * @param {WT_MapViewRoadFeatureCollection.Type[]} types -
     * @param {WT_NumberUnit} restrictionDistance - the minimum distance separating labels from restricted points.
     * @param {WT_NumberUnit} labelDistance - the minimum distance separating any two labels.
     * @param {WT_NumberUnit} repeatDistance - the minimum distance separating two labels of the same road.
     * @returns {{id:Number, execute:Function}} an object containing the ID of the search and an execute function which
     *                                          when called returns a Promise to return an array of labels.
     */
    search(center, radius, types, restrictionDistance, labelDistance, repeatDistance) {
        if (!this.isReady()){
            return undefined;
        }

        let typeBit = types.reduce((acc, cur, ind) => acc + (1 << cur), 0);
        let id = this._nextSearchID++
        return {id: id, execute: this._doSearch.bind(this, id, center, radius, typeBit, restrictionDistance, labelDistance, repeatDistance)};
    }

    /**
     * Cancels a previously initiated search. Canceling a search will cause the Promise returned by the search's execute
     * function to be rejected.
     * @param {Number} id - the ID of the search to cancel.
     */
    cancelSearch(id) {
        if (id < this._nextSearchID) {
            this._searchesToCancel.add(id);
        }
    }
}
WT_MapViewRoadLabelCollection.PRUNE_TIME_BUDGET = 0.5; // ms

class WT_MapViewRoadLabelRestrictionSearchHandler extends WT_GeoKDTreeSearchHandler {
    constructor(typeBit) {
        super();

        this._typeBit = typeBit;
    }

    onNodeFound(object, center, radius, results) {
        if (this._typeBit & object.roadTypeBit === object.roadTypeBit) {
            return WT_GeoKDTree.ResultResponse.INCLUDE_AND_STOP;
        } else {
            return WT_GeoKDTree.ResultResponse.EXCLUDE;
        }
    }
}

class WT_MapViewRoadLabelCandidateSearchHandler extends WT_GeoKDTreeSearchHandler {
    /**
     * @param {WT_GeoKDTree} restrictionsTree
     */
    constructor(restrictionsTree, typeBit, restrictionDistance) {
        super();

        this._restrictionsTree = restrictionsTree;
        this._typeBit = typeBit;
        this._restrictionDistance = restrictionDistance;
        this._restrictionSearchHandler = new WT_MapViewRoadLabelRestrictionSearchHandler(typeBit);
        this._tempArray = [];
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     *
     * @param {WT_GeoKDTreeNode} node
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     * @param {WT_MapViewRoadLabel[]} results
     */
    onNodeFound(node, center, radius, results) {
        let response = WT_GeoKDTree.ResultResponse.EXCLUDE;
        if (((1 << node.roadType) & this._typeBit) !== 0) {
            let location = this._tempGeoPoint.set(node.location[1], node.location[0]);
            let result = this._restrictionsTree.search(location, this._restrictionDistance, this._restrictionSearchHandler, true, this._tempArray);
            let collision = result.length > 0;
            if (collision) {
                result.pop();
            } else {
                response = WT_GeoKDTree.ResultResponse.INCLUDE;
            }
        }
        return response;
    }

    /**
     *
     * @param {WT_GeoKDTreeNode} object
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     */
    sortKey(object, center, radius) {
        return center.distance(object.location[1], object.location[0]);
    }
}

class WT_MapViewRoadLabelCandidatePruneHandler extends WT_GeoKDTreeSearchHandler {
    constructor() {
        super();

        /**
         * @type {WT_GeoKDTreeNode}
         */
        this._candidate = null;
        this._array = null;
        this._map = null;
        this._labelDistance = null;
        this._repeatDistance = null;

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     *
     * @param {WT_GeoKDTreeNode} candidate
     * @param {Map<WT_MapViewRoadLabel,Number>} map
     * @param {Set<Number>} toKeep
     * @param {WT_NumberUnit} labelDistance
     * @param {WT_NumberUnit} repeatDistance
     */
    setContext(candidate, map, toKeep, labelDistance, repeatDistance) {
        this._candidate = candidate;
        this._map = map;
        this._toKeep = toKeep;
        this._labelDistance = labelDistance;
        this._repeatDistance = repeatDistance;
    }

    /**
     *
     * @param {WT_GeoKDTreeNode} object
     * @param {WT_GeoPoint} center
     * @param {WT_NumberUnit} radius
     * @param {WT_MapViewRoadLabel[]} results
     */
    onNodeFound(object, center, radius, results) {
        if (object !== this._candidate) {
            let distance = this._tempGeoPoint.set(object.location[1], object.location[0]).distance(this._candidate.location[1], this._candidate.location[0]);
            let thresholdDistance = object.name === this._candidate.name ? this._repeatDistance : this._labelDistance;
            if (thresholdDistance.compare(distance, WT_Unit.GA_RADIAN) > 0) {
                let index = this._map.get(object);
                if (index !== undefined && this._toKeep.has(index)) {
                    this._toKeep.delete(index);
                    this._map.delete(object);
                }
            }
        }
        return WT_GeoKDTree.ResultResponse.EXCLUDE;
    }
}

/**
 * A label for a road.
 */
class WT_MapViewRoadLabel extends WT_MapViewTextLabel {
    /**
     * @param {WT_GeoPoint} location - the geogaphical location of the new label.
     * @param {String} name - the name of the road associated with the new label.
     */
    constructor(roadType, location, name) {
        super();

        this._roadType = roadType;
        this._location = location.copy();
        this._name = name;
    }

    /**
     * @readonly
     * @property {WT_MapViewRoadFeatureCollection.Type} roadType - the type of the road associated with this label.
     * @type {WT_MapViewRoadFeatureCollection.Type}
     */
    get roadType() {
        return this._roadType;
    }

    /**
     * @readonly
     * @property {Number} priority - the display priority of this label. Text labels with greater priority values
     *                               are always drawn above and culled after labels with lower priority values.
     * @type {Number}
     */
    get priority() {
        return 10 - this._roadType;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} location - the geographical location of this label.
     * @type {WT_GeoPointReadOnly}
     */
    get location() {
        return this._location.readonly();
    }

    /**
     * @readonly
     * @property {String} name - the name of the road associated with this label.
     * @type {String}
     */
    get name() {
        return this._name;
    }
}

/**
 * A label for a road with an image background.
 */
class WT_MapViewRoadImageLabel extends WT_MapViewRoadLabel {
    /**
     * @param {WT_GeoPoint} location - the geogaphical location of the new label.
     * @param {String} name - the name of the road associated with the new label.
     * @param {String} imagePath - the path to the background image file of the new label.
     */
    constructor(roadType, location, name, imagePath) {
        super(roadType, location, name);

        this._backgroundImage = WT_MapViewRoadImageLabel._getImage(imagePath);
        this._viewPos = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRoadImageLabel.OPTIONS_DEF);
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GVector2} viewPos
     */
    _isInBounds(state, viewPos) {
        let halfSize = this.backgroundSize * state.dpiScale / 2;
        return viewPos.x - halfSize >= 0 &&
               viewPos.y - halfSize >= 0 &&
               viewPos.x + halfSize <= state.projection.viewWidth &&
               viewPos.y + halfSize <= state.projection.viewHeight;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     * @param {Number} centerX
     * @param {Number} centerY
     */
    _drawBackground(state, context, centerX, centerY, size) {
        let left = centerX - size / 2;
        let top = centerY - size / 2;
        context.drawImage(this._backgroundImage, left, top, size, size);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     * @param {Number} centerX
     * @param {Number} centerY
     */
    _drawText(state, context, centerX, centerY, size) {
        context.font = `${this.fontWeight} ${this.fontSize * state.dpiScale}px ${this.font}`;

        centerX += this.textOffset.x * size;
        centerY += this.textOffset.y * size;
        context.textBaseline = "middle";
        context.textAlign = "center";
        if (this.fontOutlineWidth > 0) {
            context.lineWidth = this.fontOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = this.fontOutlineColor;
            context.strokeText(this.name, centerX, centerY);
        }
        context.fillStyle = this.fontColor;
        context.fillText(this.name, centerX, centerY);
    }

    /**
     * Draws this label to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the canvas rendering context to which to draw.
     */
    draw(state, context) {
        state.projection.project(this.location, this._viewPos);
        if (this._isInBounds(state, this._viewPos)) {
            let size = this.backgroundSize * state.dpiScale;
            this._drawBackground(state, context, this._viewPos.x, this._viewPos.y, size);
            this._drawText(state, context, this._viewPos.x, this._viewPos.y, size);
        }
    }

    static _getImage(path) {
        let existing = WT_MapViewRoadImageLabel._imageCache.get(path);
        if (!existing) {
            existing = document.createElement("img");
            existing.src = path;
            WT_MapViewRoadImageLabel._imageCache.set(path, existing);
        }
        return existing;
    }
}
WT_MapViewRoadImageLabel._imageCache = new Map();
WT_MapViewRoadImageLabel.OPTIONS_DEF = {
    font: {default: "Roboto-Regular", auto: true},
    fontWeight: {default: "normal", auto: true},
    fontSize: {default: 15, auto: true},
    fontColor: {default: "white", auto: true},
    fontOutlineWidth: {default: 6, auto: true},
    fontOutlineColor: {default: "black", auto: true},
    backgroundSize: {default: 35, auto: true},
    textOffset: {default: {x: 0, y: 0}, auto: true}
};