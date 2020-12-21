class WT_MapPointerSettingGroup extends WT_MapSettingGroup {
    /**
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {Number} maxScrollSpeed - the maximum map scroll speed, in pixels per second.
     */
    constructor(controller, maxScrollSpeed = WT_MapPointerSettingGroup.MAX_SCROLL_SPEED_DEFAULT) {
        super(controller, [], false, false);

        this._maxScrollSpeed = maxScrollSpeed;

        this._showSetting = new WT_MapSetting(controller, WT_MapPointerSettingGroup.SHOW_KEY, false, false, false, false);
        this._deltaXSetting = new WT_MapSetting(controller, WT_MapPointerSettingGroup.DELTA_X_KEY, 0, false, false, false);
        this._deltaYSetting = new WT_MapSetting(controller, WT_MapPointerSettingGroup.DELTA_Y_KEY, 0, false, false, false);

        this.addSetting(this._showSetting);
        this.addSetting(this._deltaXSetting);
        this.addSetting(this._deltaYSetting);

        this._targetLatLong;

        this._lastTime = Date.now() / 1000;
        this._lastShow = false;

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
    }

    isPointerActive() {
        return this._showSetting.getValue();
    }

    getTargetLatLong() {
        return this._targetLatLong;
    }

    update() {
        let currentTime = Date.now() / 1000;
        let dt = currentTime - this._lastTime;

        let show = this.isPointerActive();
        this.model.pointer.show = show;
        if (show) {
            if (!this._lastShow) {
                this.model.pointer.position = this.view.projection.absXYToRelXY(this.view.projection.viewCenter, this._tempVector1);
            }

            let deltaX = this._deltaXSetting.getValue();
            let deltaY = this._deltaYSetting.getValue();
            let delta = this._tempVector1.set(deltaX, deltaY);
            if (delta.length > this._maxScrollSpeed * dt) {
                delta.setFromPolar(this._maxScrollSpeed * dt, delta.theta);
            }
            this.view.projection.absXYToRelXY(delta, delta);
            let currentPosition = this.model.pointer.position;

            if (deltaX !== 0 || deltaY !== 0) {
                let targetPosition = delta.add(currentPosition);
                let clampedPosition = this._tempVector2.set(Math.max(0, Math.min(1, targetPosition.x)), Math.max(0, Math.min(1, targetPosition.y)));
                let translate = this.view.projection.relXYToAbsXY(targetPosition.subtract(clampedPosition), targetPosition);

                this.model.pointer.position = clampedPosition;
                this._deltaXSetting.setValue(0);
                this._deltaYSetting.setValue(0);

                this._targetLatLong = this.view.projection.invert(translate.add(this.view.projection.viewTarget));
            } else {
                this._targetLatLong = this.view.projection.target;
            }
        }

        this._lastTime = currentTime;
        this._lastShow = show;
    }

    init() {
        super.init();
    }
}
WT_MapPointerSettingGroup.SHOW_KEY = "WT_Map_CursorShow";
WT_MapPointerSettingGroup.DELTA_X_KEY = "WT_Map_CursorDeltaX";
WT_MapPointerSettingGroup.DELTA_Y_KEY = "WT_Map_CursorDeltaY";
WT_MapPointerSettingGroup.MAX_SCROLL_SPEED_DEFAULT = 500; // pixels per second.