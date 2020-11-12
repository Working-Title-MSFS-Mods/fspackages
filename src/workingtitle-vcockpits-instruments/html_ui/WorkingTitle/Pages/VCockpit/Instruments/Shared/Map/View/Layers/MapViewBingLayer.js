class WT_MapViewBingLayer extends WT_MapViewLayer {
    constructor(id = WT_MapViewBingLayer.ID_DEFAULT, configName = WT_MapViewBingLayer.CONFIG_NAME_DEFAULT) {
        super(id, configName);

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

        return this._bingMap;
    }

    onViewSizeChanged(data) {
        let long = Math.max(data.projection.viewWidth, data.projection.viewHeight);
        this._size = long * WT_MapViewBingLayer.OVERDRAW_FACTOR;
        let offsetX = (data.projection.viewWidth - this._size) / 2;
        let offsetY = (data.projection.viewHeight - this._size) / 2;

        this.bingMap.style.left = `${offsetX}px`;
        this.bingMap.style.top = `${offsetY}px`;
        this.bingMap.style.width = `${this._size}px`;
        this.bingMap.style.height = `${this._size}px`;
    }

    onConfigLoaded(data) {
        for (let i = 0; i < this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME].length; i++) {
            this.bingMap.addConfig(new WT_BingMapConfig(this.config[WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME][i]).parse());
        }
        this.bingMap.setConfig(1);
    }

    onAttached(data) {
        this.onViewSizeChanged(data);
        this._bingMap.setMode(EBingMode.PLANE);
        this._bingMap.setReference(EBingReference.SEA);
        this._bingMap.setVisible(true);
        this._bingMap.setBingId(data.model.bingMap.bingID);
    }

    onUpdate(data) {
        this._updateCenterAndRange(data);
        this._updateRotation(data);
    }

    _updateCenterAndRange(data) {
        let range = data.projection.range.asUnit(WT_Unit.METER) * (this.size / data.projection.viewHeight) * 0.5;
        let target = data.projection.center;
        if (isNaN(range) || !target) {
            return;
        }

        let params = {
            lla: target,
            radius: range
        };
        this.bingMap.setParams(params);
    }

    _updateRotation(data) {
        this.bingMap.style.transform = `rotate(${data.projection.rotation}deg)`;
    }
}
WT_MapViewBingLayer.ID_DEFAULT = "BingLayer";
WT_MapViewBingLayer.CONFIG_NAME_DEFAULT = "bingMap";
WT_MapViewBingLayer.CONFIG_BING_CONFIGS_NAME = "bingConfigs";
WT_MapViewBingLayer.OVERDRAW_FACTOR = Math.sqrt(2);

class WT_BingMapConfig {
    constructor(config) {
        this.config = config;
    }

    parse() {
        let returnValue = new BingMapsConfig();

        returnValue.aspectRatio = 1;
        returnValue.resolution = WT_BingMapConfig.readPropertyFromConfig(this.config, WT_BingMapConfig.RESOLUTION_NAME, WT_BingMapConfig.RESOLUTION_DEFAULT);
        returnValue.clearColor = WT_BingMapConfig.hextoRGB(WT_BingMapConfig.readPropertyFromConfig(this.config, WT_BingMapConfig.SKY_COLOR_NAME, WT_BingMapConfig.SKY_COLOR_DEFAULT));

        let bingColors = [];

        let waterColor = WT_BingMapConfig.readPropertyFromConfig(this.config, WT_BingMapConfig.WATER_COLOR_NAME, WT_BingMapConfig.WATER_COLOR_DEFAULT);
        bingColors[0] = waterColor;

        let elevationColors = WT_BingMapConfig.readPropertyFromConfig(this.config, WT_BingMapConfig.ELEVATION_COLORS_NAME, WT_BingMapConfig.ELEVATION_COLORS_DEFAULT);
        let curve = new Avionics.Curve();
        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;
        for (let i = 0; i < elevationColors.length; i++) {
            curve.add(elevationColors[i].alt, elevationColors[i].color);
        }
        for (let i = 0; i < 60; i++) {
            let color = curve.evaluate(i * 30000 / 60);
            bingColors[i + 1] = color;
        }
        returnValue.heightColors = bingColors.map(color => WT_BingMapConfig.hextoRGB(color));

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
WT_BingMapConfig.RESOLUTION_NAME = "textureResolution";
WT_BingMapConfig.RESOLUTION_DEFAULT = 1024;
WT_BingMapConfig.SKY_COLOR_NAME = "skyColor";
WT_BingMapConfig.SKY_COLOR_DEFAULT = "#ffffff";
WT_BingMapConfig.WATER_COLOR_NAME = "waterColor";
WT_BingMapConfig.WATER_COLOR_DEFAULT = "#0000ff";
WT_BingMapConfig.ELEVATION_COLORS_NAME = "elevationColors";
WT_BingMapConfig.ELEVATION_COLORS_DEFAULT = [{alt: 0, color: "#000000"}, {alt: 30000, color: "#000000"}];