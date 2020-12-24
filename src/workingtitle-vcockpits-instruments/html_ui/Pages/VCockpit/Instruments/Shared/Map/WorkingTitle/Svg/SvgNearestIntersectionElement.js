class SvgNearestIntersectionElement extends SvgWaypointElement {
    id(map) {
        return "nrst-intersection-" + this.icaoNoSpace + "-map-" + map.index;
    }

    class() {
        return "map-nrst-intersection";
    }

    imageFileName() {
        let fName = "";
        if (this.source) {
            fName = this.source.imageFileName();
        }
        if (!fName) {
            fName = "ICON_MAP_INTERSECTION.svg";
        }
        if (BaseInstrument.useSvgImages) {
            return fName;
        }
        return fName.replace(".svg", ".png");
    }

    getIconSize(map) {
        if (map.config.waypointINTIconSize) {
            return map.config.waypointINTIconSize;
        } else {
            return map.config.waypointIconSize;
        }
    }

    getLabelPriority() {
        return 30;
    }
}
//# sourceMappingURL=SvgNearestIntersectionElement.js.map