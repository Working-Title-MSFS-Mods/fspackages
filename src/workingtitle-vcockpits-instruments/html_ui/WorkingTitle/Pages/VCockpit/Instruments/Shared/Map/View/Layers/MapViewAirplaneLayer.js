class WT_MapViewAirplaneLayer extends WT_MapViewCanvasLayer {
    constructor(id = WT_MapViewAirplaneLayer.ID_DEFAULT, configName = WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT) {
        super(id, configName);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAirplaneLayer.OPTIONS_DEF);

        this._iconImageLoaded = false;
    }

    get canvas() {
        return this.canvases[0].canvas;
    }

    get canvasContext() {
        return this.canvases[0].context;
    }

    _resizeCanvas() {
        this.canvas.width = this.iconSizePx;
        this.canvas.height = this.iconSizePx;
        this.canvas.style.left = `${-this.iconSizePx / 2}px`;
        this.canvas.style.top = `${-this.iconSizePx / 2}px`;
        this.canvas.style.width = `${this.iconSizePx}px`;
        this.canvas.style.height = `${this.iconSizePx}px`;
    }

    _redrawIcon() {
        this.canvasContext.drawImage(this._iconImage, 0, 0, this.iconSizePx, this.iconSizePx);
    }

    _drawIconToCanvas() {
        this._redrawIcon();
        this._iconImageLoaded = true;
    }

    onViewSizeChanged(data) {
        let newIconSizePx = this.iconSize * data.pixelDensity;
        if (newIconSizePx !== this.iconSizePx) {
            this.iconSizePx = newIconSizePx;
            this._resizeCanvas();
            if (this._iconImageLoaded) {
                this._redrawIcon();
            }
        }
    }

    onConfigLoaded(data) {
        this._setPropertyFromConfig("iconSize");

        this.iconSizePx = this.iconSize * data.pixelDensity;
        this._resizeCanvas();

        this._iconImage = document.createElement("img");
        this._iconImage.onload = this._drawIconToCanvas.bind(this);
        this._iconImage.src = this.config.iconPath;
    }

    onUpdate(data) {
        if (!data.viewPlane) {
            return;
        }
        let iconRotation = data.model.airplane.headingTrue + data.projection.rotation;
        this.canvas.style.transform = `translate(${data.viewPlane.x}px, ${data.viewPlane.y}px) rotate(${iconRotation}deg)`;
    }
}
WT_MapViewAirplaneLayer.ID_DEFAULT = "AirplaneLayer";
WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT = "airplane";
WT_MapViewAirplaneLayer.OPTIONS_DEF = {
    iconSize: {default: 60, auto: true},
    iconSizePx: {default: 60, auto: true}
};