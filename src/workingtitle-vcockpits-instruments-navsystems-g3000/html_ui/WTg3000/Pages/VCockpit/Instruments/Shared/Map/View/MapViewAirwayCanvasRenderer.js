/**
 * A renderer that draws airways to HTML canvas elements.
 */
class WT_MapViewAirwayCanvasRenderer {
    /**
     * @param {WT_MapViewAirwayCanvasRendererEventHandler} eventHandler - an object which responds to rendering cycle events.
     * @param {CanvasRenderingContext2D} context - the canvas rendering context to which the new renderer should draw.
     * @param {Number} desiredLabelDistance - the desired distance between labels of the same airway, in pixels measured along the path
     *                                        of the airway. The actual distance between labels may diverge from this value, but is
     *                                        guaranteed to be at least this value.
     * @param {Number} updateTimeBudget - the amount of time the new renderer can spend actively rendering per update cycle.
     */
    constructor(eventHandler, context, desiredLabelDistance, updateTimeBudget = WT_MapViewAirwayCanvasRenderer.UPDATE_TIME_BUDGET) {
        this._eventHandler = eventHandler;
        this._context = context;
        /**
         * @property {Number} desiredLabelDistance - the desired distance between labels of the same airway, in pixels measured along the path
         *                                           of the airway. The actual distance between labels may diverge from this value, but is
         *                                           guaranteed to be at least this value.
         * @type {Number}
         */
        this.desiredLabelDistance = desiredLabelDistance;
        /**
         * @property {Number} updateTimeBudget - the amount of time this renderer can spend actively rendering per update cycle.
         * @type {Number}
         */
        this.updateTimeBudget = updateTimeBudget;

        this._renderOptions = {
            airways: [],
            renderer: null,
        };

        this._waypointsRendered = new Map();
        this._labeledSegments = [];

        this._nextRender = null;
        this._airwayQueue = [];
        this._airwayQueueHead = 0;

        this._isRendering = false;
        this._renderID = 0;
        this._donePreparingAirways = true;
        this._shouldAbort = false;

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempVector3 = new WT_GVector2(0, 0);
        this._tempVector4 = new WT_GVector2(0, 0);
        this._tempArray1 = [0, 0];
        this._tempArray2 = [0, 0];
    }

    /**
     * @readonly
     * @property {Boolean} isRendering - whether the last render task given to this renderer has finished.
     * @type {Boolean}
     */
    get isRendering() {
        return this._isRendering;
    }

    /**
     * @readonly
     * @property {Iterable<WT_ICAOWaypoint>} waypointsRendered - an iterable of all waypoints along airways that were rendered.
     * @type {Iterable<WT_ICAOWaypoint>}
     */
    get waypointsRendered() {
        return this._waypointsRendered.values();
    }

    /**
     * @readonly
     * @property {Iterable<WT_MapViewAirwayCanvasRendererLabeledSegmentData>} labeledSegments - an iterable of data on all airway segments that should be labeled.
     * @type {Iterable<WT_MapViewAirwayCanvasRendererLabeledSegmentData>}
     */
    get labeledSegments() {
        return this._labeledSegments.values();
    }

    _resolveNextRender() {
        if (this._nextRender) {
            this._nextRender();
            this._nextRender = null;
        }
    }

    _abortRender() {
        this._shouldAbort = false;
        this._isRendering = false;
        this._donePreparingAirways = true;
        this._eventHandler.onAborted();
        this._resolveNextRender();
    }

    /**
     *
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {*} start
     * @param {*} end
     * @param {*} distanceSinceLastLabel
     * @param {*} viewBounds
     * @param {*} searchDirection
     */
    _calculateLabelPathPosition(projectionRenderer, start, end, viewBounds, searchDirection) {
        let topLeft = viewBounds[0];
        let bottomRight = viewBounds[1];
        let pathPosition = 0.5;
        let delta = 0.5;
        let interpFunc = d3.geoInterpolate(WT_MapProjection.latLongGameToProjection(start, this._tempArray1), WT_MapProjection.latLongGameToProjection(end, this._tempArray2));
        let geoPosition = interpFunc(pathPosition, this._tempArray1);
        let position = projectionRenderer.project(geoPosition, this._tempArray2);
        while (position[0] <= topLeft.x ||
               position[0] >= bottomRight.x ||
               position[1] <= topLeft.y ||
               position[1] >= bottomRight.y) {
            delta /= 2;
            if (delta < 0.03125) {
                return pathPosition + searchDirection * delta * 2;
            }
            pathPosition += searchDirection * delta;
            geoPosition = interpFunc(pathPosition, this._tempArray1);
            position = projectionRenderer.project(geoPosition, this._tempArray2);
        }
        return pathPosition;
    }

    /**
     * Calculates and returns an array of contiguous lines (defined by lat/long coordinates) representing the portions of an airway that are
     * visible within a projection renderer's target viewing area.
     * @param {WT_Airway} airway - the airway to render.
     * @param {WT_ICAOWaypoint[]} waypoints - an ordered array of waypoints that make up the airway.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use when rendering the airway.
     * @param {WT_GVector2[]} viewBounds - the bounds of the view area of the projection renderer. This should be an array of size two,
     *                                     with index 0 containing the top left point, and index 1 containing the bottom right point.
     * @returns {LatLong[][]} an array of contiguous lines (defined by lat/long coordinates) representing the visible portions of an airway
     *                        when rendered.
     */
    _calculateAirwayLines(airway, waypoints, projectionRenderer, viewBounds) {
        let lines = [];
        let topLeft = viewBounds[0];
        let bottomRight = viewBounds[1];
        let prevViewPosition = this._tempVector2;
        let prevInBounds = false;
        let currentLine;
        let distanceSinceLastLabel = Infinity;
        for (let i = 0; i < waypoints.length; i++) {
            let currentViewPosition = projectionRenderer.project(waypoints[i].location, this._tempVector1);
            let currentInBounds = currentViewPosition.x >= topLeft.x &&
                                    currentViewPosition.x <= bottomRight.x &&
                                    currentViewPosition.y >= topLeft.y &&
                                    currentViewPosition.y <= bottomRight.y;
            let delta = this._tempVector3.set(0, 0);
            if (i > 0) {
                delta.set(currentViewPosition).subtract(prevViewPosition, true);
            }

            let createLabel = false;
            let labelSearchPosition = 0;

            if (currentInBounds) {
                if (i === 0) {
                    currentLine = [];
                    lines.push(currentLine);
                } else if (!prevInBounds) {
                    currentLine = [waypoints[i - 1].location];
                    lines.push(currentLine);
                }
                currentLine.push(waypoints[i].location);
                this._waypointsRendered.set(waypoints[i].uniqueID, waypoints[i]);

                if (currentLine.length > 1) {
                    if (distanceSinceLastLabel >= this.desiredLabelDistance) {
                        createLabel = true;
                        labelSearchPosition = 1;
                    }
                }
            } else if (prevInBounds) {
                currentLine.push(waypoints[i].location);
                if (distanceSinceLastLabel >= this.desiredLabelDistance) {
                    createLabel = true;
                    labelSearchPosition = -1;
                }
            }
            if (createLabel) {
                let labelPathPosition = this._calculateLabelPathPosition(projectionRenderer, waypoints[i - 1].location, waypoints[i].location, viewBounds, 1);
                this._labeledSegments.push({
                    airway: airway,
                    segment: waypoints.slice(i - 1, i + 1),
                    pathPosition: labelPathPosition
                });
                distanceSinceLastLabel = delta.length * (1 - labelPathPosition);
            } else {
                distanceSinceLastLabel += delta.length;
            }
            prevViewPosition.set(currentViewPosition);
            prevInBounds = currentInBounds;
        }
        return lines;
    }

    /**
     * Renders an array of contiguous lines (defined by lat/long coordinates) representing the portions of an airway that are visible
     * within a projection renderer's target viewing area.
     * @param {WT_Airway} airway - the airway to render.
     * @param {LatLong[][]} lines - an array of contiguous lines representing the portions of the airway that are visible when rendered.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to render the lines.
     */
    _renderLines(airway, lines, projectionRenderer) {
        let feature = {type: "MultiLineString", coordinates: lines.map(contiguous => contiguous.map(latLong => WT_MapProjection.latLongGameToProjection(latLong)))};
        projectionRenderer.renderCanvas(feature, this._context);
    }

    /**
     * Renders an airway.
     * @param {{airway:WT_Airway, waypoints:WT_ICAOWaypoint[]}} data - a data object containing the airway to render and an array of waypoints
     *                                                                 that make up the airway.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to render the airway.
     */
    _renderAirway(data, projectionRenderer, viewBounds) {
        let lines = this._calculateAirwayLines(data.airway, data.waypoints, projectionRenderer, viewBounds);
        this._renderLines(data.airway, lines, projectionRenderer);
    }

    /**
     * Clears the airway render queue.
     */
    _clearAirwayQueue() {
        this._airwayQueue = [];
        this._airwayQueueHead = 0;
    }

    /**
     * Retrieves the list of waypoints that make up an airway and enqueues that data for rendering.
     * @param {WT_Airway} airway - the airway to render.
     * @param {Number} renderID - the ID of the render task with which to associate this request.
     * @returns {Promise<undefined>} a Promise that resolves when the airway data is successfully enqueued, or rejects with an error
     *                               if the current render task is aborted.
     */
    async _enqueueAirwayData(airway, renderID) {
        let waypoints = await airway.getWaypoints();
        if (this._shouldAbort || !this._isRendering || renderID !== this._renderID) {
            throw new Error("Render aborted.");
        }

        if (waypoints.length < 2) {
            return;
        }
        this._airwayQueue.push({airway: airway, waypoints: waypoints});
    }

    /**
     * Prepares airway data for rendering by retrieving all the waypoints that make up each airway.
     * @param {WT_Airway[]} airways - the airways for which to prepare data.
     * @param {Number} renderID - the ID of the current render task.
     * @returns {Promise<undefined>} - a Promise that resolves when data for all airways has been prepared, or rejects with an error
     *                                 if the current render task is aborted.
     */
    _prepareAirwayData(airways, renderID) {
        return Promise.all(airways.map(airway => this._enqueueAirwayData(airway, renderID)));
    }

    _setRenderOptions(airways, renderer) {
        this._renderOptions.airways = airways;
        this._renderOptions.renderer = renderer;
    }

    /**
     *
     * @param {WT_Airway[]} airways
     * @param {WT_MapProjectionRenderer} projectionRenderer
     */
    async _startRender(airways, projectionRenderer) {
        this._isRendering = true;
        this._renderID++;
        this._donePreparingAirways = false;
        this._clearAirwayQueue();
        this._setRenderOptions(airways, projectionRenderer);
        this._waypointsRendered.clear();
        this._labeledSegments = [];
        this._context.beginPath();
        this._eventHandler.onStarted();
        try {
            await this._prepareAirwayData(airways, this._renderID);
            this._donePreparingAirways = true;
        } catch (e) {
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateRender(state) {
        if (this._shouldAbort) {
            this._abortRender();
            return;
        }

        let t0 = performance.now();
        let viewBounds = this._renderOptions.renderer.viewClipExtent;
        while (this._airwayQueueHead < this._airwayQueue.length && performance.now() - t0 <= this.updateTimeBudget) {
            this._renderAirway(this._airwayQueue[this._airwayQueueHead++], this._renderOptions.renderer, viewBounds);
        }

        if (this._airwayQueueHead >= this._airwayQueue.length && this._donePreparingAirways) {
            this._isRendering = false;
            this._eventHandler.onFinished(state);
        } else {
            this._eventHandler.onPaused(state);
        }
    }

    /**
     * Starts rendering airways to this renderer's canvas rendering context using the specified projection renderer. If
     * there is already an active rendering task, then the active task will be aborted before the new task is started.
     * @param {WT_Airway[]} airways - the airways to render.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to render the airways.
     */
    render(airways, projectionRenderer) {
        if (this._isRendering) {
            this._shouldAbort = true;
            this._nextRender = this._startRender.bind(this, airways, projectionRenderer);
        } else {
            this._startRender(airways, projectionRenderer);
        }
    }

    /**
     * Updates this renderer's current render task. This method should be called every update cycle.
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (this._isRendering) {
            this._updateRender(state);
        }
    }
}
WT_MapViewAirwayCanvasRenderer.UPDATE_TIME_BUDGET = 1; // milliseconds

/**
 * @typedef WT_MapViewAirwayCanvasRendererLabeledSegmentData
 * @property {WT_Airway} airway
 * @property {WT_Waypoint[]} segment
 * @property {Number} pathPosition
 */