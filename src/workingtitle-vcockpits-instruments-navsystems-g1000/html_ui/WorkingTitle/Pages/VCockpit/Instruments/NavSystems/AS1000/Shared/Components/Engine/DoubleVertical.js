class XMLVerticalDoubleGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.endY = 15;
        this.beginY = 95;
        this.height = 100;
        this.textIncrement = 1;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            let textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            let heightElem = _styleElem.getElementsByTagName("Height");
            if (heightElem.length > 0) {
                this.height = parseFloat(heightElem[0].textContent);
                this.beginY = this.height - 5;
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("overflow", "hidden");
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        let beginBar = document.createElementNS(Avionics.SVG.NS, "rect");
        beginBar.setAttribute("x", "25");
        beginBar.setAttribute("y", (this.beginY).toString());
        beginBar.setAttribute("height", "2");
        beginBar.setAttribute("width", "50");
        beginBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginBar);
        let endBar = document.createElementNS(Avionics.SVG.NS, "rect");
        endBar.setAttribute("x", "25");
        endBar.setAttribute("y", (this.endY).toString());
        endBar.setAttribute("height", "2");
        endBar.setAttribute("width", "50");
        endBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(endBar);
        let gradTextBackground = document.createElementNS(Avionics.SVG.NS, "rect");
        gradTextBackground.setAttribute("x", "36");
        gradTextBackground.setAttribute("y", (this.endY - 5).toString());
        gradTextBackground.setAttribute("width", "28");
        gradTextBackground.setAttribute("height", (this.beginY - this.endY + 10).toString());
        gradTextBackground.setAttribute("fill", "#1a1d21");
        this.rootSvg.appendChild(gradTextBackground);
        this.graduationTextGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationTextGroup);
        let barLeft = document.createElementNS(Avionics.SVG.NS, "rect");
        barLeft.setAttribute("x", "34");
        barLeft.setAttribute("y", this.endY.toString());
        barLeft.setAttribute("height", (this.beginY - this.endY).toString());
        barLeft.setAttribute("width", "2");
        barLeft.setAttribute("fill", "white");
        this.rootSvg.appendChild(barLeft);
        let barRight = document.createElementNS(Avionics.SVG.NS, "rect");
        barRight.setAttribute("x", "64");
        barRight.setAttribute("y", this.endY.toString());
        barRight.setAttribute("height", (this.beginY - this.endY).toString());
        barRight.setAttribute("width", "2");
        barRight.setAttribute("fill", "white");
        this.rootSvg.appendChild(barRight);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", "30," + this.beginY + " 20," + this.beginY + " 20," + (this.beginY + this.beginY - this.endY) + " 25," + (this.beginY + this.beginY - this.endY) + " 25," + (this.beginY + 10));
        this.cursor.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor);
        this.cursor2 = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor2.setAttribute("points", "70," + this.beginY + " 80," + this.beginY + " 80," + (this.beginY + this.beginY - this.endY) + " 75," + (this.beginY + this.beginY - this.endY) + " 75," + (this.beginY + 10));
        this.cursor2.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.cursor2);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "50");
        this.titleText.setAttribute("y", (this.endY - 5).toString());
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "9");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.titleText);
        this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
        this.valueText.setAttribute("x", "35");
        this.valueText.setAttribute("y", (this.endY - 2).toString());
        this.valueText.setAttribute("fill", "white");
        this.valueText.setAttribute("font-size", "12");
        this.valueText.setAttribute("font-family", "Roboto-Bold");
        this.valueText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.valueText);
        this.valueText2 = document.createElementNS(Avionics.SVG.NS, "text");
        this.valueText2.setAttribute("x", "65");
        this.valueText2.setAttribute("y", (this.endY - 2).toString());
        this.valueText2.setAttribute("fill", "white");
        this.valueText2.setAttribute("font-size", "12");
        this.valueText2.setAttribute("font-family", "Roboto-Bold");
        this.valueText2.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(this.valueText2);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", "50");
        this.beginText.setAttribute("y", (this.beginY + 4).toString());
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", "50");
        this.endText.setAttribute("y", (this.endY + 4).toString());
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);
    }
    addColorZone(_begin, _end, _color, _context) {
        let colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("width", "40");
        colorZone.setAttribute("x", "30");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    addColorLine(_position, _color, _context) {
        let colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "46");
        colorLine.setAttribute("x", "27");
        colorLine.setAttribute("y", this.beginY.toString());
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        let begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        let end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY;
        _element.setAttribute("y", end.toString());
        _element.setAttribute("height", (begin - end).toString());
    }
    updateColorLine(_element, _pos) {
        if (_pos > this.minValue && _pos < this.maxValue) {
            _element.setAttribute("transform", "translate(0," + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
            _element.setAttribute("display", "");
        }
        else {
            _element.setAttribute("display", "none");
        }
    }
    updateValue(_value, _value2) {
        this.cursor.setAttribute("transform", "translate(0," + (((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
        this.cursor2.setAttribute("transform", "translate(0," + (((Math.max(Math.min(_value2, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY)) + ")");
        this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
        this.valueText2.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value2 / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value2, 0);
        let val1Set = false;
        let val2Set = false;
        for (let i = this.colorZones.length - 1; i >= 0; i--) {
            if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                val1Set = true;
            }
            if (_value2 >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                this.valueText2.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                val2Set = true;
            }
        }
        if (!val1Set) {
            this.valueText.setAttribute("fill", "white");
        }
        if (!val2Set) {
            this.valueText2.setAttribute("fill", "white");
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeCautionBackgrounds() {
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            let grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "29");
            grad.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY - 0.5).toString());
            grad.setAttribute("height", "1");
            grad.setAttribute("width", "42");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                let gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", "50");
                gradText.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY + 4).toString());
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Bold");
                gradText.setAttribute("text-anchor", "middle");
                gradText.textContent = i.toString();
                this.graduationTextGroup.appendChild(gradText);
            }
        }
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlverticaldoublegauge', XMLVerticalDoubleGauge);