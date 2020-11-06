class ManagedText {
    constructor(manager, mapElement) {
        this.manager = manager;
        this.mapElement = mapElement;
        this._showText = false;
        this.collisions = new Set();
    }

    get priority() {
        return this.mapElement.getLabelPriority();
    }

    get label() {
        return this.mapElement.getLabel();
    }

    get labelRect() {
        return this.mapElement.getLabelRect();
    }

    get showText() {
        return this._showText;
    }

    set showText(val) {
        if (val) {
            if (!this.label.parentNode) {
                this.manager.map.textLayer.appendChild(this.label);
            }
        } else {
            if (this.label.parentNode == this.manager.map.textLayer) {
                this.manager.map.textLayer.removeChild(this.label);
            }
        }
        this._showText = val;
    }

    doesCollide(other) {
        let thisRect = this.labelRect;
        let otherRect = other.labelRect;
        return thisRect.left < otherRect.right
            && thisRect.right > otherRect.left
            && thisRect.top < otherRect.bottom
            && thisRect.bottom > otherRect.top;
    }
}
class SvgTextManager {
    constructor(map, perfModeThreshold = SvgTextManager.PERFORMANCE_MODE_THRESHOLD_DEFAULT) {
        this.map = map;
        this.perfModeThreshold = perfModeThreshold;
        this._lastPerformanceMode = false;

        this._managedTexts = new Map();
        this._visibleTexts = new Set();

        this._lastNMWidth = 0;
        this._lastTime = 0;
        this._mapZoomTimer = 0;
        this.mapZoomUpdateDelay = SvgTextManager.ZOOM_CHANGE_UPDATE_DELAY_DEFAULT;

        this.rotationDeltaThreshold = SvgTextManager.ROTATION_DELTA_THRESHOLD_DEFAULT;
        this._lastRotation = 0;

        this._collisionUpdateBuffer = [];
        this._collisionUpdateHead = 0;

        this._toAddBuffer = new Map();
        this._toRemoveBuffer = new Map();

        this.addRemoveMaxQueries = SvgTextManager.ADD_REMOVE_MAX_QUERIES_DEFAULT;
        this.addRemoveForceUpdateThreshold = SvgTextManager.ADD_REMOVE_FORCE_UPDATE_THRESHOLD_DEFAULT;
        this.collisionUpdateMaxQueries = SvgTextManager.COLLISION_UPDATE_MAX_QUERIES_DEFAULT;
    }

    isInPerformanceMode() {
        return this._managedTexts.size >= this.perfModeThreshold;
    }

    add(mapElement) {
        if (!mapElement) {
            return;
        }

        let existing = this._managedTexts.get(mapElement.getLabel());
        if (!existing) {
            let toAdd = new ManagedText(this, mapElement);
            mapElement.updateDraw(this.map);
            this._toAddBuffer.set(toAdd.label, toAdd);
        } else {
            if (this._toRemoveBuffer.has(mapElement.getLabel())) {
                if (mapElement != existing) {
                    existing.mapElement = mapElement;
                }
                this._toRemoveBuffer.delete(mapElement.getLabel());
            }
        }
    }

    remove(mapElement) {
        if (!mapElement) {
            return;
        }

        let toRemove = this._managedTexts.get(mapElement.getLabel());
        if (toRemove) {
            this._toRemoveBuffer.set(toRemove.label, toRemove);
        } else {
            this._toAddBuffer.delete(mapElement.getLabel());
        }
    }

    updateOnAdd(newManagedText) {
        newManagedText.mapElement.updateDraw(this.map);
        let showText = true;
        let compareSet = this.isInPerformanceMode() ? this._visibleTexts.values() : this._managedTexts.values();
        for (let existing of compareSet) {
            if (existing.doesCollide(newManagedText)) {
                existing.collisions.add(newManagedText);
                newManagedText.collisions.add(existing);
                if (existing.showText) {
                    showText = showText && newManagedText.priority < existing.priority;
                }
            }
        }

        this._managedTexts.set(newManagedText.label, newManagedText);
        this.changeVisibility(newManagedText, showText);
    }

    updateOnRemove(removedManagedText) {
        this.changeVisibility(removedManagedText, false);
        for (let conflicted of removedManagedText.collisions) {
            conflicted.collisions.delete(removedManagedText);
        }

        this._managedTexts.delete(removedManagedText.label);
    }

    changeVisibility(managedText, showText) {
        let toShow = new Set();
        let toHide = new Set();
        this._changeVisibilityHelper(managedText, showText, toShow, toHide, 1);
        for (let e of toShow) {
            e.showText = true;
        }
        for (let e of toHide) {
            e.showText = false;
        }
    }

    _changeVisibilityHelper(managedText, showText, toShow, toHide, depth) {
        let queries = 0;
        if (depth > SvgTextManager.VISIBILITY_CHANGE_STACK_MAX_DEPTH) {
            return queries;
        }
        if (showText && !this._visibleTexts.has(managedText)) {
            queries++;
            this._visibleTexts.add(managedText);
            toShow.add(managedText);
            toHide.delete(managedText);
            for (let conflicted of managedText.collisions) {
                queries++;
                if (this._visibleTexts.has(conflicted)) {
                    queries += this._changeVisibilityHelper(conflicted, false, toShow, toHide, depth + 1);
                }
            }
        } else if (!showText && this._visibleTexts.has(managedText)) {
            queries++;
            this._visibleTexts.delete(managedText);
            toHide.add(managedText);
            toShow.delete(managedText);
            for (let conflicted of managedText.collisions) {
                queries++;
                let showTextConflicted = true;
                for (let conflictedOfConflicted of conflicted.collisions) {
                    if (this._visibleTexts.has(conflictedOfConflicted) && conflictedOfConflicted.priority <= conflicted.priority) {
                        showTextConflicted = false;
                        break;
                    }
                }
                if (showTextConflicted) {
                    queries += this._changeVisibilityHelper(conflicted, true, toShow, toHide, depth + 1);
                }
            }
        }
        return queries;
    }

    update() {
        let currentTime = Date.now() / 1000;

        if (this.map.NMWidth != this._lastNMWidth) {
            // map zoom changed -> clear all labels and start timer
            for (let managedText of this._managedTexts.values()) {
                managedText.showText = false;
                this._visibleTexts.clear();
            }
            this._mapZoomTimer = this.mapZoomUpdateDelay;
            this._lastTime = currentTime;
            this._lastNMWidth = this.map.NMWidth;
            return;
        }

        if (this._mapZoomTimer > 0) {
            let dt = currentTime - this._lastTime;
            this._mapZoomTimer -= dt;
            if (this._mapZoomTimer <= 0) {
                // map zoom change timer expired -> update collisions
                this.startUpdateCollisions();
                this.updateDrawVisible();
                return;
            }
            this._lastTime = currentTime;
            return;
        }

        let rotationDelta = Math.abs(this.map.rotation - this._lastRotation);
        rotationDelta = Math.min(rotationDelta, 360 - rotationDelta);
        if (rotationDelta >= this.rotationDeltaThreshold) {
            this._lastRotation = this.map.rotation;
            this.startUpdateCollisions();
            return;
        }

        let forceUpdateCollisions =
               (this.isInPerformanceMode() != this._lastPerformanceMode)
            || (this._toRemoveBuffer.size + this._toAddBuffer.size > this.addRemoveForceUpdateThreshold);

        if (forceUpdateCollisions) {
            this.startUpdateCollisions();
            return;
        }

        if (this.isUpdatingCollisions()) {
            this.doUpdateCollisions();
            return;
        }

        if (this.isAddingRemoving()) {
            this.doAddRemove();
        } else {
            this.updateDrawVisible();
        }
    }

    updateDrawVisible() {
        for (let visibleText of this._visibleTexts.values()) {
            visibleText.mapElement.updateDraw(this.map);
        }
    }

    updateDrawAll() {
        for (let managedText of this._managedTexts.values()) {
            managedText.mapElement.updateDraw(this.map);
        }
    }

    doUpdateCollisions() {
        let queries = 0;
        while (this._collisionUpdateHead < this._collisionUpdateBuffer.length && queries <= this.collisionUpdateMaxQueries) {
            let current = this._collisionUpdateBuffer[this._collisionUpdateHead++];
            if (!current || !current.label) {
                continue;
            }

            let showText = true;
            let j = this._collisionUpdateHead - 2;
            while (j >= 0) {
                let other = this._collisionUpdateBuffer[j--];
                if (!other || !other.label || (this.isInPerformanceMode() && !other.showText)) {
                    continue;
                }
                if (current.doesCollide(other)) {
                    showText = false;
                    current.collisions.add(other);
                    other.collisions.add(current);
                }
                queries++;
            }
            current.showText = showText;
            if (current.showText) {
                this._visibleTexts.add(current);
            }
        }

        if (this._collisionUpdateHead >= this._collisionUpdateBuffer.length) {
            this._collisionUpdateBuffer = [];
            this._collisionUpdateHead = 0;
        }

        this.updateDrawVisible();
    }

    startUpdateCollisions() {
        this._visibleTexts.clear();

        for (let [key, e] of this._toRemoveBuffer) {
            e.showText = false;
            this._managedTexts.delete(key);
        }
        this._toRemoveBuffer.clear();
        for (let e of this._toAddBuffer.values()) {
            this._managedTexts.set(e.label, e);
        }
        this._toAddBuffer.clear();

        this._lastPerformanceMode = this.isInPerformanceMode();

        this._collisionUpdateBuffer = Array.from(this._managedTexts.values()).sort((a, b) => a.priority - b.priority);
        this._collisionUpdateHead = 0;
        for (let managedText of this._collisionUpdateBuffer) {
            managedText.mapElement.updateDraw(this.map);
            managedText.collisions.clear();
        }
        this.doUpdateCollisions();
    }

    isUpdatingCollisions() {
        return this._collisionUpdateBuffer.length > 0;
    }

    doAddRemove() {
        this.isInPerformanceMode() ? this.updateDrawVisible() : this.updateDrawAll();

        let queries = 0;
        while (this._toRemoveBuffer.size > 0 && queries <= this.addRemoveMaxQueries) {
            let dequeuedKey = this._toRemoveBuffer.keys().next().value;
            queries += this.updateOnRemove(this._toRemoveBuffer.get(dequeuedKey));
            this._toRemoveBuffer.delete(dequeuedKey);
        }
        while (this._toAddBuffer.size > 0 && queries <= this.addRemoveMaxQueries) {
            let dequeuedKey = this._toAddBuffer.keys().next().value;
            queries += this.updateOnAdd(this._toAddBuffer.values().next().value);
            this._toAddBuffer.delete(dequeuedKey);
        }
    }

    isAddingRemoving() {
        return this._toAddBuffer.size > 0 || this._toRemoveBuffer.size > 0;
    }
}
SvgTextManager.PERFORMANCE_MODE_THRESHOLD_DEFAULT = 50;
SvgTextManager.ZOOM_CHANGE_UPDATE_DELAY_DEFAULT = 1;
SvgTextManager.ROTATION_DELTA_THRESHOLD_DEFAULT = 30;
SvgTextManager.VISIBILITY_CHANGE_STACK_MAX_DEPTH = 5;
SvgTextManager.ADD_REMOVE_MAX_QUERIES_DEFAULT = 100;
SvgTextManager.ADD_REMOVE_FORCE_UPDATE_THRESHOLD_DEFAULT = 20;
SvgTextManager.COLLISION_UPDATE_MAX_QUERIES_DEFAULT = 500;

//# sourceMappingURL=SvgTextManager.js.map