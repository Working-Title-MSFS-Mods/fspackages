class SvgAltitudeInterceptElement extends SvgMapElement {
    constructor() {
        super();
        this.strokeColor = SvgAltitudeInterceptElement.STROKE_COLOR_DEFAULT;
        this.strokeWidth = SvgAltitudeInterceptElement.STROKE_WIDTH_DEFAULT;
        this.outlineColor = SvgAltitudeInterceptElement.OUTLINE_COLOR_DEFAULT;
        this.outlineWidth = SvgAltitudeInterceptElement.OUTLINE_WIDTH_DEFAULT;
        this.angularWidth = SvgAltitudeInterceptElement.ANGULAR_WIDTH_DEFAULT;                          // degrees
        this.vSpeedThreshold = SvgAltitudeInterceptElement.VERTICAL_SPEED_THRESHOLD_DEFAULT;            // feet per minute, minimum deviation from 0 before arc is shown
        this.altitudeTargetThreshold = SvgAltitudeInterceptElement.ALTITUDE_TARGET_THRESHOLD_DEFAULT;   // feet, minimum deviation from altitude target before arc is shown
        this.smoothingConstant = SvgAltitudeInterceptElement.SMOOTHING_CONSTANT;                        // larger values = more smoothing but also more temporal lag

        this.facingHeadingGetter = SvgAltitudeInterceptElement.FACING_HEADING_GETTER_DEFAULT;

        this._lastTime = 0;
        this._lastDistance = -1;
        this._lastMapRange = 0;
    }

    id(map) {
        return "altitude-intercept" + "-map-" + map.index;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.altitudeInterceptLayer);
    }

    createDraw(map) {
        this.setPropertyFromConfig(map.config.altitudeArc, "strokeColor");
        this.setPropertyFromConfig(map.config.altitudeArc, "strokeWidth");
        this.setPropertyFromConfig(map.config.altitudeArc, "outlineColor");
        this.setPropertyFromConfig(map.config.altitudeArc, "outlineWidth");
        this.setPropertyFromConfig(map.config.altitudeArc, "angularWidth");

        let container = document.createElementNS(Avionics.SVG.NS, "svg");

        this.arcOuter = document.createElementNS(Avionics.SVG.NS, "path");
        this.arcOuter.setAttribute("fill-opacity", "0");
        this.arcOuter.setAttribute("stroke", this.outlineColor);
        this.arcOuter.setAttribute("stroke-width", this.outlineWidth);
        this.arcOuter.setAttribute("stroke-opacity", "1");
        this.arcOuter.setAttribute("display", "none");
        container.appendChild(this.arcOuter);

        this.arcInner = document.createElementNS(Avionics.SVG.NS, "path");
        this.arcInner.setAttribute("fill-opacity", "0");
        this.arcInner.setAttribute("stroke", this.strokeColor);
        this.arcInner.setAttribute("stroke-width", this.strokeWidth);
        this.arcInner.setAttribute("stroke-opacity", "1");
        this.arcInner.setAttribute("display", "none");
        container.appendChild(this.arcInner);

        return container;
    }

    updateDraw(map) {
        if (SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
            return;
        }

        let currentTime = Date.now() / 1000;
        let dt = currentTime - this._lastTime;

        let vSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        let altTarget = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet");
        let altCurrent = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        if (Math.abs(vSpeed) < this.vSpeedThreshold || ((altTarget - altCurrent) / vSpeed) < 0 || Math.abs(altTarget - altCurrent) < this.altitudeTargetThreshold) {
            this.arcOuter.setAttribute("display", "none");
            this.arcInner.setAttribute("display", "none");
            this._lastDistance = -1;
            return;
        }

        let mapRangeChanged = map.NMWidth != this._lastMapRange;

        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") / map.NMWidth * 1000 / 60;
        let facing = this.facingHeadingGetter.getFacingHeading();

        let centerPos = map.getPlanePositionXY();
        let distance = (altTarget - altCurrent) / vSpeed * groundSpeed;

        if (this._lastDistance >= 0 && !mapRangeChanged) {
            let smoothingFactor = Math.pow(0.5, dt * this.smoothingConstant);
            distance = distance * smoothingFactor + (this._lastDistance) * (1 - smoothingFactor);
        }

        let arcAngularWidthRad = this.angularWidth * Math.PI / 180;
        let arcStart = SvgAltitudeInterceptElement.getRadialOffsetPos(centerPos, distance, -arcAngularWidthRad / 2);
        let arcEnd = SvgAltitudeInterceptElement.getRadialOffsetPos(centerPos, distance, arcAngularWidthRad / 2);

        this.arcOuter.setAttribute("d", `M ${arcStart.x} ${arcStart.y} A ${distance} ${distance} 0 0 1 ${arcEnd.x} ${arcEnd.y}`);
        this.arcOuter.setAttribute("transform", `rotate(${facing + map.rotation} ${centerPos.x} ${centerPos.y})`);
        this.arcInner.setAttribute("d", `M ${arcStart.x} ${arcStart.y} A ${distance} ${distance} 0 0 1 ${arcEnd.x} ${arcEnd.y}`);
        this.arcInner.setAttribute("transform", `rotate(${facing + map.rotation} ${centerPos.x} ${centerPos.y})`);

        this._lastTime = currentTime;
        this._lastDistance = distance;
        this._lastMapRange = map.NMWidth;

        this.arcOuter.setAttribute("display", "inherit");
        this.arcInner.setAttribute("display", "inherit");

        if(WTDataStore.get("RANGE_SEL", 0) === 0){
            this.arcOuter.setAttribute("display", "none");
            this.arcInner.setAttribute("display", "none");  
            return;          
        }
    }

    static getRadialOffsetPos(_center, _radius, _angle) {
        return new Vec2(_center.x + _radius * Math.sin(_angle), _center.y - _radius * Math.cos(_angle));
    }
}
SvgAltitudeInterceptElement.STROKE_COLOR_DEFAULT = "cyan";
SvgAltitudeInterceptElement.STROKE_WIDTH_DEFAULT = 4;
SvgAltitudeInterceptElement.OUTLINE_COLOR_DEFAULT = "black";
SvgAltitudeInterceptElement.OUTLINE_WIDTH_DEFAULT = 6;
SvgAltitudeInterceptElement.ANGULAR_WIDTH_DEFAULT = 40;

SvgAltitudeInterceptElement.VERTICAL_SPEED_THRESHOLD_DEFAULT = 100;
SvgAltitudeInterceptElement.ALTITUDE_TARGET_THRESHOLD_DEFAULT = 100;
SvgAltitudeInterceptElement.SMOOTHING_CONSTANT = 100;

SvgAltitudeInterceptElement.FACING_HEADING_GETTER_DEFAULT = {
    getFacingHeading() {
        return SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
    }
};