class WT_MapViewPersistentCanvas extends WT_MapViewCanvas {
    constructor(overdrawFactor) {
        super(true, true);

        this._overdrawFactor = overdrawFactor;

        this._nominalWidth = 0;
        this._nominalHeight = 0;
        this._topLeft = new WT_GVector2(0, 0);
        this._margin = 0;

        this._clipExtent = [[0, 0], [0, 0]];
        this._translate = [0, 0];

        this._tempVector = new WT_GVector2(0, 0);
    }

    _createBuffer() {
        return new WT_MapViewPersistenCanvasDrawable();
    }

    _createDisplay() {
        let display = new WT_MapViewPersistenCanvasDrawable();
        display.canvas.style.position = "absolute";
        display.canvas.style.left = 0;
        display.canvas.style.top = 0;
        return display;
    }

    /**
     * @property {Number} width - the width, in pixels, of this sublayer.
     * @type {Number}
     */
    get width() {
        return this.display.canvas.width;
    }

    set width(width) {
        super.width = width;
        let left = -(width - this._nominalWidth) / 2;
        this.display.canvas.style.left = `${left}px`;
        this._topLeft.set(left, this._topLeft.y);
        this._clipExtent[1][0] = width;
        this._translate[0] = width / 2;
        this._updateProjectionRenderers();
    }

    /**
     * @property {Number} height - the height, in pixels, of this sublayer.
     * @type {Number}
     */
    get height() {
        return this.display.canvas.height;
    }

    set height(height) {
        super.height = height;
        let top = -(height - this._nominalHeight) / 2;
        this.display.canvas.style.top = `${top}px`;
        this._topLeft.set(this._topLeft.x, top);
        this._clipExtent[1][1] = height;
        this._translate[1] = height / 2;
        this._updateProjectionRenderers();
    }

    /**
     * @readonly
     * @property {Number} overdrawFactor - the factor by which to overdraw this canvas relative to the map view window.
     * @type {Number}
     */
    get overdrawFactor() {
        return this._overdrawFactor;
    }

    /**
     * @readonly
     * @property {Number} margin - the smallest possible margin, in pixels, between the edge of the visible map view window and
     *                             the edge of the canvas.
     * @type {Number}
     */
    get margin() {
        return this._margin;
    }

    /**
     * @readonly
     * @property {Boolean} isDisplayInvalid - whether the displayed canvas is invalid. The canvas is invalid if the current map projection
     *                                        range has changed since the last redraw or if the offset of the canvas in either the x- or y-
     *                                        axes is greater than the margin.
     * @type {Boolean}
     */
    get isDisplayInvalid() {
        return this._isDisplayInvalid;
    }

    /**
     * @readonly
     * @property {Boolean} isBufferInvalid - whether the buffer is invalid. The buffer is invalid if the current map projection range has
     *                                       changed since the last time the buffer was reset or if the offset of the buffer in either the
     *                                       x- or y- axes is greater than the margin.
     * @type {Boolean}
     */
    get isBufferInvalid() {
        return this._isBufferInvalid;
    }

    _updateProjectionRenderers() {
        if (this.display.projectionRenderer) {
            this.display.projectionRenderer.projection.clipExtent(this._clipExtent);
            this.buffer.projectionRenderer.projection.clipExtent(this._clipExtent);

            this.display.projectionRenderer.projection.translate(this._translate);
            this.buffer.projectionRenderer.projection.translate(this._translate);
        }
    }

    updateSize(width, height) {
        this._nominalWidth = width;
        this._nominalHeight = height;
        let long = Math.max(width, height);
        let size = long * this.overdrawFactor;

        this.width = size;
        this.height = size;
        this._margin = long * (this.overdrawFactor - 1.41421356237) / 2;
    }

    _syncDisplayFromBuffer() {
        this.display.reference.range.set(this.buffer.reference.range);
        this.display.reference._center.set(this.buffer.reference.center);
        this.display.reference.scale = this.buffer.reference.scale;
        this.display.reference.rotation = this.buffer.reference.rotation;

        this.display.projectionRenderer.projection.center(this.buffer.projectionRenderer.projection.center());
        this.display.projectionRenderer.projection.scale(this.buffer.projectionRenderer.projection.scale());
        this.display.projectionRenderer.projection.angle(this.buffer.projectionRenderer.projection.angle());
    }

    _updateReference(state, reference) {
        reference._range.set(state.projection.range);
        reference._center.set(state.projection.center);
        reference.scale = state.projection.scale;
        reference.rotation = state.projection.rotation;
    }

    initProjectionRenderers(projection) {
        this.display._projectionRenderer = projection.createCustomRenderer();
        this.buffer._projectionRenderer = projection.createCustomRenderer();
        this._updateProjectionRenderers();
    }

    _updateTransform(state, reference, transform) {
        transform.scale = state.projection.scale / reference.scale;
        transform.rotation = state.projection.rotation - reference.rotation;
        state.projection.project(reference.center, transform._offset).subtract(state.projection.viewCenter);
        transform.margin = this.margin * transform.scale;
    }

    _transformDisplay() {
        let transform = this.display.transform;
        let offset = this._tempVector.set(transform.offset).scale(1 / transform.scale);
        this.display.canvas.style.transform = `scale(${transform.scale}) translate(${offset.x}px, ${offset.y}px) rotate(${transform.rotation}deg)`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    resetBuffer(state) {
        this.buffer.clear();
        this.buffer._isInvalid = false;
        this._updateReference(state, this.buffer.reference);
        state.projection.syncRenderer(this.buffer.projectionRenderer);
    }

    redrawDisplay(state, fromBuffer = true) {
        this.display._isInvalid = false;
        this.display.clear();
        if (fromBuffer) {
            this.copyBufferToCanvas();
            this._syncDisplayFromBuffer();
        } else {
            this._updateReference(state, this.display.reference);
            state.projection.syncRenderer(this.display.projectionRenderer);

        }
        this._updateTransform(state, this.display.reference, this.display.transform);
        this._transformDisplay();
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        let range = state.projection.range;

        this._updateTransform(state, this.display.reference, this.display.transform);
        this._updateTransform(state, this.buffer.reference, this.buffer.transform);
        let offsetXAbsDisplay = Math.abs(this.display.transform.offset.x);
        let offsetYAbsDisplay = Math.abs(this.display.transform.offset.y);
        let offsetXAbsBuffer = Math.abs(this.buffer.transform.offset.x);
        let offsetYAbsBuffer = Math.abs(this.buffer.transform.offset.y);

        if (!this.display.isInvalid) {
            this.display._isInvalid = !this.display.reference.range.equals(range) ||
                                      (offsetXAbsDisplay > this.display.transform.margin || offsetYAbsDisplay > this.display.transform.margin);
        }

        if (!this.buffer.isInvalid) {
            this.buffer._isInvalid = !this.buffer.reference.range.equals(range) ||
                                     (offsetXAbsBuffer > this.buffer.transform.margin || offsetYAbsBuffer > this.buffer.transform.margin);
        }

        if (!this.display.isInvalid) {
            this._transformDisplay();
        }
    }
}

class WT_MapViewPersistenCanvasDrawable extends WT_MapViewCanvasDrawable {
    constructor() {
        super();

        this._reference = {
            _range: new WT_NumberUnit(-1, WT_Unit.NMILE),
            get range() {return this._range.readonly()},
            _center: new WT_GeoPoint(0, 0, 0),
            get center() {return this._center.readonly()},
            scale: 150,
            rotation: 0,
        };
        this._transform = {
            scale: 1,
            rotation: 0,
            _offset: new WT_GVector2(0, 0),
            get offset() {return this._offset.readonly()},
            margin: 0
        };
        this._isInvalid = false;
    }

    get reference() {
        return this._reference;
    }

    get transform() {
        return this._transform;
    }

    get isInvalid() {
        return this._isInvalid;
    }

    get projectionRenderer() {
        return this._projectionRenderer;
    }

    invalidate() {
        this._isInvalid = true;
        this.clear();
    }
}