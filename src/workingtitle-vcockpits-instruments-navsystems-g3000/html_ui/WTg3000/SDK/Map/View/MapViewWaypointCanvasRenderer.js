/**
 * A renderer that draws waypoints to an HTML canvas element. Waypoints can be rendered in one of multiple contexts: normal, as part of
 * an airway, as part of a flight plan, as the active waypoint in a flight plan, and as a highlighted waypoint. For the renderer to draw
 * a waypoint, the waypoint must first be registered with the renderer. Waypoints may be registered under multiple waypoint contexts.
 * However, a waypoint will only be rendered in one context at any point in time, chosen based on the following order of precedence:
 * highlighted > active flight plan > flight plan > normal > airway.
 */
class WT_MapViewWaypointCanvasRenderer {
    /**
     * @param {WT_MapViewTextLabelManager} labelManager - the label manager to use for waypoint labels.
     */
    constructor(labelManager) {
        this._labelManager = labelManager;

        /**
         * @type {Map<String,WT_MapViewWaypointCanvasRendererEntry>}
         */
        this._registered = new Map();

        this._contexts = {
            normal: {
                iconFactory: null,
                labelFactory: null,
                canvasContext: null,
                styleOptionHandler: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.normal;}},
                visibilityHandler: {isVisible(state, waypoint) {return true;}}
            },
            airway: {
                iconFactory: null,
                labelFactory: null,
                canvasContext: null,
                styleOptionHandler: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.airway;}},
                visibilityHandler: {isVisible(state, waypoint) {return true;}}
            },
            flightPlan: {
                iconFactory: null,
                labelFactory: null,
                canvasContext: null,
                styleOptionHandler: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.flightPlan;}},
                visibilityHandler: {isVisible(state, waypoint) {return true;}}
            },
            flightPlanActive: {
                iconFactory: null,
                labelFactory: null,
                canvasContext: null,
                styleOptionHandler: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.flightPlanActive;}},
                visibilityHandler: {isVisible(state, waypoint) {return true;}}
            },
            highlight: {
                iconFactory: null,
                labelFactory: null,
                canvasContext: null,
                styleOptionHandler: {getOptions(state, waypoint) {return WT_MapViewWaypointCanvasRenderer.DEFAULT_STYLE_OPTIONS.highlight;}},
                visibilityHandler: {isVisible(state, waypoint) {return true;}}
            }
        }

        this._iconFactories = {
            normal: null,
            airway: null,
            flightPlan: null,
            flightPlanActive: null,
            highlight: null
        };
        this._labelFactories = {
            normal: null,
            airway: null,
            flightPlan: null,
            flightPlanActive: null,
            highlight: null
        };

        this._canvasContexts = {
            normal: null,
            airway: null,
            flightPlan: null,
            flightPlanActive: null,
            highlight: null
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
     * Sets the factory to use to create waypoint icons for a waypoint context.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - a waypoint context.
     * @param {WT_MapViewWaypointIconFactory} factory - a waypoint icon factory.
     */
    setIconFactory(context, factory) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._contexts.normal.iconFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._contexts.airway.iconFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._contexts.flightPlan.iconFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._contexts.flightPlanActive.iconFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._contexts.highlight.iconFactory = factory;
                break;
        }
    }

    /**
     * Sets the factory to use to create waypoint albels for a waypoint context.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - a waypoint context.
     * @param {WT_MapViewWaypointLabelFactory} factory - a waypoint label factory.
     */
    setLabelFactory(context, factory) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._contexts.normal.labelFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._contexts.airway.labelFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._contexts.flightPlan.labelFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._contexts.flightPlanActive.labelFactory = factory;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._contexts.highlight.labelFactory = factory;
                break;
        }
    }

    /**
     * Sets the HTML canvas rendering context for a waypoint context.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - the waypoint context.
     * @param {CanvasRenderingContext2D} canvasContext - an HTML canvas 2D rendering context.
     */
    setCanvasContext(context, canvasContext) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._contexts.normal.canvasContext = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._contexts.airway.canvasContext = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._contexts.flightPlan.canvasContext = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._contexts.flightPlanActive.canvasContext = canvasContext;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._contexts.highlight.canvasContext = canvasContext;
                break;
        }
    }

    /**
     * Sets the handler that determines if a waypoint is visible for a waypoint context.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - the waypoint context.
     * @param {{isVisible(state:WT_MapViewState, waypoint:WT_Waypoint):Boolean}} handler - an object that determines if a waypoint should be visible by
     *                                                                                     implementing the .isVisible(state, waypoint) method.
     */
    setVisibilityHandler(context, handler) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._contexts.normal.visibilityHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._contexts.airway.visibilityHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._contexts.flightPlan.visibilityHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._contexts.flightPlanActive.visibilityHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._contexts.highlight.visibilityHandler = handler;
                break;
        }
    }

    /**
     * Sets the handler that sets style options for waypoint icons and labels for a waypoint context.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - the waypoint context.
     * @param {{getOptions(state:WT_MapViewState, waypoint:WT_Waypoint):{icon:Object, label: Object}}} handler - an object that returns an object defining
     *                                                                                                           style options for both icons and labels
     *                                                                                                           via the .getOptions(state, waypoint) method.
     */
    setStyleOptionHandler(context, handler) {
        switch (context) {
            case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                this._contexts.normal.styleOptionHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                this._contexts.airway.styleOptionHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                this._contexts.flightPlan.styleOptionHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                this._contexts.flightPlanActive.styleOptionHandler = handler;
                break;
            case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                this._contexts.highlight.styleOptionHandler = handler;
                break;
        }
    }

    /**
     * Sets the boundary outside of which waypoints rendered in the normal context will be deprecated. The boundary
     * is defined using the map projection's viewing window coordinates.
     * @param {WT_GVector2[]} bounds - the new deprecation bounds, as a two-element array. Index 0 should contain the
     *                                 coordinates for the top-left corner, and index 1 should contain the coordinates
     *                                 for the bottom-right corner.
     */
    setDeprecateBounds(bounds) {
        this._deprecateBounds[0].set(bounds[0]);
        this._deprecateBounds[1].set(bounds[1]);
    }

    /**
     * Checks if a waypoint is registered with this renderer. A context or contexts can be optionally specified such
     * that the method will only return true if the waypoint is registered under those specific contexts.
     * @param {WT_Waypoint} waypoint - a waypoint.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} [context] - the specific context(s) to check.
     * @returns {Boolean} whether the waypoint is registered with this renderer.
     */
    isRegistered(waypoint, context) {
        if (!waypoint) {
            return false;
        }

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
     * Registers a waypoint with this renderer under a specific context or contexts. Registered waypoints will be drawn as
     * appropriate the next time this renderer's .update() method is called. Registering a waypoint under a context under
     * which it is already registered has no effect.
     * @param {WT_Waypoint} waypoint - the waypoint to register.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - the context(s) under which the waypoint should be registered.
     */
    register(waypoint, context) {
        if (!waypoint || context === 0) {
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
     * Deletes and cleans up a registered waypoint entry.
     * @param {WT_MapViewWaypointCanvasRendererEntry} entry - the entry to delete.
     */
    _deleteEntry(entry) {
        let showLabel = entry.showLabel;
        if (showLabel) {
            this._labelManager.remove(entry.label);
        }
        this._registered.delete(entry.waypoint.uniqueID);
    }

    /**
     * Deregisters a waypoint with this render from a specific context or contexts. Once a waypoint is deregistered from
     * a context, it will no longer be rendered in that context the next this renderer's update() method is called.
     * @param {WT_Waypoint} waypoint - the waypoint to deregister.
     * @param {WT_MapViewWaypointCanvasRenderer.Context} context - the context(s) from which the waypoint should be deregistered.
     */
    deregister(waypoint, context) {
        if (!waypoint) {
            return;
        }

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
     * Redraws waypoints registered with this renderer.
     * @param {WT_MapViewState} state - the current map view state.
     */
    update(state) {
        let iconsToDraw = [];
        let toRemove = [];
        for (let entry of this._registered.values()) {
            entry.update(state);
            if (entry.showIcon) {
                iconsToDraw.push(entry);
            }

            if (entry.isDeprecated) {
                toRemove.push(entry);
            }
        }

        for (let prop in this._canvasContexts) {
            let context = this._canvasContexts[prop];
            if (context) {
                context.clearRect(0, 0, state.projection.viewWidth, state.projection.viewHeight);
            }
        }

        iconsToDraw.sort((a, b) => a.icon.priority - b.icon.priority);
        for (let entry of iconsToDraw) {
            let icon = entry.icon;
            switch(entry.lastShowContext) {
                case WT_MapViewWaypointCanvasRenderer.Context.NORMAL:
                    icon.draw(state, this._contexts.normal.canvasContext);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.AIRWAY:
                    icon.draw(state, this._contexts.airway.canvasContext);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN:
                    icon.draw(state, this._contexts.flightPlan.canvasContext);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE:
                    icon.draw(state, this._contexts.flightPlanActive.canvasContext);
                    break;
                case WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT:
                    icon.draw(state, this._contexts.highlight.canvasContext);
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

/**
 * An entry for a waypoint registered with a WT_MapViewWaypointCanvasRenderer.
 */
class WT_MapViewWaypointCanvasRendererEntry {
    /**
     * @param {WT_MapViewWaypointCanvasRenderer} renderer - the renderer to which the new entry belongs.
     * @param {WT_Waypoint} waypoint - the waypoint associated with the new entry.
     * @param {Number} context - the waypoint context(s) of the new entry.
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

        this._lastShowContext = 0;
        this._isDeprecated = false;
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint - the waypoint associated with this entry.
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    /**
     * @readonly
     * @property {Number} context - the waypoint context(s) associated with this entry.
     * @type {Number}
     */
    get context() {
        return this._context;
    }

    /**
     * @readonly
     * @property {WT_MapViewWaypointCanvasRenderer.Context} lastShownContext - the context in which this entry's waypoint was last rendered.
     * @type {WT_MapViewWaypointCanvasRenderer.Context}
     */
    get lastShowContext() {
        return this._lastShowContext;
    }

    /**
     * @readonly
     * @property {Boolean} isDeprecated - whether this entry is deprecated.
     * @type {Boolean}
     */
    get isDeprecated() {
        return this._isDeprecated;
    }

    /**
     * @readonly
     * @property {Boolean} showIcon - whether this entry's waypoint icon is currently visible.
     * @type {Boolean}
     */
    get showIcon() {
        return this._showIcon;
    }

    /**
     * @readonly
     * @property {Boolean} showLabel - whether this entry's waypoint label is currently visible.
     * @type {Boolean}
     */
    get showLabel() {
        return this._showLabel;
    }

    /**
     * @readonly
     * @property {WT_MapViewWaypointIcon} icon - this entry's waypoint icon.
     * @type {WT_MapViewWaypointIcon}
     */
    get icon() {
        return this._icon;
    }

    /**
     * @readonly
     * @property {WT_MapViewWaypointLabel} label - this entry's waypoint label.
     * @type {WT_MapViewWaypointLabel}
     */
    get label() {
        return this._label;
    }

    /**
     * Checks whether this entry is associated with any of the specified contexts. Optionally, this method can also check if
     * this entry's waypoint was last rendered in any of the specified contexts instead.
     * @param {Number} context - the contexts against which to check.
     * @param {Boolean} [lastShown] - whether to check the context in which this entry's waypoint was last rendered instead of
     *                                the current contexts associated with this entry. False by default.
     * @returns {Boolean} whether the check passed.
     */
    isAnyContext(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShowContext;
        } else {
            toCompare = this.context;
        }
        return (toCompare & context) !== 0;
    }

    /**
     * Checks whether this entry is associated with only the specified context(s). Optionally, this method can also check if
     * this entry's waypoint was last rendered in only the specified context(s) instead.
     * @param {Number} context - the context(s) against which to check.
     * @param {Boolean} [lastShown] - whether to check the context in which this entry's waypoint was last rendered instead of
     *                                the current contexts associated with this entry. False by default.
     * @returns {Boolean} whether the check passed.
     */
    isOnlyContext(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShowContext;
        } else {
            toCompare = this.context;
        }
        return toCompare === context;
    }

    /**
     * Checks whether this entry is associated with all the specified context(s). Optionally, this method can also check if
     * this entry's waypoint was last rendered in all the specified context(s) instead.
     * @param {Number} context - the context(s) against which to check.
     * @param {Boolean} [lastShown] - whether to check the context in which this entry's waypoint was last rendered instead of
     *                                the current contexts associated with this entry. False by default.
     * @returns {Boolean} whether the check passed.
     */
    isAllContexts(context, lastShown = false) {
        let toCompare;
        if (lastShown) {
            toCompare = this.lastShowContext;
        } else {
            toCompare = this.context;
        }
        return (toCompare & context) === context;
    }

    /**
     * Adds a waypoint context or contexts to this entry.
     * @param {Number} context - the context(s) to add.
     */
    addContext(context) {
        this._context = this._context | context;
    }

    /**
     * Removes a waypoint context or contexts to this entry.
     * @param {Number} context - the context(s) to remove.
     */
    removeContext(context) {
        this._context = this._context & ~context;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewWaypointCanvasRenderer.Context} showContext
     * @param {Boolean} showIcon
     * @param {Boolean} showLabel
     * @param {WT_MapViewWaypointIconFactory} [iconFactory]
     * @param {WT_MapViewWaypointLabelFactory} [labelFactory]
     * @param {{getOptions(state:WT_MapViewState, waypoint:WT_Waypoint)}} [styleOptionHandler]
     */
    _draw(state, showContext, showIcon, showLabel, iconFactory, labelFactory, styleOptionHandler) {
        let needReplace = showContext !== this.lastShowContext;
        if (needReplace) {
            if (this._showLabel) {
                this._renderer._labelManager.remove(this._label);
            }

            let options = styleOptionHandler.getOptions(state, this.waypoint);

            this._icon = iconFactory.getIcon(this.waypoint, options.icon.priority);
            this._icon.setOptions(options.icon);
            this._label = labelFactory.getLabel(this.waypoint, options.label.priority, options.label.alwaysShow);
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
        this._lastShowContext = showContext;
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
     * Updates this entry. An appropriate waypoint context is selected for this entry's waypoint, then the icon and label are
     * updated as appropriate for the chosen context. If the waypoint's label should be visible, it is added to the appropriate
     * label manager. Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the
     * .showIcon property returns the correct value depending on whether the icon should be visible.
     * @param {WT_MapViewState} state - the current map view state.
     */
    update(state) {
        let hide = false;
        let isInView = state.projection.renderer.isInView(this.waypoint.location, 0.05);
        let showContext = 0;
        let showIcon = false;
        let showLabel = false;
        let propertyName = "";

        if (isInView) {
            if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT) && this._renderer._contexts.highlight.visibilityHandler.isVisible(state, this.waypoint)) {
                showContext = WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT;
                showIcon = true;
                showLabel = true;
                propertyName = "highlight";
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE) && this._renderer._contexts.flightPlanActive.visibilityHandler.isVisible(state, this.waypoint)) {
                showContext = WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE;
                showIcon = true;
                showLabel = true;
                propertyName = "flightPlanActive";
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN) && this._renderer._contexts.flightPlan.visibilityHandler.isVisible(state, this.waypoint)) {
                showContext = WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN;
                showIcon = true;
                showLabel = true;
                propertyName = "flightPlan";
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.NORMAL) && this._renderer._contexts.normal.visibilityHandler.isVisible(state, this.waypoint)) {
                showContext = WT_MapViewWaypointCanvasRenderer.Context.NORMAL;
                showIcon = true;
                showLabel = true;
                propertyName = "normal";
            } else if (this.isAnyContext(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY) && this._renderer._contexts.airway.visibilityHandler.isVisible(state, this.waypoint)) {
                showContext = WT_MapViewWaypointCanvasRenderer.Context.AIRWAY;
                showIcon = true;
                showLabel = false;
                propertyName = "airway";
            } else {
                hide = true;
            }
        } else {
            hide = true;
        }

        if (hide) {
            this._draw(state, this.lastShowContext, false, false);
        } else {
            let iconFactory = this._renderer._contexts[propertyName].iconFactory;
            let labelFactory = this._renderer._contexts[propertyName].labelFactory;
            let optionHandler = this._renderer._contexts[propertyName].styleOptionHandler;
            this._draw(state, showContext, showIcon, showLabel, iconFactory, labelFactory, optionHandler);
        }

        this._updateDeprecation(state);
    }
}