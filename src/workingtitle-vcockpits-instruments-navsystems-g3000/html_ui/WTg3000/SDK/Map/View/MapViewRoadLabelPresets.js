// GENERIC LABELS

class WT_MapViewGenericInternationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewGenericInternationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewGenericInternationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_INTERNATIONAL_HIGHWAY.png";
WT_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0,
    backgroundSize: 45
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

// INTERNATIONAL LABELS

class WT_MapViewERoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewERoadLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewERoadLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewERoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_EROAD.png";
WT_MapViewERoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

// UNITED STATES

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

// CANADA

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

// MEXICO

class WT_MapViewMexicoRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewMexicoRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_MapViewMexicoFederalHighwayLabel(roadType, location, name);
            }
        });
    }
}
WT_MapViewMexicoRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/mexico_labels.json";
/**
 * @enum {String}
 */
WT_MapViewMexicoRouteCollection.RouteType = {
    FEDERAL_HIGHWAY: "fed_highway",
};

class WT_MapViewMexicoFederalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewMexicoFederalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewMexicoFederalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewMexicoFederalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_MEXICO_FEDERALHIGHWAY.png";
WT_MapViewMexicoFederalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

// ICELAND

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

// UK AND IRELAND

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

// FRANCE

class WT_MapViewFranceRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewFranceRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewFranceRouteCollection.RouteType.E_ROAD:
                        return new WT_MapViewERoadLabel(roadType, location, name);
                    case WT_MapViewFranceRouteCollection.RouteType.AUTOROUTE:
                    case WT_MapViewFranceRouteCollection.RouteType.NATIONAL_ROUTE:
                        return new WT_MapViewFranceAutorouteLabel(roadType, location, name);
                    case WT_MapViewFranceRouteCollection.RouteType.DEPARTMENTAL_ROUTE:
                        return new WT_MapViewFranceDepartmentalRouteLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewFranceRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/france_labels.json";
/**
 * @enum {String}
 */
WT_MapViewFranceRouteCollection.RouteType = {
    E_ROAD: "e-road",
    AUTOROUTE: "autoroute",
    NATIONAL_ROUTE: "nat_route",
    DEPARTMENTAL_ROUTE: "departmental_route"
};

class WT_MapViewFranceAutorouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewFranceAutorouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewFranceAutorouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewFranceAutorouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_FRANCE_AUTOROUTE.png";
WT_MapViewFranceAutorouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

class WT_MapViewFranceDepartmentalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewFranceDepartmentalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewFranceDepartmentalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewFranceDepartmentalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_FRANCE_DEPARTMENTALROUTE.png";
WT_MapViewFranceDepartmentalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

// RUSSIA

class WT_MapViewRussiaRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewRussiaRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_MapViewRussiaFederalHighwayLabel(roadType, location, name);
            }
        });
    }
}
WT_MapViewRussiaRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/RU_labels.json";
/**
 * @enum {String}
 */
WT_MapViewRussiaRouteCollection.RouteType = {
    FEDERAL_HIGHWAY: "fed_highway",
};

class WT_MapViewRussiaFederalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewRussiaFederalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewRussiaFederalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewRussiaFederalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_RU_FEDERALHIGHWAY.png";
WT_MapViewRussiaFederalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

// CHINA

class WT_MapViewChinaRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewChinaRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewChinaRouteCollection.RouteType.NATIONAL_EXPRESSWAY:
                        return new WT_MapViewChinaNationalExpresswayLabel(roadType, location, name);
                    case WT_MapViewChinaRouteCollection.RouteType.PROVINCIAL_EXPRESSWAY:
                        return new WT_MapViewChinaProvincialExpresswayLabel(roadType, location, name);
                    case WT_MapViewChinaRouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewChinaNationalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewChinaRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/china_labels.json";
/**
 * @enum {String}
 */
WT_MapViewChinaRouteCollection.RouteType = {
    NATIONAL_EXPRESSWAY: "nat_expressway",
    PROVINCIAL_EXPRESSWAY: "prov_expressway",
    NATIONAL_HIGHWAY: "nat_highway"
};

class WT_MapViewChinaNationalExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewChinaNationalExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewChinaNationalExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewChinaNationalExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_CHINA_NATIONALEXPRESSWAY.png";
WT_MapViewChinaNationalExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

class WT_MapViewChinaProvincialExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewChinaProvincialExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewChinaProvincialExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewChinaProvincialExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_CHINA_PROVINCIALEXPRESSWAY.png";
WT_MapViewChinaProvincialExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

class WT_MapViewChinaNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewChinaNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewChinaNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewChinaNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_CHINA_NATIONALHIGHWAY.png";
WT_MapViewChinaNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 50
};

// TAIWAN

class WT_MapViewTaiwanRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewTaiwanRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewTaiwanRouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewTaiwanNationalHighwayLabel(roadType, location, name);
                    case WT_MapViewTaiwanRouteCollection.RouteType.PROVINCIAL_HIGHWAY:
                        return new WT_MapViewTaiwanProvincialHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewTaiwanRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/taiwan_labels.json";
/**
 * @enum {String}
 */
WT_MapViewTaiwanRouteCollection.RouteType = {
    NATIONAL_HIGHWAY: "nat_highway",
    PROVINCIAL_HIGHWAY: "prov_highway",
};

class WT_MapViewTaiwanNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewTaiwanNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewTaiwanNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewTaiwanNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_TAIWAN_NATIONALHIGHWAY.png";
WT_MapViewTaiwanNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    fontOutlineWidth: 0
};

class WT_MapViewTaiwanProvincialHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewTaiwanProvincialHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewTaiwanProvincialHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewTaiwanProvincialHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_TAIWAN_PROVINCIALHIGHWAY.png";
WT_MapViewTaiwanProvincialHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

// JAPAN

class WT_MapViewJapanRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewJapanRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewJapanRouteCollection.RouteType.EXPRESSWAY:
                        return new WT_MapViewJapanExpresswayLabel(roadType, location, name);
                    case WT_MapViewJapanRouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewJapanNationalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewJapanRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/japan_labels.json";
/**
 * @enum {String}
 */
WT_MapViewJapanRouteCollection.RouteType = {
    EXPRESSWAY: "expressway",
    NATIONAL_HIGHWAY: "nat_highway"
};

class WT_MapViewJapanExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewJapanExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewJapanExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewJapanExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_JAPAN_EXPRESSWAY.png";
WT_MapViewJapanExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

class WT_MapViewJapanNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewJapanNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewJapanNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewJapanNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_JAPAN_NATIONALHIGHWAY.png";
WT_MapViewJapanNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

// SOUTH KOREA

class WT_MapViewSKRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewSKRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewSKRouteCollection.RouteType.NATIONAL_EXPRESSWAY:
                        return new WT_MapViewSKNationalExpresswayLabel(roadType, location, name);
                    case WT_MapViewSKRouteCollection.RouteType.NATIONAL_HIGHWAY:
                        return new WT_MapViewSKNationalHighwayLabel(roadType, location, name);
                    case WT_MapViewSKRouteCollection.RouteType.LOCAL_HIGHWAY:
                        return new WT_MapViewSKLocalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewSKRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/SK_labels.json";
/**
 * @enum {String}
 */
WT_MapViewSKRouteCollection.RouteType = {
    NATIONAL_EXPRESSWAY: "nat_expressway",
    NATIONAL_HIGHWAY: "nat_highway",
    LOCAL_HIGHWAY: "local_highway"
};

class WT_MapViewSKNationalExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewSKNationalExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewSKNationalExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewSKNationalExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_SK_NATIONALEXPRESSWAY.png";
WT_MapViewSKNationalExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

class WT_MapViewSKNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewSKNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewSKNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewSKNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_SK_NATIONALHIGHWAY.png";
WT_MapViewSKNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};

class WT_MapViewSKLocalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewSKLocalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewSKLocalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewSKLocalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_SK_LOCALHIGHWAY.png";
WT_MapViewSKLocalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#2f2fbf",
    fontOutlineWidth: 0,
    backgroundSize: 45
};

// AUSTRALIA

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

// NEW ZEALAND

class WT_MapViewNZRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewNZRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_MapViewNZStateHighwayLabel(roadType, location, name);
            }
        });
    }
}
WT_MapViewNZRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/NZ_labels.json";
/**
 * @enum {String}
 */
WT_MapViewNZRouteCollection.RouteType = {
    STATE_HIGHWAY: "state_highway",
};

class WT_MapViewNZStateHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_MapViewNZStateHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_MapViewNZStateHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_MapViewNZStateHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Map/Garmin/ICON_MAP_NZ_STATEHIGHWAY.png";
WT_MapViewNZStateHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontOutlineWidth: 0
};