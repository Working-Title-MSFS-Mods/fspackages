class WT_MapViewRangeCompassArcLayer extends WT_MapViewMultiLayer {
    constructor(forwardTickBearingGetter, facingAngleGetter = {getFacingAngle: data => 0}, className = WT_MapViewRangeCompassArcLayer.CLASS_DEFAULT, configName = WT_MapViewRangeCompassArcLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName, 4);

        this.forwardTickBearingGetter = forwardTickBearingGetter;
        this.facingAngleGetter = facingAngleGetter;

        this._center = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRangeCompassArcLayer.OPTIONS_DEF);

        this._arcLayer = new WT_MapViewCanvas(false, true);
        this._bearingTickLayer = new WT_MapViewCanvas(true, true);
        this._forwardTickLayer = new WT_MapViewCanvas(false, true);
        this._bearingLabelLayer = new WT_MapViewCanvas(true, true);

        this.addSubLayer(this._arcLayer, this.compassContainer);
        this.addSubLayer(this._bearingTickLayer, this.compassContainer);
        this.addSubLayer(this._forwardTickLayer, this.compassContainer);
        this.addSubLayer(this._bearingLabelLayer, this.compassContainer);

        this._needRedrawArc = true;
        this._needRotateArc = true;
        this._needRedrawBearings = true;
        this._needRotateBearingTicks = true;
        this._needRestyleBearingLabels = true;
        this._needRedrawForwardTick = true;
        this._needRotateForwardTick = true;
        this._needReclipTicks = true;
        this._needRepositionLabel = true;

        this._arcLastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};
        this._bearingLastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};
        this._forwardTickLastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};
        this._labelLastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};
    }

    get center() {
        return this._center.copy();
    }

    set center(newValue) {
        let oldValue = this.center;
        this._center.set(newValue);
        this.onOptionChanged("center", oldValue, newValue);
    }

    get compassContainer() {
        return this._compassContainer;
    }

    get labelContainer() {
        return this._labelContainer;
    }

    get arcLayer() {
        return this._arcLayer;
    }

    get bearingTickLayer() {
        return this._bearingTickLayer;
    }

    get forwardTickLayer() {
        return this._forwardTickLayer;
    }

    get bearingLabelLayer() {
        return this._bearingLabelLayer;
    }

    get rangeLabel() {
        return this._rangeLabel;
    }

    _calculateIntervals(start, interval) {
        let count = Math.floor(360 / interval);
        return [...new Array(count).keys()].map(e => (start + interval * e) % 360);
    }

    get bearingTickMinorStart() {
        return this._bearingTickMinorStart;
    }

    set bearingTickMinorStart(newValue) {
        let oldValue = this.bearingTickMinorStart;
        this._bearingTickMinorStart = newValue;

        if (this.bearingTickMinorInterval != undefined && this.bearingTickMinorInterval > 0) {
            this._bearingTickMinorAngles = this._calculateIntervals(this.bearingTickMinorStart, this.bearingTickMinorInterval);
        }

        this.onOptionChanged("bearingTickMinorStart", oldValue, newValue);
    }

    get bearingTickMinorInterval() {
        return this._bearingTickMinorInterval;
    }

    set bearingTickMinorInterval(newValue) {
        let oldValue = this.bearingTickMinorInterval;
        this._bearingTickMinorInterval = newValue;

        if (this.bearingTickMinorStart != undefined) {
            this._bearingTickMinorAngles = this._calculateIntervals(this.bearingTickMinorStart, this.bearingTickMinorInterval);
        }

        this.onOptionChanged("bearingTickMinorInterval", oldValue, newValue);
    }

    get bearingTickMinorAngles() {
        return this._bearingTickMinorAngles;
    }

    get bearingTickMajorStart() {
        return this._bearingTickMajorStart;
    }

    set bearingTickMajorStart(newValue) {
        let oldValue = this.bearingTickMajorStart;
        this._bearingTickMajorStart = newValue;

        if (this.bearingTickMajorInterval != undefined && this.bearingTickMajorInterval > 0) {
            this._bearingTickMajorAngles = this._calculateIntervals(this.bearingTickMajorStart, this.bearingTickMajorInterval);
        }

        this.onOptionChanged("bearingTickMajorStart", oldValue, newValue);
    }

    get bearingTickMajorInterval() {
        return this._bearingTickMajorInterval;
    }

    set bearingTickMajorInterval(newValue) {
        let oldValue = this.bearingTickMajorInterval;
        this._bearingTickMajorInterval = newValue;

        if (this.bearingTickMajorStart != undefined) {
            this._bearingTickMajorAngles = this._calculateIntervals(this.bearingTickMajorStart, this.bearingTickMajorInterval);
        }

        this.onOptionChanged("bearingTickMajorInterval", oldValue, newValue);
    }

    get bearingTickMajorAngles() {
        return this._bearingTickMajorAngles;
    }

    get bearingLabelStart() {
        return this._bearingLabelStart;
    }

    set bearingLabelStart(newValue) {
        let oldValue = this.bearingLabelStart;
        this._bearingLabelStart = newValue;

        if (this.bearingLabelInterval != undefined && this.bearingLabelInterval > 0) {
            this._bearingLabelAngles = this._calculateIntervals(this.bearingLabelStart, this.bearingLabelInterval);
        }

        this.onOptionChanged("bearingLabelStart", oldValue, newValue);
    }

    get bearingLabelInterval() {
        return this._bearingLabelInterval;
    }

    set bearingLabelInterval(newValue) {
        let oldValue = this.bearingLabelInterval;
        this._bearingLabelInterval = newValue;

        if (this.bearingLabelStart != undefined) {
            this._bearingLabelAngles = this._calculateIntervals(this.bearingLabelStart, this.bearingLabelInterval);
        }

        this.onOptionChanged("bearingLabelInterval", oldValue, newValue);
    }

    get bearingLabelAngles() {
        return this._bearingLabelAngles;
    }

    _createHTMLElement() {
        let topLevel = super._createHTMLElement();

        this._compassContainer = document.createElement("div");
        this._compassContainer.style.position = "absolute";
        this._compassContainer.style.width = "100%";
        this._compassContainer.style.height = "100%";
        this._compassContainer.style.zIndex = 1;
        this._labelContainer = document.createElement("div");
        this._labelContainer.style.position = "absolute";
        this._labelContainer.style.width = "100%";
        this._labelContainer.style.height = "100%";
        this._labelContainer.style.zIndex = 2;

        this._rangeLabel = new WT_MapViewRangeLabel("");
        let labelElement = this._rangeLabel.labelElement;
        labelElement.style.position = "absolute";
        labelElement.style.transform = "translate(-50%, -50%)";
        this._labelContainer.appendChild(labelElement);

        topLevel.appendChild(this._compassContainer);
        topLevel.appendChild(this._labelContainer);

        return topLevel;
    }

    onOptionChanged(name, oldValue, newValue) {
        switch (name) {
            case "center":
                if (oldValue && newValue && (oldValue.x !== newValue.x || oldValue.y !== newValue.y)) {
                    this._needRedrawArc = true;
                    this._needRedrawBearings = true;
                    this._needRedrawForwardTick = true;
                    this._needReclipTicks = true;
                    this._needRepositionLabel = true;
                }
                break;

            case "radius":
                this._needRedrawArc = true;
                this._needRedrawBearings = true;
                this._needRedrawForwardTick = true;
                this._needReclipTicks = true;
                this._needRepositionLabel = true;
                break;

            case "facing":
                this._needRotateArc = true;
                this._needReclipTicks = true;
                this._needRepositionLabel = true;
                break;

            case "rotation":
                this._needRotateBearingTicks = true;
            case "forwardTickAngle":
                this._needRotateForwardTick = true;
                break;

            case "arcStrokeWidth":
            case "arcStrokeColor":
            case "arcOutlineWidth":
            case "arcOutlineColor":
                this._needRedrawBearings = true;
                this._needRedrawForwardTick = true;
            case "arcAngularWidth":
            case "arcEndTickLength":
                this._needRedrawArc = true;
                this._needReclipTicks = true;
                break;

            case "bearingLabelFont":
            case "bearingLabelFontColor":
            case "bearingLabelFontSize":
            case "bearingLabelFontOutlineWidth":
            case "bearingLabelFontOutlineColor":
                this._needRestyleBearingLabels = true;
            case "bearingTickMinorStart":
            case "bearingTickMinorInterval":
            case "bearingTickMinorLength":
            case "bearingTickMajorStart":
            case "bearingTickMajorInterval":
            case "bearingTickMajorLength":
            case "bearingLabelStart":
            case "bearingLabelInterval":
            case "bearingLabelOffset":
                this._needRedrawBearings = true;
                this._needReclipTicks = true;
                break;

            case "forwardTickLength":
                this._needRedrawForwardTick = true;
                this._needReclipTicks = true;
                break;

            case "labelAngle":
            case "labelOffset":
                this._needRepositionLabel = true;
                break;
        }
    }

    isVisible(data) {
        return data.model.rangeCompass.show;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewRangeCompassArcLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    onViewSizeChanged(data) {
        super.onViewSizeChanged(data);

        this._needRedrawArc = true;
        this._needRedrawBearings = true;
        this._needRepositionLabel = true;
    }

    _applyStrokeToContext(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.stroke();
    }

    _composeArcPath(center, radius, angularWidth, leftTickStart, leftTickEnd, rightTickStart, rightTickEnd) {
        this.arcLayer.context.beginPath();
        this.arcLayer.context.moveTo(leftTickStart.x, leftTickStart.y);
        this.arcLayer.context.lineTo(leftTickEnd.x, leftTickEnd.y);
        this.arcLayer.context.arc(center.x, center.y, radius, (-angularWidth - Math.PI) / 2, (angularWidth - Math.PI) / 2);
        this.arcLayer.context.lineTo(rightTickEnd.x, rightTickEnd.y);
    }

    _rotateArc() {
        this.arcLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.arcLayer.canvas.style.transform = `rotate(${this.facing}deg)`;
    }

    _updateArc(data) {
        if (!this._needRedrawArc && !this._needRotateArc) {
            return;
        }

        this._rotateArc();
        this._needRotateArc = false;

        if (!this._needRedrawArc) {
            return;
        }

        this.arcLayer.context.clearRect(this._arcLastDrawnBounds.left, this._arcLastDrawnBounds.top, this._arcLastDrawnBounds.width, this._arcLastDrawnBounds.height);

        let center = this.center;
        let arcAngularWidthRad = this.arcAngularWidth * Avionics.Utils.DEG2RAD;
        let arcLeftTickStart = center.add(WT_GVector2.fromPolar(this.radius + this.arcEndTickLength, -arcAngularWidthRad / 2));
        let arcLeftTickEnd = center.add(WT_GVector2.fromPolar(this.radius, -arcAngularWidthRad / 2));
        let arcRightTickStart = center.add(WT_GVector2.fromPolar(this.radius, arcAngularWidthRad / 2));
        let arcRightTickEnd = center.add(WT_GVector2.fromPolar(this.radius + this.arcEndTickLength, arcAngularWidthRad / 2));
        this._composeArcPath(center, this.radius, arcAngularWidthRad, arcLeftTickStart, arcLeftTickEnd, arcRightTickStart, arcRightTickEnd);

        if (this.arcOutlineWidth > 0) {
            this._applyStrokeToContext(this.arcLayer.context, (this.arcSrrokeWidth + this.arcOutlineWidth * 2) * data.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.arcLayer.context, this.arcStrokeWidth * data.dpiScale, this.arcStrokeColor);

        let thick = (this.arcStrokeWidth / 2 + this.arcOutlineWidth) * data.dpiScale;
        let arcApexLeft = center.x - this.radius;
        let arcApexRight = center.x + this.radius;
        let arcApexTop = center.y - this.radius;
        this._arcLastDrawnBounds.left = Math.min(arcApexLeft, arcLeftTickStart.x) - thick - 5;
        this._arcLastDrawnBounds.top = Math.min(arcApexTop, arcLeftTickStart.y) - thick - 5;
        this._arcLastDrawnBounds.width = Math.max(arcApexRight, arcRightTickEnd.x) + thick + 5 - this._arcLastDrawnBounds.left;
        this._arcLastDrawnBounds.height = Math.max(arcLeftTickStart.y, arcLeftTickEnd.y) + thick + 5 - this._arcLastDrawnBounds.top;

        this._needRedrawArc = false;
    }

    _calculateBearingBounds(canvas) {
        let left = Math.max(this.center.x - this.radius, 0);
        let top = Math.max(this.center.y - this.radius, 0);
        let width = Math.min(this.radius * 2, canvas.width - left);
        let height = Math.min(this.radius * 2, canvas.height - top);
        return {left: left, top: top, width: width, height: height};
    }

    _composeBearingTicksPath(minorTicks, majorTicks) {
        this.bearingTickLayer.buffer.context.beginPath();
        for (let tick of minorTicks) {
            this.bearingTickLayer.buffer.context.moveTo(tick.start.x, tick.start.y);
            this.bearingTickLayer.buffer.context.lineTo(tick.end.x, tick.end.y);
        }
        for (let tick of majorTicks) {
            this.bearingTickLayer.buffer.context.moveTo(tick.start.x, tick.start.y);
            this.bearingTickLayer.buffer.context.lineTo(tick.end.x, tick.end.y);
        }
    }

    _rotateBearingTicks() {
        this.bearingTickLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.bearingTickLayer.canvas.style.transform = `rotate(${this.rotation}deg)`;
    }

    _calculateBearingLabelPosition(angle, text, tickLengthPx, offsetPx, fontSizePx) {
        let viewAngleRad = (angle + this.rotation) * Avionics.Utils.DEG2RAD;
        let textWidth = this.bearingLabelLayer.buffer.context.measureText(text).width;
        let textHeight = fontSizePx;

        let textBoundsOffset = new WT_GVector2(-textWidth / 2, textHeight / 2);
        let radius = this.radius - tickLengthPx - textBoundsOffset.length - offsetPx;

        return this.center.add(WT_GVector2.fromPolar(radius, viewAngleRad), true).add(textBoundsOffset, true);
    }

    _drawBearingLabelToBuffer(angle, tickLengthPx, offsetPx, fontSizePx) {
        let text = angle.toString().padStart(3, "0");
        let position = this._calculateBearingLabelPosition(angle, text, tickLengthPx, offsetPx, fontSizePx);

        if (this.bearingLabelFontOutlineWidth > 0) {
            this.bearingLabelLayer.buffer.context.strokeText(text, position.x, position.y);
        }
        this.bearingLabelLayer.buffer.context.fillText(text, position.x, position.y);
    }

    _drawBearingLabels(data, toDrawBounds) {
        this.bearingLabelLayer.buffer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);
        this.bearingLabelLayer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);

        if (this._needRestyleBearingLabels) {
            if (this.bearingLabelFontOutlineWidth > 0) {
                this.bearingLabelLayer.buffer.context.lineWidth = this.bearingLabelFontOutlineWidth * data.dpiScale * 2;
                this.bearingLabelLayer.buffer.context.strokeStyle = this.bearingLabelFontOutlineWidth;
            }

            this.bearingLabelLayer.buffer.context.font = `${this.bearingLabelFontSize * data.dpiScale}px ${this.bearingLabelFont}`;
            this.bearingLabelLayer.buffer.context.fontSize = this.bearingLabelFontSize;
            this.bearingLabelLayer.buffer.context.fillStyle = this.bearingLabelFontColor;

            this._needRestyleBearingLabels = false;
        }

        let halfAngularWidth = this.arcAngularWidth / 2;
        let centerAngle = (-this.rotation + this.facing + 360) % 360;
        let bearingLabelToDrawAngles = this.bearingLabelAngles.filter(angle => Math.min(Math.abs(angle - centerAngle), 360 - Math.abs(angle - centerAngle)) <= halfAngularWidth);

        let tickLengthPx = Math.max(this.bearingTickMinorLength, this.bearingTickMajorLength) * data.dpiScale;
        let offsetPx = this.bearingLabelOffset * data.dpiScale;
        let fontSizePx = this.bearingLabelFontSize * data.dpiScale;
        for (let angle of bearingLabelToDrawAngles) {
            this._drawBearingLabelToBuffer(angle, tickLengthPx, offsetPx, fontSizePx);
        }
        this.bearingLabelLayer.copyBufferToCanvas(toDrawBounds.left, toDrawBounds.top, toDrawBounds.width, toDrawBounds.height)
    }

    _updateBearings(data) {
        if (!this._needRedrawBearings && !this._needRotateBearingTicks) {
            return;
        }

        let toDrawBounds = this._calculateBearingBounds(this.bearingTickLayer.canvas);

        this._drawBearingLabels(data, toDrawBounds);
        this._rotateBearingTicks();
        this._needRotateBearingTicks = false;

        if (!this._needRedrawBearings) {
            return;
        }

        this.bearingTickLayer.buffer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);
        this.bearingTickLayer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);

        let center = this.center;
        let minorTicks = this.bearingTickMinorAngles.map((function(angle) {
            return {
                start: center.add(WT_GVector2.fromPolar(this.radius - this.bearingTickMinorLength * data.dpiScale, angle * Avionics.Utils.DEG2RAD)),
                end: center.add(WT_GVector2.fromPolar(this.radius, angle * Avionics.Utils.DEG2RAD))
            };
        }).bind(this));
        let majorTicks = this.bearingTickMajorAngles.map((function(angle) {
            return {
                start: center.add(WT_GVector2.fromPolar(this.radius - this.bearingTickMajorLength * data.dpiScale, angle * Avionics.Utils.DEG2RAD)),
                end: center.add(WT_GVector2.fromPolar(this.radius, angle * Avionics.Utils.DEG2RAD))
            };
        }).bind(this));

        this._composeBearingTicksPath(minorTicks, majorTicks);

        if (this.arcOutlineWidth > 0) {
            this._applyStrokeToContext(this.bearingTickLayer.buffer.context, (this.arcStrokeWidth + 2 * this.arcOutlineWidth) * data.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.bearingTickLayer.buffer.context, this.arcStrokeWidth * data.dpiScale, this.arcStrokeColor);

        this._bearingLastDrawnBounds = this.bearingTickLayer.copyBufferToCanvas(toDrawBounds.left, toDrawBounds.top, toDrawBounds.width, toDrawBounds.height);

        this._needRedrawBearings = false;
    }

    _rotateForwardTick() {
        this.forwardTickLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.forwardTickLayer.canvas.style.transform = `rotate(${this.forwardTickAngle}deg)`;
    }

    _composeForwardTickPath(begin, end) {
        this.forwardTickLayer.context.beginPath();
        this.forwardTickLayer.context.moveTo(begin.x, begin.y);
        this.forwardTickLayer.context.lineTo(end.x, end.y);
    }

    _drawForwardTick(data) {
        let angleRad = this.forwardTickAngle * Avionics.Utils.DEG2RAD;
        let lengthPx = this.forwardTickLength * data.dpiScale;
        let begin = this.center.add(WT_GVector2.fromPolar(this.radius, angleRad), true);
        let end = begin.add(WT_GVector2.fromPolar(lengthPx, angleRad));

        this.forwardTickLayer.context.clearRect(this._forwardTickLastDrawnBounds.left, this._forwardTickLastDrawnBounds.top, this._forwardTickLastDrawnBounds.width, this._forwardTickLastDrawnBounds.height)
        this._composeForwardTickPath(begin, end);

        if (this.arcOutlineWidth > 0) {
            this._applyStrokeToContext(this.forwardTickLayer.context, (this.arcStrokeWidth + 2 * this.arcOutlineWidth) * data.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.forwardTickLayer.context, this.arcStrokeWidth * data.dpiScale, this.arcStrokeColor);

        let thick = this.arcOutlineWidth + this.arcStrokeWidth / 2;
        let drawnLeft = Math.max(0, Math.min(begin.x, end.x) - thick - 5);
        let drawnTop = Math.max(0, Math.min(begin.y, end.y) - thick - 5);
        let drawnRight = Math.min(data.projection.viewWidth, Math.max(begin.x, end.x) + thick + 5);
        let drawnBottom = Math.min(data.projection.viewHeight, Math.max(begin.y, end.y) + thick + 5);

        this._forwardTickLastDrawnBounds.left = drawnLeft;
        this._forwardTickLastDrawnBounds.top = drawnTop;
        this._forwardTickLastDrawnBounds.width = drawnRight - drawnLeft;
        this._forwardTickLastDrawnBounds.height = drawnBottom - drawnTop;
    }

    _updateForwardTick(data) {
        if (!this._needRedrawForwardTick && !this._needRotateForwardTick) {
            return;
        }

        this._rotateForwardTick();
        this._needRotateForwardTick = false;

        if (!this._needRedrawForwardTick) {
            return;
        }

        this._drawForwardTick(data);
    }

    _reclipTicks(data) {
        if (!this._needReclipTicks) {
            return;
        }

        let thick = (this.arcStrokeWidth / 2 + this.arcOutlineWidth) * data.dpiScale;
        let innerToOuterLength = Math.max(this.arcEndTickLength * data.dpiScale, this.forwardTickLength * data.dpiScale) + thick + 5;
        let totalRadius = this.radius + Math.max(this.arcEndTickLength * data.dpiScale, this.forwardTickLength * data.dpiScale);
        let facingRad = this.facing * Avionics.Utils.DEG2RAD;
        let leftAngleRad = (-this.arcAngularWidth / 2 + this.facing) * Avionics.Utils.DEG2RAD;

        // use origin as center to simplify calcs
        let center = this.center;
        let leftInner1 = center.add(WT_GVector2.fromPolar(this.radius - thick / 2, leftAngleRad));
        let leftInner2 = leftInner1.add(WT_GVector2.fromPolar(thick / 2, leftAngleRad - Math.PI / 2));
        let leftOuter = leftInner2.add(WT_GVector2.fromPolar(innerToOuterLength, leftAngleRad));

        let reflect = WT_GTransform2.reflect(facingRad, this.center);

        let rightInner1 = reflect.apply(leftInner1);
        let rightInner2 = reflect.apply(leftInner2);
        let rightOuter = reflect.apply(leftOuter);

        this.bearingTickLayer.container.style.webkitClipPath = `path('` +
            `M${center.x},${center.y} ` +
            `L${leftInner1.x},${leftInner1.y} ` +
            `L${leftInner2.x},${leftInner2.y} ` +
            `L${leftOuter.x},${leftOuter.y} ` +
            `A${totalRadius},${totalRadius},0,0,1,${rightOuter.x},${rightOuter.y} ` +
            `L${rightInner2.x},${rightInner2.y} ` +
            `L${rightInner1.x},${rightInner1.y} ` +
            `Z` +
        `')`;

        this._needReclipTicks = false;
    }

    _updateLabel(data) {
        this.rangeLabel.onUpdate(data);

        if (!this._needRepositionLabel) {
            return;
        }

        let position = this.center.add(WT_GVector2.fromPolar(this.radius + this.labelOffset * data.dpiScale, (this.labelAngle + this.facing) * Avionics.Utils.DEG2RAD), true);
        this.rangeLabel.labelElement.style.left = `${position.x}px`;
        this.rangeLabel.labelElement.style.top = `${position.y}px`;

        this._needRepositionLabel = false;
    }

    onUpdate(data) {
        this.center = data.projection.viewTarget;
        this.radius = data.model.range.ratio(data.projection.range) * data.projection.viewHeight;
        this.facing = this.facingAngleGetter.getFacingAngle(data);

        let magVar = data.model.units.bearing === WT_MapModelUnitsModule.Bearing.MAGNETIC ? data.model.airplane.magVar : 0;
        this.rotation = data.projection.rotation + magVar;

        this.forwardTickAngle = this.forwardTickBearingGetter.getForwardTickBearing(data) + data.projection.rotation;

        this._updateArc(data);
        this._updateBearings(data);
        this._updateForwardTick(data);
        this._reclipTicks(data);
        this._updateLabel(data);
    }
}
WT_MapViewRangeCompassArcLayer.CLASS_DEFAULT = "rangeCompassLayer";
WT_MapViewRangeCompassArcLayer.CONFIG_NAME_DEFAULT = "rangeCompass";
WT_MapViewRangeCompassArcLayer.OPTIONS_DEF = {
    center: {},
    radius: {default: 0, auto: true, observed: true},
    facing: {default: 0, auto: true, observed: true},
    rotation: {default: 0, auto: true, observed: true},
    forwardTickAngle: {default: 0, auto: true, observed: true},

    arcStrokeWidth: {default: 2, auto: true, observed: true},
    arcStrokeColor: {default: "#ffffff", auto: true, observed: true},
    arcOutlineWidth: {default: 0, auto: true, observed: true},
    arcOutlineColor: {default: "#000000", auto: true, observed: true},
    arcAngularWidth: {default: 122, auto: true, observed: true},
    arcEndTickLength: {default: 10, auto: true, observed: true},

    bearingTickMinorStart: {default: 0, auto: false, observed: true},
    bearingTickMinorInterval: {default: 10, auto: false, observed: true},
    bearingTickMinorLength: {default: 5, auto: true, observed: true},

    bearingTickMajorStart: {default: 0, auto: false, observed: true},
    bearingTickMajorInterval: {default: 30, auto: false, observed: true},
    bearingTickMajorLength: {default: 10, auto: true, observed: true},

    bearingLabelStart: {default: 0, auto: false, observed: true},
    bearingLabelInterval: {default: 30, auto: false, observed: true},
    bearingLabelOffset: {default: 1, auto: true, observed: true},
    bearingLabelFont: {default: "Roboto", auto: true, observed: true},
    bearingLabelFontColor: {default: "#ffffff", auto: true, observed: true},
    bearingLabelFontSize: {default: 20, auto: true, observed: true},
    bearingLabelFontOutlineWidth: {default: 6, auto: true, observed: true},
    bearingLabelFontOutlineColor: {default: "#000000", auto: true, observed: true},

    forwardTickLength: {default: 10, auto: true, observed: true},

    labelAngle: {default: -45, auto: true, observed: true},
    labelOffset: {default: 0, auto: true, observed: true}
};
WT_MapViewRangeCompassArcLayer.CONFIG_PROPERTIES = [
    "arcStrokeWidth",
    "arcStrokeColor",
    "arcOutlineWidth",
    "arcOutlineColor",
    "arcAngularWidth",
    "bearingTickMinorStart",
    "bearingTickMinorInterval",
    "bearingTickMinorLength",
    "bearingTickMajorStart",
    "bearingTickMajorInterval",
    "bearingTickMajorLength",
    "bearingLabelStart",
    "bearingLabelInterval",
    "bearingLabelOffset",
    "bearingLabelFont",
    "bearingLabelFontColor",
    "bearingLabelFontSize",
    "bearingLabelFontOutlineWidth",
    "bearingLabelFontOutlineColor",
    "forwardTickLength",
    "labelAngle",
    "labelOffset",
];