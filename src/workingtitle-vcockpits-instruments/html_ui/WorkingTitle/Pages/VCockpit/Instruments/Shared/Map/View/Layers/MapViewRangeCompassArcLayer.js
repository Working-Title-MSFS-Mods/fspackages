/**
 * A range compass. This layer draws a compass arc of arbitrary angular width and facing centered on the map model's target position.
 * The radius of the arc is equal to the map model's nominal range. A label which displays the map's nominal range is also drawn next to the arc.
 * Inside the arc, ticks mark bearing angles. There is support for minor and major tick variants that can be of different lengths.
 * Certain bearing angles can also be marked with text labels. Finally, the compass arc has an outside, forward tick that can be used to
 * mark an arbitrary bearing angle. The use of this layer requires the .rangeCompass module to be added to the map model.
 */
class WT_MapViewRangeCompassArcLayer extends WT_MapViewMultiLayer {
    /**
     * @param {{getForwardTickBearing(state:WT_MapViewState):Number}} forwardTickBearingGetter - defines which bearing the new compass arc's forward tick should track
     *                                                                                           by implementing the getForwardTickBearing() method.
     * @param {{getFacingAngle(state:WT_MapViewState):Number}} [facingAngleGetter] - defines which angle (in viewing window space) the compass arc should face by
     *                                                                               implementing the getFacingAngle() method. An angle of 0 degrees indicates straight
     *                                                                               up, with increasing values proceeding clockwise. If this argument is not supplied,
     *                                                                               then the compass arc will default to always face straight up.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(forwardTickBearingGetter, facingAngleGetter = {getFacingAngle: state => 0}, className = WT_MapViewRangeCompassArcLayer.CLASS_DEFAULT, configName = WT_MapViewRangeCompassArcLayer.CONFIG_NAME_DEFAULT) {
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

    /**
     * @property {WT_GVector2} center - the center point of the arc, in pixel coordinates.
     * @type {WT_GVector2}
     */
    get center() {
        return this._center.copy();
    }

    set center(newValue) {
        let oldValue = this.center;
        this._center.set(newValue);
        this.onOptionChanged("center", oldValue, newValue);
    }

    /**
     * @readonly
     * @property {HTMLDivElement} compassContainer - the parent HTML element of all of this compass arc's graphical elements except the label.
     * @type {HTMLDivElement}
     */
    get compassContainer() {
        return this._compassContainer;
    }

    /**
     * @readonly
     * @property {HTMLDivElement} labelContainer - the parent HTML element of this compass arc's label.
     * @type {HTMLDivElement}
     */
    get labelContainer() {
        return this._labelContainer;
    }

    /**
     * @readonly
     * @property {WT_MapViewCanvas} arcLayer - the canvas sublayer on which this compass's arc is drawn.
     * @type {WT_MapViewCanvas}
     */
    get arcLayer() {
        return this._arcLayer;
    }

    /**
     * @readonly
     * @property {WT_MapViewCanvas} bearingTickLayer - the canvas sublayer on which this compass's bearing ticks are drawn.
     * @type {WT_MapViewCanvas}
     */
    get bearingTickLayer() {
        return this._bearingTickLayer;
    }

    /**
     * @readonly
     * @property {WT_MapViewCanvas} forwardTickLayer - the canvas sublayer on which this compass's forward tick is drawn.
     * @type {WT_MapViewCanvas}
     */
    get forwardTickLayer() {
        return this._forwardTickLayer;
    }

    /**
     * @readonly
     * @property {WT_MapViewCanvas} bearingLabelLayer - the canvas sublayer on which this compass's bearing labels are drawn.
     * @type {WT_MapViewCanvas}
     */
    get bearingLabelLayer() {
        return this._bearingLabelLayer;
    }

    /**
     * @readonly
     * @property {WT_MapViewRangeLabel} rangeLabel - this compass's range label object.
     * @type {WT_MapViewRangeLabel}
     */
    get rangeLabel() {
        return this._rangeLabel;
    }

    /**
     * Calculates a list of regularly spaced angles through 360 degrees of arc from a given starting angle and spacing interval.
     * @param {Number} start - the starting angle.
     * @param {Number} interval - the spacing interval.
     * @return {Number[]} a list of angles beginning with start and with spacing equal to interval through 360 degrees of arc.
     */
    _calculateIntervals(start, interval) {
        let count = Math.floor(360 / interval);
        return [...new Array(count).keys()].map(e => (start + interval * e) % 360);
    }

    /**
     * @property {Number} bearingTickMinorStart - the starting angle for this compass's minor bearing ticks.
     * @type {Number}
     */
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

    /**
     * @property {Number} bearingTickMinorInterval - the interval for this compass's minor bearing ticks.
     * @type {Number}
     */
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

    /**
     * @readonly
     * @property {Number[]} bearingTickMinorAngles - the list of bearing angles to show with minor bearing ticks.
     * @type {Number[]}
     */
    get bearingTickMinorAngles() {
        return this._bearingTickMinorAngles;
    }

    /**
     * @property {Number} bearingTickMajorStart - the starting angle for this compass's major bearing ticks.
     * @type {Number}
     */
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

    /**
     * @property {Number} bearingTickMajorInterval - the interval for this compass's major bearing ticks.
     * @type {Number}
     */
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

    /**
     * @readonly
     * @property {Number[]} bearingTickMajorAngles - the list of bearing angles to show with major bearing ticks.
     * @type {Number[]}
     */
    get bearingTickMajorAngles() {
        return this._bearingTickMajorAngles;
    }

    /**
     * @property {Number} bearingLabelStart - the starting angle for this compass's bearing labels.
     * @type {Number}
     */
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

    /**
     * @property {Number} bearingLabelStart - the interval for this compass's bearing labels.
     * @type {Number}
     */
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

    /**
     * @readonly
     * @property {Number[]} bearingLabelAngles - the list of bearing angles to label.
     * @type {Number[]}
     */
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

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.rangeCompass.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewRangeCompassArcLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onViewSizeChanged(state) {
        super.onViewSizeChanged(state);

        this._needRedrawArc = true;
        this._needRedrawBearings = true;
        this._needRepositionLabel = true;
    }

    /**
     * Applies a stroke to a canvas rendering context using the specified styles.
     * @param {CanvasRenderingContext2D} context - the rendering context to which to apply the stroke.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     */
    _applyStrokeToContext(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.stroke();
    }

    /**
     * Loads the path definition of this compass's arc into the appropriate canvas rendering context.
     * @param {{x:Number, y:Number}} center - the center point of this compass, in pixel coordinates.
     * @param {Number} radius - the radius of this compass, in pixels.
     * @param {Number} angularWidth - the angular width of this compass's arc, in degrees.
     * @param {{x:Number, y:Number}} leftTickStart - the starting point of the arc's left outer tick, in pixel coordinates.
     * @param {{x:Number, y:Number}} leftTickEnd - the end point of the arc's left outer tick, in pixel coordinates.
     * @param {{x:Number, y:Number}} rightTickStart - the starting point of the arc's right outer tick, in pixel coordinates.
     * @param {{x:Number, y:Number}} rightTickEnd - the end point of the arc's right outer tick, in pixel coordinates.
     */
    _composeArcPath(center, radius, angularWidth, leftTickStart, leftTickEnd, rightTickStart, rightTickEnd) {
        this.arcLayer.context.beginPath();
        this.arcLayer.context.moveTo(leftTickStart.x, leftTickStart.y);
        this.arcLayer.context.lineTo(leftTickEnd.x, leftTickEnd.y);
        this.arcLayer.context.arc(center.x, center.y, radius, (-angularWidth - Math.PI) / 2, (angularWidth - Math.PI) / 2);
        this.arcLayer.context.lineTo(rightTickEnd.x, rightTickEnd.y);
    }

    /**
     * Updates the rotation of this compass's arc.
     */
    _rotateArc() {
        this.arcLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.arcLayer.canvas.style.transform = `rotate(${this.facing}deg)`;
    }

    /**
     * Updates this compass's arc.
     * @param {WT_MapViewState} state - current map view state.
     */
    _updateArc(state) {
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
            this._applyStrokeToContext(this.arcLayer.context, (this.arcSrrokeWidth + this.arcOutlineWidth * 2) * state.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.arcLayer.context, this.arcStrokeWidth * state.dpiScale, this.arcStrokeColor);

        let thick = (this.arcStrokeWidth / 2 + this.arcOutlineWidth) * state.dpiScale;
        let arcApexLeft = center.x - this.radius;
        let arcApexRight = center.x + this.radius;
        let arcApexTop = center.y - this.radius;
        this._arcLastDrawnBounds.left = Math.min(arcApexLeft, arcLeftTickStart.x) - thick - 5;
        this._arcLastDrawnBounds.top = Math.min(arcApexTop, arcLeftTickStart.y) - thick - 5;
        this._arcLastDrawnBounds.width = Math.max(arcApexRight, arcRightTickEnd.x) + thick + 5 - this._arcLastDrawnBounds.left;
        this._arcLastDrawnBounds.height = Math.max(arcLeftTickStart.y, arcLeftTickEnd.y) + thick + 5 - this._arcLastDrawnBounds.top;

        this._needRedrawArc = false;
    }

    /**
     * Calculates the minimum bounds of the area needed to draw this compass's bearing ticks.
     * @param {HTMLCanvasElement} canvas - the canvas element on which the bearing ticks will be drawn.
     * @returns {{left:Number, top:Number, width:Number, height:Number}} the bounds of the area needed to draw this compass's bearing ticks.
     */
    _calculateBearingBounds(canvas) {
        let left = Math.max(this.center.x - this.radius, 0);
        let top = Math.max(this.center.y - this.radius, 0);
        let width = Math.min(this.radius * 2, canvas.width - left);
        let height = Math.min(this.radius * 2, canvas.height - top);
        return {left: left, top: top, width: width, height: height};
    }

    /**
     * Loads the path definitions of the specified bearing ticks into the appropriate canvas rendering context.
     * @param {{start:{x:Number, y:Number}, end:{x:Number, y:Number}}[]} minorTicks - an array of start and end points for the minor ticks to draw.
     * @param {{start:{x:Number, y:Number}, end:{x:Number, y:Number}}[]} majorTicks - an array of start and end points for the major ticks to draw.
     */
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

    /**
     * Updates the rotation of this compass's bearing ticks.
     */
    _rotateBearingTicks() {
        this.bearingTickLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.bearingTickLayer.canvas.style.transform = `rotate(${this.rotation}deg)`;
    }

    /**
     * Calculates the desired position of a bearing label.
     * @param {Number} angle - the bearing angle of the label.
     * @param {String} text - the text content of the label.
     * @param {Number} tickLengthPx - the length of the bearing tick, in pixels, associated with the label.
     * @param {Number} offsetPx - the offset distance of the label, in pixels, from the inner end of its associated bearing tick.
     * @param {Number} fontSizePx - the font size of the label.
     */
    _calculateBearingLabelPosition(angle, text, tickLengthPx, offsetPx, fontSizePx) {
        let viewAngleRad = (angle + this.rotation) * Avionics.Utils.DEG2RAD;
        let textWidth = this.bearingLabelLayer.buffer.context.measureText(text).width;
        let textHeight = fontSizePx;

        let textBoundsOffset = new WT_GVector2(-textWidth / 2, textHeight / 2);
        let radius = this.radius - tickLengthPx - textBoundsOffset.length - offsetPx;

        return this.center.add(WT_GVector2.fromPolar(radius, viewAngleRad), true).add(textBoundsOffset, true);
    }

    /**
     * Draws a bearing label associated with a specific bearing to an offscreen buffer.
     * @param {Number} angle - the bearing angle of the label.
     * @param {Number} tickLengthPx - the length of the bearing tick, in pixels, associated with the label.
     * @param {Number} offsetPx - the offset distance of the label, in pixels, from the inner end of its associated bearing tick.
     * @param {Number} fontSizePx - the font size of the label.
     */
    _drawBearingLabelToBuffer(angle, tickLengthPx, offsetPx, fontSizePx) {
        let text = angle.toString().padStart(3, "0");
        let position = this._calculateBearingLabelPosition(angle, text, tickLengthPx, offsetPx, fontSizePx);

        if (this.bearingLabelFontOutlineWidth > 0) {
            this.bearingLabelLayer.buffer.context.strokeText(text, position.x, position.y);
        }
        this.bearingLabelLayer.buffer.context.fillText(text, position.x, position.y);
    }

    /**
     * Draws this compass's bearing labels to canvas.
     * @param {WT_MapViewState} state - current map view state.
     */
    _drawBearingLabels(state, toDrawBounds) {
        this.bearingLabelLayer.buffer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);
        this.bearingLabelLayer.context.clearRect(this._bearingLastDrawnBounds.left, this._bearingLastDrawnBounds.top, this._bearingLastDrawnBounds.width, this._bearingLastDrawnBounds.height);

        if (this._needRestyleBearingLabels) {
            if (this.bearingLabelFontOutlineWidth > 0) {
                this.bearingLabelLayer.buffer.context.lineWidth = this.bearingLabelFontOutlineWidth * state.dpiScale * 2;
                this.bearingLabelLayer.buffer.context.strokeStyle = this.bearingLabelFontOutlineWidth;
            }

            this.bearingLabelLayer.buffer.context.font = `${this.bearingLabelFontSize * state.dpiScale}px ${this.bearingLabelFont}`;
            this.bearingLabelLayer.buffer.context.fontSize = this.bearingLabelFontSize;
            this.bearingLabelLayer.buffer.context.fillStyle = this.bearingLabelFontColor;

            this._needRestyleBearingLabels = false;
        }

        let halfAngularWidth = this.arcAngularWidth / 2;
        let centerAngle = (-this.rotation + this.facing + 360) % 360;
        let bearingLabelToDrawAngles = this.bearingLabelAngles.filter(angle => Math.min(Math.abs(angle - centerAngle), 360 - Math.abs(angle - centerAngle)) <= halfAngularWidth);

        let tickLengthPx = Math.max(this.bearingTickMinorLength, this.bearingTickMajorLength) * state.dpiScale;
        let offsetPx = this.bearingLabelOffset * state.dpiScale;
        let fontSizePx = this.bearingLabelFontSize * state.dpiScale;
        for (let angle of bearingLabelToDrawAngles) {
            this._drawBearingLabelToBuffer(angle, tickLengthPx, offsetPx, fontSizePx);
        }
        this.bearingLabelLayer.copyBufferToCanvas(toDrawBounds.left, toDrawBounds.top, toDrawBounds.width, toDrawBounds.height)
    }

    /**
     * Updates this compass's bearing ticks and labels.
     * @param {WT_MapViewState} state - current map view state.
     */
    _updateBearings(state) {
        if (!this._needRedrawBearings && !this._needRotateBearingTicks) {
            return;
        }

        let toDrawBounds = this._calculateBearingBounds(this.bearingTickLayer.canvas);

        this._drawBearingLabels(state, toDrawBounds);
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
                start: center.add(WT_GVector2.fromPolar(this.radius - this.bearingTickMinorLength * state.dpiScale, angle * Avionics.Utils.DEG2RAD)),
                end: center.add(WT_GVector2.fromPolar(this.radius, angle * Avionics.Utils.DEG2RAD))
            };
        }).bind(this));
        let majorTicks = this.bearingTickMajorAngles.map((function(angle) {
            return {
                start: center.add(WT_GVector2.fromPolar(this.radius - this.bearingTickMajorLength * state.dpiScale, angle * Avionics.Utils.DEG2RAD)),
                end: center.add(WT_GVector2.fromPolar(this.radius, angle * Avionics.Utils.DEG2RAD))
            };
        }).bind(this));

        this._composeBearingTicksPath(minorTicks, majorTicks);

        if (this.arcOutlineWidth > 0) {
            this._applyStrokeToContext(this.bearingTickLayer.buffer.context, (this.arcStrokeWidth + 2 * this.arcOutlineWidth) * state.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.bearingTickLayer.buffer.context, this.arcStrokeWidth * state.dpiScale, this.arcStrokeColor);

        this._bearingLastDrawnBounds = this.bearingTickLayer.copyBufferToCanvas(toDrawBounds.left, toDrawBounds.top, toDrawBounds.width, toDrawBounds.height);

        this._needRedrawBearings = false;
    }

    /**
     * Updates this compass's forward tick rotation.
     */
    _rotateForwardTick() {
        this.forwardTickLayer.canvas.style.transformOrigin = `${this.center.x}px ${this.center.y}px`;
        this.forwardTickLayer.canvas.style.transform = `rotate(${this.forwardTickAngle}deg)`;
    }

    /**
     * Loads the path definition for this compass's forward tick to the appropriate canvas rendering context.
     * @param {{x:Number, y:Number}} begin - the starting point of the tick, in pixel coordinates.
     * @param {{x:Number, y:Number}} end - the ending point of the tick, in pixel coordinates.
     */
    _composeForwardTickPath(begin, end) {
        this.forwardTickLayer.context.beginPath();
        this.forwardTickLayer.context.moveTo(begin.x, begin.y);
        this.forwardTickLayer.context.lineTo(end.x, end.y);
    }

    /**
     * Draws this compass's forward tick to canvas.
     * @param {WT_MapViewState} state - current map view state.
     */
    _drawForwardTick(state) {
        let angleRad = this.forwardTickAngle * Avionics.Utils.DEG2RAD;
        let lengthPx = this.forwardTickLength * state.dpiScale;
        let begin = this.center.add(WT_GVector2.fromPolar(this.radius, angleRad), true);
        let end = begin.add(WT_GVector2.fromPolar(lengthPx, angleRad));

        this.forwardTickLayer.context.clearRect(this._forwardTickLastDrawnBounds.left, this._forwardTickLastDrawnBounds.top, this._forwardTickLastDrawnBounds.width, this._forwardTickLastDrawnBounds.height)
        this._composeForwardTickPath(begin, end);

        if (this.arcOutlineWidth > 0) {
            this._applyStrokeToContext(this.forwardTickLayer.context, (this.arcStrokeWidth + 2 * this.arcOutlineWidth) * state.dpiScale, this.arcOutlineColor);
        }
        this._applyStrokeToContext(this.forwardTickLayer.context, this.arcStrokeWidth * state.dpiScale, this.arcStrokeColor);

        let thick = this.arcOutlineWidth + this.arcStrokeWidth / 2;
        let drawnLeft = Math.max(0, Math.min(begin.x, end.x) - thick - 5);
        let drawnTop = Math.max(0, Math.min(begin.y, end.y) - thick - 5);
        let drawnRight = Math.min(state.projection.viewWidth, Math.max(begin.x, end.x) + thick + 5);
        let drawnBottom = Math.min(state.projection.viewHeight, Math.max(begin.y, end.y) + thick + 5);

        this._forwardTickLastDrawnBounds.left = drawnLeft;
        this._forwardTickLastDrawnBounds.top = drawnTop;
        this._forwardTickLastDrawnBounds.width = drawnRight - drawnLeft;
        this._forwardTickLastDrawnBounds.height = drawnBottom - drawnTop;
    }

    /**
     * Updates this compass's forward tick.
     * @param {WT_MapViewState} state - current map view state.
     */
    _updateForwardTick(state) {
        if (!this._needRedrawForwardTick && !this._needRotateForwardTick) {
            return;
        }

        this._rotateForwardTick();
        this._needRotateForwardTick = false;

        if (!this._needRedrawForwardTick) {
            return;
        }

        this._drawForwardTick(state);
    }

    /**
     * Updates the clipping bounds of this compass's bearing ticks.
     * @param {WT_MapViewState} state - current map view state.
     */
    _reclipTicks(state) {
        if (!this._needReclipTicks) {
            return;
        }

        let thick = (this.arcStrokeWidth / 2 + this.arcOutlineWidth) * state.dpiScale;
        let innerToOuterLength = Math.max(this.arcEndTickLength * state.dpiScale, this.forwardTickLength * state.dpiScale) + thick + 5;
        let totalRadius = this.radius + Math.max(this.arcEndTickLength * state.dpiScale, this.forwardTickLength * state.dpiScale);
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

    /**
     * Updates this compass's range label.
     * @param {WT_MapViewState} state - current map view state.
     */
    _updateLabel(state) {
        this.rangeLabel.onUpdate(state);

        if (!this._needRepositionLabel) {
            return;
        }

        let position = this.center.add(WT_GVector2.fromPolar(this.radius + this.labelOffset * state.dpiScale, (this.labelAngle + this.facing) * Avionics.Utils.DEG2RAD), true);
        this.rangeLabel.labelElement.style.left = `${position.x}px`;
        this.rangeLabel.labelElement.style.top = `${position.y}px`;

        this._needRepositionLabel = false;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.center = state.projection.viewTarget;
        this.radius = state.model.range.ratio(state.projection.range) * state.projection.viewHeight;
        this.facing = this.facingAngleGetter.getFacingAngle(state);

        let magVar = state.model.units.bearing === WT_MapModelUnitsModule.Bearing.MAGNETIC ? state.model.airplane.magVar : 0;
        this.rotation = state.projection.rotation + magVar;

        this.forwardTickAngle = this.forwardTickBearingGetter.getForwardTickBearing(state) + state.projection.rotation;

        this._updateArc(state);
        this._updateBearings(state);
        this._updateForwardTick(state);
        this._reclipTicks(state);
        this._updateLabel(state);
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