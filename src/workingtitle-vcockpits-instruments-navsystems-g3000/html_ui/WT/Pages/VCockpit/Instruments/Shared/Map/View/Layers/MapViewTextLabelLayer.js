class WT_MapViewTextLabelLayer extends WT_MapViewMultiLayer {
    constructor(manager, className = WT_MapViewTextLabelLayer.CLASS_DEFAULT, configName = WT_MapViewTextLabelLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._manager = manager;

        this._textLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._textLayer);
    }

    get textLayer() {
        return this._textLayer;
    }

    get manager() {
        return this._manager;
    }

    _drawLabels(data, labels) {
        labels = Array.from(labels);
        labels.sort(
            (a, b) => {
                let value = a.priority - b.priority;
                if (a.alwaysShow !== b.alwaysShow) {
                    value = b.alwaysShow ? -1 : 1;
                }
                return value;
            }
        )
        this.textLayer.buffer.clear();
        for (let label of labels) {
            label.draw(data, this.textLayer.buffer.context);
        }
        this.textLayer.display.clear();
        this.textLayer.copyBufferToCanvas();
    }

    onUpdate(data) {
        this.manager.onUpdate(data);
        this._drawLabels(data, this.manager.getVisibleLabels());
    }
}
WT_MapViewTextLabelLayer.CLASS_DEFAULT = "textLabelLayer";
WT_MapViewTextLabelLayer.CONFIG_NAME_DEFAULT = "textLabel";

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

    getVisibleLabels() {
        return new WT_MapViewManagedTextLabelIterator(this._visibleLabels.values());
    }

    add(label) {
        let existing = this._managedLabels.get(label);
        if (!existing) {
            this._toAddBuffer.add(label);
        } else {
            this._toRemoveBuffer.delete(label);
        }
    }

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

    _updateVisibleLabels(data) {
        for (let visible of this._visibleLabels.values()) {
            visible.label.update(data);
        }
    }

    _updateAllLabels(data) {
        for (let managedLabel of this._managedLabels.values()) {
            managedLabel.label.update(data);
        }
    }

    _showAll(data) {
        for (let managedLabel of this._managedLabels.values()) {
            managedLabel.collisions.clear();
            managedLabel.label.update(data);
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

    _startUpdateCollisions(data) {
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
            managedLabel.label.update(data);
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

    onUpdate(data) {
        let currentTime = data.currentTime / 1000;
        let preventOverlapChanged = this._preventOverlapChanged;
        this._preventOverlapChanged = false;

        if (this.preventOverlap) {
            if (!data.projection.range.equals(this._lastRange)) {
                // map zoom changed -> clear all labels and start timer
                for (let managedText of this._managedLabels.values()) {
                    managedText.show = false;
                }
                this._visibleLabels.clear();
                this._mapZoomTimer = this.mapZoomUpdateDelay;
                this._lastTime = currentTime;
                this._lastRange.set(data.projection.range);
                return;
            }

            if (this._mapZoomTimer > 0) {
                let dt = currentTime - this._lastTime;
                this._mapZoomTimer -= dt;
                if (this._mapZoomTimer <= 0) {
                    // map zoom change timer expired -> update collisions
                    this._startUpdateCollisions(data);
                    this._updateVisibleLabels(data);
                    return;
                }
                this._lastTime = currentTime;
                return;
            }

            let rotationDelta = Math.abs(data.projection.rotation - this._lastRotation);
            rotationDelta = Math.min(rotationDelta, 360 - rotationDelta);
            if (rotationDelta >= this.rotationThreshold) {
                this._lastRotation = data.projection.rotation;
                this._startUpdateCollisions(data);
                return;
            }

            let forceUpdateCollisions =
                preventOverlapChanged ||
                (this._isInPerformanceMode() != this._lastPerformanceMode) ||
                (this._toRemoveBuffer.size + this._toAddBuffer.size > this.addRemoveForceUpdateThreshold);

            if (forceUpdateCollisions) {
                this._startUpdateCollisions(data);
                this._updateVisibleLabels(data);
                return;
            }

            if (this._isUpdatingCollisions()) {
                this._doUpdateCollisions();
                this._updateVisibleLabels(data);
                return;
            }
        } else {
            if (preventOverlapChanged) {
                this._showAll();
                return;
            }
        }

        if (this._isAddingRemoving()) {
            this._doAddRemove(data);
        } else {
            this._updateVisibleLabels(data);
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

    get label() {
        return this._label;
    }

    get collisions() {
        return this._collisions;
    }

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