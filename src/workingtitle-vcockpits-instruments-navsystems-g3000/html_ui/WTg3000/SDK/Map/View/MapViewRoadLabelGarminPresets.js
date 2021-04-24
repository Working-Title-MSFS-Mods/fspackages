// GENERIC LABELS

class WT_Garmin_MapViewGenericInternationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewGenericInternationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewGenericInternationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_INTERNATIONAL_HIGHWAY.png";
WT_Garmin_MapViewGenericInternationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewGenericNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewGenericNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewGenericNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewGenericNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_NATIONAL_HIGHWAY.png";
WT_Garmin_MapViewGenericNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    textOffset: {x: 0, y: -0.075},
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewGenericLocalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewGenericLocalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewGenericLocalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewGenericLocalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_LOCAL_HIGHWAY.png";
WT_Garmin_MapViewGenericLocalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

// INTERNATIONAL LABELS

class WT_Garmin_MapViewERoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewERoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewERoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewERoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_EROAD.png";
WT_Garmin_MapViewERoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

// NA

class WT_Garmin_MapViewNARouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewNARouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewNARouteCollection.RouteType.US_INTERSTATE:
                        return new WT_Garmin_MapViewUSInterstateLabel(roadType, location, name);
                    case WT_Garmin_MapViewNARouteCollection.RouteType.US_US_ROUTE:
                        return new WT_Garmin_MapViewUSRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewNARouteCollection.RouteType.CANADA_TRANS_CANADA:
                        return new WT_Garmin_MapViewGenericInternationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewNARouteCollection.RouteType.CANADA_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewGenericNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewNARouteCollection.RouteType.CANADA_PROVINCIAL_HIGHWAY:
                        return new WT_Garmin_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewNARouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/NA_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewNARouteCollection.RouteType = {
    US_INTERSTATE: "US_interstate",
    US_US_ROUTE: "US_usroute",
    CANADA_TRANS_CANADA: "canada_trans_canada",
    CANADA_NATIONAL_HIGHWAY: "canada_nat_highway",
    CANADA_PROVINCIAL_HIGHWAY: "canada_prov_highway"
};

class WT_Garmin_MapViewUSInterstateLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewUSInterstateLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewUSInterstateLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewUSInterstateLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_US_INTERSTATE.png";
WT_Garmin_MapViewUSInterstateLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.55, right: 0.4, bottom: 0.55},
    minWidthEm: 2.3
};

class WT_Garmin_MapViewUSRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewUSRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewUSRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewUSRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_US_ROUTE.png";
WT_Garmin_MapViewUSRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.4}
};

// MEXICO

class WT_Garmin_MapViewMexicoRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewMexicoRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_Garmin_MapViewMexicoFederalHighwayLabel(roadType, location, name);
            }
        });
    }
}
WT_Garmin_MapViewMexicoRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/mexico_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewMexicoRouteCollection.RouteType = {
    FEDERAL_HIGHWAY: "fed_highway",
};

class WT_Garmin_MapViewMexicoFederalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewMexicoFederalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewMexicoFederalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewMexicoFederalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_MEXICO_FEDERALHIGHWAY.png";
WT_Garmin_MapViewMexicoFederalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.55}
};

// SA

class WT_Garmin_MapViewSARouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewSARouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewSARouteCollection.RouteType.ARGENTINA_NATIONAL_ROUTE:
                        return new WT_Garmin_MapViewArgentinaNationalRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.ARGENTINA_PROVINCIAL_ROUTE:
                        return new WT_Garmin_MapViewArgentinaProvincialRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.BOLIVIA_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewBoliviaNationalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.BRAZIL_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewBrazilNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.BRAZIL_REGIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewBrazilRegionalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.CHILE_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewChileNationalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.CHILE_REGIONAL_ROAD:
                        return new WT_Garmin_MapViewChileRegionalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.PARAGUAY_NATIONAL_ROUTE:
                        return new WT_Garmin_MapViewParaguayNationalRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.PARAGUAY_DEPARTMENTAL_ROUTE:
                        return new WT_Garmin_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.PERU_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewPeruNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.PERU_DEPARTMENTAL_ROAD:
                        return new WT_Garmin_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.PERU_RURAL_ROAD:
                        return new WT_Garmin_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewSARouteCollection.RouteType.URUGUAY_NATIONAL_ROUTE:
                        return new WT_Garmin_MapViewUruguayNationalRouteLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewSARouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/SA_labels.json";
/**
 * @enum {String}
 */
 WT_Garmin_MapViewSARouteCollection.RouteType = {
    ARGENTINA_NATIONAL_ROUTE: "argentina_nat_route",
    ARGENTINA_PROVINCIAL_ROUTE: "argentina_prov_route",
    BOLIVIA_NATIONAL_ROAD: "bolivia_nat_road",
    BRAZIL_NATIONAL_HIGHWAY: "brazil_nat_highway",
    BRAZIL_REGIONAL_HIGHWAY: "brazil_reg_highway",
    CHILE_NATIONAL_ROAD: "chile_nat_road",
    CHILE_REGIONAL_ROAD: "chile_reg_road",
    PARAGUAY_NATIONAL_ROUTE: "paraguay_nat_route",
    PARAGUAY_DEPARTMENTAL_ROUTE: "paraguay_dep_route",
    PERU_NATIONAL_HIGHWAY: "peru_nat_highway",
    PERU_DEPARTMENTAL_ROAD: "peru_dep_road",
    PERU_RURAL_ROAD: "peru_rural_road",
    URUGUAY_NATIONAL_ROUTE: "uruguay_nat_route"
};

class WT_Garmin_MapViewArgentinaNationalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewArgentinaNationalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewArgentinaNationalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewArgentinaNationalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ARGENTINA_NATIONALROUTE.png";
WT_Garmin_MapViewArgentinaNationalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.55}
};

class WT_Garmin_MapViewArgentinaProvincialRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewArgentinaProvincialRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewArgentinaProvincialRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewArgentinaProvincialRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ITALY_MUNICIPALROAD.png";
WT_Garmin_MapViewArgentinaProvincialRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewBoliviaNationalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewBoliviaNationalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewBoliviaNationalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewBoliviaNationalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_BOLIVIA_NATIONALROAD.png";
WT_Garmin_MapViewBoliviaNationalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.55, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewBrazilNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewBrazilNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewBrazilNationalHighwayLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return ["BR", this.name];
    }
}
WT_Garmin_MapViewBrazilNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_BRAZIL_NATIONALHIGHWAY.png";
WT_Garmin_MapViewBrazilNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    lineHeightEm: 1,
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewBrazilRegionalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewBrazilRegionalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewBrazilRegionalHighwayLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return this.name.split("-");
    }
}
WT_Garmin_MapViewBrazilRegionalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_BRAZIL_REGIONALHIGHWAY.png";
WT_Garmin_MapViewBrazilRegionalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    lineHeightEm: 1,
    backgroundPaddingEm: {left: 0.55, top: 0.7, right: 0.55, bottom: 0.4}
};

class WT_Garmin_MapViewChileNationalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewChileNationalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewChileNationalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewChileNationalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_BOLIVIA_NATIONALROAD.png";
WT_Garmin_MapViewChileNationalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.55, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewChileRegionalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewChileRegionalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewChileRegionalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewChileRegionalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_BOLIVIA_NATIONALROAD.png";
WT_Garmin_MapViewChileRegionalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewParaguayNationalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewParaguayNationalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewParaguayNationalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewParaguayNationalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ARGENTINA_NATIONALROUTE.png";
WT_Garmin_MapViewParaguayNationalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.55}
};

class WT_Garmin_MapViewPeruNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewPeruNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewPeruNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewPeruNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_PERU_NATIONALHIGHWAY.png";
WT_Garmin_MapViewPeruNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.55, right: 0.4, bottom: 0.4}
};

class WT_Garmin_MapViewUruguayNationalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewUruguayNationalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewUruguayNationalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewUruguayNationalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_URUGUAY_NATIONALROUTE.png";
WT_Garmin_MapViewUruguayNationalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.55}
};

// EI

class WT_Garmin_MapViewEIRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewEIRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewEIRouteCollection.RouteType.ICELAND_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewIcelandRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewEIRouteCollection.RouteType.UK_IRELAND_MOTORWAY:
                        return new WT_Garmin_MapViewUKMotorwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewEIRouteCollection.RouteType.UK_IRELAND_A_ROAD:
                    case WT_Garmin_MapViewEIRouteCollection.RouteType.UK_IRELAND_N_ROAD:
                        return new WT_Garmin_MapViewUKARoadLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewEIRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/EI_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewEIRouteCollection.RouteType = {
    ICELAND_NATIONAL_ROAD: "iceland_nat_road",
    UK_IRELAND_MOTORWAY: "UK_ireland_motorway",
    UK_IRELAND_A_ROAD: "UK_ireland_a_road",
    UK_IRELAND_N_ROAD: "UK_ireland_n_road"
};

class WT_Garmin_MapViewIcelandRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewIcelandRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewIcelandRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewIcelandRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ICELAND_ROUTE.png";
WT_Garmin_MapViewIcelandRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

class WT_Garmin_MapViewUKMotorwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewUKMotorwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewUKMotorwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewUKMotorwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_UK_MOTORWAY.png";
WT_Garmin_MapViewUKMotorwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold"
};

class WT_Garmin_MapViewUKARoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewUKARoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewUKARoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewUKARoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_UK_AROAD.png";
WT_Garmin_MapViewUKARoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffd200",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

// EN

class WT_Garmin_MapViewENRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewENRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewENRouteCollection.RouteType.E_ROAD:
                    case WT_Garmin_MapViewENRouteCollection.RouteType.NORWAY_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewERoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.DENMARK_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewDenmarkNationalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.DENMARK_SECONDARY_ROAD:
                        return new WT_Garmin_MapViewDenmarkSecondaryRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.NORWAY_PROVINCIAL_ROAD:
                        return new WT_Garmin_MapViewNorwayProvincialRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.NORWAY_RING_ROAD:
                        return new WT_Garmin_MapViewNorwayRingRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.SWEDEN_NATIONAL_ROAD:
                        return new WT_Garmin_MapViewSwedenNationalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.SWEDEN_COUNTY_ROAD:
                        return new WT_Garmin_MapViewSwedenCountyRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.FINLAND_MAIN_ROAD_CLASS1:
                        return new WT_Garmin_MapViewFinlandMainRoadClass1Label(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.FINLAND_MAIN_ROAD_CLASS2:
                        return new WT_Garmin_MapViewFinlandMainRoadClass2Label(roadType, location, name);
                    case WT_Garmin_MapViewENRouteCollection.RouteType.FINLAND_REGIONAL_ROAD:
                        return new WT_Garmin_MapViewFinlandRegionalRoadLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewENRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/EN_labels.json";
/**
 * @enum {String}
 */
 WT_Garmin_MapViewENRouteCollection.RouteType = {
    E_ROAD: "e-road",
    DENMARK_NATIONAL_ROAD: "denmark_nat_road",
    DENMARK_SECONDARY_ROAD: "denmark_secondary_road",
    NORWAY_NATIONAL_ROAD: "norway_nat_road",
    NORWAY_PROVINCIAL_ROAD: "norway_prov_road",
    NORWAY_RING_ROAD: "norway_ring_road",
    SWEDEN_NATIONAL_ROAD: "sweden_nat_road",
    SWEDEN_COUNTY_ROAD: "sweden_county_road",
    FINLAND_MAIN_ROAD_CLASS1: "finland_main_road_cl1",
    FINLAND_MAIN_ROAD_CLASS2: "finland_main_road_cl2",
    FINLAND_REGIONAL_ROAD: "finland_reg_road"
};

class WT_Garmin_MapViewDenmarkNationalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewDenmarkNationalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewDenmarkNationalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewDenmarkNationalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_DENMARK_NATIONALROAD.png";
WT_Garmin_MapViewDenmarkNationalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    minWidthEm: 3
};

class WT_Garmin_MapViewDenmarkSecondaryRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewDenmarkSecondaryRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewDenmarkSecondaryRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewDenmarkSecondaryRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ITALY_MUNICIPALROAD.png";
WT_Garmin_MapViewDenmarkSecondaryRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewNorwayProvincialRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewNorwayProvincialRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewNorwayProvincialRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewNorwayProvincialRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ICELAND_ROUTE.png";
WT_Garmin_MapViewNorwayProvincialRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewNorwayRingRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewNorwayRingRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewNorwayRingRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewNorwayRingRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ICELAND_ROUTE.png";
WT_Garmin_MapViewNorwayRingRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewSwedenNationalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSwedenNationalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSwedenNationalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSwedenNationalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SWEDEN_NATIONALROAD.png";
WT_Garmin_MapViewSwedenNationalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
};

class WT_Garmin_MapViewSwedenCountyRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSwedenCountyRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSwedenCountyRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSwedenCountyRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SWEDEN_NATIONALROAD.png";
WT_Garmin_MapViewSwedenCountyRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
};

class WT_Garmin_MapViewFinlandMainRoadClass1Label extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewFinlandMainRoadClass1Label.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewFinlandMainRoadClass1Label.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewFinlandMainRoadClass1Label.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_FINLAND_MAINROADCLASS1.png";
WT_Garmin_MapViewFinlandMainRoadClass1Label.OPTION_DEFAULTS = {
    fontWeight: "bold",
};

class WT_Garmin_MapViewFinlandMainRoadClass2Label extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewFinlandMainRoadClass2Label.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewFinlandMainRoadClass2Label.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewFinlandMainRoadClass2Label.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_FINLAND_MAINROADCLASS2.png";
WT_Garmin_MapViewFinlandMainRoadClass2Label.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

class WT_Garmin_MapViewFinlandRegionalRoadLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewFinlandRegionalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewFinlandRegionalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewFinlandRegionalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ICELAND_ROUTE.png";
WT_Garmin_MapViewFinlandRegionalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

// EW

class WT_Garmin_MapViewEWRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewEWRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewEWRouteCollection.RouteType.E_ROAD:
                        return new WT_Garmin_MapViewERoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewEWRouteCollection.RouteType.FRANCE_AUTOROUTE:
                    case WT_Garmin_MapViewEWRouteCollection.RouteType.FRANCE_NATIONAL_ROUTE:
                        return new WT_Garmin_MapViewFranceAutorouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewEWRouteCollection.RouteType.FRANCE_DEPARTMENTAL_ROUTE:
                        return new WT_Garmin_MapViewFranceDepartmentalRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewEWRouteCollection.RouteType.SPAIN_UNKNOWN:
                        return new WT_Garmin_MapViewGenericInternationalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewEWRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/EW_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewEWRouteCollection.RouteType = {
    E_ROAD: "e-road",
    FRANCE_AUTOROUTE: "france_autoroute",
    FRANCE_NATIONAL_ROUTE: "france_nat_route",
    FRANCE_DEPARTMENTAL_ROUTE: "france_departmental_route",
    SPAIN_UNKNOWN: "spain_unknown"
};

class WT_Garmin_MapViewFranceAutorouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewFranceAutorouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewFranceAutorouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewFranceAutorouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_FRANCE_AUTOROUTE.png";
WT_Garmin_MapViewFranceAutorouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold"
};

class WT_Garmin_MapViewFranceDepartmentalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewFranceDepartmentalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewFranceDepartmentalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewFranceDepartmentalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_FRANCE_DEPARTMENTALROUTE.png";
WT_Garmin_MapViewFranceDepartmentalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black"
};

// EC

class WT_Garmin_MapViewECRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewECRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewECRouteCollection.RouteType.GERMANY_AUTOBAHN:
                        return new WT_Garmin_MapViewGermanyAutobahnLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.GERMANY_BUNDESSTRASSE:
                        return new WT_Garmin_MapViewGermanyBundesstrasseLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.AUSTRIA_BUNDESSTRASSE_A:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.AUSTRIA_BUNDESSTRASSE_S:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.AUSTRIA_BUNDESSTRASSE_B:
                        return new WT_Garmin_MapViewAustriaBundesstrasseLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.SWITZERLAND_AUTOBAHN:
                        return new WT_Garmin_MapViewSwitzerlandAutobahnLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.SWITZERLAND_HAUPTSTRASSE:
                        return new WT_Garmin_MapViewSwitzerlandHauptstrasseLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.ITALY_MOTORWAY:
                        return new WT_Garmin_MapViewItalyMotorwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.ITALY_STATE_HIGHWAY:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.ITALY_REGIONAL_ROAD:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.ITALY_PROVINCIAL_ROAD:
                        return new WT_Garmin_MapViewItalyStateHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.ITALY_MUNICIPAL_ROAD:
                        return new WT_Garmin_MapViewItalyMunicipalRoadLabel(roadType, location, name);
                    case WT_Garmin_MapViewECRouteCollection.RouteType.GERMANY_LANDESSTRASSE:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.GERMANY_KREISSTRASSE:
                    case WT_Garmin_MapViewECRouteCollection.RouteType.AUSTRIA_LANDESSTRASSE:
                        return new WT_Garmin_MapViewGenericLocalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewECRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/EC_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewECRouteCollection.RouteType = {
    GERMANY_AUTOBAHN: "germany_autobahn",
    GERMANY_BUNDESSTRASSE: "germany_bundesstrasse",
    GERMANY_LANDESSTRASSE: "germany_landesstrasse",
    GERMANY_KREISSTRASSE: "germany_kreisstrasse",
    AUSTRIA_BUNDESSTRASSE_A: "austria_bundesstrasse_A",
    AUSTRIA_BUNDESSTRASSE_S: "austria_bundesstrasse_S",
    AUSTRIA_BUNDESSTRASSE_B: "austria_bundesstrasse_B",
    AUSTRIA_LANDESSTRASSE: "austria_landesstrasse",
    SWITZERLAND_AUTOBAHN: "switzerland_autobahn",
    SWITZERLAND_HAUPTSTRASSE: "switzerland_hauptstrasse",
    ITALY_MOTORWAY: "italy_motorway",
    ITALY_STATE_HIGHWAY: "italy_state_highway",
    ITALY_REGIONAL_ROAD: "italy_reg_road",
    ITALY_PROVINCIAL_ROAD: "italy_prov_road",
    ITALY_MUNICIPAL_ROAD: "italy_muni_road"
};

class WT_Garmin_MapViewGermanyAutobahnLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewGermanyAutobahnLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewGermanyAutobahnLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return [this.name.replace(/^[^\d]+/, "")];
    }
}
WT_Garmin_MapViewGermanyAutobahnLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_GERMANY_AUTOBAHN.png";
WT_Garmin_MapViewGermanyAutobahnLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    minWidthEm: 2.5
};

class WT_Garmin_MapViewGermanyBundesstrasseLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewGermanyBundesstrasseLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewGermanyBundesstrasseLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return [this.name.replace(/^[^\d]+/, "")];
    }
}
WT_Garmin_MapViewGermanyBundesstrasseLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_GERMANY_BUNDESSTRASSE.png";
WT_Garmin_MapViewGermanyBundesstrasseLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

class WT_Garmin_MapViewAustriaBundesstrasseLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewAustriaBundesstrasseLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewAustriaBundesstrasseLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return [this.name.charAt(0) === "B" ? this.name : this.name.replace(/^[^\d]+/, "")];
    }
}
WT_Garmin_MapViewAustriaBundesstrasseLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_AUSTRIA_BUNDESSTRASSE.png";
WT_Garmin_MapViewAustriaBundesstrasseLabel.OPTION_DEFAULTS = {
    fontWeight: "bold"
};

class WT_Garmin_MapViewSwitzerlandAutobahnLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSwitzerlandAutobahnLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSwitzerlandAutobahnLabel.OPTION_DEFAULTS);
    }

    _initText() {
        return [this.name.replace(/^[^\d]+/, "")];
    }
}
WT_Garmin_MapViewSwitzerlandAutobahnLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SWITZERLAND_AUTOBAHN.png";
WT_Garmin_MapViewSwitzerlandAutobahnLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    minWidthEm: 2.5
};

class WT_Garmin_MapViewSwitzerlandHauptstrasseLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSwitzerlandHauptstrasseLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSwitzerlandHauptstrasseLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSwitzerlandHauptstrasseLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SWITZERLAND_HAUPTSTRASSE.png";
WT_Garmin_MapViewSwitzerlandHauptstrasseLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

class WT_Garmin_MapViewItalyRoadLabel extends WT_MapViewRoadImageLabel {
    _initText() {
        let lines = this.name.split(" ");
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].length === 1 && lines[i - 1].search(/\d/) === -1) {
                lines[i - 1] = `${lines[i - 1]} ${lines[i]}`
                lines.splice(i, 1);
                i--;
            }
        }
        return lines;
    }
}

class WT_Garmin_MapViewItalyMotorwayLabel extends WT_Garmin_MapViewItalyRoadLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewItalyMotorwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewItalyMotorwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewItalyMotorwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ITALY_MOTORWAY.png";
WT_Garmin_MapViewItalyMotorwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.4, right: 0.4, bottom: 0.4},
};

class WT_Garmin_MapViewItalyStateHighwayLabel extends WT_Garmin_MapViewItalyRoadLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewItalyStateHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewItalyStateHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewItalyStateHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ITALY_STATEHIGHWAY.png";
WT_Garmin_MapViewItalyStateHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.5, top: 0.4, right: 0.5, bottom: 0.4}
};

class WT_Garmin_MapViewItalyMunicipalRoadLabel extends WT_Garmin_MapViewItalyRoadLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewItalyMunicipalRoadLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewItalyMunicipalRoadLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewItalyMunicipalRoadLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_ITALY_MUNICIPALROAD.png";
WT_Garmin_MapViewItalyMunicipalRoadLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

// RUSSIA

class WT_Garmin_MapViewRussiaRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewRussiaRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                return new WT_Garmin_MapViewRussiaFederalHighwayLabel(roadType, location, name);
            }
        });
    }
}
WT_Garmin_MapViewRussiaRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/RU_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewRussiaRouteCollection.RouteType = {
    FEDERAL_HIGHWAY: "fed_highway",
};

class WT_Garmin_MapViewRussiaFederalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewRussiaFederalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewRussiaFederalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewRussiaFederalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_RU_FEDERALHIGHWAY.png";
WT_Garmin_MapViewRussiaFederalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold"
};

// CH

class WT_Garmin_MapViewCHRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewCHRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewCHRouteCollection.RouteType.CHINA_NATIONAL_EXPRESSWAY:
                        return new WT_Garmin_MapViewChinaNationalExpresswayLabel(roadType, location, name);
                    case WT_Garmin_MapViewCHRouteCollection.RouteType.CHINA_PROVINCIAL_EXPRESSWAY:
                        return new WT_Garmin_MapViewChinaProvincialExpresswayLabel(roadType, location, name);
                    case WT_Garmin_MapViewCHRouteCollection.RouteType.CHINA_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewChinaNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewCHRouteCollection.RouteType.TAIWAN_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewTaiwanNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewCHRouteCollection.RouteType.TAIWAN_PROVINCIAL_HIGHWAY:
                        return new WT_Garmin_MapViewTaiwanProvincialHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewCHRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/CH_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewCHRouteCollection.RouteType = {
    CHINA_NATIONAL_EXPRESSWAY: "china_nat_expressway",
    CHINA_PROVINCIAL_EXPRESSWAY: "china_prov_expressway",
    CHINA_NATIONAL_HIGHWAY: "china_nat_highway",
    TAIWAN_NATIONAL_HIGHWAY: "taiwan_nat_highway",
    TAIWAN_PROVINCIAL_HIGHWAY: "taiwan_prov_highway",
};

class WT_Garmin_MapViewChinaNationalExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewChinaNationalExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewChinaNationalExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewChinaNationalExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_CHINA_NATIONALEXPRESSWAY.png";
WT_Garmin_MapViewChinaNationalExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.25, top: 0.65, right: 0.25, bottom: 0.25}
};

class WT_Garmin_MapViewChinaProvincialExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewChinaProvincialExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewChinaProvincialExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewChinaProvincialExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_CHINA_PROVINCIALEXPRESSWAY.png";
WT_Garmin_MapViewChinaProvincialExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.25, top: 0.65, right: 0.25, bottom: 0.25}
};

class WT_Garmin_MapViewChinaNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewChinaNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewChinaNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewChinaNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_CHINA_NATIONALHIGHWAY.png";
WT_Garmin_MapViewChinaNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25}
};

class WT_Garmin_MapViewTaiwanNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewTaiwanNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewTaiwanNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewTaiwanNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_TAIWAN_NATIONALHIGHWAY.png";
WT_Garmin_MapViewTaiwanNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.65, right: 0.4, bottom: 0.45},
    minWidthEm: 2.3
};

class WT_Garmin_MapViewTaiwanProvincialHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewTaiwanProvincialHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewTaiwanProvincialHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewTaiwanProvincialHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_TAIWAN_PROVINCIALHIGHWAY.png";
WT_Garmin_MapViewTaiwanProvincialHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65},
    minWidthEm: 2.3
};

// AE

class WT_Garmin_MapViewAERouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewAERouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewAERouteCollection.RouteType.JAPAN_EXPRESSWAY:
                        return new WT_Garmin_MapViewJapanExpresswayLabel(roadType, location, name);
                    case WT_Garmin_MapViewAERouteCollection.RouteType.JAPAN_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewJapanNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewAERouteCollection.RouteType.SK_NATIONAL_EXPRESSWAY:
                        return new WT_Garmin_MapViewSKNationalExpresswayLabel(roadType, location, name);
                    case WT_Garmin_MapViewAERouteCollection.RouteType.SK_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewSKNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewAERouteCollection.RouteType.SK_LOCAL_HIGHWAY:
                        return new WT_Garmin_MapViewSKLocalHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewAERouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/AE_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewAERouteCollection.RouteType = {
    JAPAN_EXPRESSWAY: "japan_expressway",
    JAPAN_NATIONAL_HIGHWAY: "japan_nat_highway",
    SK_NATIONAL_EXPRESSWAY: "SK_nat_expressway",
    SK_NATIONAL_HIGHWAY: "SK_nat_highway",
    SK_LOCAL_HIGHWAY: "SK_local_highway"
};

class WT_Garmin_MapViewJapanExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewJapanExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewJapanExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewJapanExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_JAPAN_EXPRESSWAY.png";
WT_Garmin_MapViewJapanExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold"
};

class WT_Garmin_MapViewJapanNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewJapanNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewJapanNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewJapanNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_JAPAN_NATIONALHIGHWAY.png";
WT_Garmin_MapViewJapanNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65},
    minWidthEm: 2.3
};

class WT_Garmin_MapViewSKNationalExpresswayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSKNationalExpresswayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSKNationalExpresswayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSKNationalExpresswayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SK_NATIONALEXPRESSWAY.png";
WT_Garmin_MapViewSKNationalExpresswayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.65, right: 0.4, bottom: 0.45},
    minWidthEm: 2.3
};

class WT_Garmin_MapViewSKNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSKNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSKNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSKNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SK_NATIONALHIGHWAY.png";
WT_Garmin_MapViewSKNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    minWidthEm: 2.4
};

class WT_Garmin_MapViewSKLocalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewSKLocalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewSKLocalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewSKLocalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_SK_LOCALHIGHWAY.png";
WT_Garmin_MapViewSKLocalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#2f2fbf",
    backgroundPaddingEm: {left: 0.4, top: 0.25, right: 0.4, bottom: 0.25},
};

// OC

class WT_Garmin_MapViewOCRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_Garmin_MapViewOCRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_Garmin_MapViewOCRouteCollection.RouteType.AUSTRALIA_ALPHANUMERIC:
                        return new WT_Garmin_MapViewAUAlphaNumLabel(roadType, location, name);
                    case WT_Garmin_MapViewOCRouteCollection.RouteType.AUSTRALIA_NATIONAL_HIGHWAY:
                        return new WT_Garmin_MapViewAUNationalHighwayLabel(roadType, location, name);
                    case WT_Garmin_MapViewOCRouteCollection.RouteType.AUSTRALIA_NATIONAL_ROUTE:
                        return new WT_Garmin_MapViewAUNationalRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewOCRouteCollection.RouteType.AUSTRALIA_STATE_ROUTE:
                        return new WT_Garmin_MapViewAUStateRouteLabel(roadType, location, name);
                    case WT_Garmin_MapViewOCRouteCollection.RouteType.NZ_STATE_HIGHWAY:
                        return new WT_Garmin_MapViewNZStateHighwayLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_Garmin_MapViewOCRouteCollection.DATA_FILE_PATH = "/Data/Roads/Labels/OC_labels.json";
/**
 * @enum {String}
 */
WT_Garmin_MapViewOCRouteCollection.RouteType = {
    AUSTRALIA_ALPHANUMERIC: "australia_alphanum_route",
    AUSTRALIA_NATIONAL_HIGHWAY: "australia_nat_highway",
    AUSTRALIA_NATIONAL_ROUTE: "australia_nat_route",
    AUSTRALIA_STATE_ROUTE: "australia_state_route",
    NZ_STATE_HIGHWAY: "NZ_state_highway"
};

class WT_Garmin_MapViewAUAlphaNumLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewAUAlphaNumLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewAUAlphaNumLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewAUAlphaNumLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_AU_ALPHANUMROUTE.png";
WT_Garmin_MapViewAUAlphaNumLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffa709"
};

class WT_Garmin_MapViewAUNationalHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewAUNationalHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewAUNationalHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewAUNationalHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_AU_NATIONALHIGHWAY.png";
WT_Garmin_MapViewAUNationalHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "#ffa709",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65}
};

class WT_Garmin_MapViewAUNationalRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewAUNationalRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewAUNationalRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewAUNationalRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_AU_NATIONALROUTE.png";
WT_Garmin_MapViewAUNationalRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    fontColor: "black",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65}
};

class WT_Garmin_MapViewAUStateRouteLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewAUStateRouteLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewAUStateRouteLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewAUStateRouteLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_AU_STATEROUTE.png";
WT_Garmin_MapViewAUStateRouteLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65},
    minWidthEm: 2.3
};

class WT_Garmin_MapViewNZStateHighwayLabel extends WT_MapViewRoadImageLabel {
    constructor(roadType, location, name) {
        super(roadType, location, name, WT_Garmin_MapViewNZStateHighwayLabel.IMAGE_PATH);

        this.setOptions(WT_Garmin_MapViewNZStateHighwayLabel.OPTION_DEFAULTS);
    }
}
WT_Garmin_MapViewNZStateHighwayLabel.IMAGE_PATH = "/WTg3000/SDK/Assets/Images/Garmin/Map/Roads/ICON_MAP_NZ_STATEHIGHWAY.png";
WT_Garmin_MapViewNZStateHighwayLabel.OPTION_DEFAULTS = {
    fontWeight: "bold",
    backgroundPaddingEm: {left: 0.4, top: 0.45, right: 0.4, bottom: 0.65},
    minWidthEm: 2.3
};