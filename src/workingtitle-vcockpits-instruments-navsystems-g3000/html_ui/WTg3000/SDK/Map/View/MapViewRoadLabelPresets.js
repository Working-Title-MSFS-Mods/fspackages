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

class WT_MapViewIcelandRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewIcelandRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_MapViewIcelandRouteLabel(roadType, location, name);
            }
        });
    }
}
WT_MapViewIcelandRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/iceland_labels.json";
/**
 * @enum {String}
 */
WT_MapViewIcelandRouteCollection.RouteType = {
    NATIONAL_ROAD: "nat_road",
};

class WT_MapViewIcelandRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewIcelandRouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewIcelandRouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewIcelandRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_ICELAND_ROUTE.png";
WT_MapViewIcelandRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewUKIrelandRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewUKIrelandRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewUKIrelandRouteCollection.RouteType.MOTORWAY:
                        return new WT_MapViewUKMotorwayLabel(roadType, location, name);
                    case WT_MapViewUKIrelandRouteCollection.RouteType.A_ROAD:
                    case WT_MapViewUKIrelandRouteCollection.RouteType.N_ROAD:
                        return new WT_MapViewUKARoadLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewUKIrelandRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/UK_ireland_labels.json";
/**
 * @enum {String}
 */
WT_MapViewUKIrelandRouteCollection.RouteType = {
    MOTORWAY: "motorway",
    A_ROAD: "a_road",
    N_ROAD: "n_road"
};

class WT_MapViewUKMotorwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewUKMotorwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewUKMotorwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewUKMotorwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_UK_MOTORWAY.png";
WT_MapViewUKMotorwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

class WT_MapViewUKARoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewUKARoadLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewUKARoadLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewUKARoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_UK_AROAD.png";
WT_MapViewUKARoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffd200",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

class WT_MapViewAURouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewAURouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewAURouteCollection.RouteType.ALPHANUMERIC:
                        return new WT_MapViewAUAlphaNumLabel(roadType, location, name);
                    case WT_MapViewAURouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewAUNationalHighwayLabel(roadType, location, name);
                    case WT_MapViewAURouteCollection.RouteType.NATIONAL_ROUTE:
                        return new WT_MapViewAUNationalRouteLabel(roadType, location, name);
                    case WT_MapViewAURouteCollection.RouteType.STATE_ROUTE:
                        return new WT_MapViewAUStateRouteLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewAURouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/AU_labels.json";
/**
 * @enum {String}
 */
WT_MapViewAURouteCollection.RouteType = {
    ALPHANUMERIC: "alphanum_route",
    NATIONAL_HIGHWAY: "nat_highway",
    NATIONAL_ROUTE: "nat_route",
    STATE_ROUTE: "state_route"
};

class WT_MapViewAUAlphaNumLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewAUAlphaNumLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewAUAlphaNumLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewAUAlphaNumLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_AU_ALPHANUMROUTE.png";
WT_MapViewAUAlphaNumLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffa709",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

class WT_MapViewAUNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewAUNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewAUNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewAUNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_AU_NATIONALHIGHWAY.png";
WT_MapViewAUNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffa709",
    fontOutlineWidth: 0
};

class WT_MapViewAUNationalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewAUNationalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewAUNationalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewAUNationalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_AU_NATIONALROUTE.png";
WT_MapViewAUNationalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewAUStateRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewAUStateRouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewAUStateRouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewAUStateRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_AU_STATEROUTE.png";
WT_MapViewAUStateRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};