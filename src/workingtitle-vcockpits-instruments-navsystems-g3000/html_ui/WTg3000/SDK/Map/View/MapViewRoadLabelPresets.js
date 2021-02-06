class WT_MapViewUSInterstateRouteCollection extends WT_MapViewRoadLabelCollection {
    constructor() {
        super(WT_MapViewUSInterstateRouteCollection.DATA_FILE_PATH, {
            createLabel(roadType, routeType, location, name) {
                switch (routeType) {
                    case WT_MapViewUSInterstateRouteCollection.RouteType.INTERSTATE:
                        return new WT_MapViewUSInterstateLabel(roadType, location, name);
                    case WT_MapViewUSInterstateRouteCollection.RouteType.US_ROUTE:
                        return new WT_MapViewUSRouteLabel(roadType, location, name);
                    default:
                        return null;
                }
            }
        });
    }
}
WT_MapViewUSInterstateRouteCollection.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Roads/Labels/US_interstate_usroute_labels.json";
/**
 * @enum {String}
 */
WT_MapViewUSInterstateRouteCollection.RouteType = {
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