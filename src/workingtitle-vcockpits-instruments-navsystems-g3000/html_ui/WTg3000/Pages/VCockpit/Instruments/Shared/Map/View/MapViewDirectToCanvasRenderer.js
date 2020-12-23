class WT_MapViewDirectToCanvasRenderer {
    constructor() {
        this._directTo = null;
        this._directToListener = this._onDirectToEvent.bind(this);

        this._originRendered = null;
        this._destinationRendered = null;

        this._needsRedraw = false;

        this._optsManager = new WT_OptionsManager(this, WT_MapViewDirectToCanvasRenderer.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} directTo
     * @type {WT_FlightPlan}
     */
    get directTo() {
        return this._directTo;
    }

    needsRedraw() {
        return this._needsRedraw;
    }

    originRendered() {
        return this._originRendered;
    }

    destinationRendered() {
        return this._destinationRendered;
    }

    _onDirectToEvent(event) {
        this._needsRedraw = true;
    }

    setOptions(options) {
        this._optsManager.setOptions(options);
    }

    setDirectTo(directTo) {
        if (directTo === this.directTo) {
            return;
        }

        if (this.directTo) {
            this.directTo.removeListener(this._directToListener);
        }

        this._directTo = directTo;
        if (this.directTo) {
            this.directTo.addListener(this._directToListener);
        }
        this._needsRedraw = true;
    }

    _strokePath(context, lineWidth, strokeStyle, lineDash) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        if (lineDash) {
            context.setLineDash(lineDash);
        } else {
            context.setLineDash([]);
        }
        context.stroke();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     */
    render(state, projectionRenderer, context) {
        this._needsRedraw = false;

        this._originRendered = null;
        this._destinationRendered = null;

        if (!this.directTo || !this.directTo.isActive()) {
            return;
        }

        let bounds = projectionRenderer.viewClipExtent;
        let origin = this.directTo.getOrigin();
        let destination = this.directTo.getDestination();
        if (projectionRenderer.isInViewBounds(origin.location, bounds, 0.05)) {
            this._originRendered = origin;
        }
        if (projectionRenderer.isInViewBounds(destination.location, bounds, 0.05)) {
            this._destinationRendered = destination;
        }
        if (!this._originRendered && !this._destinationRendered) {
            return;
        }

        let geoJSON = {
            type: "LineString",
            coordinates: [[origin.location.long, origin.location.lat], [destination.location.long, destination.location.lat]]
        };
        context.beginPath();
        projectionRenderer.renderCanvas(geoJSON, context);

        let lineDash = this.lineDash.map(e => state.dpiScale * e);
        if (this.outlineWidth > 0) {
            this._strokePath(context, (2 * this.outlineWidth + this.strokeWidth) * state.dpiScale, this.outlineColor, lineDash);
        }
        this._strokePath(context, this.strokeWidth * state.dpiScale, this.strokeColor, lineDash);
    }
}
WT_MapViewDirectToCanvasRenderer.OPTIONS_DEF = {
    strokeWidth: {default: 4, auto: true},
    strokeColor: {default: "black", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "white", auto: true},
    lineDash: {default: [], auto: true}
};