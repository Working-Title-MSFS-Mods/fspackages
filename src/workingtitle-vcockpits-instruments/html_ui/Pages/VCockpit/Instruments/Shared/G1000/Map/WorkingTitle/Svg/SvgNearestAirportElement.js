class SvgNearestAirportElement extends SvgWaypointElement {
    get airportClass() {
        if (this._airportClass) {
            return this._airportClass;
        }
        if (this.source) {
            return this.source.airportClass;
        }
    }

    set airportClass(v) {
        this._airportClass = v;
    }

    id(map) {
        return "nrst-airport-" + this.ident + "-map-" + map.index;
    }

    class() {
        return "map-nrst-airport";
    }

    constructor(source) {
        super(source);
        this.sortIndex = 3;
    }

    imageFileName() {
        if (this.source && this.source.imageFileName) {
            return this.source.imageFileName();
        }
        let fName = "";
        if (this.airportClass == 2 || this.airportClass == 3) {
            fName = "ICON_MAP_AIRPORT8.svg";
        }
        else if (this.airportClass == 1) {
            fName = "ICON_MAP_AIRPORT_NON_TOWERED_NON_SERVICED_PINK.svg";
        }
        else if (this.airportClass == 4) {
            fName = "ICON_MAP_AIRPORT_HELIPORT_PINK.svg";
        }
        else if (this.airportClass == 5) {
            fName = "ICON_MAP_AIRPORT_PRIVATE_PINK.svg";
        }
        else {
            fName = "ICON_MAP_AIRPORT8.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }

    getIconSize(map) {
        if (this.source && this.source.getClassSize) {
            if (this.source.airportClass >= 2 && map.config.waypointAirportClass2IconSize) {
                return map.config.waypointAirportClass2IconSize;
            } else {
                return map.config.waypointIconSize;
            }
        }

        return super.getIconSize(map);
    }

    getLabelFontSize(map) {
        if (this.source && this.source.getClassSize) {
            if (this.source.getClassSize() == AirportSize.Large && map.config.waypointAirportLargeLabelFontSize) {
                return map.config.waypointAirportLargeLabelFontSize;
            } else {
                return map.config.waypointLabelFontSize;
            }
        }

        return super.getLabelFontSize(map);
    }

    getLabelPriority() {
        return 0 + this.airportClass;
    }
}
//# sourceMappingURL=SvgNearestAirportElement.js.map