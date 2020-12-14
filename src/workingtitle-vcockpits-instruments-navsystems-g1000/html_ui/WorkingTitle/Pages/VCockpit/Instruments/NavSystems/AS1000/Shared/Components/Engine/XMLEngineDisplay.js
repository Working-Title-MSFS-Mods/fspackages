class XMLEngineDisplay extends HTMLElement {
    constructor() {
        super(...arguments);
        this.context = new LogicXMLContext();
        this.CAS = null;
    }
    setConfiguration(_gps, _config) {
        this.gps = _gps;
        this.configuration = _config;
        this.gauges = [];
        this.texts = [];
        this.innerHTML = "";
        this.parseElement(this.configuration, this);
    }
    parseElement(_configElement, _element) {
        let gauges = _configElement.children;
        for (let i = 0; i < gauges.length; i++) {
            if (gauges[i].tagName == "Gauge") {
                let typeElem = gauges[i].getElementsByTagName("Type");
                if (typeElem.length > 0) {
                    let gauge;
                    switch (typeElem[0].textContent) {
                        case "Circular":
                            gauge = document.createElement("glasscockpit-xmlcirculargauge");
                            _element.appendChild(gauge);
                            break;
                        case "Horizontal":
                            gauge = document.createElement("glasscockpit-xmlhorizontalgauge");
                            _element.appendChild(gauge);
                            break;
                        case "DoubleHorizontal":
                            gauge = document.createElement("glasscockpit-xmlhorizontaldoublegauge");
                            _element.appendChild(gauge);
                            break;
                        case "Vertical":
                            gauge = document.createElement("glasscockpit-xmlverticalgauge");
                            _element.appendChild(gauge);
                            break;
                        case "DoubleVertical":
                            gauge = document.createElement("glasscockpit-xmlverticaldoublegauge");
                            _element.appendChild(gauge);
                            break;
                        case "Flaps":
                            let flapGauge = document.createElement("glasscockpit-xmlflapsgauge");
                            let toElement = gauges[i].getElementsByTagName("TakeOff");
                            if (toElement.length > 0) {
                                flapGauge.setTakeOffValue(parseFloat(toElement[0].textContent));
                            }
                            _element.appendChild(flapGauge);
                            gauge = flapGauge;
                            break;
                        case "FlapsSpeedbrakes":
                            gauge = document.createElement("glasscockpit-xmlflapsspeedbrakesgauge");
                            _element.appendChild(gauge);
                            break;
                        case "LongitudeFuel":
                            gauge = document.createElement("glasscockpit-xmllongitudefuelgauge");
                            _element.appendChild(gauge);
                            break;
                    }
                    if (gauge) {
                        let styleElem = gauges[i].getElementsByTagName("Style");
                        if (styleElem.length > 0) {
                            let sizePercentElem = styleElem[0].getElementsByTagName("SizePercent");
                            if (sizePercentElem.length > 0) {
                                gauge.sizePercent = parseFloat(sizePercentElem[0].textContent);
                            }
                        }
                        gauge.setStyle(styleElem.length > 0 ? styleElem[0] : null);
                        gauge.drawBase();
                        let minElem = gauges[i].getElementsByTagName("Minimum");
                        let maxElem = gauges[i].getElementsByTagName("Maximum");
                        if (minElem.length > 0 && maxElem.length > 0) {
                            gauge.setLimitCallbacks(new CompositeLogicXMLElement(this.gps, minElem[0]), new CompositeLogicXMLElement(this.gps, maxElem[0]), this.context);
                        }
                        let colorZones = gauges[i].getElementsByTagName("ColorZone");
                        for (let j = 0; j < colorZones.length; j++) {
                            let colorElem = colorZones[j].getElementsByTagName("Color");
                            let beginElem = colorZones[j].getElementsByTagName("Begin");
                            let endElem = colorZones[j].getElementsByTagName("End");
                            let color = colorElem.length > 0 ? colorElem[0].textContent : "white";
                            if (beginElem.length > 0 && endElem.length > 0) {
                                gauge.addColorZone(new CompositeLogicXMLElement(this.gps, beginElem[0]), new CompositeLogicXMLElement(this.gps, endElem[0]), color, this.context);
                            }
                        }
                        let colorLines = gauges[i].getElementsByTagName("ColorLine");
                        for (let j = 0; j < colorLines.length; j++) {
                            let colorElem = colorLines[j].getElementsByTagName("Color");
                            let posElem = colorLines[j].getElementsByTagName("Position");
                            let color = colorElem.length > 0 ? colorElem[0].textContent : "white";
                            if (posElem.length > 0) {
                                gauge.addColorLine(new CompositeLogicXMLElement(this.gps, posElem[0]), color, this.context);
                            }
                        }
                        let valueElem = gauges[i].getElementsByTagName("Value");
                        if (valueElem.length > 0) {
                            gauge.valueCallback = new CompositeLogicXMLElement(this.gps, valueElem[0]);
                        }
                        let value2Elem = gauges[i].getElementsByTagName("Value2");
                        if (value2Elem.length > 0) {
                            gauge.value2Callback = new CompositeLogicXMLElement(this.gps, value2Elem[0]);
                        }
                        let title = "";
                        let unit = "";
                        let titleElem = gauges[i].getElementsByTagName("Title");
                        if (titleElem.length > 0) {
                            title = titleElem[0].textContent;
                        }
                        let unitElem = gauges[i].getElementsByTagName("Unit");
                        if (unitElem.length > 0) {
                            unit = unitElem[0].textContent;
                        }
                        gauge.setTitleAndUnit(title, unit);
                        let graduationElem = gauges[i].getElementsByTagName("GraduationLength");
                        if (graduationElem.length > 0) {
                            gauge.setGraduations(parseFloat(graduationElem[0].textContent), graduationElem[0].getAttribute("text") == "True" ? true : false);
                        }
                        let beginTextElem = gauges[i].getElementsByTagName("BeginText");
                        if (beginTextElem.length > 0) {
                            gauge.forceBeginText(beginTextElem[0].textContent);
                        }
                        let endTextElem = gauges[i].getElementsByTagName("EndText");
                        if (endTextElem.length > 0) {
                            gauge.forceEndText(endTextElem[0].textContent);
                        }
                        let cursorTextElem = gauges[i].getElementsByTagName("CursorText");
                        let cursorText2Elem = gauges[i].getElementsByTagName("CursorText2");
                        if (cursorTextElem.length > 0 || cursorText2Elem.length > 0) {
                            gauge.setCursorLabel(cursorTextElem.length > 0 ? cursorTextElem[0].textContent : "", cursorText2Elem.length > 0 ? cursorText2Elem[0].textContent : "");
                        }
                        let gaugeIdElem = gauges[i].getElementsByTagName("ID");
                        if (gaugeIdElem.length > 0) {
                            gauge.rootSvg.setAttribute("class", gaugeIdElem[0].textContent);
                        }
                        this.gauges.push(gauge);
                        let yellowBlinkElem = gauges[i].getElementsByTagName("YellowBlink");
                        if (yellowBlinkElem.length > 0) {
                            gauge.yellowBlinkCallback = new CompositeLogicXMLElement(this.gps, yellowBlinkElem[0]);
                        }
                        let redBlinkElem = gauges[i].getElementsByTagName("RedBlink");
                        if (redBlinkElem.length > 0) {
                            gauge.redBlinkCallback = new CompositeLogicXMLElement(this.gps, redBlinkElem[0]);
                        }
                    }
                }
            }
            else if (gauges[i].tagName == "ColumnsGauge") {
                let gauge = document.createElement("glasscockpit-xmlcolumngauge");
                _element.appendChild(gauge);
                this.gauges.push(gauge);
                let minElem = gauges[i].getElementsByTagName("Minimum");
                let maxElem = gauges[i].getElementsByTagName("Maximum");
                if (minElem.length > 0 && maxElem.length > 0) {
                    gauge.setLimits(new CompositeLogicXMLElement(this.gps, minElem[0]), new CompositeLogicXMLElement(this.gps, maxElem[0]), this.context);
                }
                let columns = [];
                let columnNodes = gauges[i].getElementsByTagName("Column");
                for (let c = 0; c < columnNodes.length; c++) {
                    let columnNode = columnNodes[c];
                    columns.push(new CompositeLogicXMLElement(this.gps, columnNode));
                }
                let titleElem = gauges[i].getElementsByTagName("Title");
                if (titleElem.length > 0) {
                    gauge.setTitle(titleElem[0].textContent);
                }
                gauge.addColumns(columns);
                let redLineElem = gauges[i].getElementsByTagName("RedLine");
                if (redLineElem.length > 0) {
                    gauge.setRedLine(redLineElem[0].textContent);
                }
            }
            else if (gauges[i].tagName == "Text") {
                let textZone = document.createElement("glasscockpit-xmltextzone");
                textZone.setAttribute("class", gauges[i].getAttribute("id"));
                _element.appendChild(textZone);
                this.texts.push(textZone);
                let leftText = gauges[i].getElementsByTagName("Left");
                if (leftText.length > 0) {
                    let contentElem = leftText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.leftCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        }
                        else {
                            textZone.setLeftText(contentElem[0].textContent);
                        }
                    }
                    else {
                        if (leftText[0].children.length > 0) {
                            textZone.leftCallback = new CompositeLogicXMLElement(this.gps, leftText[0]);
                        }
                        else {
                            textZone.setLeftText(leftText[0].textContent);
                        }
                    }
                    let colorElem = leftText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.leftColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setLeftClass(leftText[0].getAttribute("id"));
                    let fontSize = leftText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setLeftFontSize(fontSize);
                    }
                }
                let centerText = gauges[i].getElementsByTagName("Center");
                if (centerText.length > 0) {
                    let contentElem = centerText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.centerCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        }
                        else {
                            textZone.setCenterText(contentElem[0].textContent);
                        }
                    }
                    else {
                        if (centerText[0].children.length > 0) {
                            textZone.centerCallback = new CompositeLogicXMLElement(this.gps, centerText[0]);
                        }
                        else {
                            textZone.setCenterText(centerText[0].textContent);
                        }
                    }
                    let colorElem = centerText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.centerColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setCenterClass(centerText[0].getAttribute("id"));
                    let fontSize = centerText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setCenterFontSize(fontSize);
                    }
                }
                let rightText = gauges[i].getElementsByTagName("Right");
                if (rightText.length > 0) {
                    let contentElem = rightText[0].getElementsByTagName("Content");
                    if (contentElem.length > 0) {
                        if (contentElem[0].children.length > 0) {
                            textZone.rightCallback = new CompositeLogicXMLElement(this.gps, contentElem[0]);
                        }
                        else {
                            textZone.setRightText(contentElem[0].textContent);
                        }
                    }
                    else {
                        if (rightText[0].children.length > 0) {
                            textZone.rightCallback = new CompositeLogicXMLElement(this.gps, rightText[0]);
                        }
                        else {
                            textZone.setRightText(rightText[0].textContent);
                        }
                    }
                    let colorElem = rightText[0].getElementsByTagName("Color");
                    if (colorElem.length > 0) {
                        textZone.rightColor = new CompositeLogicXMLElement(this.gps, colorElem[0]);
                    }
                    textZone.setRightClass(rightText[0].getAttribute("id"));
                    let fontSize = rightText[0].getAttribute("fontsize");
                    if (fontSize != null && fontSize != "") {
                        textZone.setRightFontSize(fontSize);
                    }
                }
            }
            else if (gauges[i].tagName == "Header") {
                let textZone = document.createElement("glasscockpit-xmlheader");
                textZone.setAttribute("class", gauges[i].getAttribute("id"));
                _element.appendChild(textZone);
                this.texts.push(textZone);
                let textNode = gauges[i].getElementsByTagName("Text");
                if (textNode.length > 0) {
                    textZone.setText(textNode[0].textContent);
                }
            }
            else if (gauges[i].tagName == "Spacing") {
                let spacingElement = document.createElement("glasscockpit-xmlspacing");
                _element.appendChild(spacingElement);
                this.texts.push(spacingElement);
                spacingElement.setSpacing(gauges[i].textContent);
            }
            else if (gauges[i].tagName == "ColumnsGroup") {
                let columns = gauges[i].children;
                let mainDiv = document.createElement("div");
                mainDiv.style.width = "100%";
                mainDiv.style.display = "flex";
                mainDiv.setAttribute("class", gauges[i].getAttribute("id"));
                _element.appendChild(mainDiv);
                let unset = 0;
                let setSize = 0;
                for (let j = 0; j < columns.length; j++) {
                    let width = columns[j].getAttribute("width");
                    if (width) {
                        setSize += parseFloat(width);
                    }
                    else {
                        unset++;
                    }
                }
                for (let j = 0; j < columns.length; j++) {
                    let colDiv = document.createElement("div");
                    let width = columns[j].getAttribute("width");
                    if (width) {
                        colDiv.style.width = width + "%";
                    }
                    else {
                        colDiv.style.width = ((99 - setSize) / unset) + "%";
                    }
                    let colId = columns[j].getAttribute("id");
                    colDiv.setAttribute("class", "Column" + ((colId && colId != "") ? (" " + colId) : ""));
                    mainDiv.appendChild(colDiv);
                    this.parseElement(columns[j], colDiv);
                }
            }
            else if (gauges[i].tagName == "CAS") {
                this.CAS = new Cabin_Annunciations();
                this.CAS.setGPS(this.gps);
                let casDiv = document.createElement("div");
                casDiv.setAttribute("id", "Annunciations");
                _element.appendChild(casDiv);
                this.CAS.init(_element);
            }
            else if (gauges[i].tagName == "Function") {
                let func = new LogicXMLFunction();
                func.name = gauges[i].getAttribute("Name");
                func.callback = new CompositeLogicXMLElement(this.gps, gauges[i]);
                this.context.addFunction(func);
            }
        }
    }
    onSoundEnd(_eventId) {
        if (this.CAS) {
            this.CAS.onSoundEnd(_eventId);
        }
    }
    update(_deltaTime) {
        for (let i = 0; i < this.gauges.length; i++) {
            this.gauges[i].update(this.context);
        }
        for (let i = 0; i < this.texts.length; i++) {
            this.texts[i].update(this.context);
        }
        if (this.CAS) {
            this.CAS.onUpdate(_deltaTime);
        }
        this.context.update();
    }
    onEvent(_event) {
        if (this.CAS) {
            this.CAS.onEvent(_event);
        }
    }
}
customElements.define('glasscockpit-xmlenginedisplay', XMLEngineDisplay);
class XMLGauge extends HTMLElement {
    constructor() {
        super(...arguments);
        this.forcedBeginText = null;
        this.forcedEndText = null;
        this.isAlerting = false;
        this.isCaution = false;
        this.sizePercent = 100;
        this.colorZones = [];
        this.colorLines = [];

        this.state$ = new rxjs.BehaviorSubject("");
    }
    setLimitCallbacks(_begin, _end, _context) {
        this.minValueCallback = _begin;
        this.maxValueCallback = _end;
        this.setLimitValues(_begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    setLimitValues(_begin, _end) {
        this.minValue = _begin;
        this.maxValue = _end;
        for (let i = 0; i < this.colorZones.length; i++) {
            this.updateColorZone(this.colorZones[i].element, this.colorZones[i].lastBegin, this.colorZones[i].lastEnd);
        }
        for (let i = 0; i < this.colorLines.length; i++) {
            this.updateColorLine(this.colorLines[i].element, this.colorLines[i].lastPos);
        }
    }
    update(_context) {
        let min = this.minValueCallback.getValueAsNumber(_context);
        let max = this.maxValueCallback.getValueAsNumber(_context);
        if (min != this.minValue || max != this.maxValue) {
            this.setLimitValues(min, max);
        }
        this.updateValue(this.valueCallback.getValueAsNumber(_context), this.value2Callback ? this.value2Callback.getValueAsNumber() : null);
        for (let i = 0; i < this.colorZones.length; i++) {
            let begin = this.colorZones[i].beginXmlCallback.getValueAsNumber(_context);
            let end = this.colorZones[i].endXmlCallback.getValueAsNumber(_context);
            if (begin != this.colorZones[i].lastBegin || end != this.colorZones[i].lastEnd) {
                this.updateColorZone(this.colorZones[i].element, begin, end);
                this.colorZones[i].lastBegin = begin;
                this.colorZones[i].lastEnd = end;
            }
        }
        for (let i = 0; i < this.colorLines.length; i++) {
            let pos = this.colorLines[i].posXmlCallback.getValueAsNumber(_context);
            if (pos != this.colorLines[i].lastPos) {
                this.updateColorLine(this.colorLines[i].element, pos);
                this.colorLines[i].lastPos = pos;
            }
        }
        let newValueCaution = this.yellowBlinkCallback ? this.yellowBlinkCallback.getValue(_context) : null;
        let newValueAlert = this.redBlinkCallback ? this.redBlinkCallback.getValue(_context) : null;

        if (newValueAlert && newValueAlert != 0) {
            if (!this.isAlerting) {
                //console.log("Switching to alert mode")
                this.isAlerting = true;
                this.isCaution = false;
                this.computeAlertBackgrounds();
                this.setAttribute("State", "Alert");
                this.state$.next("Alert");
            }
        } else if (newValueCaution && newValueCaution != 0) {
            if (!this.isCaution) {
                //console.log("Switching to caution mode")
                this.isAlerting = false;
                this.isCaution = true;
                this.computeCautionBackgrounds();
                this.setAttribute("State", "Caution");
                this.state$.next("Caution");
            }
        } else {
            this.isAlerting = this.isCaution = false;
            this.setAttribute("State", "");
            this.state$.next("");
        }
    }
    processStyleElement(styleElement, tag, callback) {
        let element = styleElement.getElementsByTagName(tag);
        if (element.length > 0) {
            callback(element[0].textContent);
        }
    }
}
class XMLGaugeColorZone {
    constructor(_element, _begin, _end) {
        this.lastBegin = 0;
        this.lastEnd = 0;
        this.element = _element;
        this.beginXmlCallback = _begin;
        this.endXmlCallback = _end;
    }
}
class XMLGaugeColorLine {
    constructor(_element, _pos) {
        this.lastPos = NaN;
        this.element = _element;
        this.posXmlCallback = _pos;
    }
}
class XMLLongitudeFuelGauge extends XMLGauge {
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 30");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        let leftBg = document.createElementNS(Avionics.SVG.NS, "rect");
        leftBg.setAttribute("x", "5");
        leftBg.setAttribute("y", "20");
        leftBg.setAttribute("width", "25");
        leftBg.setAttribute("height", "10");
        leftBg.setAttribute("stroke", "grey");
        leftBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(leftBg);
        let rightBg = document.createElementNS(Avionics.SVG.NS, "rect");
        rightBg.setAttribute("x", "70");
        rightBg.setAttribute("y", "20");
        rightBg.setAttribute("width", "25");
        rightBg.setAttribute("height", "10");
        rightBg.setAttribute("stroke", "grey");
        rightBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(rightBg);
        let totalBg = document.createElementNS(Avionics.SVG.NS, "rect");
        totalBg.setAttribute("x", "35");
        totalBg.setAttribute("y", "10");
        totalBg.setAttribute("width", "30");
        totalBg.setAttribute("height", "10");
        totalBg.setAttribute("stroke", "grey");
        totalBg.setAttribute("fill", "none");
        this.rootSvg.appendChild(totalBg);
        let horizBar = document.createElementNS(Avionics.SVG.NS, "rect");
        horizBar.setAttribute("x", "30");
        horizBar.setAttribute("y", "24.5");
        horizBar.setAttribute("width", "40");
        horizBar.setAttribute("height", "1");
        horizBar.setAttribute("fill", "grey");
        this.rootSvg.appendChild(horizBar);
        let vertBar = document.createElementNS(Avionics.SVG.NS, "rect");
        vertBar.setAttribute("x", "49.5");
        vertBar.setAttribute("y", "20");
        vertBar.setAttribute("width", "1");
        vertBar.setAttribute("height", "5");
        vertBar.setAttribute("fill", "grey");
        this.rootSvg.appendChild(vertBar);
        let leftText = document.createElementNS(Avionics.SVG.NS, "text");
        leftText.setAttribute("x", "30");
        leftText.setAttribute("y", "18");
        leftText.setAttribute("fill", "white");
        leftText.setAttribute("font-size", "7");
        leftText.setAttribute("font-family", "Roboto-Bold");
        leftText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(leftText);
        leftText.textContent = "TOT";
        let rightText = document.createElementNS(Avionics.SVG.NS, "text");
        rightText.setAttribute("x", "70");
        rightText.setAttribute("y", "18");
        rightText.setAttribute("fill", "white");
        rightText.setAttribute("font-size", "7");
        rightText.setAttribute("font-family", "Roboto-Bold");
        rightText.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(rightText);
        rightText.textContent = "GAL";
        this.leftText = document.createElementNS(Avionics.SVG.NS, "text");
        this.leftText.setAttribute("x", "17.5");
        this.leftText.setAttribute("y", "28");
        this.leftText.setAttribute("fill", "green");
        this.leftText.setAttribute("font-size", "7");
        this.leftText.setAttribute("font-family", "Roboto-Bold");
        this.leftText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.leftText);
        this.rightText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rightText.setAttribute("x", "82.5");
        this.rightText.setAttribute("y", "28");
        this.rightText.setAttribute("fill", "green");
        this.rightText.setAttribute("font-size", "7");
        this.rightText.setAttribute("font-family", "Roboto-Bold");
        this.rightText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.rightText);
        this.totalText = document.createElementNS(Avionics.SVG.NS, "text");
        this.totalText.setAttribute("x", "50");
        this.totalText.setAttribute("y", "18");
        this.totalText.setAttribute("fill", "green");
        this.totalText.setAttribute("font-size", "7");
        this.totalText.setAttribute("font-family", "Roboto-Bold");
        this.totalText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.totalText);
    }
    addColorZone(_begin, _end, _color) {
    }
    addColorLine(_position, _color) {
    }
    updateColorZone(_element, _begin, _end) {
    }
    updateColorLine(_element, _pos) {
    }
    updateValue(_value, _value2) {
        this.leftText.textContent = fastToFixed(_value, 0);
        this.rightText.textContent = fastToFixed(_value2, 0);
        this.totalText.textContent = fastToFixed(_value + _value2, 0);
    }
    setTitleAndUnit(_title, _unit) {
    }
    computeCautionBackgrounds() {
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
    }
    forceBeginText(_text) {
    }
    forceEndText(_text) {
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmllongitudefuelgauge', XMLLongitudeFuelGauge);
class XMLFlapsSpeedbrakesGauge extends XMLGauge {
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "-10 0 120 40");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        let wing = document.createElementNS(Avionics.SVG.NS, "path");
        wing.setAttribute("d", "M45 12 C40 11, 30 10, 22 10 C0 13, 0 24, 23 24 C35 25, 50 25, 70 24 C65 21, 70 15, 71 17 L62 15");
        wing.setAttribute("stroke", "white");
        wing.setAttribute("stroke-width", "0.5");
        wing.setAttribute("fill", "none");
        this.rootSvg.appendChild(wing);
        this.speedbrakes = document.createElementNS(Avionics.SVG.NS, "path");
        this.speedbrakes.setAttribute("d", "M49 14 Q44.75 12, 49 11 Q71.5 15.5, 49 14");
        this.speedbrakes.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.speedbrakes);
        this.flaps = document.createElementNS(Avionics.SVG.NS, "path");
        this.flaps.setAttribute("d", "M75 23.5 Q68 20.5, 75 17.5 Q110 22.5, 75 23.5");
        this.flaps.setAttribute("fill", "white");
        this.rootSvg.appendChild(this.flaps);
    }
    addColorZone(_begin, _end, _color) {
    }
    addColorLine(_position, _color) {
    }
    updateColorZone(_element, _begin, _end) {
    }
    updateColorLine(_element, _pos) {
    }
    updateValue(_value, _value2) {
        this.flaps.setAttribute("transform", "rotate(" + _value + " 72.5 20.5)");
        this.speedbrakes.setAttribute("transform", "rotate(" + _value2 + " 48 12.4)");
    }
    setTitleAndUnit(_title, _unit) {
    }
    computeCautionBackgrounds() {
    }
    computeAlertBackgrounds() {
    }
    setGraduations(_spaceBetween, _withText) {
    }
    forceBeginText(_text) {
    }
    forceEndText(_text) {
    }
    setCursorLabel(_label1, _label2) {
    }
}
customElements.define('glasscockpit-xmlflapsspeedbrakesgauge', XMLFlapsSpeedbrakesGauge);
//# sourceMappingURL=XMLEngineDisplay.js.map