/**
 * Loads geographic border data with LOD levels and stores the data for future access.
 */
class WT_MapViewBorderData {
    /**
     * @param {Number} admin1ScaleRankThreshold - the scale rank threshold by which to filter admin1 borders. All admin1 borders
     *                                            with scalerank above this value will be discarded before processing.
     * @param {Number[]} lodSimplifyThresholds - the geometry simplification thresholds for each LOD level. The length of this array
     *                                           determines the number of LOD levels. Each element in the array should be the
     *                                           Visvalingam threshold (in steradians) for the associated LOD level.
     */
    constructor() {
        this._isReady = false;
        this._loadBorderJSON(WT_MapViewBorderData.DATA_FILE_PATH);
    }

    /**
     * Checks whether the border data has been loaded and processed.
     * @returns {Boolean} whether the border data has been loaded and processed.
     */
    isReady() {
        return this._isReady;
    }

    _loadBorderJSON(path) {
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

    _loadData(data) {
        this._data = JSON.parse(data);
        this._isReady = true;
    }

    /**
     * Counts the number of LOD levels encoded in these data.
     * @returns {Number} the number of LOD levels encoded in these data.
     */
    countLODLevels() {
        if (!this.isReady()){
            return undefined;
        }
        return this._data.lodSimplifyThresholds.length;
    }

    /**
     * Gets the geometry simplification threshold for an LOD level. Geometry is simplified at each LOD level using
     * the Visvalingam method.
     * @param {Number} lod - the LOD level.
     * @returns {Number} the simplification threshold, in steradians.
     */
    getSimplifyThreshold(lod) {
        if (!this.isReady()){
            return undefined;
        }
        return this._data.lodSimplifyThresholds[lod];
    }

    /**
     * Gets the polygon data for all features of a given administration level.
     * @param {WT_MapViewBorderData.AdminLevel} adminLevel - an administration level, either admin0 or admin1.
     * @returns {MapViewBorderDataFeatureInfo[]} an array of feature polygon data.
     */
    getPolygons(adminLevel) {
        if (!this.isReady()) {
            return undefined;
        }

        switch (adminLevel) {
            case WT_MapViewBorderData.AdminLevel.ADMIN_0: return this._data.admin0Polygons;
            case WT_MapViewBorderData.AdminLevel.ADMIN_1: return this._data.admin1Polygons;
        }
    }

    /**
     * Gets the border data for all features of a given administration level at a specified LOD level.
     * @param {WT_MapViewBorderData.AdminLevel} adminLevel - an administration level, either admin0 or admin1.
     * @param {Number} lod - an LOD level.
     * @returns {MapViewBorderDataFeatureInfo[]} an array of feature border data.
     */
    getBorders(adminLevel, lod) {
        if (!this.isReady()) {
            return undefined;
        }

        switch (adminLevel) {
            case WT_MapViewBorderData.AdminLevel.ADMIN_0: return this._data.admin0Borders[lod];
            case WT_MapViewBorderData.AdminLevel.ADMIN_1: return this._data.admin1Borders[lod];
        }
    }
}
WT_MapViewBorderData.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Borders/borders_processed.json";
WT_MapViewBorderData.ADMIN_1_SCALERANK_THRESHOLD_DEFAULT = 2;
WT_MapViewBorderData.LOD_SIMPLIFY_THRESHOLDS_DEFAULT = [
    Number.MIN_VALUE,
    0.00000003,
    0.0000003,
    0.000003,
    0.00003
];
/**
 * @enum {Number}
 */
WT_MapViewBorderData.AdminLevel = {
    ADMIN_0: 0,
    ADMIN_1: 1
}

/**
 * @typedef MapViewBorderDataFeatureInfo
 * @property {Object} feature
 * @property {Number[][]} geoBounds
 * @property {Number[]} geoCentroid
 * @property {Number} geoArea
 */

 class WT_MapViewBorderDataProcessor {
     constructor(topology) {
         this._topology = topology;
     }

     /**
      * @readonly
      */
     get topology() {
         return this._topology;
     }

     _filterScaleRank(threshold, feature) {
        return feature.properties.scalerank <= threshold;
    }

    _createFeatureInfo(feature) {
        let bounds = d3.geoBounds(feature);
        // avoid +90 or -90 latitude
        bounds[0][1] = Math.min(89.9, Math.max(-89.9, bounds[0][1]));
        bounds[1][1] = Math.min(89.9, Math.max(-89.9, bounds[1][1]));

        return {
            feature: feature,
            geoBounds: bounds,
            geoCentroid: d3.geoCentroid(feature),
            geoArea: d3.geoArea(feature)
        };
    }

    _processFeaturesObject(topology, object, array, simplifyThreshold, scaleRankThreshold) {
        let simplified = topojson.simplify(topology, simplifyThreshold);
        array.push(...topojson.feature(simplified, object).features.filter(
            this._filterScaleRank.bind(this, scaleRankThreshold)
        ).map(
            this._createFeatureInfo.bind(this)
        ));
    }

    _processBorders(processed, topology, admin1ScaleRankThreshold, lodSimplifyThresholds) {
        processed.admin0Borders = [];
        processed.admin1Borders = [];
        for (let i = 0; i < this._lodSimplifyThresholds.length; i++) {
            this._admin0Borders.push([]);
            this._admin1Borders.push([]);
            this._processFeaturesObject(topology, topology.objects.admin0Boundaries, processed.admin0Borders[i], lodSimplifyThresholds[i], Infinity);
            this._processFeaturesObject(topology, topology.objects.admin0MapUnitBoundaries, processed.admin0Borders[i], lodSimplifyThresholds[i], Infinity);
            this._processFeaturesObject(topology, topology.objects.admin1Boundaries, processed.admin1Borders[i], lodSimplifyThresholds[i], admin1ScaleRankThreshold);
        }
    }

    _processPolygons(processed, topology, admin1ScaleRankThreshold) {
        processed.admin0Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin0Polygons, processed.admin0Polygons, Number.MIN_VALUE, Infinity);

        processed.admin1Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin1Polygons, processed.admin1Polygons, Number.MIN_VALUE, admin1ScaleRankThreshold);
    }

     process(admin1ScaleRankThreshold, lodSimplifyThresholds) {
        let processed = {};
        let presimplified = topojson.presimplify(this.topology, topojson.sphericalTriangleArea);
        this._processBorders(processed, presimplified, admin1ScaleRankThreshold, lodSimplifyThresholds);
        this._processPolygons(processed, presimplified, admin1ScaleRankThreshold);
        return processed;
     }
 }