class SvgTrackVectorElement extends SvgMapElement {
    constructor() {
        super();
        this.strokeInnerColor = SvgTrackVectorElement.STROKE_INNER_COLOR_DEFAULT;
        this.strokeInnerWidth = SvgTrackVectorElement.STROKE_INNER_WIDTH_DEFAULT;
        this.strokeOuterColor = SvgTrackVectorElement.STROKE_OUTER_COLOR_DEFAULT;
        this.strokeOuterWidth = SvgTrackVectorElement.STROKE_OUTER_WIDTH_DEFAULT;
        this.lookahead = SvgTrackVectorElement.LOOKAHEAD_DEFAULT;
        this.dynamicLookaheadMax = SvgTrackVectorElement.DYNAMIC_LOOKAHEAD_MAX_DEFAULT;
        this.dynamicTimeStepMapResolution = SvgTrackVectorElement.DYNAMIC_TIME_STEP_MAP_RESOLUTION;
        this.dynamicHeadingDeltaMax = SvgTrackVectorElement.DYNAMIC_HEADING_DELTA_MAX_DEFAULT;
        this.smoothingConstant = SvgTrackVectorElement.SMOOTHING_CONSTANT;
        
        this.lastTurnSpeed = 0;
        this.lastTime = 0;
    }
    
    id(map) {
        return "track-vector" + "-map-" + map.index;
    }
    
    appendToMap(map) {
        map.appendChild(this.svgElement, map.trackVectorLayer);
    }
    
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        
        this.trackOuter = document.createElementNS(Avionics.SVG.NS, "path");
        this.trackOuter.setAttribute("fill-opacity", "0");
        this.trackOuter.setAttribute("stroke", this.strokeOuterColor);
        this.trackOuter.setAttribute("stroke-width", this.strokeOuterWidth);
        this.trackOuter.setAttribute("stroke-opacity", "1");
        container.appendChild(this.trackOuter);
        
        this.trackInner = document.createElementNS(Avionics.SVG.NS, "path");
        this.trackInner.setAttribute("fill-opacity", "0");
        this.trackInner.setAttribute("stroke", this.strokeInnerColor);
        this.trackInner.setAttribute("stroke-width", this.strokeInnerWidth);
        this.trackInner.setAttribute("stroke-opacity", "1");
        container.appendChild(this.trackInner);
        
        return container;
    }
    
    updateDraw(map) {
        let currentTime = Date.now() / 1000;
        let dt = currentTime - this.lastTime;
        
        let smoothingFactor = Math.pow(0.5, dt * this.smoothingConstant);
        
        let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") / map.NMWidth * 1000 / 3600;
        let track = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree") * Math.PI / 180;
        let tas = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots") / map.NMWidth * 1000 / 3600;
        let heading = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree") * Math.PI / 180;
        let turnSpeed = SimVar.GetSimVarValue("DELTA HEADING RATE", "radians per second");
        let windSpeed = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots") / map.NMWidth * 1000 / 3600;
        let windDirection = (SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree") + 180) * Math.PI / 180;
        
        turnSpeed = turnSpeed * smoothingFactor + (this.lastTurnSpeed) * (1 - smoothingFactor);
        
        let points = null;
        if (this.lookahead > this.dynamicLookaheadMax) {
            points = [map.getPlanePositionXY()];
            
            let newX = points[0].x + groundSpeed * Math.sin(track) * this.lookahead;
            let newY = points[0].y - groundSpeed * Math.cos(track) * this.lookahead;
            points.push(new Vec2(newX, newY));
        } else {
            let timeStep = this.dynamicTimeStepMapResolution / tas;
            points = [map.getPlanePositionXY()];
            let i = 0;
            for (let t = 0; t < this.lookahead; t += timeStep) {
                if (Math.abs(heading - track) > this.dynamicHeadingDeltaMax * Math.PI / 180) {
                    break;
                }
                let planeSpeedX = tas * Math.sin(heading);
                let planeSpeedY = -tas * Math.cos(heading);
                let windSpeedX = windSpeed * Math.sin(windDirection);
                let windSpeedY = -windSpeed * Math.cos(windDirection);
                
                let currentPoint = points[i++];
                let nextPoint = new Vec2(currentPoint.x + (planeSpeedX + windSpeedX) * timeStep, currentPoint.y + (planeSpeedY + windSpeedY) * timeStep);
                points.push(nextPoint);
                
                if (nextPoint.x > 1100 || nextPoint.x < -100 || nextPoint.y > 1100 || nextPoint.y < -100) {
                    break;
                }
                
                heading += turnSpeed * timeStep;
            }
        }
        
        let pathString = "M " + points[0].x + " " + points[0].y;
        let i = 1;
        while (i < points.length) {
            let currentPoint = points[i++];
            pathString += " L " + currentPoint.x + " " + currentPoint.y;
        }
        
        this.trackOuter.setAttribute("d", pathString);
        this.trackInner.setAttribute("d", pathString);
        this.trackOuter.setAttribute("transform", "rotate(" + map.rotation + " " + points[0].x + " " + points[0].y + ")");
        this.trackInner.setAttribute("transform", "rotate(" + map.rotation + " " + points[0].x + " " + points[0].y + ")");
        
        this.lastTime = currentTime;
        this.lastTurnSpeed = turnSpeed;
    }
}
SvgTrackVectorElement.STROKE_INNER_COLOR_DEFAULT = "cyan";
SvgTrackVectorElement.STROKE_INNER_WIDTH_DEFAULT = 4;
SvgTrackVectorElement.STROKE_OUTER_COLOR_DEFAULT = "black";
SvgTrackVectorElement.STROKE_OUTER_WIDTH_DEFAULT = 6;
SvgTrackVectorElement.LOOKAHEAD_DEFAULT = 60;                       // seconds
SvgTrackVectorElement.DYNAMIC_LOOKAHEAD_MAX_DEFAULT = 60;           // seconds
SvgTrackVectorElement.DYNAMIC_TIME_STEP_MAP_RESOLUTION = 5;         // in SVG coordinate units, the target resolution per time step
SvgTrackVectorElement.DYNAMIC_HEADING_DELTA_MAX_DEFAULT = 90;       // degrees, the maximum turn angle up to which the dynamic track vector will be calculated
SvgTrackVectorElement.SMOOTHING_CONSTANT = 100;                     // larger values = more smoothing but also more temporal lag