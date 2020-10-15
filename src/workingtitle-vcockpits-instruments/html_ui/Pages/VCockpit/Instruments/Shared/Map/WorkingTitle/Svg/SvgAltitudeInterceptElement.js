class SvgAltitudeInterceptElement extends SvgMapElement {
    constructor() {
        super();
        this.strokeInnerColor = SvgAltitudeInterceptElement.STROKE_INNER_COLOR_DEFAULT;
        this.strokeInnerWidth = SvgAltitudeInterceptElement.STROKE_INNER_WIDTH_DEFAULT;
        this.strokeOuterColor = SvgAltitudeInterceptElement.STROKE_OUTER_COLOR_DEFAULT;
        this.strokeOuterWidth = SvgAltitudeInterceptElement.STROKE_OUTER_WIDTH_DEFAULT;
        this.angularWidth = SvgAltitudeInterceptElement.ANGULAR_WIDTH_DEFAULT;                      // degrees
        this.vSpeedThreshold = SvgAltitudeInterceptElement.VERTICAL_SPEED_THRESHOLD_DEFAULT;        // feet per minute, minimum deviation from 0 before altitude intercept arc is shown
        this.smoothingConstant = SvgAltitudeInterceptElement.SMOOTHING_CONSTANT;                    // larger values = more smoothing but also more temporal lag
        
        this.lastTime = 0;
        this.lastDistance = -1;
        this.lastMapRange = 0;
    }
    
    id(map) {
        return "altitude-intercept" + "-map-" + map.index;
    }
    
    appendToMap(map) {
        map.appendChild(this.svgElement, map.altitudeInterceptLayer);
    }
    
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        
        this.arcOuter = document.createElementNS(Avionics.SVG.NS, "path");
        this.arcOuter.setAttribute("fill-opacity", "0");
        this.arcOuter.setAttribute("stroke", this.strokeOuterColor);
        this.arcOuter.setAttribute("stroke-width", this.strokeOuterWidth);
        this.arcOuter.setAttribute("stroke-opacity", "1");
        this.arcOuter.setAttribute("display", "none");
        container.appendChild(this.arcOuter);
        
        this.arcInner = document.createElementNS(Avionics.SVG.NS, "path");
        this.arcInner.setAttribute("fill-opacity", "0");
        this.arcInner.setAttribute("stroke", this.strokeInnerColor);
        this.arcInner.setAttribute("stroke-width", this.strokeInnerWidth);
        this.arcInner.setAttribute("stroke-opacity", "1");
        this.arcInner.setAttribute("display", "none");
        container.appendChild(this.arcInner);
        
        return container;
    }
    
    updateDraw(map) {
        let currentTime = Date.now() / 1000;
        let dt = currentTime - this.lastTime;
        
        let vSpeed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        let altTarget = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet");
        let altCurrent = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        if (Math.abs(vSpeed) < this.vSpeedThreshold || ((altTarget - altCurrent) / vSpeed) < 0) {
            this.arcOuter.setAttribute("display", "none");
            this.arcInner.setAttribute("display", "none");
            this.lastDistance = -1;
            return;
        }
        
        let mapRangeChanged = map.NMWidth != this.lastMapRange;
        
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") / map.NMWidth * 1000 / 60;
        let track = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
        
        let centerPos = map.getPlanePositionXY();
        let distance = (altTarget - altCurrent) / vSpeed * groundSpeed;
        
        if (this.lastDistance >= 0 && !mapRangeChanged) {
            let smoothingFactor = Math.pow(0.5, dt * this.smoothingConstant);
            distance = distance * smoothingFactor + (this.lastDistance) * (1 - smoothingFactor);
        }
        
        let arcAngularWidthRad = this.angularWidth * Math.PI / 180;
        let arcStart = SvgAltitudeInterceptElement.getRadialOffsetPos(centerPos, distance, -arcAngularWidthRad / 2);
        let arcEnd = SvgAltitudeInterceptElement.getRadialOffsetPos(centerPos, distance, arcAngularWidthRad / 2);
        
        this.arcOuter.setAttribute("d", "M " + arcStart.x + " " + arcStart.y + " A " + distance + " " + distance + " 0 0 1 " + arcEnd.x + " " + arcEnd.y);
        this.arcOuter.setAttribute("transform", "rotate(" + (track + map.rotation) + ", " + centerPos.x + ", " + centerPos.y + ")");
        this.arcInner.setAttribute("d", "M " + arcStart.x + " " + arcStart.y + " A " + distance + " " + distance + " 0 0 1 " + arcEnd.x + " " + arcEnd.y);
        this.arcInner.setAttribute("transform", "rotate(" + (track + map.rotation) + ", " + centerPos.x + ", " + centerPos.y + ")");
        
        this.lastTime = currentTime;
        this.lastDistance = distance;
        this.lastMapRange = map.NMWidth;
        
        this.arcOuter.setAttribute("display", "inherit");
        this.arcInner.setAttribute("display", "inherit");
    }
    
    static getRadialOffsetPos(_center, _radius, _angle) {
        return new Vec2(_center.x + _radius * Math.sin(_angle), _center.y - _radius * Math.cos(_angle));
    }
}
SvgAltitudeInterceptElement.STROKE_INNER_COLOR_DEFAULT = "cyan";
SvgAltitudeInterceptElement.STROKE_INNER_WIDTH_DEFAULT = 4;
SvgAltitudeInterceptElement.STROKE_OUTER_COLOR_DEFAULT = "black";
SvgAltitudeInterceptElement.STROKE_OUTER_WIDTH_DEFAULT = 6;
SvgAltitudeInterceptElement.ANGULAR_WIDTH_DEFAULT = 40;                   

SvgAltitudeInterceptElement.VERTICAL_SPEED_THRESHOLD_DEFAULT = 100;
SvgAltitudeInterceptElement.SMOOTHING_CONSTANT = 100;