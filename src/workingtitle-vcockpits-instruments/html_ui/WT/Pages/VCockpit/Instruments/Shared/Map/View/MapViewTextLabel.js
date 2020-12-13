class WT_MapViewTextLabel {
    get priority() {
        return 0;
    }

    get bounds() {
        return undefined;
    }

    draw(data, context) {
    }

    update(data) {
    }
}

class WT_MapViewSimpleTextLabel extends WT_MapViewTextLabel {
    constructor(text, priority) {
        super();
        this._text = text;
        this._priority = priority;
        this._position = new WT_GVector2(0, 0);
        this._anchor = new WT_GVector2(0, 1);

        this._backgroundPadding = [0, 0, 0, 0];

        this._bounds = {left: 0, right: 0, top: 0, bottom: 0};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewSimpleTextLabel.OPTIONS_DEF);
    }

    get priority() {
        return this._priority;
    }

    get bounds() {
        return this._bounds;
    }

    get text() {
        return this._text;
    }

    get anchor() {
        return this._anchor.readonly();
    }

    set anchor(value) {
        this._anchor.set(value);
    }

    get backgroundPadding() {
        return this._backgroundPadding;
    }

    set backgroundPadding(padding) {
        if (padding.length > 0) {
            this._backgroundPadding[0] = padding[0];
            this._backgroundPadding[1] = padding[0];
            this._backgroundPadding[2] = padding[0];
            this._backgroundPadding[3] = padding[0];
        }
        if (padding.length > 1) {
            this._backgroundPadding[1] = padding[1];
            this._backgroundPadding[3] = padding[1];
        }
        if (padding.length > 2) {
            this._backgroundPadding[2] = padding[2];
        }
        if (padding.length > 3) {
            this._backgroundPadding[3] = padding[3];
        }
    }

    draw(state, context) {
        context.font = `${this.fontSize * state.dpiScale}px ${this.font}`;
        let width = context.measureText(this.text).width;
        let height = this.fontSize * state.dpiScale;

        let centerX = this._position.x + (this.anchor.x - 0.5) * width;
        let centerY = this._position.y + (this.anchor.x - 0.5) * height;

        if (this.showBackground) {
            let backgroundLeft = centerX - width / 2 - (this.backgroundPadding[3] + this.backgroundOutlineWidth) * state.dpiScale;
            let backgroundTop = centerY - height / 2 - (this.backgroundPadding[0] + this.backgroundOutlineWidth) * state.dpiScale;
            let backgroundWidth = width + (this.backgroundPadding[1] + this.backgroundPadding[3] + 2 * this.backgroundOutlineWidth) * state.dpiScale;
            let backgroundHeight = height + (this.backgroundPadding[0] + this.backgroundPadding[2] + 2 * this.backgroundOutlineWidth) * state.dpiScale;
            if (this.backgroundOutlineWidth > 0) {
                context.lineWidth = this.backgroundOutlineWidth * 2 * state.dpiScale;
                context.strokeStyle = this.backgroundOutlineColor;
                context.strokeRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
            }
            context.fillStyle = this.backgroundColor;
            context.fillRect(backgroundLeft, backgroundTop, backgroundWidth, backgroundHeight);
        }

        context.textBaseline = "middle";
        context.textAlign = "center";
        if (this.fontOutlineWidth > 0) {
            context.lineWidth = this.fontOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = this.fontOutlineColor;
            context.strokeText(this.text, centerX, centerY);
        }
        context.fillStyle = this.fontColor;
        context.fillText(this.text, centerX, centerY);
    }

    _updateBounds(state) {
        let width = 0.6 * this.fontSize * this.text.length * state.dpiScale;
        let height = this.fontSize * state.dpiScale;

        let left = this._position.x - this.anchor.x * width;
        let right = left + width;
        let top = this._position.y - this.anchor.y * height;
        let bottom = top + height;
        if (this.showBackground) {
            left -= (this.backgroundPadding[3] + this.backgroundOutlineWidth) * state.dpiScale;
            right += (this.backgroundPadding[1] + this.backgroundOutlineWidth) * state.dpiScale;
            top -= (this.backgroundPadding[0] + this.backgroundOutlineWidth) * state.dpiScale;
            bottom += (this.backgroundPadding[2] + this.backgroundOutlineWidth) * state.dpiScale;
        }
        this._bounds.left = left;
        this._bounds.right = right;
        this._bounds.top = top;
        this._bounds.bottom = bottom;
    }

    update(state) {
        this._updateBounds(state);
    }
}
WT_MapViewSimpleTextLabel.OPTIONS_DEF = {
    font: {default: "Roboto", auto: true},
    fontSize: {default: 20, auto: true},
    fontColor: {default: "white", auto: true},
    fontOutlineWidth: {default: 6, auto: true},
    fontOutlineColor: {default: "black", auto: true},
    showBackground: {default: false, auto: true},
    backgroundColor: {default: "black", auto: true},
    backgroundPadding: {default: [0]},
    backgroundOutlineWidth: {default: 0, auto: true},
    backgroundOutlineColor: {default: "white", auto: true}
}