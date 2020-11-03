/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class AilTrimGauge extends AbstractGauge {
    constructor() {
        super();
        this.takeOffValue = 10;
        this.forceSvg = true;
    }
    _redrawSvg() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        this.root = document.createElementNS(Avionics.SVG.NS, "svg");
        this.root.setAttribute("width", "100%");
        this.root.setAttribute("height", "100%");
        this.root.setAttribute("viewBox", "0 0 100 50");
        this.root.setAttribute("overflow", "visible");
        this.appendChild(this.root);
        let AlText = document.createElementNS(Avionics.SVG.NS, "text");
        AlText.setAttribute("x", "50");
        AlText.setAttribute("y", "50");
        AlText.textContent = "AIL";
        AlText.setAttribute("fill", "white");
        AlText.setAttribute("font-size", "20");
        AlText.setAttribute("text-anchor", "middle");
        this.root.appendChild(AlText);
        let horizontalBar = document.createElementNS(Avionics.SVG.NS, "rect");
        horizontalBar.setAttribute("x", "0");
        horizontalBar.setAttribute("y", "0");
        horizontalBar.setAttribute("height", "2");
        horizontalBar.setAttribute("width", "100");
        horizontalBar.setAttribute("fill", "white");
        this.root.appendChild(horizontalBar);
        let leftBar = document.createElementNS(Avionics.SVG.NS, "rect");
        leftBar.setAttribute("x", "0");
        leftBar.setAttribute("y", "0");
        leftBar.setAttribute("height", "15");
        leftBar.setAttribute("width", "2");
        leftBar.setAttribute("fill", "white");
        this.root.appendChild(leftBar);
        let rightBar = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBar.setAttribute("x", "98");
        rightBar.setAttribute("y", "0");
        rightBar.setAttribute("height", "15");
        rightBar.setAttribute("width", "2");
        rightBar.setAttribute("fill", "white");
        this.root.appendChild(rightBar);
        let whiteBar = document.createElementNS(Avionics.SVG.NS, "rect");
        whiteBar.setAttribute("x", (this._whiteStartPercent * 100).toString());
        whiteBar.setAttribute("y", "2");
        whiteBar.setAttribute("height", "5");
        whiteBar.setAttribute("width", (this._whiteEndPercent * 100 - this._whiteStartPercent * 100).toString());
        whiteBar.setAttribute("fill", "white");
        this.root.appendChild(whiteBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M-4 16 L-4 8 L0 0 L4 8 L4 16 Z");
        this.cursor.setAttribute("fill", "aqua");
        this.root.appendChild(this.cursor);
        this._updateValueSvg();
    }
    _drawBase() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    _updateValueSvg() {
        this.cursor.setAttribute("transform", "translate(" + this._valuePercent * 100 + " 0 )");
    }
    _drawCursor() {
        throw new Error("Elev trim Gauge not implemented in Canvas");
    }
    connectedCallback() {
        this._redrawSvg();
    }
}
customElements.define('ail-trim-gauge', AilTrimGauge);
//# sourceMappingURL=AilTrimGauge.js.map