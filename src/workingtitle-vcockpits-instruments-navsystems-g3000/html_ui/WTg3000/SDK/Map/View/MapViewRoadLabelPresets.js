class WT_MapViewGenericInternationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewGenericInternationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewGenericInternationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_INTERNATIONAL_HIGHWAY.png";
WT_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

class WT_MapViewGenericNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewGenericNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewGenericNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewGenericNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_NATIONAL_HIGHWAY.png";
WT_MapViewGenericNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewGenericLocalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewGenericLocalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewGenericLocalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewGenericLocalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_LOCAL_HIGHWAY.png";
WT_MapViewGenericLocalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewUSRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewUSRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewUSRouteCollection.RouteType.INTERSTATE:
                        return new WT_MapViewUSInterstateLabel(roadType, location, name);
                    case WT_MapViewUSRouteCollection.RouteType.US_ROUTE:
                        return new WT_MapViewUSRouteLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewUSRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/US_interstate_usroute_labels.json";
/**
 * @enum {String}
 */
WT_MapViewUSRouteCollection.RouteType = {
    INTERSTATE: "us_interstate",
    US_ROUTE: "us_route"
};

class WT_MapViewUSInterstateLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewUSInterstateLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewUSInterstateLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewUSInterstateLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_US_INTERSTATE.png";
WT_MapViewUSInterstateLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

class WT_MapViewUSRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewUSRouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewUSRouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewUSRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_US_ROUTE.png";
WT_MapViewUSRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewCanadaRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewCanadaRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewCanadaRouteCollection.RouteType.TRANS_CANADA:
                        return new WT_MapViewGenericInternationalHighwayLabel(roadType, location, name);
                    case WT_MapViewCanadaRouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewGenericNationalHighwayLabel(roadType, location, name);
                    case WT_MapViewCanadaRouteCollection.RouteType.PROVINCIAL_HIGHWAY:
                        return new WT_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewCanadaRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/canada_labels.json";
/**
 * @enum {String}
 */
WT_MapViewCanadaRouteCollection.RouteType = {
    TRANS_CANADA: "trans_canada",
    NATIONAL_HIGHWAY: "nat_highway",
    PROVINCIAL_HIGHWAY: "prov_highway"
};