class WT_MapViewAirplaneLayer extends WT_MapViewMultiLayer {
    constructor(id = WT_MapViewAirplaneLayer.ID_DEFAULT, configName = WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT) {
        super(id, configName);

        this._airplaneIcon = new WT_MapViewCanvas(false, false);
        this.addSubLayer(this._airplaneIcon);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAirplaneLayer.OPTIONS_DEF);

        this._iconImageLoaded = false;
    }

    get airplaneIcon() {
        return this._airplaneIcon;
    }

    _resizeCanvas() {
        this.airplaneIcon.canvas.width = this.iconSizePx;
        this.airplaneIcon.canvas.height = this.iconSizePx;
        this.airplaneIcon.canvas.style.left = `${-this.iconSizePx / 2}px`;
        this.airplaneIcon.canvas.style.top = `${-this.iconSizePx / 2}px`;
        this.airplaneIcon.canvas.style.width = `${this.iconSizePx}px`;
        this.airplaneIcon.canvas.style.height = `${this.iconSizePx}px`;
    }

    _redrawIcon() {
        this.airplaneIcon.context.drawImage(this._iconImage, 0, 0, this.iconSizePx, this.iconSizePx);
    }

    _drawIconToCanvas() {
        this._redrawIcon();
        this._iconImageLoaded = true;
    }

    onViewSizeChanged(data) {
        let newIconSizePx = this.iconSize * data.dpiScale;
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

        this.iconSizePx = this.iconSize * data.dpiScale;
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
        this.airplaneIcon.canvas.style.transform = `translate(${data.viewPlane.x}px, ${data.viewPlane.y}px) rotate(${iconRotation}deg)`;
    }
}
WT_MapViewAirplaneLayer.ID_DEFAULT = "AirplaneLayer";
WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT = "airplane";
WT_MapViewAirplaneLayer.OPTIONS_DEF = {
    iconSize: {default: 60, auto: true},
    iconSizePx: {default: 60, auto: true}
};