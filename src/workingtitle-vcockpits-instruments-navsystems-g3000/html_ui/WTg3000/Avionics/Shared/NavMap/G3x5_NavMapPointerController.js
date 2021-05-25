class WT_G3x5_NavMapPointerController {
    /**
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_G3x5_NavMapPointerEventHandler} eventHandler
     * @param {Object} [options]
     */
    constructor(mapModel, mapView, eventHandler, options) {
        this._mapModel = mapModel;
        this._mapView = mapView;
        this._eventHandler = eventHandler;

        this._delta = new WT_GVector2(0, 0);
        this._target = new WT_GeoPoint(0, 0);

        this._lastShow = false;

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_NavMapPointerController.OPTION_DEFS);
        if (options) {
            this._optsManager.setOptions(options);
        }

        this._tempVector2_1 = new WT_GVector2(0, 0);
        this._tempVector2_2 = new WT_GVector2(0, 0);

        this._initEventListener();
    }

    _initEventListener() {
        this._eventHandler.addListener(this._onPointerControlEvent.bind(this));
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    _scroll(delta) {
        this._delta.add(delta);
    }

    _onPointerControlEvent(source, event) {
        switch (event.type) {
            case WT_G3x5_NavMapPointerEventHandler.EventType.SCROLL:
                this._scroll(event.delta);
                break;
        }
    }

    update() {
        let show = this._mapModel.pointer.show;
        if (show) {
            if (!this._lastShow) {
                this._mapModel.pointer.position = this._mapView.projection.absXYToRelXY(this._mapView.projection.viewCenter, this._tempVector2_1);
            }

            if (this._delta.length > 0) {
                let deltaRelative = this._mapView.projection.absXYToRelXY(this._delta, this._tempVector2_1);
                let currentPosition = this._mapModel.pointer.position;

                let targetPosition = deltaRelative.add(currentPosition);
                let clampedPosition = this._tempVector2_2.set(
                    Math.max(this.edgeBuffer.x, Math.min(1 - this.edgeBuffer.x, targetPosition.x)),
                    Math.max(this.edgeBuffer.y, Math.min(1 - this.edgeBuffer.y, targetPosition.y))
                );
                let panDelta = this._mapView.projection.relXYToAbsXY(targetPosition.subtract(clampedPosition), targetPosition);
                this._mapModel.pointer.position = clampedPosition;
                this._mapView.projection.invert(panDelta.add(this._mapView.projection.viewTarget), this._target);

                this._delta.set(0, 0);
            } else {
                this._target.set(this._mapView.projection.target);
            }
            this._mapModel.pointer.target = this._target;
        }

        this._lastShow = show;
    }
}
WT_G3x5_NavMapPointerController.OPTION_DEFS = {
    edgeBuffer: {default: {x: 0.05, y: 0.05}, auto: true}
};