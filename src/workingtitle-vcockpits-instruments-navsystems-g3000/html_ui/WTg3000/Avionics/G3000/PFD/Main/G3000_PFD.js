class WT_G3000_PFD extends WT_G3x5_PFD {
    get templateID() { return "AS3000_PFD"; }

    _createMainPage() {
        return new WT_G3000_PFDMainPage(this);
    }

    _createInsetMap() {
        return new WT_G3000_PFDInsetMap("PFD");
    }

    _createTrafficInsetMap() {
        return new WT_G3000_PFDTrafficInsetMapContainer("PFD");
    }

    _createApproachNavLoader() {
        return new WT_G3000_ApproachNavLoader(this.airplane);
    }

    _initSoftkeyContainer() {
        this.addIndependentElementContainer(new NavSystemElementContainer("SoftKeys", "SoftKeys", new SoftKeys(WT_G3000_PFDSoftKey)));
    }

    _initComponents() {
        super._initComponents();

        this._initSoftkeyContainer();
    }

    /**
     *
     * @returns {WT_G3000_TrafficAdvisorySystem}
     */
    _createTrafficSystem() {
        return new WT_G3000_TrafficAdvisorySystem(this.airplane, this._trafficTracker);
    }
}

class WT_G3000_PFDInsetMap extends WT_G3x5_PFDInsetMap {
    _createNavMap() {
        return new WT_G3000_NavMap(this.instrumentID, this.instrument.airplane, this.instrument.referenceAirspeedSensor.index, this.instrument.referenceAltimeter.index, this.instrument.icaoWaypointFactory, this.instrument.icaoSearchers, this.instrument.flightPlanManagerWT, this.instrument.unitsSettingModel, this.instrument.citySearcher, new WT_MapViewBorderData(), null, null, this.instrument.trafficSystem, WT_G3x5_PFDInsetMap.LAYER_OPTIONS);
    }
}

class WT_G3000_PFDTrafficInsetMapContainer extends WT_G3x5_PFDTrafficInsetMapContainer {
    _createTrafficMap() {
        return new WT_G3000_PFDTrafficInsetMap(this.instrument.airplane, this.instrument.trafficSystem, this.instrument.unitsSettingModel);
    }
}

class WT_G3000_PFDSoftKeyElement extends SoftKeyElement {
    constructor(_name = "", _callback = null, _statusCB = null, _valueCB = null, _stateCB = null) {
        super(_name, _callback, _stateCB);
        this.statusBarCallback = _statusCB;
        this.valueCallback = _valueCB;
    }
}

class WT_G3000_PFDSoftKey {
    /**
     * @param {HTMLElement} container
     */
    constructor(container) {
        this._container = container;

        this._defineChildren();
    }

    _defineChildren() {
        this._containerCached = new WT_CachedElement(this._container);
        this._title = new WT_CachedElement(this._container.querySelector(`.Title`));
        this._value = new WT_CachedElement(this._container.querySelector(`.Value`));
        this._statusBar = new WT_CachedElement(this._container.querySelector(`.Status`));
    }

    _updateTitle(element) {
        this._title.innerHTML = element.name;
    }

    _updateState(element) {
        if (element.stateCallback) {
            element.state = element.stateCallback();
        } else if (!element.callback) {
            element.state = "Greyed";
        }

        if (element.state) {
            this._title.setAttribute("state", element.state);
        }
    }

    _showStatusBar(value) {
        this._containerCached.setAttribute("show-statusbar", `${value}`);
    }

    _setStatusBarToggle(value) {
        this._statusBar.setAttribute("toggle", value ? "on" : "off");
    }

    _updateStatusBar(element) {
        if (element.statusBarCallback == null) {
            this._showStatusBar(false);
        } else {
            this._setStatusBarToggle(element.statusBarCallback());
            this._showStatusBar(true);
        }
    }

    _showValue(value) {
        this._containerCached.setAttribute("show-value", `${value}`);
    }

    _setValueDisplay(text) {
        this._value.innerHTML = text;
    }

    _updateValue(element) {
        if (element.valueCallback == null) {
            this._showValue(false);
        } else {
            this._setValueDisplay(element.valueCallback());
            this._showValue(true);
        }
    }

    fillFromElement(element) {
        this._updateTitle(element);
        this._updateState(element);
        this._updateStatusBar(element);
        this._updateValue(element);
    }
}

class WT_G3000_PFDMainPage extends WT_G3x5_PFDMainPage {
    _createAutopilotDisplay() {
        return new WT_G3000_PFDAutopilotDisplay();
    }

    _createAirspeedIndicator() {
        return new WT_G3000_PFDAirspeedIndicator();
    }

    _createAltimeter() {
        return new WT_G3000_PFDAltimeter();
    }

    _createAoAIndicator() {
        return new WT_G3000_PFDAoAIndicator();
    }

    _createTrafficAlert() {
        return new WT_G3000_PFDTrafficAlert();
    }

    _createBottomInfo() {
        return new WT_G3000_PFDBottomInfo();
    }

    _createElements() {
        let elements = super._createElements();
        elements.push(this._windData = new WT_G3000_PFDWindData());
        elements.push(new WT_G3000_PFDNavStatusBox());
        elements.push(new WT_G3000_PFDNavDMEInfo());
        return elements;
    }

    _initSoftkeys() {
        this._rootMenu = new SoftKeysMenu();
        this._pfdMenu = new SoftKeysMenu();
        this._pfdMapMenu = new SoftKeysMenu();
        this._pfdMapLayoutMenu = new SoftKeysMenu();
        this._attitudeMenu = new SoftKeysMenu();
        this._otherPfdMenu = new SoftKeysMenu();
        this._windMenu = new SoftKeysMenu();
        this._altUnitsMenu = new SoftKeysMenu();

        this._hsi = this.gps.getChildById("Compass");

        this._rootMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Map Range&nbsp−", this._changeMapRange.bind(this, -1), null, null, this._getMapRangeSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Map Range&nbsp+", this._changeMapRange.bind(this, 1), null, null, this._getMapRangeSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement("PFD Map Settings", this._switchSoftkeyMenu.bind(this, this._pfdMapMenu)),
            new WT_G3000_PFDSoftKeyElement("Traffic Map", this._toggleTrafficInsetMap.bind(this), this._trafficInsetMapEnabledCompare.bind(this, true)),
            new WT_G3000_PFDSoftKeyElement("PFD Settings", this._switchSoftkeyMenu.bind(this, this._pfdMenu)),
            new WT_G3000_PFDSoftKeyElement("OBS"),
            new WT_G3000_PFDSoftKeyElement("Active&nbsp;NAV", this.gps.computeEvent.bind(this.gps, "SoftKey_CDI"), null, this._getNavSourceValue.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Sensors"),
            new WT_G3000_PFDSoftKeyElement("WX Radar Controls"),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._pfdMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Attitude Overlays", this._switchSoftkeyMenu.bind(this, this._attitudeMenu)),
            new WT_G3000_PFDSoftKeyElement("PFD Mode", null, null, this._constElement.bind(this, "FULL")),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Bearing 1", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG1"), null, this._getBearing1Value.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Bearing 2", this.gps.computeEvent.bind(this.gps, "SoftKeys_PFD_BRG2"), null, this._getBearing2Value.bind(this)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Other PFD Settings", this._switchSoftkeyMenu.bind(this, this._otherPfdMenu)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._rootMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._pfdMapMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Map Layout", this._switchSoftkeyMenu.bind(this, this._pfdMapLayoutMenu)),
            new WT_G3000_PFDSoftKeyElement("Detail", this._toggleDCLTR.bind(this), null, this._getDCLTRValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Weather Legend"),
            new WT_G3000_PFDSoftKeyElement("Traffic", this._toggleInsetMapTraffic.bind(this), this._insetMapTrafficCompare.bind(this, true), null, this._getInsetMapSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Storm-scope"),
            new WT_G3000_PFDSoftKeyElement("Terrain", this._toggleTerrain.bind(this), null, this._getTerrainValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Data Link Settings"),
            new WT_G3000_PFDSoftKeyElement("WX&nbsp;Overlay", this._toggleWX.bind(this), null, this._getWXOverlayValue.bind(this), this._getInsetMapSoftkeyState.bind(this)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("METAR"),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._rootMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._pfdMapLayoutMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Map Off", this._deactivateInsetMap.bind(this), this._insetMapEnabledCompare.bind(this, false)),
            new WT_G3000_PFDSoftKeyElement("Inset Map", this._activateNavInsetMap.bind(this), this._navInsetMapEnabledCompare.bind(this, true)),
            new WT_G3000_PFDSoftKeyElement("HSI Map", null, this._constElement.bind(this, false)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Inset Traffic", this._activateTrafficInsetMap.bind(this), this._trafficInsetMapEnabledCompare.bind(this, true)),
            new WT_G3000_PFDSoftKeyElement("HSI Traffic"),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._pfdMapMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._attitudeMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Pathways"),
            new WT_G3000_PFDSoftKeyElement("Synthetic Terrain", this._toggleSyntheticVision.bind(this), this._softkeySyntheticVisionCompare.bind(this, true)),
            new WT_G3000_PFDSoftKeyElement("Horizon Heading"),
            new WT_G3000_PFDSoftKeyElement("Airport Signs"),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._pfdMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._otherPfdMenu.elements = [
            new WT_G3000_PFDSoftKeyElement("Wind", this._switchSoftkeyMenu.bind(this, this._windMenu)),
            new WT_G3000_PFDSoftKeyElement("AOA", this._cycleAoAMode.bind(this), null, this._softkeyAoAStatus.bind(this)),
            new WT_G3000_PFDSoftKeyElement("Altitude Units", this._switchSoftkeyMenu.bind(this, this._altUnitsMenu)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("COM1 121.5", null, this._constElement.bind(this, false)),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._rootMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._windMenu.elements = [
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Option 1", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_1), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_1)),
            new WT_G3000_PFDSoftKeyElement("Option 2", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_2), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_2)),
            new WT_G3000_PFDSoftKeyElement("Option 3", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_3), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OPTION_3)),
            new WT_G3000_PFDSoftKeyElement("Off", this._setWindMode.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OFF), this._softkeyWindModeCompare.bind(this, WT_G3x5_PFDWindModeSetting.Mode.OFF)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._otherPfdMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this._altUnitsMenu.elements = [
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("METERS", this._toggleAltimeterMetersOverlay.bind(this), this._softkeyAltimeterMetersCompare.bind(this)),
            new WT_G3000_PFDSoftKeyElement("IN", this._setBaroUnit.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG), this._softkeyBaroUnitCompare.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.IN_HG)),
            new WT_G3000_PFDSoftKeyElement("HPA", this._setBaroUnit.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.HPA), this._softkeyBaroUnitCompare.bind(this, WT_G3x5_PFDBaroUnitsSetting.Mode.HPA)),
            new WT_G3000_PFDSoftKeyElement(""),
            new WT_G3000_PFDSoftKeyElement("Back", this._switchSoftkeyMenu.bind(this, this._otherPfdMenu)),
            new WT_G3000_PFDSoftKeyElement("")
        ];
        this.softKeys = this._rootMenu;
    }

    init() {
        super.init();

        this._initSoftkeys();
    }

    _switchSoftkeyMenu(menu) {
        this.softKeys = menu;
    }

    _constElement(elem) {
        return elem;
    }

    // PFD inset map softkeys should be greyed out if the map is not shown.
    _getInsetMapSoftkeyState() {
        return this.instrument.navInsetMap.isEnabled ? "None" : "Greyed";
    }

    _getMapRangeSoftkeyState() {
        return (this.instrument.navInsetMap.isEnabled || this.instrument.trafficInsetMap.isEnabled) ? "None" : "Greyed";
    }

    _changeMapRange(delta) {
        let setting = this.instrument.navInsetMap.isEnabled ? this.instrument.navInsetMap.navMap.rangeSetting : this.instrument.trafficInsetMap.trafficMap.rangeSetting;
        setting.changeRange(delta);
    }

    _activateNavInsetMap() {
        this.instrument.navInsetMap.showSetting.setValue(true);
    }

    _deactivateInsetMap() {
        this.instrument.navInsetMap.showSetting.setValue(false);
        this.instrument.trafficInsetMap.showSetting.setValue(false);
    }

    _insetMapEnabledCompare(value) {
        return (this.instrument.navInsetMap.isEnabled || this.instrument.trafficInsetMap.isEnabled) === value;
    }

    _navInsetMapEnabledCompare(value) {
        return this.instrument.navInsetMap.isEnabled === value;
    }

    _activateTrafficInsetMap() {
        this.instrument.trafficInsetMap.showSetting.setValue(true);
    }

    _toggleTrafficInsetMap() {
        let setting = this.instrument.trafficInsetMap.showSetting;
        setting.setValue(!setting.getValue());
    }

    _trafficInsetMapEnabledCompare(value) {
        return this.instrument.trafficInsetMap.isEnabled === value;
    }

    _toggleDCLTR() {
        let currentValue = this.instrument.navInsetMap.navMap.dcltrSetting.getValue();
        let newValue = (currentValue + 1) % WT_G3x5_NavMap.DCLTR_DISPLAY_TEXTS.length;
        this.instrument.navInsetMap.navMap.dcltrSetting.setValue(newValue);
    }

    _getDCLTRValue() {
        return WT_G3x5_NavMap.DCLTR_DISPLAY_TEXTS[this.instrument.navInsetMap.navMap.dcltrSetting.getValue()];
    }

    _toggleTerrain() {
        let currentValue = this.instrument.navInsetMap.navMap.terrainSetting.getValue();
        let newValue = (currentValue + 1) % WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT.length;
        this.instrument.navInsetMap.navMap.terrainSetting.setValue(newValue);
    }

    _getTerrainValue() {
        return WT_G3x5_NavMap.TERRAIN_MODE_DISPLAY_TEXT[this.instrument.navInsetMap.navMap.terrainSetting.getValue()];
    }

    _toggleInsetMapTraffic() {
        let setting = this.instrument.navInsetMap.navMap.trafficShowSetting;
        setting.setValue(!setting.getValue());
    }

    _insetMapTrafficCompare(value) {
        return this.instrument.navInsetMap.navMap.trafficShowSetting.getValue() === value;
    }

    _toggleWX() {
        this.instrument.navInsetMap.navMap.nexradShowSetting.setValue(!this.instrument.navInsetMap.navMap.nexradShowSetting.getValue());
    }

    _getWXOverlayValue() {
        return this.instrument.navInsetMap.navMap.nexradShowSetting.getValue() ? "NEXRAD" : "OFF";
    }

    _toggleSyntheticVision() {
        this._attitude.svtShowSetting.setValue(!this._attitude.svtShowSetting.getValue());
    }

    _softkeySyntheticVisionCompare(_val) {
        return this._attitude.syntheticVisionEnabled == _val;
    }

    _getBearing1Value() {
        if (this._hsi && this._hsi.getAttribute("show_bearing1") == "true") {
            return this._hsi.getAttribute("bearing1_source");
        }
        else {
            return "OFF";
        }
    }

    _getBearing2Value() {
        if (this._hsi && this._hsi.getAttribute("show_bearing2") == "true") {
            return this._hsi.getAttribute("bearing2_source");
        }
        else {
            return "OFF";
        }
    }

    _getNavSourceValue() {
        return this._hsi.getAttribute("nav_source");
    }

    _setWindMode(mode) {
        this._windData.windModeSetting.setValue(mode);
    }

    _softkeyWindModeCompare(value) {
        return this._windData.windModeSetting.getValue() === value;
    }

    _cycleAoAMode() {
        let value = this._aoaIndicator.aoaModeSetting.getValue();
        value = (value + 1) % WT_G3000_PFDMainPage.AOA_MODE_TEXT.length;
        this._aoaIndicator.aoaModeSetting.setValue(value);
    }

    _softkeyAoAStatus() {
        return WT_G3000_PFDMainPage.AOA_MODE_TEXT[this._aoaIndicator.aoaModeSetting.getValue()];
    }

    _toggleAltimeterMetersOverlay() {
        this._altimeter.metersSetting.setValue(!this._altimeter.metersSetting.getValue());
    }

    _softkeyAltimeterMetersCompare() {
        return this._altimeter.metersSetting.getValue();
    }

    _setBaroUnit(value) {
        this._altimeter.baroUnitsSetting.setValue(value);
    }

    _softkeyBaroUnitCompare(value) {
        return this._altimeter.baroUnitsSetting.getValue() === value;
    }
}
WT_G3000_PFDMainPage.AOA_MODE_TEXT = [
    "OFF",
    "ON",
    "AUTO"
];

registerInstrument("as3000-pfd-element", WT_G3000_PFD);