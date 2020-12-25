class WT_MapViewWaypointCanvasRenderer {
    /**
     *
     * @param {WT_MapViewTextLabelManager} labelManager
     * @param {Number} [normalCacheSize]
     * @param {Number} [flightPlanCacheSize]
     * @param {Number} [highlightCacheSize]
     */
    constructor(labelManager, normalCacheSize = WT_MapViewWaypointCanvasRenderer.NORMAL_CACHE_SIZE, airwayCacheSize = WT_MapViewWaypointCanvasRenderer.AIRWAY_CACHE_SIZE, flightPlanCacheSize = WT_MapViewWaypointCanvasRenderer.FLIGHT_PLAN_CACHE_SIZE, flightPlanActiveCacheSize = WT_MapViewWaypointCanvasRenderer.FLIGHT_PLAN_ACTIVE_CACHE_SIZE = 20, highlightCacheSize = WT_MapViewWaypointCanvasRenderer.HIGHLIGHT_CACHE_SIZE) {
        this._labelManager = labelManager;

        this._iconCaches = {
            normal: new WT_MapViewWaypointImageIconCache(normalCacheSize),
            airway: new WT_MapViewWaypointImageIconCache(airwayCacheSize),
            flightPlan: new WT_MapViewWaypointImageIconCache(flightPlanCacheSize),
            flightPlanActive: new WT_MapViewWaypointImageIconCache(flightPlanActiveCacheSize),
            highlight: new WT_MapViewWaypointImageIconCache(highlightCacheSize)
        };
        this._labelCaches = {
            normal: new WT_MapViewWaypointLabelCache(normalCacheSize),
            airway: new WT_MapViewWaypointLabelCache(airwayCacheSize),
            flightPlan: new WT_MapViewWaypointLabelCache(flightPlanCacheSize),
            flightPlanActive: new WT_MapViewWaypointLabelCache(flightPlanActiveCacheSize),
            highlight: new WT_MapViewWaypointLabelCache(highlightCacheSize)
        };

        /**
         * @type {Map<String,WT_MapViewWaypointCanvasRendererEntry>}
         */
        this._registered = new Map();

        this._canvasContexts = {

        };

        this._styleOptionHandlers = {
            normal: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.normal;}},
            airway: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.airway;}},
            flightPlan: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.flightPlan;}},
            flightPlanActive: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.flightPlanActive;}},
            highlight: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.highlight;}}
        };

        this._visibilityHandlers = {
            normal: {isVisible(state, waypoint) {return true;}},
            airway: {isVisible(state, waypoint) {return true;}},
            flightPlan: {isVisible(state, waypoint) {return true;}},
            flightPlanActive: {isVisible(state, waypoint) {return true;}},
            highlight: {isVisible(state, waypoint) {return true;}}
        };

        this._deprecateBounds = [new WT_GVector2(0, 0), new WT_GVector2(0, 0)];
    }

    /**
     *
     * @param {Number} context
     * @param {CanvasRenderingContext2D} canvasContext
     */
    setCanvasContext(context, canvasContext) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._canvasContexts.normal = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._canvasContexts.airway = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._canvasContexts.flightPlan = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._canvasContexts.flightPlanActive = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._canvasContexts.highlight = canvasContext;
                break;
        }
    }

    /**
     *
     * @param {Number} context
     * @param {{isVisible(state:WT_MapViewState, waypoint:WT_Waypoint)}} handler
     */
    setVisibilityHandler(context, handler) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._visibilityHandlers.normal = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._visibilityHandlers.airway = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._visibilityHandlers.flightPlan = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._visibilityHandlers.flightPlanActive = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._visibilityHandlers.highlight = handler;
                break;
        }
    }

    /**
     *
     * @param {Number} context
     * @param {{getOptions(state:WT_MapViewState, waypoint:WT_Waypoint)}} handler
     */
    setStyleOptionHandler(context, handler) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._styleOptionHandlers.normal = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._styleOptionHandlers.airway = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._styleOptionHandlers.flightPlan = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._styleOptionHandlers.flightPlanActive = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._styleOptionHandlers.highlight = handler;
                break;
        }
    }

    setDeprecateBounds(bounds) {
        this._deprecateBounds[0].set(bounds[0]);
        this._deprecateBounds[1].set(bounds[1]);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {Number} [context]
     */
    isRegistered(waypoint, context) {
        let entry = this._registered.get(waypoint.uniqueID);
        if (!entry) {
            return false;
        }

        if (context === undefined) {
            return true;
        }
        return entry.isAllContexts(context);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {Number} context
     */
    register(waypoint, context) {
        if (context === 0) {
            return;
        }

        let entry = this._registered.get(waypoint.uniqueID);
        if (!entry) {
            entry = new WT_MapViewWaypointCanvasRendererEntry(this, waypoint, context);
            this._registered.set(waypoint.uniqueID, entry);
        } else {
            entry.addContext(context);
        }
    }

    /**
     *
     * @param {WT_MapViewWaypointCanvasRendererEntry} entry
     */
    _deleteEntry(entry) {
        let showLabel = entry.showLabel();
        if (showLabel) {
            this._labelManager.remove(entry.label());
        }
        this._registered.delete(entry.waypoint.uniqueID);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {Number} context
     */
    deregister(waypoint, context) {
        let entry = this._registered.get(waypoint.uniqueID);
        if (!entry) {
            return;
        }

        entry.removeContext(context);
        if (entry.context === WT_MapViewWaypointCanvasRenderer.Context.NONE) {
            this._deleteEntry(entry);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    update(state) {
        let iconsToDraw = [];
        let toRemove = [];
        for (let entry of this._registered.values()) {
            entry.update(state);
            if (entry.showIcon()) {
                iconsToDraw.push(entry);
            }

            if (entry.isDeprecated) {
                toRemove.push(entry);
            }
        }

        for (let prop in this._canvasContexts) {
            this._canvasContexts[prop].clearRect(0, 0, state.projection.viewWidth, state.projection.viewHeight);
        }

        iconsToDraw.sort((a, b) => a.icon().priority - b.icon().priority);
        for (let entry of iconsToDraw) {
            let icon = entry.icon();
            switch(entry.lastShownContext) {
                case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                    icon.draw(state, this._canvasContexts.normal);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                    icon.draw(state, this._canvasContexts.airway);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                    icon.draw(state, this._canvasContexts.flightPlan);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                    icon.draw(state, this._canvasContexts.flightPlanActive);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                    icon.draw(state, this._canvasContexts.highlight);
                    break;
            }
        }
        for (let entry of toRemove) {
            this._deleteEntry(entry);
        }
    }
}
WT_MapViewWaypointCanvasRenderer.NORMAL_CACHE_SIZE = 1000;
WT_MapViewWaypointCanvasRenderer.AIRWAY_CACHE_SIZE = 1000;
WT_MapViewWaypointCanvasRenderer.FLIGHT_PLAN_CACHE_SIZE = 200;
WT_MapViewWaypointCanvasRenderer.FLIGHT_PLAN_ACTIVE_CACHE_SIZE = 20;
WT_MapViewWaypointCanvasRenderer.HIGHLIGHT_CACHE_SIZE = 20;
WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS = {
    normal: {icon: {priority: 0, imageDir: ""}, label: {priority: 0, alwaysShow: false}},
    airway: {icon: {priority: 0, imageDir: ""}, label: {priority: 0, alwaysShow: false}},
    flightPlan: {icon: {priority: 0, imageDir: ""}, label: {priority: 0, alwaysShow: false}},
    flightPlanActive: {icon: {priority: 0, imageDir: ""}, label: {priority: 0, alwaysShow: false}},
    highlight: {icon: {priority: 0, imageDir: ""}, label: {priority: 0, alwaysShow: false}},
};
/**
 * @enum {Number}
 */
WT_MapViewWaypointCanvasRenderer.Context = {
    NONE: 0,
    NORMAL: 1,
    AIRWAY: 1 << 1,
    FLIGHT_PLAN: 1 << 2,
    FLIGHT_PLAN_ACTIVE: 1 << 3,
    HIGHLIGHT: 1 << 4,
    ALL: (1 << 5) - 1
}

class WT_MapViewWaypointCanvasRendererEntry {
    /**
     *
     * @param {WT_MapViewWaypointCanvasRenderer} renderer
     * @param {WT_Waypoint} waypoint
     * @param {Number} context
     */
    constructor(renderer, waypoint, context) {
        this._renderer = renderer;
        this._waypoint = waypoint;
        this._context = context;
        this._icon = null;
        this._label = null;
        this._showIcon = null;
        this._showLabel = null;
        this._deprecateTimer = 0;
        this._lastTime = 0;

        this._lastShownContext = 0;
        this._isDeprecated = false;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    /**
     * @readonly
     * @property {Number} context
     * @type {Number}
     */
    get context() {
        return this._context;
    }

    /**
     * @readonly
     * @property {Number} lastShownContext
     * @type {Number}
     */
    get lastShownContext() {
        return this._lastShownContext;
    }

    /**
     * @readonly
     * @property {Boolean} isDeprecated
     * @type {Boolean}
     */
    get isDeprecated() {
        return this._isDeprecated;
    }

    showIcon() {
        return this._showIcon;
    }

    showLabel() {
        return this._showLabel;
    }

    icon() {
        return this._icon;
    }

    label() {
        return this._label;
    }

    isAnyContext(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShownContext;
        } else {
            toCompare = this.context;
        }
        return (toCompare & context) !== 0;
    }

    isOnlyContext(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShownContext;
        } else {
            toCompare = this.context;
        }
        return toCompare === context;
    }

    isAllContexts(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShownContext;
        } else {
            toCompare = this.context;
        }
        return (toCompare & context) === context;
    }

    addContext(context) {
        this._context = this._context | context;
    }

    removeContext(context) {
        this._context = this._context & ~context;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} showContext
     * @param {Boolean} showIcon
     * @param {Boolean} showLabel
     * @param {WT_MapViewWaypointImageIconCache} [iconCache]
     * @param {WT_MapViewWaypointLabelCache} [labelCache]
     * @param {{getOptions(state:WT_MapViewState, waypoint:WT_Waypoint)}} [styleOptionHandler]
     */
    _draw(state, showContext, showIcon, showLabel, iconCache, labelCache, styleOptionHandler) {
        let needReplace = showContext !== this.lastShownContext;
        if (needReplace) {
            if (this._showLabel && !showLabel) {
                this._renderer._labelManager.remove(this._label);
            }

            let options = styleOptionHandler.getOptions(state, this.waypoint);

            this._icon = iconCache.getIcon(this.waypoint, options.icon.priority, options.icon.imageDir);
            this._icon.setOptions(options.icon);
            this._label = labelCache.getLabel(this.waypoint, options.label.priority, options.label.alwaysShow);
            this._label.setOptions(options.label);
            this._showLabel = false;
        }

        if (!this._showLabel && showLabel) {
            this._renderer._labelManager.add(this._label);
        } else if (this._showLabel && !showLabel) {
            this._renderer._labelManager.remove(this._label);
        }

        this._showIcon = showIcon;
        this._showLabel = showLabel;
        this._lastShownContext = showContext;
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _drawHighlight(state) {
        this._draw(state, WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT, true, true, this._renderer._iconCaches.highlight, this._renderer._labelCaches.highlight, this._renderer._styleOptionHandlers.highlight)
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _drawFlightPlanActive(state) {
        this._draw(state, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, true, true, this._renderer._iconCaches.flightPlanActive, this._renderer._labelCaches.flightPlanActive, this._renderer._styleOptionHandlers.flightPlanActive)
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _drawFlightPlan(state) {
        this._draw(state, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, true, true, this._renderer._iconCaches.flightPlan, this._renderer._labelCaches.flightPlan, this._renderer._styleOptionHandlers.flightPlan)
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _drawNormal(state) {
        this._draw(state, WT_MapViewWaypointCanvasRenderer.Context.NORMAL, true, true, this._renderer._iconCaches.normal, this._renderer._labelCaches.normal, this._renderer._styleOptionHandlers.normal)
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _drawAirway(state) {
        this._draw(state, WT_MapViewWaypointCanvasRenderer.Context.AIRWAY, true, false, this._renderer._iconCaches.airway, this._renderer._labelCaches.airway, this._renderer._styleOptionHandlers.airway)
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _updateDeprecation(state) {
        if (this.isDeprecated || !this.isOnlyContext(WT_MapViewWaypointCanvasRenderer.Context.NORMAL)) {
            this._deprecateTimer = 0;
            return;
        }

        if (!state.projection.renderer.isInViewBounds(this.waypoint.location, this._renderer._deprecateBounds, 0.05)) {
            let currentTime = state.currentTime / 1000;
            if (this._deprecateTimer <= 0) {
                this._deprecateTimer = 20;
            } else {
                this._deprecateTimer -= currentTime - this._lastTime;
                if (this._deprecateTimer <= 0) {
                    this._isDeprecated = true;
                }
            }
            this._lastTime = currentTime;
        } else {
            this._deprecateTimer = 0;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    update(state) {
        let hide = false;
        let isInView = state.projection.renderer.isInView(this.waypoint.location, 0.05);
        if (isInView) {
            if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT) && this._renderer._visibilityHandlers.highlight.isVisible(state, this.waypoint)) {
                this._drawHighlight(state);
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE) && this._renderer._visibilityHandlers.flightPlanActive.isVisible(state, this.waypoint)) {
                this._drawFlightPlanActive(state);
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN) && this._renderer._visibilityHandlers.flightPlan.isVisible(state, this.waypoint)) {
                this._drawFlightPlan(state);
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.NORMAL) && this._renderer._visibilityHandlers.normal.isVisible(state, this.waypoint)) {
                this._drawNormal(state);
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY) && this._renderer._visibilityHandlers.airway.isVisible(state, this.waypoint)) {
                this._drawAirway(state);
            } else {
                hide = true;
            }
        } else {
            hide = true;
        }

        if (hide) {
            this._draw(state, this.lastShownContext, false, false);
        }

        this._updateDeprecation(state);
    }
}