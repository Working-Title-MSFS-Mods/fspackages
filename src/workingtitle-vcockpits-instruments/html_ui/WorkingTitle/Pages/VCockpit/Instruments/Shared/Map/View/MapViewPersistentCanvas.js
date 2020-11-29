class WT_MapViewPersistentCanvas extends WT_MapViewCanvas {
    constructor(overdrawFactor) {
        super(true, true);

        this._overdrawFactor = overdrawFactor;

        this._nominalWidth = 0;
        this._nominalHeight = 0;
        this._topLeft = new WT_GVector2(0, 0);
        this._margin = 0;
        this._displayTransform = {
            scale: 1,
            rotation: 0,
            offset: new WT_GVector2(0, 0),
            margin: 0
        };
        this._bufferTransform = {
            scale: 1,
            rotation: 0,
            offset: new WT_GVector2(0, 0),
            margin: 0
        };
        this._isDisplayInvalid = true;
        this._isBufferInvalid = true;

        this._clipExtent = [[0, 0], [0, 0]];
        this._translate = [0, 0];

        this._displayReference = {
            range: new WT_NumberUnit(-1, WT_Unit.NMILE),
            center: new LatLong(0, 0),
            scale: 150,
            rotation: 0,
        };

        this._bufferReference = {
            range: new WT_NumberUnit(-1, WT_Unit.NMILE),
            center: new LatLong(0, 0),
            scale: 150,
            rotation: 0
        };
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

    get displayTransform() {
        return this._displayTransform;
    }

    get bufferTransform() {
        return this._bufferTransform;
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
     *                                       changed since the last time the buffer was synchronized to the map view projection or if the
     *                                       offset of the buffer in either the x- or y- axes is greater than the margin.
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
        this._displayReference.range.copyFrom(this._bufferReference.range);
        this._displayReference.center = this._bufferReference.center;
        this._displayReference.scale = this._bufferReference.scale;
        this._displayReference.rotation = this._bufferReference.rotation;

        this.display.projectionRenderer.projection.center(this.buffer.projectionRenderer.projection.center());
        this.display.projectionRenderer.projection.scale(this.buffer.projectionRenderer.projection.scale());
        this.display.projectionRenderer.projection.angle(this.buffer.projectionRenderer.projection.angle());
    }

    _updateReference(state, reference) {
        reference.range.copyFrom(state.projection.range);
        reference.center = state.projection.center;
        reference.scale = state.projection.scale;
        reference.rotation = state.projection.rotation;
    }

    initProjectionRenderers(projection) {
        this.display.projectionRenderer = projection.createCustomRenderer();
        this.buffer.projectionRenderer = projection.createCustomRenderer();
        this._updateProjectionRenderers();
    }

    _updateTransform(state, reference, transform) {
        transform.scale = state.projection.scale / reference.scale;
        transform.rotation = state.projection.rotation - reference.rotation;
        transform.offset = state.projection.projectLatLong(reference.center).subtract(state.projection.viewCenter, true);
        transform.margin = this.margin * transform.scale;
    }

    _transformDisplay() {
        let transform = this.displayTransform;
        transform.offset.scale(1 / transform.scale, true);
        this.display.canvas.style.transform = `scale(${transform.scale}) translate(${transform.offset.x}px, ${transform.offset.y}px) rotate(${transform.rotation}deg)`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    syncBufferToMapProjection(state) {
        this._updateReference(state, this._bufferReference);
        state.projection.syncRenderer(this.buffer.projectionRenderer);
    }

    redraw(state, fromBuffer = true) {
        if (fromBuffer) {
            this.copyBufferToCanvas();
            this._syncDisplayFromBuffer();
        } else {
            this._updateReference(state, this._displayReference);
            state.projection.syncRenderer(this.display.projectionRenderer);

        }
        this._updateTransform(state, this._displayReference, this._displayTransform);
        this._transformDisplay();
    }

    invalidateDisplay() {
        this.display.context.clearRect(0, 0, this.width, this.height);
    }

    invalidateBuffer() {
        this.buffer.context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        let range = state.projection.range;

        this._updateTransform(state, this._displayReference, this._displayTransform);
        this._updateTransform(state, this._bufferReference, this._bufferTransform);
        let offsetXAbsDisplay = Math.abs(this.displayTransform.offset.x);
        let offsetYAbsDisplay = Math.abs(this.displayTransform.offset.y);
        let offsetXAbsBuffer = Math.abs(this.bufferTransform.offset.x);
        let offsetYAbsBuffer = Math.abs(this.bufferTransform.offset.y);

        this._isDisplayInvalid = !this._displayReference.range.equals(range) ||
                                 (offsetXAbsDisplay > this._displayTransform.margin || offsetYAbsDisplay > this._displayTransform.margin);

        this._isBufferInvalid = !this._bufferReference.range.equals(range) ||
                                (offsetXAbsBuffer > this._bufferTransform.margin || offsetYAbsBuffer > this._bufferTransform.margin);

        if (!this.isDisplayInvalid) {
            this._transformDisplay();
        }
    }
}