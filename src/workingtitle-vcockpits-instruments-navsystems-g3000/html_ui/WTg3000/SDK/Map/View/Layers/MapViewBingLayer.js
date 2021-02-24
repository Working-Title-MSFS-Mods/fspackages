/**
 * Bing map terrain texture and NEXRAD weather overlay. The use of this layer requires the .terrain and .weatherDisplay modules
 * to be added to the map model.
 */
class WT_MapViewBingLayer extends WT_MapViewLayer {
    /**
     * @param {String} bingMapID - the ID of the underlying bing map instance to which to bind the new layer. Note that a maximum
     *                             of four unique IDs can be bound. Attempting to bind more than four will result in a game freeze/
     *                             crash.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(bingMapID, className = WT_MapViewBingLayer.CLASS_DEFAULT, configName = WT_MapViewBingLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._bingMapID = bingMapID;

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempVector3 = new WT_GVector2(0, 0);
        this._radiusTemp = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
    }

    _createHTMLElement() {
        this._bingMap = new WT_BingMapElement();
        this._bingMap.style.position = "absolute";
        this._bingMap.style.overflow = "hidden";

        return this._bingMap;
    }

    /**
     * Puts this bing layer to sleep, allowing other code to use the bing map instance to which
     * this layer is bound.
     */
    sleep() {
        this._bingMap.setConfig(0);
        this._bingMap.setReference(EBingReference.SEA);
        this._bingMap.showWeather(EWeatherRadar.OFF, 0);
        this._bingMap.showIsolines(false);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        let long = Math.max(state.projection.viewWidth, state.projection.viewHeight);
        this._size = long * WT_MapViewBingLayer.OVERDRAW_FACTOR;
        let offsetX = (state.projection.viewWidth - this._size) / 2;
        let offsetY = (state.projection.viewHeight - this._size) / 2;

        this._bingMap.style.left = `${offsetX}px`;
        this._bingMap.style.top = `${offsetY}px`;
        this._bingMap.style.width = `${this._size}px`;
        this._bingMap.style.height = `${this._size}px`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let i = 0; i < this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME].length; i++) {
            this._bingMap.addConfig(new WT_BingMapConfigParser(this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME][i]).parse());
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        this.onProjectionViewChanged(state);
        this._bingMap.setBingId(this._bingMapID);
        this._bingMap.setMode(EBingMode.PLANE);
        this._bingMap.setReference(EBingReference.SEA);
        this._bingMap.setVisible(true);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _calculateDesiredRadius(state) {
        let viewCenter = state.projection.viewCenter;

        let delta = this._tempVector1.setFromPolar(state.projection.viewHeight / 2, state.projection.rotation * Avionics.Utils.DEG2RAD);
        let viewTop = this._tempVector2.set(viewCenter).subtract(delta);
        let viewBottom = this._tempVector3.set(viewCenter).add(delta);

        return state.projection.distance(viewTop, viewBottom, this._radiusTemp).scale(this._size / state.projection.viewHeight * 0.5, true);
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
            lla: new LatLong(target.lat, target.long),
            radius: range
        };
        this._bingMap.setParams(params);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateRotation(state) {
        this._bingMap.style.transform = `rotate(${state.projection.rotation}deg)`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateTerrainColors(state) {
        let mode = state.model.terrain.mode;

        if (state.model.airplane.isOnGround() && mode === WT_MapModelTerrainModule.TerrainMode.RELATIVE) {
            mode = WT_MapModelTerrainModule.TerrainMode.OFF;
        }
        this._bingMap.setConfig(mode);
        if (mode === WT_MapModelTerrainModule.TerrainMode.RELATIVE) {
            this._bingMap.setReference(EBingReference.PLANE);
        } else {
            this._bingMap.setReference(EBingReference.SEA);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateIsolines(state) {
        this._bingMap.showIsolines(state.model.terrain.showIsolines);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateNEXRAD(state) {
        let show = state.model.weatherDisplay.nexradShow && state.model.range.compare(state.model.weatherDisplay.nexradRange) <= 0;
        if (show && this._bingMap.getWeather() != EWeatherRadar.TOPVIEW) {
            this._bingMap.showWeather(EWeatherRadar.TOPVIEW, 0);
        } else if (!show && this._bingMap.getWeather() == EWeatherRadar.TOPVIEW) {
            this._bingMap.showWeather(EWeatherRadar.OFF, 0);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._updateCenterAndRange(state);
        this._updateRotation(state);
        this._updateTerrainColors(state);
        this._updateIsolines(state);
        this._updateNEXRAD(state);
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