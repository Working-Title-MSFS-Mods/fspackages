class WT_MapViewBingLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewBingLayer.CLASS_DEFAULT, configName = WT_MapViewBingLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this.projection = new WT_MapProjection("asdf", d3.geoEquirectangular());
    }

    get bingMap() {
        return this._bingMap;
    }

    get size() {
        return this._size;
    }

    _createHTMLElement() {
        this._bingMap = document.createElement("bing-map");
        this._bingMap.style.position = "absolute";
        this._bingMap.style.overflow = "hidden";

        return this._bingMap;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onViewSizeChanged(state) {
        let long = Math.max(state.projection.viewWidth, state.projection.viewHeight);
        this._size = long * WT_MapViewBingLayer.OVERDRAW_FACTOR;
        let offsetX = (state.projection.viewWidth - this._size) / 2;
        let offsetY = (state.projection.viewHeight - this._size) / 2;

        this.bingMap.style.left = `${offsetX}px`;
        this.bingMap.style.top = `${offsetY}px`;
        this.bingMap.style.width = `${this._size}px`;
        this.bingMap.style.height = `${this._size}px`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let i = 0; i < this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME].length; i++) {
            this.bingMap.addConfig(new WT_BingMapConfigParser(this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME][i]).parse());
        }
        this.bingMap.setConfig(1);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        this.onViewSizeChanged(state);
        this._bingMap.setMode(EBingMode.PLANE);
        this._bingMap.setReference(EBingReference.SEA);
        this._bingMap.setVisible(true);
        this._bingMap.setBingId(state.model.bingMap.bingID);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _calculateDesiredRadius(state) {
        let viewCenter = state.projection.viewCenter;

        let delta = WT_GVector2.fromPolar(state.projection.viewHeight / 2, state.projection.rotation * Avionics.Utils.DEG2RAD);
        let viewTop = viewCenter.minus(delta);
        let viewBottom = viewCenter.plus(delta);

        let top = state.projection.invertXY(viewTop);
        let bottom = state.projection.invertXY(viewBottom);
        return state.projection.distance(top, bottom).scale(this.size / state.projection.viewHeight * 0.5);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateCenterAndRange(state) {
        let range = this._calculateDesiredRadius(state).asUnit(WT_Unit.METER);
        let target = state.projection.center;
        if (isNaN(range) || !target) {
            return;
        }

        let params = {
            lla: target,
            radius: range
        };
        this.bingMap.setParams(params);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateRotation(state) {
        this.bingMap.style.transform = `rotate(${state.projection.rotation}deg)`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateTerrainColors(state) {
        let mode = state.model.terrain.mode;

        if (state.model.airplane.isOnGround && mode === WT_MapModelTerrainModule.TerrainMode.RELATIVE) {
            mode = WT_MapModelTerrainModule.TerrainMode.OFF;
        }
        this.bingMap.setConfig(mode);
        if (mode === WT_MapModelTerrainModule.TerrainMode.RELATIVE) {
            this.bingMap.setReference(EBingReference.PLANE);
        } else {
            this.bingMap.setReference(EBingReference.SEA);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._updateCenterAndRange(state);
        this._updateRotation(state);
        this._updateTerrainColors(state);
    }
}
WT_MapViewBingLayer.CLASS_DEFAULT = "bingLayer";
WT_MapViewBingLayer.CONFIG_NAME_DEFAULT = "bingMap";
WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME = "bingConfigs";
WT_MapViewBingLayer.OVERDRAW_FACTOR = Math.sqrt(2);

class WT_BingMapConfigParser {
    constructor(config) {
        this.config = config;
    }

    parse() {
        let returnValue = new BingMapsConfig();

        returnValue.aspectRatio = 1;
        returnValue.resolution = WT_BingMapConfigParser.readPropertyFromConfig(this.config, WT_BingMapConfigParser.RESOLUTION_NAME, WT_BingMapConfigParser.RESOLUTION_DEFAULT);
        returnValue.clearColor = WT_BingMapConfigParser.hextoRGB(WT_BingMapConfigParser.readPropertyFromConfig(this.config, WT_BingMapConfigParser.SKY_COLOR_NAME, WT_BingMapConfigParser.SKY_COLOR_DEFAULT));

        let bingColors = [];

        let waterColor = WT_BingMapConfigParser.readPropertyFromConfig(this.config, WT_BingMapConfigParser.WATER_COLOR_NAME, WT_BingMapConfigParser.WATER_COLOR_DEFAULT);
        bingColors[0] = waterColor;

        let elevationColors = WT_BingMapConfigParser.readPropertyFromConfig(this.config, WT_BingMapConfigParser.ELEVATION_COLORS_NAME, WT_BingMapConfigParser.ELEVATION_COLORS_DEFAULT);
        let curve = new Avionics.Curve();
        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
        for (let i = 0; i < elevationColors.length; i++) {
            curve.add(elevationColors[i].alt, elevationColors[i].color);
        }
        for (let i = 0; i < 60; i++) {
            let color = curve.evaluate(i * 30000 / 60);
            bingColors[i + 1] = color;
        }
        returnValue.heightColors = bingColors.map(color => WT_BingMapConfigParser.hextoRGB(color));

        return returnValue;
    }

    static readPropertyFromConfig(config, name, defaultValue) {
        return config[name] ? config[name] : defaultValue;
    }

    static hextoRGB(hex) {
        let hexStringColor = hex;
        let offset = 0;
        if (hexStringColor[0] === "#") {
            offset = 1;
        }
        let r = parseInt(hexStringColor.substr(0 + offset, 2), 16);
        let g = parseInt(hexStringColor.substr(2 + offset, 2), 16);
        let b = parseInt(hexStringColor.substr(4 + offset, 2), 16);
        var rgb = 256 * 256 * b + 256 * g + r;
        return rgb;
    }
}
WT_BingMapConfigParser.RESOLUTION_NAME = "textureResolution";
WT_BingMapConfigParser.RESOLUTION_DEFAULT = 1024;
WT_BingMapConfigParser.SKY_COLOR_NAME = "skyColor";
WT_BingMapConfigParser.SKY_COLOR_DEFAULT = "#000000";
WT_BingMapConfigParser.WATER_COLOR_NAME = "waterColor";
WT_BingMapConfigParser.WATER_COLOR_DEFAULT = "#0000ff";
WT_BingMapConfigParser.ELEVATION_COLORS_NAME = "elevationColors";
WT_BingMapConfigParser.ELEVATION_COLORS_DEFAULT = [{alt: 0, color: "#000000"}, {alt: 30000, color: "#000000"}];