/**
 * A text label. A label may be culled (hidden) to prevent overlap with other labels.
 */
class WT_MapViewTextLabel {
    /**
     * @readonly
     * @property {Number} priority - the display priority of this label. Text labels with greater priority values
     *                               are always drawn above and culled after labels with lower priority values.
     * @type {Number}
     */
    get priority() {
        return 0;
    }

    /**
     * @readonly
     * @property {Boolean} alwaysShow - whether this label is immune to culling.
     * @type {Boolean}
     */
    get alwaysShow() {
        return false;
    }

    /**
     * @readonly
     * @property {{left:Number, right:Number, top:Number, bottom:Number}} bounds - the boundaries of this text label in the map view window.
     * @type {{left:Number, right:Number, top:Number, bottom:Number}}
     */
    get bounds() {
        return undefined;
    }

    /**
     * Draws this label to a canvas rendering context.
     * @abstract
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the canvas rendering context to which to draw.
     */
    draw(state, context) {
    }

    /**
     * Updates this label according to the current map view state.
     * @abstract
     * @param {WT_MapViewState} state - the current map view state.
     */
    update(state) {
    }
}

/**
 * An implementation of a text label that supports customization of text font and background.
 */
class WT_MapViewSimpleTextLabel extends WT_MapViewTextLabel {
    /**
     * @param {String} text - the text content of the new label.
     * @param {Number} priority - the display priority of the new label.
     * @param {Boolean} [alwaysShow] - whether the new label is immune to culling. False by default.
     */
    constructor(text, priority, alwaysShow = false) {
        super();
        this._text = text;
        this._priority = priority;
        this._alwaysShow = alwaysShow;
        this._position = new WT_GVector2(0, 0);
        this._anchor = new WT_GVector2(0, 1);

        this._backgroundPadding = [0, 0, 0, 0];

        this._bounds = {left: 0, right: 0, top: 0, bottom: 0};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewSimpleTextLabel.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {Number} priority - the display priority of this label. Text labels with greater priority values
     *                               are always drawn above and culled after labels with lower priority values.
     * @type {Number}
     */
    get priority() {
        return this._priority;
    }

    /**
     * @readonly
     * @property {Boolean} alwaysShow - whether this label is immune to culling.
     * @type {Boolean}
     */
    get alwaysShow() {
        return this._alwaysShow;
    }

    /**
     * @readonly
     * @property {{left:Number, right:Number, top:Number, bottom:Number}} bounds - the boundaries of this text label in the map view window.
     * @type {{left:Number, right:Number, top:Number, bottom:Number}}
     */
    get bounds() {
        return this._bounds;
    }

    /**
     * @readonly
     * @property {String} priority - the text content of this label.
     * @type {String}
     */
    get text() {
        return this._text;
    }

    /**
     * @property {WT_GVector2} priority - the anchor point of this label's text, expressed as a 2D vector in relative
     *                                    coordinates. (0, 0) is the top-left corner of the text, and (1, 1) is the
     *                                    bottom-right corner.
     * @type {WT_GVector2}
     */
    get anchor() {
        return this._anchor.readonly();
    }

    set anchor(value) {
        this._anchor.set(value);
    }

    get backgroundPadding() {
        return this._backgroundPadding;
    }

    set backgroundPadding(padding) {
        if (padding.length > 0) {
            this._backgroundPadding[0] = padding[0];
            this._backgroundPadding[1] = padding[0];
            this._backgroundPadding[2] = padding[0];
            this._backgroundPadding[3] = padding[0];
        }
        if (padding.length > 1) {
            this._backgroundPadding[1] = padding[1];
            this._backgroundPadding[3] = padding[1];
        }
        if (padding.length > 2) {
            this._backgroundPadding[2] = padding[2];
        }
        if (padding.length > 3) {
            this._backgroundPadding[3] = padding[3];
        }
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    _pathBackground(context, left, top, width, height, radius) {
        let right = left + width;
        let bottom = top + height;

        context.beginPath();
        context.moveTo(left + radius, top);
        context.lineTo(right - radius, top);
        context.arcTo(right, top, right, top + radius, radius);
        context.lineTo(right, bottom - radius);
        context.arcTo(right, bottom, right - radius, bottom, radius);
        context.lineTo(left + radius, bottom);
        context.arcTo(left, bottom, left, bottom - radius, radius);
        context.lineTo(left, top + radius);
        context.arcTo(left, top, left + radius, top, radius);
    }

    _drawBackground(state, context, centerX, centerY, width, height) {
        let backgroundLeft = centerX - width / 2 - (this.backgroundPadding[3] + this.backgroundOutlineWidth) * state.dpiScale;
        let backgroundTop = centerY - height / 2 - (this.backgroundPadding[0] + this.backgroundOutlineWidth) * state.dpiScale;
        let backgroundWidth = width + (this.backgroundPadding[1] + this.backgroundPadding[3] + 2 * this.backgroundOutlineWidth) * state.dpiScale;
        let backgroundHeight = height + (this.backgroundPadding[0] + this.backgroundPadding[2] + 2 * this.backgroundOutlineWidth) * state.dpiScale;

        let isRounded = false;
        if (this.backgroundBorderRadius > 0) {
            isRounded = true;
            this._pathBackground(context, backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight, this.backgroundBorderRadius * state.dpiScale);
        }

        if (this.backgroundOutlineWidth > 0) {
            context.lineWidth = this.backgroundOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = this.backgroundOutlineColor;
            if (isRounded) {
                context.stroke();
            } else {
                context.strokeRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
            }
        }
        context.fillStyle = this.backgroundColor;
        if (isRounded) {
            context.fill();
        } else {
            context.fillRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
        }
    }

    _drawText(state, context, centerX, centerY) {
        context.textBaseline = "middle";
        context.textAlign = "center";
        if (this.fontOutlineWidth > 0) {
            context.lineWidth = this.fontOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = this.fontOutlineColor;
            context.strokeText(this.text, centerX, centerY);
        }
        context.fillStyle = this.fontColor;
        context.fillText(this.text, centerX, centerY);
    }

    /**
     * Draws this label to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the canvas rendering context to which to draw.
     */
    draw(state, context) {
        context.font = `${this.fontWeight} ${this.fontSize * state.dpiScale}px ${this.font}`;
        let width = context.measureText(this.text).width;
        let height = this.fontSize * state.dpiScale;

        let centerX = this._position.x + (this.anchor.x - 0.5) * width;
        let centerY = this._position.y + (this.anchor.x - 0.5) * height;

        if (this.showBackground) {
            this._drawBackground(state, context, centerX, centerY, width, height);
        }

        this._drawText(state, context, centerX, centerY);
    }

    /**
     * Updates this label's boundaries.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _updateBounds(state) {
        let width = 0.6 * this.fontSize * this.text.length * state.dpiScale;
        let height = this.fontSize * state.dpiScale;

        let left = this._position.x - this.anchor.x * width;
        let right = left + width;
        let top = this._position.y - this.anchor.y * height;
        let bottom = top + height;
        if (this.showBackground) {
            left -= (this.backgroundPadding[3] + this.backgroundOutlineWidth) * state.dpiScale;
            right += (this.backgroundPadding[1] + this.backgroundOutlineWidth) * state.dpiScale;
            top -= (this.backgroundPadding[0] + this.backgroundOutlineWidth) * state.dpiScale;
            bottom += (this.backgroundPadding[2] + this.backgroundOutlineWidth) * state.dpiScale;
        }
        this._bounds.left = left;
        this._bounds.right = right;
        this._bounds.top = top;
        this._bounds.bottom = bottom;
    }

    /**
     * Updates this label according to the current map view state.
     * @param {WT_MapViewState} state - the current map view state.
     */
    update(state) {
        this._updateBounds(state);
    }
}
WT_MapViewSimpleTextLabel.OPTIONS_DEF = {
    font: {default: "Roboto-Regular", auto: true},
    fontWeight: {default: "normal", auto: true},
    fontSize: {default: 20, auto: true},
    fontColor: {default: "white", auto: true},
    fontOutlineWidth: {default: 6, auto: true},
    fontOutlineColor: {default: "black", auto: true},
    showBackground: {default: false, auto: true},
    backgroundColor: {default: "black", auto: true},
    backgroundPadding: {default: [0]},
    backgroundBorderRadius: {default: 0, auto: true},
    backgroundOutlineWidth: {default: 0, auto: true},
    backgroundOutlineColor: {default: "white", auto: true}
};

/**
 * A manager for text labels. Labels are tracked and optionally culled to avoid overlap based on their label priority.
 * Labels with lower priority are culled before labels with higher priority.
 */
class WT_MapViewTextLabelManager {
    constructor(opts = {}) {
        this.perfModeThreshold = WT_MapViewTextLabelManager.PERFORMANCE_MODE_THRESHOLD_DEFAULT;
        this._lastPerformanceMode = false;
        this._preventOverlapChanged = false;

        this._managedLabels = new Map();
        this._visibleLabels = new Set();

        this._lastRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._lastTime = 0;
        this._mapZoomTimer = 0;

        this._lastRotation = 0;

        this._collisionUpdateBuffer = [];
        this._collisionUpdateHead = 0;

        this._toAddBuffer = new Set();
        this._toRemoveBuffer = new Set();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewTextLabelManager.OPTIONS_DEF);
        this._optsManager.setOptions(opts);
    }

    onOptionChanged(name, oldValue, newValue) {
        if (name === "preventOverlap") {
            this._preventOverlapChanged = true;
        }
    }

    /**
     * Gets the labels belonging to this manager that are currently visible.
     * @returns {IterableIterator<WT_MapViewTextLabel>} an iterable over the currently visible labels belonging to this manager.
     */
    getVisibleLabels() {
        return new WT_MapViewManagedTextLabelIterator(this._visibleLabels.values());
    }

    /**
     * Adds a label to this manager to be tracked.
     * @param {WT_MapViewTextLabel} label - the text label to add.
     */
    add(label) {
        let existing = this._managedLabels.get(label);
        if (!existing) {
            this._toAddBuffer.add(label);
        } else {
            this._toRemoveBuffer.delete(label);
        }
    }

    /**
     * Removes a label from this manager.
     * @param {WT_MapViewTextLabel} label - the text label to remove.
     */
    remove(label) {
        let toRemove = this._managedLabels.get(label);
        if (toRemove) {
            this._toRemoveBuffer.add(label);
        } else {
            this._toAddBuffer.delete(label);
        }
    }

    _isInPerformanceMode() {
        return this._managedLabels.size >= this.perfModeThreshold;
    }

    _updateOnAdd(data, managedLabelToAdd) {
        managedLabelToAdd.label.update(data);
        let show = true;
        if (this.preventOverlap) {
            let compareSet = this._isInPerformanceMode() ? this._visibleLabels.values() : this._managedLabels.values();
            for (let toCompare of compareSet) {
                if (toCompare.doesCollide(managedLabelToAdd)) {
                    toCompare.collisions.add(managedLabelToAdd);
                    managedLabelToAdd.collisions.add(toCompare);
                    if (toCompare.show && !managedLabelToAdd.label.alwaysShow) {
                        show = show && managedLabelToAdd.label.priority > toCompare.label.priority;
                    }
                }
            }
        }
        this._managedLabels.set(managedLabelToAdd.label, managedLabelToAdd);
        this._changeVisibility(managedLabelToAdd, show);
    }

    _updateOnRemove(managedLabelToRemove) {
        this._changeVisibility(managedLabelToRemove, false);
        for (let conflicted of managedLabelToRemove.collisions) {
            conflicted.collisions.delete(managedLabelToRemove);
        }

        this._managedLabels.delete(managedLabelToRemove.label);
    }

    _changeVisibility(managedLabel, show) {
        this._changeVisibilityHelper(managedLabel, show, 1);
    }

    _changeVisibilityHelper(managedLabel, show, depth) {
        let queries = 0;
        if (depth > this.collisionResolutionMaxStackDepth) {
            return queries;
        }
        if (show && !managedLabel.show) {
            queries++;
            this._visibleLabels.add(managedLabel);
            managedLabel.show = true;
            for (let conflicted of managedLabel.collisions) {
                queries++;
                if (conflicted.show && !conflicted.label.alwaysShow) {
                    queries += this._changeVisibilityHelper(conflicted, false, depth + 1);
                }
            }
        } else if (!show && managedLabel.show) {
            queries++;
            this._visibleLabels.delete(managedLabel);
            managedLabel.show = false;
            for (let conflicted of managedLabel.collisions) {
                queries++;
                let showTextConflicted = true;
                for (let conflictedOfConflicted of conflicted.collisions) {
                    if (conflictedOfConflicted.show && conflictedOfConflicted.label.priority >= conflicted.label.priority) {
                        showTextConflicted = false;
                        break;
                    }
                }
                if (showTextConflicted) {
                    queries += this._changeVisibilityHelper(conflicted, true, depth + 1);
                }
            }
        }
        return queries;
    }

    _updateVisibleLabels(state) {
        for (let visible of this._visibleLabels.values()) {
            visible.label.update(state);
        }
    }

    _updateAllLabels(state) {
        for (let managedLabel of this._managedLabels.values()) {
            managedLabel.label.update(state);
        }
    }

    _showAll(state) {
        for (let managedLabel of this._managedLabels.values()) {
            managedLabel.collisions.clear();
            managedLabel.label.update(state);
            this._visibleLabels.add(managedLabel);
            managedLabel.show = true;
        }
    }

    _doUpdateCollisions() {
        let queries = 0;
        while (this._collisionUpdateHead < this._collisionUpdateBuffer.length && queries <= this.collisionUpdateMaxQueries) {
            let current = this._collisionUpdateBuffer[this._collisionUpdateHead++];

            let show = true;
            let j = this._collisionUpdateHead - 2;
            while (j >= 0) {
                let other = this._collisionUpdateBuffer[j--];
                if (this._isInPerformanceMode() && !other.show) {
                    continue;
                }
                if (current.doesCollide(other)) {
                    show = current.label.alwaysShow;
                    current.collisions.add(other);
                    other.collisions.add(current);
                }
                queries++;
            }
            current.show = show;
            if (current.show) {
                this._visibleLabels.add(current);
            }
        }

        if (this._collisionUpdateHead >= this._collisionUpdateBuffer.length) {
            this._collisionUpdateBuffer = [];
            this._collisionUpdateHead = 0;
        }
    }

    _startUpdateCollisions(state) {
        this._visibleLabels.clear();

        for (let label of this._toRemoveBuffer.values()) {
            this._managedLabels.delete(label);
        }
        this._toRemoveBuffer.clear();
        for (let label of this._toAddBuffer.values()) {
            this._managedLabels.set(label, new WT_MapViewManagedTextLabel(label));
        }
        this._toAddBuffer.clear();

        this._lastPerformanceMode = this._isInPerformanceMode();

        this._collisionUpdateBuffer = Array.from(this._managedLabels.values()).sort(
            (a, b) => {
                let value = b.label.priority - a.label.priority;
                if (a.label.alwaysShow !== b.label.alwaysShow) {
                    value = a.label.alwaysShow ? -1 : 1;
                }
                return value;
            }
        );
        this._collisionUpdateHead = 0;
        for (let managedLabel of this._collisionUpdateBuffer) {
            managedLabel.label.update(state);
            managedLabel.collisions.clear();
        }
        this._doUpdateCollisions();
    }

    _isUpdatingCollisions() {
        return this._collisionUpdateBuffer.length > 0;
    }

    _doAddRemove(data) {
        this._isInPerformanceMode() ? this._updateVisibleLabels(data) : this._updateAllLabels(data);

        let queries = 0;
        while (this._toRemoveBuffer.size > 0 && queries <= this.addRemoveMaxQueries) {
            let labelToRemove = this._toRemoveBuffer.values().next().value;
            queries += this._updateOnRemove(this._managedLabels.get(labelToRemove));
            this._toRemoveBuffer.delete(labelToRemove);
        }
        while (this._toAddBuffer.size > 0 && queries <= this.addRemoveMaxQueries) {
            let labelToAdd = this._toAddBuffer.values().next().value;
            queries += this._updateOnAdd(data, new WT_MapViewManagedTextLabel(labelToAdd));
            this._toAddBuffer.delete(labelToAdd);
        }
    }

    _isAddingRemoving() {
        return this._toAddBuffer.size > 0 || this._toRemoveBuffer.size > 0;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        let currentTime = state.currentTime / 1000;
        let preventOverlapChanged = this._preventOverlapChanged;
        this._preventOverlapChanged = false;

        if (this.preventOverlap) {
            if (!state.projection.range.equals(this._lastRange)) {
                // map zoom changed -> clear all labels and start timer
                for (let managedText of this._managedLabels.values()) {
                    managedText.show = false;
                }
                this._visibleLabels.clear();
                this._mapZoomTimer = this.mapZoomUpdateDelay;
                this._lastTime = currentTime;
                this._lastRange.set(state.projection.range);
                return;
            }

            if (this._mapZoomTimer > 0) {
                let dt = currentTime - this._lastTime;
                this._mapZoomTimer -= dt;
                if (this._mapZoomTimer <= 0) {
                    // map zoom change timer expired -> update collisions
                    this._startUpdateCollisions(state);
                    this._updateVisibleLabels(state);
                    return;
                }
                this._lastTime = currentTime;
                return;
            }

            let rotationDelta = Math.abs(state.projection.rotation - this._lastRotation);
            rotationDelta = Math.min(rotationDelta, 360 - rotationDelta);
            if (rotationDelta >= this.rotationThreshold) {
                this._lastRotation = state.projection.rotation;
                this._startUpdateCollisions(state);
                return;
            }

            let forceUpdateCollisions =
                preventOverlapChanged ||
                (this._isInPerformanceMode() != this._lastPerformanceMode) ||
                (this._toRemoveBuffer.size + this._toAddBuffer.size > this.addRemoveForceUpdateThreshold);

            if (forceUpdateCollisions) {
                this._startUpdateCollisions(state);
                this._updateVisibleLabels(state);
                return;
            }

            if (this._isUpdatingCollisions()) {
                this._doUpdateCollisions();
                this._updateVisibleLabels(state);
                return;
            }
        } else {
            if (preventOverlapChanged) {
                this._showAll();
                return;
            }
        }

        if (this._isAddingRemoving()) {
            this._doAddRemove(state);
        } else {
            this._updateVisibleLabels(state);
        }
    }
}
WT_MapViewTextLabelManager.OPTIONS_DEF = {
    preventOverlap: {default: false, auto: true, observed: true},
    perfModeThreshold: {default: 50, auto: true},
    mapZoomUpdateDelay: {default: 0.5, auto: true},
    rotationThreshold: {default: 30, auto: true},
    collisionResolutionMaxStackDepth: {default: 5, auto: true},
    addRemoveMaxQueries: {default: 100, auto: true},
    addRemoveForceUpdateThreshold: {default: 20, auto: true},
    collisionUpdateMaxQueries: {default: 500, auto: true}
};

class WT_MapViewManagedTextLabel {
    constructor(label) {
        this._label = label;
        this._collisions = new Set();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewManagedTextLabel.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {WT_MapViewTextLabel} label - this label.
     * @type {WT_MapViewTextLabel}
     */
    get label() {
        return this._label;
    }

    /**
     * @readonly
     * @property {Set<WT_MapViewManagedTextLabel>} collisions - the set of labels that collide with this one.
     * @type {Set<WT_MapViewManagedTextLabel>}
     */
    get collisions() {
        return this._collisions;
    }

    /**
     * Checks whether this label collides with another.
     * @param {WT_MapViewManagedTextLabel} other - the other label.
     * @returns {Boolean} whether this label collides with the other.
     */
    doesCollide(other) {
        let thisBounds = this.label.bounds;
        let otherBounds = other.label.bounds;
        return thisBounds.left < otherBounds.right &&
               thisBounds.right > otherBounds.left &&
               thisBounds.top < otherBounds.bottom &&
               thisBounds.bottom > otherBounds.top;
    }
}
WT_MapViewManagedTextLabel.OPTIONS_DEF = {
    show: {default: false, auto: true}
};

class WT_MapViewManagedTextLabelIterator {
    constructor(iterator) {
        this._iterator = iterator;
        this._nextObject = {
            done: false,
            value: undefined
        };
    }

    next() {
        let next = this._iterator.next();
        this._nextObject.done = next.done;
        this._nextObject.value = next.value ? next.value.label : undefined;
        return this._nextObject;
    }

    [Symbol.iterator]() {
        return this;
    }
}