/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class RudderTrimGauge extends AbstractGauge {
    constructor() {
        super();
        this.takeOffValue = 10;
        this.forceSvg = true;
    }
    _redrawSvg() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        let width = 80;
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 " + width + " 50");
        this.root.setAttribute("overflow", "visible");
        this.appendChild(this.root);
        let RudText = document.createElementNS(Avionics.SVG.NS, "text");
        RudText.setAttribute("x", (width / 2).toString());
        RudText.setAttribute("y", "20");
        RudText.textContent = "RUD";
        RudText.setAttribute("fill", "white");
        RudText.setAttribute("font-size", "20");
        RudText.setAttribute("text-anchor", "middle");
        this.root.appendChild(RudText);
        let horizontalBar = document.createElementNS(Avionics.SVG.NS, "rect");
        horizontalBar.setAttribute("x", "0");
        horizontalBar.setAttribute("y", "48");
        horizontalBar.setAttribute("height", "2");
        horizontalBar.setAttribute("width", "80");
        horizontalBar.setAttribute("fill", "white");
        this.root.appendChild(horizontalBar);
        let leftBar = document.createElementNS(Avionics.SVG.NS, "rect");
        leftBar.setAttribute("x", "0");
        leftBar.setAttribute("y", "35");
        leftBar.setAttribute("height", "15");
        leftBar.setAttribute("width", "2");
        leftBar.setAttribute("fill", "white");
        this.root.appendChild(leftBar);
        let rightBar = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBar.setAttribute("x", "78");
        rightBar.setAttribute("y", "35");
        rightBar.setAttribute("height", "15");
        rightBar.setAttribute("width", "2");
        rightBar.setAttribute("fill", "white");
        this.root.appendChild(rightBar);
        let greenBar = document.createElementNS(Avionics.SVG.NS, "rect");
        greenBar.setAttribute("x", (this._greenStartPercent * width).toString());
        greenBar.setAttribute("y", "43");
        greenBar.setAttribute("height", "5");
        greenBar.setAttribute("width", (this._greenEndPercent * width - this._greenStartPercent * width).toString());
        greenBar.setAttribute("fill", "green");
        this.root.appendChild(greenBar);
        let whiteBar = document.createElementNS(Avionics.SVG.NS, "rect");
        whiteBar.setAttribute("x", (this._whiteStartPercent * width).toString());
        whiteBar.setAttribute("y", "43");
        whiteBar.setAttribute("height", "5");
        whiteBar.setAttribute("width", (this._whiteEndPercent * width - this._whiteStartPercent * width).toString());
        whiteBar.setAttribute("fill", "white");
        this.root.appendChild(whiteBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M-4 34 L-4 42 L0 50 L4 42 L4 34 Z");
        this.cursor.setAttribute("fill", "aqua");
        this.root.appendChild(this.cursor);
        this._updateValueSvg();
    }
    _drawBase() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    _updateValueSvg() {
        this.cursor.setAttribute("transform", "translate(" + this._valuePercent * 80 + " 0 )");
    }
    _drawCursor() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    connectedCallback() {
        this._redrawSvg();
    }
}
customElements.define('rudder-trim-gauge', RudderTrimGauge);
//# sourceMappingURL=RudderTrimGauge.js.map