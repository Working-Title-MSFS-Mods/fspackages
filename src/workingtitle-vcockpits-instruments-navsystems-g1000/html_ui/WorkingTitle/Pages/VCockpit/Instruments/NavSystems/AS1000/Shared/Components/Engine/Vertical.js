class XMLVerticalGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.endY = 15;
        this.beginY = 70;
        this.cursorColor = "white";
        this.number = 0;
        this.textIncrement = 1;
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            let textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            let cursorColorElem = _styleElem.getElementsByTagName("CursorColor");
            if (cursorColorElem.length > 0) {
                this.cursorColor = cursorColorElem[0].textContent;
            }
            let valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "None":
                        this.valuePos = 1;
                        break;
                }
            }
        }
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        if (this.valuePos == 1) {
            this.rootSvg.setAttribute("viewBox", "0 0 50 75");
        }
        else {
            this.rootSvg.setAttribute("viewBox", "0 0 50 85");
        }
        this.appendChild(this.rootSvg);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        let rightBar = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBar.setAttribute("x", "35");
        rightBar.setAttribute("y", this.endY.toString());
        rightBar.setAttribute("height", (this.beginY - this.endY).toString());
        rightBar.setAttribute("width", "2");
        rightBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(rightBar);
        let beginBar = document.createElementNS(Avionics.SVG.NS, "rect");
        beginBar.setAttribute("x", "25");
        beginBar.setAttribute("y", (this.beginY).toString());
        beginBar.setAttribute("height", "2");
        beginBar.setAttribute("width", "12");
        beginBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginBar);
        let endBar = document.createElementNS(Avionics.SVG.NS, "rect");
        endBar.setAttribute("x", "25");
        endBar.setAttribute("y", (this.endY).toString());
        endBar.setAttribute("height", "2");
        endBar.setAttribute("width", "12");
        endBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(endBar);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", "35," + this.beginY + " 32," + (this.beginY - 3) + " 27," + (this.beginY - 3) + " 27," + (this.beginY + 3) + " 32," + (this.beginY + 3));
        this.cursor.setAttribute("fill", this.cursorColor);
        this.rootSvg.appendChild(this.cursor);
        this.titleText_cautionbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.titleText_cautionbg.setAttribute("fill-opacity", "0");
        this.titleText_cautionbg.setAttribute("CautionBlink", "Background");
        this.rootSvg.appendChild(this.titleText_cautionbg);
        this.titleText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.titleText_alertbg.setAttribute("fill-opacity", "0");
        this.titleText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.titleText_alertbg);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "25");
        this.titleText.setAttribute("y", (this.endY - 5).toString());
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "9");
        this.titleText.setAttribute("font-family", "Roboto-Bold");
        this.titleText.setAttribute("text-anchor", "middle");
        this.titleText.setAttribute("CautionBlink", "Text");
        this.titleText.setAttribute("AlertBlink", "Text");
        this.rootSvg.appendChild(this.titleText);
        this.valueText_cautionbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_cautionbg.setAttribute("fill-opacity", "0");
        this.valueText_cautionbg.setAttribute("CautionBlink", "Background");
        this.rootSvg.appendChild(this.valueText_cautionbg);
        this.valueText_alertbg = document.createElementNS(Avionics.SVG.NS, "rect");
        this.valueText_alertbg.setAttribute("fill-opacity", "0");
        this.valueText_alertbg.setAttribute("AlertBlink", "Background");
        this.rootSvg.appendChild(this.valueText_alertbg);
        if (this.valuePos != 1) {
            this.valueText = document.createElementNS(Avionics.SVG.NS, "text");
            this.valueText.setAttribute("x", "25");
            this.valueText.setAttribute("y", (this.beginY + 15).toString());
            this.valueText.setAttribute("fill", "white");
            this.valueText.setAttribute("font-size", "12");
            this.valueText.setAttribute("font-family", "Roboto-Bold");
            this.valueText.setAttribute("text-anchor", "middle");
            this.valueText.setAttribute("CautionBlink", "Text");
            this.valueText.setAttribute("AlertBlink", "Text");
            this.rootSvg.appendChild(this.valueText);
        }
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", "24");
        this.beginText.setAttribute("y", (this.beginY + 4).toString());
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("font-family", "Roboto-Bold");
        this.beginText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", "24");
        this.endText.setAttribute("y", (this.endY + 4).toString());
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("font-family", "Roboto-Bold");
        this.endText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.endText);
    }
    addColorZone(_begin, _end, _color, _context) {
        let colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("width", "4");
        colorZone.setAttribute("x", "31");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    addColorLine(_position, _color, _context) {
        let colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "8");
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
        if (this.valueText) {
            this.valueText.textContent = this.textIncrement != 1 ? fastToFixed(Math.round(_value / this.textIncrement) * this.textIncrement, 0) : fastToFixed(_value, 0);
            let colorFound = false;
            for (let i = this.colorZones.length - 1; i >= 0; i--) {
                if (_value >= this.colorZones[i].lastBegin && _value <= this.colorZones[i].lastEnd) {
                    this.valueText.setAttribute("fill", this.colorZones[i].element.getAttribute("fill"));
                    colorFound = true;
                    break;
                }
            }
            if (!colorFound) {
                this.valueText.setAttribute("fill", "white");
            }
            if (this.valueText) {
                let valueBbox = this.valueText.getBBox();
                this.valueText_cautionbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_cautionbg.setAttribute("y", (valueBbox.y + 1).toString());
                this.valueText_cautionbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_cautionbg.setAttribute("height", (valueBbox.height).toString());
                this.valueText_alertbg.setAttribute("x", (valueBbox.x - 1).toString());
                this.valueText_alertbg.setAttribute("y", (valueBbox.y + 1).toString());
                this.valueText_alertbg.setAttribute("width", (valueBbox.width + 2).toString());
                this.valueText_alertbg.setAttribute("height", (valueBbox.height).toString());
            }
        }
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeCautionBackgrounds() {
        let titleBbox = this.titleText.getBBox();
        this.titleText_cautionbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_cautionbg.setAttribute("y", (titleBbox.y + 1).toString());
        this.titleText_cautionbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_cautionbg.setAttribute("height", (titleBbox.height - 0.5).toString());
    }
    computeAlertBackgrounds() {
        let titleBbox = this.titleText.getBBox();
        this.titleText_alertbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_alertbg.setAttribute("y", (titleBbox.y + 1).toString());
        this.titleText_alertbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_alertbg.setAttribute("height", (titleBbox.height - 0.5).toString());
    }
    setGraduations(_spaceBetween, _withText) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            let grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "25");
            grad.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY - 0.5).toString());
            grad.setAttribute("height", "1");
            grad.setAttribute("width", "10");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                let gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", "23");
                gradText.setAttribute("y", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endY - this.beginY) + this.beginY + 4).toString());
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Bold");
                gradText.setAttribute("text-anchor", "end");
                gradText.textContent = i.toString();
                this.graduationGroup.appendChild(gradText);
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
customElements.define('glasscockpit-xmlverticalgauge', XMLVerticalGauge);