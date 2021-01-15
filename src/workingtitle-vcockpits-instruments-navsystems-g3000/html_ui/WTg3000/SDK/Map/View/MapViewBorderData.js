/**
 * Loads geographic border data from a topojson file, generates LOD levels for the borders, and
 * stores the processed data for future access.
 */
class WT_MapViewBorderData {
    /**
     * @param {Number} admin1ScaleRankThreshold - the scale rank threshold by which to filter admin1 borders. All admin1 borders
     *                                            with scalerank above this value will be discarded before processing.
     * @param {Number[]} lodSimplifyThresholds - the geometry simplification thresholds for each LOD level. The length of this array
     *                                           determines the number of LOD levels. Each element in the array should be the
     *                                           Visvalingam threshold (in steradians) for the associated LOD level.
     */
    constructor(admin1ScaleRankThreshold = WT_MapViewBorderData.ADMIN_1_SCALERANK_THRESHOLD_DEFAULT, lodSimplifyThresholds = WT_MapViewBorderData.LOD_SIMPLIFY_THRESHOLDS_DEFAULT) {
        this._admin1ScaleRankThreshold = admin1ScaleRankThreshold;
        this._lodSimplifyThresholds = lodSimplifyThresholds;
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
        array.push(...topojson.feature(topojson.simplify(topology, simplifyThreshold), object).features.filter(
            this._filterScaleRank.bind(this, scaleRankThreshold)
        ).map(
            this._createFeatureInfo.bind(this)
        ));
    }

    _processBorders(topology) {
        this._admin0Borders = [];
        this._admin1Borders = [];
        for (let i = 0; i < this._lodSimplifyThresholds.length; i++) {
            this._admin0Borders.push([]);
            this._admin1Borders.push([]);
            this._processFeaturesObject(topology, topology.objects.admin0Boundaries, this._admin0Borders[i], this._lodSimplifyThresholds[i], Infinity);
            this._processFeaturesObject(topology, topology.objects.admin0MapUnitBoundaries, this._admin0Borders[i], this._lodSimplifyThresholds[i], Infinity);
            this._processFeaturesObject(topology, topology.objects.admin1Boundaries, this._admin1Borders[i], this._lodSimplifyThresholds[i], this._admin1ScaleRankThreshold);
        }
    }

    _processPolygons(topology) {
        this._admin0Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin0Polygons, this._admin0Polygons, Number.MIN_VALUE, Infinity);

        this._admin1Polygons = [];
        this._processFeaturesObject(topology, topology.objects.admin1Polygons, this._admin1Polygons, Number.MIN_VALUE, this._admin1ScaleRankThreshold);
    }

    _loadData(data) {
        let topology = JSON.parse(data);
        let presimplified = topojson.presimplify(topology, topojson.sphericalTriangleArea);
        this._processBorders(presimplified);
        this._processPolygons(presimplified);
        this._isReady = true;
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
            case WT_MapViewBorderData.AdminLevel.ADMIN_0: return this._admin0Polygons;
            case WT_MapViewBorderData.AdminLevel.ADMIN_1: return this._admin1Polygons;
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
            case WT_MapViewBorderData.AdminLevel.ADMIN_0: return this._admin0Borders[lod];
            case WT_MapViewBorderData.AdminLevel.ADMIN_1: return this._admin1Borders[lod];
        }
    }
}
WT_MapViewBorderData.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/borders.json";
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