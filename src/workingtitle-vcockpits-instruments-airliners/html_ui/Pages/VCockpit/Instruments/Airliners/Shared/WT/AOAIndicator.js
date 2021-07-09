class Jet_PFD_AOAIndicator extends HTMLElement {
    constructor() {
        super(...arguments);
        this.fontSize = 25;
        this.cursorWidth = 0;
        this.cursorHeight = 0;
        this.cursorMinY = 0;
        this.cursorMaxY = 0;
        this._aircraft = Aircraft.A320_NEO;
        this.aoaStyle = 1;
    }
    static get observedAttributes() {
        return [
            "angle",
            "aoa-style"
        ];
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
            this.construct();
        }
    }
    connectedCallback() {
        this.construct();
    }
    construct() {
        if (this.aircraft == Aircraft.CJ4) {
            this.construct_CJ4();
        }
    }
    construct_CJ4() {
        this.newAOA = document.createElementNS(Avionics.SVG.NS, "svg");
        this.newAOA.setAttribute("id", "ViewBox");
        this.newAOA.setAttribute("viewBox", "0 0 250 500");
        var width = 70.5;
        var centerHeight = 380;
        var posX = width * 0.5;
        var posY = 435;
        if (!this.rootGroup) {
            this.rootGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup.setAttribute("id", "AoA");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup);
        }
        if (!this.centerGroup) {
            this.centerGroup = document.createElementNS(Avionics.SVG.NS, "g");
            this.centerGroup.setAttribute("id", "CenterGroup");
        }
        else {
            Utils.RemoveAllChildren(this.centerGroup);
        }
        posY -= centerHeight;
        {
            var _top = posY;
            var _left = posX - width * 0.5;
            var _width = width;
            var _height = centerHeight;
            var bg = document.createElementNS(Avionics.SVG.NS, "rect");
            diffAndSetAttribute(bg, "x", _left.toString());
            diffAndSetAttribute(bg, "y", _top.toString());
            diffAndSetAttribute(bg, "width", _width.toString());
            diffAndSetAttribute(bg, "height", _height.toString());
            diffAndSetAttribute(bg, "fill", "black");
            diffAndSetAttribute(bg, "fill-opacity", "0.5");
            this.centerGroup.appendChild(bg);
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            diffAndSetText(text, "AOA");
            diffAndSetAttribute(text, "x", (_left + _width * 0.75).toString());
            diffAndSetAttribute(text, "y", (_top + 30).toString());
            diffAndSetAttribute(text, "fill", "#a1a1a1");
            diffAndSetAttribute(text, "font-size", (this.fontSize + 3).toString());
            diffAndSetAttribute(text, "font-family", "Roboto-Light");
            diffAndSetAttribute(text, "text-anchor", "end");
            diffAndSetAttribute(text, "alignment-baseline", "central");
            this.centerGroup.appendChild(text);
            var _graduationStartY = _top + 60;
            var _graduationHeight = (_top + 325) - _graduationStartY;
            if (!this.graduationsGroup) {
                this.graduationsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                this.graduationsGroup.setAttribute("id", "GraduationsGroup");
            }
            else {
                Utils.RemoveAllChildren(this.graduationsGroup);
            }
            var _nbGrads = 9;
            var _gradSpacing = _graduationHeight / (_nbGrads - 1);
            var _gradTexts = ["1.0", ".8", ".6", ".4", ".2"];
            var _textId = 0;
            var _gradX = (_left + _width * 0.71);
            for (var i = 0; i < _nbGrads; i++) {
                var isPrimary = (i % 2) ? false : true;
                var y = _graduationStartY + (_gradSpacing * i);
                var len = isPrimary ? 12 : 6;
                var line = document.createElementNS(Avionics.SVG.NS, "rect");
                diffAndSetAttribute(line, "x", (_gradX - len).toString());
                diffAndSetAttribute(line, "y", y.toString());
                diffAndSetAttribute(line, "width", len.toString());
                diffAndSetAttribute(line, "height", "2");
                diffAndSetAttribute(line, "fill", "#a1a1a1");
                this.graduationsGroup.appendChild(line);
                if (isPrimary) {
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    diffAndSetText(text, _gradTexts[_textId]);
                    diffAndSetAttribute(text, "x", (_gradX - len - 5).toString());
                    diffAndSetAttribute(text, "y", (y + 3).toString());
                    diffAndSetAttribute(text, "fill", "#a1a1a1");
                    diffAndSetAttribute(text, "font-size", this.fontSize.toString());
                    diffAndSetAttribute(text, "font-family", "Roboto-Light");
                    diffAndSetAttribute(text, "text-anchor", "end");
                    diffAndSetAttribute(text, "alignment-baseline", "central");
                    this.graduationsGroup.appendChild(text);
                    _textId++;
                }
            }
            var graduationVLine = document.createElementNS(Avionics.SVG.NS, "line");
            diffAndSetAttribute(graduationVLine, "x1", _gradX.toString());
            diffAndSetAttribute(graduationVLine, "y1", _graduationStartY.toString());
            diffAndSetAttribute(graduationVLine, "x2", _gradX.toString());
            diffAndSetAttribute(graduationVLine, "y2", (_graduationStartY + (_gradSpacing * (_nbGrads - 1))).toString());
            diffAndSetAttribute(graduationVLine, "fill", "none");
            diffAndSetAttribute(graduationVLine, "stroke", "#a1a1a1");
            diffAndSetAttribute(graduationVLine, "stroke-width", "2");
            this.graduationsGroup.appendChild(graduationVLine);
            this.centerGroup.appendChild(this.graduationsGroup);
            this.bottomText = document.createElementNS(Avionics.SVG.NS, "text");
            this.bottomText.textContent = ".";
            this.bottomText.setAttribute("x", (_left + _width * 0.90).toString());
            this.bottomText.setAttribute("y", (_top + _height - 20).toString());
            this.bottomText.setAttribute("fill", "#a1a1a1");
            this.bottomText.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.bottomText.setAttribute("font-family", "Roboto-Light");
            this.bottomText.setAttribute("text-anchor", "end");
            this.bottomText.setAttribute("alignment-baseline", "central");
            this.centerGroup.appendChild(this.bottomText);
            this.cursorMinY = _graduationStartY + _graduationHeight;
            this.cursorMaxY = _graduationStartY;
            this.cursorWidth = 40;
            this.cursorHeight = 8;
            var cursorPosX = _gradX - this.cursorWidth * 0.45;
            var cursorPosY = this.cursorMinY;
            if (!this.cursorSVG) {
                this.cursorSVG = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG);
            this.cursorSVG.setAttribute("x", cursorPosX.toString());
            this.cursorSVG.setAttribute("y", (cursorPosY - this.cursorHeight * 0.5).toString());
            this.cursorSVG.setAttribute("width", this.cursorWidth.toString());
            this.cursorSVG.setAttribute("height", this.cursorHeight.toString());
            this.cursorSVG.setAttribute("viewBox", "0 0 " + this.cursorWidth + " " + this.cursorHeight);
            {
                if (!this.cursorSVGShape)
                    this.cursorSVGShape = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape.setAttribute("fill", "#a1a1a1");
                this.cursorSVGShape.setAttribute("d", "M7 0 l20 0 l2 2 l5 5 l-20 0 Z");
                this.cursorSVGShape.setAttribute("fill", "none");
                this.cursorSVGShape.setAttribute("stroke", "#a1a1a1");
                this.cursorSVGShape.setAttribute("stroke-width", "2");
                this.cursorSVG.appendChild(this.cursorSVGShape);
            }
            this.centerGroup.appendChild(this.cursorSVG);
            this.rootGroup.appendChild(this.centerGroup);
        }
        
        let borderline = document.createElementNS(Avionics.SVG.NS, "line");
        let blx = "72";
        diffAndSetAttribute(borderline, "x1", blx);
        diffAndSetAttribute(borderline, "y1", "55");
        diffAndSetAttribute(borderline, "x2", blx);
        diffAndSetAttribute(borderline, "y2", "435");
        diffAndSetAttribute(borderline, "stroke", "#909090");
        diffAndSetAttribute(borderline, "stroke-width", "2");
        this.rootGroup.appendChild(borderline);
        
        this.newAOA.appendChild(this.rootGroup);
        this.appendChild(this.newAOA);
    
    //OLD STYLE AOA INDICATOR
        this.oldAOA = document.createElementNS(Avionics.SVG.NS, "svg");
        this.oldAOA.setAttribute("id", "ViewBox");
        this.oldAOA.setAttribute("viewBox", "0 0 250 500");
        var width = 70.5;
        var centerHeight = 380;
        var posX = width * 0.5;
        var posY = 435;

        if (!this.rootGroup_2) {
            this.rootGroup_2 = document.createElementNS(Avionics.SVG.NS, "g");
            this.rootGroup_2.setAttribute("id", "AoA");
        }
        else {
            Utils.RemoveAllChildren(this.rootGroup2);
        }
        if (!this.centerGroup_2) {
            this.centerGroup_2 = document.createElementNS(Avionics.SVG.NS, "g");
            this.centerGroup_2.setAttribute("id", "CenterGroup");
        }
        else {
            Utils.RemoveAllChildren(this.centerGroup_2);
        }
        posY -= centerHeight;
        {
            var _top = posY;
            var _left = posX - width * 0.5;
            var _width = width;
            var _height = centerHeight;
            var bg_2 = document.createElementNS(Avionics.SVG.NS, "rect");
            bg_2.setAttribute("x", _left.toString());
            bg_2.setAttribute("y", _top.toString());
            bg_2.setAttribute("width", _width.toString());
            bg_2.setAttribute("height", _height.toString());
            bg_2.setAttribute("fill", "black");
            bg_2.setAttribute("fill-opacity", "0.5");
            this.centerGroup_2.appendChild(bg_2);
            var text_2 = document.createElementNS(Avionics.SVG.NS, "text");
            text_2.textContent = "AOA";
            text_2.setAttribute("x", (_left + _width * 0.75).toString());
            text_2.setAttribute("y", (_top + 30).toString());
            text_2.setAttribute("fill", "white");
            text_2.setAttribute("font-size", (this.fontSize + 3).toString());
            text_2.setAttribute("font-family", "Roboto-Light");
            text_2.setAttribute("text-anchor", "end");
            text_2.setAttribute("alignment-baseline", "central");
            this.centerGroup_2.appendChild(text_2);
            var _graduationStartY = _top + 60;
            var _graduationHeight = (_top + 325) - _graduationStartY;
            if (!this.graduationsGroup_2) {
                this.graduationsGroup_2 = document.createElementNS(Avionics.SVG.NS, "g");
                this.graduationsGroup_2.setAttribute("id", "GraduationsGroup");
            }
            else {
                Utils.RemoveAllChildren(this.graduationsGroup_2);
            }
            var _nbGrads = 9;
            var _gradSpacing = _graduationHeight / (_nbGrads - 1);
            var _gradTexts = ["1.0", ".8", ".6", ".4", ".2"];
            var _textId = 0;
            var _gradX = (_left + _width * 0.71);
            for (var i = 0; i < _nbGrads; i++) {
                var isPrimary = (i % 2) ? false : true;
                var y = _graduationStartY + (_gradSpacing * i);
                var len = isPrimary ? 12 : 6;
                var line_2 = document.createElementNS(Avionics.SVG.NS, "rect");
                line_2.setAttribute("x", (_gradX - len).toString());
                line_2.setAttribute("y", y.toString());
                line_2.setAttribute("width", len.toString());
                line_2.setAttribute("height", "2");
                line_2.setAttribute("fill", "white");
                this.graduationsGroup_2.appendChild(line_2);
                if (isPrimary) {
                    var text_2 = document.createElementNS(Avionics.SVG.NS, "text");
                    text_2.textContent = _gradTexts[_textId];
                    text_2.setAttribute("x", (_gradX - len - 5).toString());
                    text_2.setAttribute("y", (y + 3).toString());
                    text_2.setAttribute("fill", "white");
                    text_2.setAttribute("font-size", this.fontSize.toString());
                    text_2.setAttribute("font-family", "Roboto-Light");
                    text_2.setAttribute("text-anchor", "end");
                    text_2.setAttribute("alignment-baseline", "central");
                    this.graduationsGroup_2.appendChild(text_2);
                    _textId++;
                }
            }
            var graduationVLine_2 = document.createElementNS(Avionics.SVG.NS, "line");
            graduationVLine_2.setAttribute("x1", _gradX.toString());
            graduationVLine_2.setAttribute("y1", _graduationStartY.toString());
            graduationVLine_2.setAttribute("x2", _gradX.toString());
            graduationVLine_2.setAttribute("y2", (_graduationStartY + (_gradSpacing * (_nbGrads - 1))).toString());
            graduationVLine_2.setAttribute("fill", "none");
            graduationVLine_2.setAttribute("stroke", "white");
            graduationVLine_2.setAttribute("stroke-width", "2");
            this.graduationsGroup_2.appendChild(graduationVLine_2);
            this.centerGroup_2.appendChild(this.graduationsGroup_2);
            this.bottomText_2 = document.createElementNS(Avionics.SVG.NS, "text");
            this.bottomText_2.textContent = ".";
            this.bottomText_2.setAttribute("x", (_left + _width * 0.90).toString());
            this.bottomText_2.setAttribute("y", (_top + _height - 20).toString());
            this.bottomText_2.setAttribute("fill", "white");
            this.bottomText_2.setAttribute("font-size", (this.fontSize * 1.1).toString());
            this.bottomText_2.setAttribute("font-family", "Roboto-Light");
            this.bottomText_2.setAttribute("text-anchor", "end");
            this.bottomText_2.setAttribute("alignment-baseline", "central");
            this.centerGroup_2.appendChild(this.bottomText_2);
            this.cursorMinY = _graduationStartY + _graduationHeight;
            this.cursorMaxY = _graduationStartY;
            this.cursorWidth = 40;
            this.cursorHeight_2 = 16;
            var cursorPosX = _gradX - this.cursorWidth * 0.45;
            var cursorPosY = this.cursorMinY;
            if (!this.cursorSVG_2) {
                this.cursorSVG_2 = document.createElementNS(Avionics.SVG.NS, "svg");
                this.cursorSVG_2.setAttribute("id", "CursorGroup");
            }
            else
                Utils.RemoveAllChildren(this.cursorSVG_2);
            this.cursorSVG_2.setAttribute("x", cursorPosX.toString());
            this.cursorSVG_2.setAttribute("y", (cursorPosY - this.cursorHeight2 * 0.5).toString());
            this.cursorSVG_2.setAttribute("width", this.cursorWidth.toString());
            this.cursorSVG_2.setAttribute("height", this.cursorHeight_2.toString());
            this.cursorSVG_2.setAttribute("viewBox", "0 0 " + this.cursorWidth + " " + this.cursorHeight_2);
            {
                if (!this.cursorSVGShape_2)
                    this.cursorSVGShape_2 = document.createElementNS(Avionics.SVG.NS, "path");
                this.cursorSVGShape_2.setAttribute("fill", "white");
                this.cursorSVGShape_2.setAttribute("d", "M14 0 l24 0 l-6 8 l6 8 l-23 0 l-6 -8 l5 -8 Z");
                this.cursorSVGShape_2.setAttribute("fill", "none");
                this.cursorSVGShape_2.setAttribute("stroke", "white");
                this.cursorSVGShape_2.setAttribute("stroke-width", "2");
                this.cursorSVG_2.appendChild(this.cursorSVGShape_2);
            }
            this.centerGroup_2.appendChild(this.cursorSVG_2);
            this.rootGroup_2.appendChild(this.centerGroup_2);
        }
        let borderline_2 = document.createElementNS(Avionics.SVG.NS, "line");
        let blx_2 = "72";
        borderline_2.setAttribute("x1", blx_2);
        borderline_2.setAttribute("y1", "55");
        borderline_2.setAttribute("x2", blx_2);
        borderline_2.setAttribute("y2", "435");
        borderline_2.setAttribute("stroke", "white");
        borderline_2.setAttribute("stroke-width", "2");
        this.rootGroup_2.appendChild(borderline_2);

        this.oldAOA.appendChild(this.rootGroup_2);
        this.appendChild(this.oldAOA);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue == newValue)
            return;
        switch (name) {
            case "angle":
                let angle = parseFloat(newValue);
                angle = Math.min(Math.max(angle, 0), 12.5) / 12.5;
                if (this.cursorSVG || this.cursorSVG_2) {
                    var posY = Math.min(this.cursorMinY + (this.cursorMaxY - this.cursorMinY) * (1.25 * angle - 0.25), 390);
                    this.cursorSVG.setAttribute("y", (posY - this.cursorHeight * 0.5).toString());
                    this.cursorSVG_2.setAttribute("y", (posY - this.cursorHeight_2 * 0.5).toString());

                }
                var fixedAngle = angle.toFixed(2);
                if (angle < 1.0) {
                    var radixPos = fixedAngle.indexOf('.');
                    this.bottomText.textContent = fixedAngle.slice(radixPos);
                    this.bottomText_2.textContent = fixedAngle.slice(radixPos);
                }
                else {
                    this.bottomText.textContent = fixedAngle;
                    this.bottomText_2.textContent = fixedAngle;
                }
                break;
            case "aoa-style":
                this.aoaStyle = parseInt(newValue);
        }
        this.applyAttributes();
    }
     applyAttributes() {          
        if (this.aoaStyle == 0) {
            this.oldAOA.setAttribute("display", "");
            this.newAOA.setAttribute("display", "none");      
        } else if (this.aoaStyle == 1) {
            this.newAOA.setAttribute("display", "");
            this.oldAOA.setAttribute("display", "none");
        }
    }
}
customElements.define("jet-pfd-aoa-indicator", Jet_PFD_AOAIndicator);
//# sourceMappingURL=AOAIndicator.js.map