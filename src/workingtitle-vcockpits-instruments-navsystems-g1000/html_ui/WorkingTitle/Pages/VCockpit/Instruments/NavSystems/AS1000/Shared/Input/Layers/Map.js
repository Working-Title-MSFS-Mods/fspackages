class WT_Map_Input_Layer extends Input_Layer {
    constructor(map, allowScrolling = true) {
        super()
        this.cursorSpeed = 2;
        this.mapSpeed = 4;
        this.speedMultiplier = 1;
        this.lastCursorTimestamp = null;
        this.map = map;
        this.allowScrolling = allowScrolling;
    }
    onRangeInc() {
        this.map.zoomIn();
    }
    onRangeDec() {
        this.map.zoomOut();
    }
    updateSpeed() {
        let now = performance.now();
        if (this.lastCursorTimestamp === null) {
            this.lastCursorTimestamp = now;
            return;
        }
        let dt = (now - this.lastCursorTimestamp) / 1000;
        this.lastCursorTimestamp = now;
        this.speedMultiplier = Math.min(this.speedMultiplier * 1.05, 10);
        //this.speedMultiplier += (1 - this.speedMultiplier) * Math.min(1, 1 - Math.pow(0.01, dt * 3))
        if (dt > 0.2)
            this.speedMultiplier = 1;
    }
    onJoystickUp() {
        if (!this.allowScrolling)
            return;
        this.updateSpeed();
        if (this.map.cursorY > 10) {
            this.map.setCursorPos(this.map.cursorX, this.map.cursorY - this.cursorSpeed * this.speedMultiplier);
        }
        else {
            this.map.scrollDisp.y += this.mapSpeed * this.speedMultiplier;
        }
    }
    onJoystickDown() {
        if (!this.allowScrolling)
            return;
        this.updateSpeed();
        if (this.map.cursorY < 90) {
            this.map.setCursorPos(this.map.cursorX, this.map.cursorY + this.cursorSpeed * this.speedMultiplier);
        }
        else {
            this.map.scrollDisp.y -= this.mapSpeed * this.speedMultiplier;
        }
    }
    onJoystickLeft() {
        if (!this.allowScrolling)
            return;
        this.updateSpeed();
        if (this.map.cursorX > 10) {
            this.map.setCursorPos(this.map.cursorX - this.cursorSpeed * this.speedMultiplier, this.map.cursorY);
        }
        else {
            this.map.scrollDisp.x += this.mapSpeed * this.speedMultiplier;
        }
    }
    onJoystickRight() {
        if (!this.allowScrolling)
            return;
        this.updateSpeed();
        if (this.map.cursorX < 90) {
            this.map.setCursorPos(this.map.cursorX + this.cursorSpeed * this.speedMultiplier, this.map.cursorY);
        }
        else {
            this.map.scrollDisp.x -= this.mapSpeed * this.speedMultiplier;
        }
    }
    onJoystickPush() {
        if (!this.allowScrolling)
            return;
        if (this.map.eBingMode === EBingMode.PLANE || this.map.eBingMode === EBingMode.VFR) {
            this.map.activateCursor();
        }
        else if (this.map.eBingMode === EBingMode.CURSOR) {
            this.map.deactivateCursor();
        }
    }
}