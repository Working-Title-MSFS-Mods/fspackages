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
class XMLTextZone extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        this.leftText = DOMUtilities.createElement("div", { class: "left-text" });
        this.appendChild(this.leftText);

        this.centerText = DOMUtilities.createElement("div", { class: "center-text" });
        this.appendChild(this.centerText);

        this.rightText = DOMUtilities.createElement("div", { class: "right-text" });
        this.appendChild(this.rightText);
    }
    setLeftText(_value) {
        if (this.leftText.textContent != _value) {
            this.leftText.textContent = _value;
        }
    }
    setCenterText(_value) {
        if (this.centerText.textContent != _value) {
            this.centerText.textContent = _value;
        }
    }
    setRightText(_value) {
        if (this.rightText.textContent != _value) {
            this.rightText.textContent = _value;
        }
    }
    setLeftFontSize(_value) {
        this.leftText.setAttribute("font-size", _value);
    }
    setCenterFontSize(_value) {
        this.centerText.setAttribute("font-size", _value);
    }
    setRightFontSize(_value) {
        this.rightText.setAttribute("font-size", _value);
    }
    setLeftClass(_value) {
        this.leftText.classList.add(_value);
    }
    setCenterClass(_value) {
        this.centerText.classList.add(_value);
    }
    setRightClass(_value) {
        this.rightText.classList.add(_value);
    }
    update(_context) {
        if (this.leftCallback) {
            this.setLeftText(this.leftCallback.getValueAsString(_context));
        }
        if (this.centerCallback) {
            this.setCenterText(this.centerCallback.getValueAsString(_context));
        }
        if (this.rightCallback) {
            this.setRightText(this.rightCallback.getValueAsString(_context));
        }
        if (this.leftColor) {
            Avionics.Utils.diffAndSetAttribute(this.leftText, "color", this.leftColor.getValueAsString(_context));
        }
        if (this.centerColor) {
            Avionics.Utils.diffAndSetAttribute(this.centerText, "color", this.centerColor.getValueAsString(_context));
        }
        if (this.rightColor) {
            Avionics.Utils.diffAndSetAttribute(this.rightText, "color", this.rightColor.getValueAsString(_context));
        }
    }
}
customElements.define('glasscockpit-xmltextzone', XMLTextZone);
class XMLHeader extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        let line = document.createElement("div");
        this.appendChild(line);

        this.textElement = document.createElement("label");
        this.appendChild(this.textElement);

        line = document.createElement("div");
        this.appendChild(line);
    }
    setText(_value) {
        if (this.textElement.textContent != _value) {
            this.textElement.textContent = _value;
        }
    }
    setFontSize(_value) {
        this.textElement.style.fontSize = _value;
    }
    update(_context) {
    }
}
customElements.define('glasscockpit-xmlheader', XMLHeader);
class XMLColumnGauge extends HTMLElement {
    constructor() {
        super(...arguments);

        this.minValueCallback = null;
        this.maxValueCallback = null;
        this.peak = 0;
        this.selectedColumn = null;
        this.numberOfBars = 16;
        this.columnsContainer = null;
        this.height = 80;
        this.sizePercent = 100;
        this.columns = [];
        this.redLineValue = null;
        this.redLineElement = null;
    }
    setLimits(minValueCallback, maxValueCallback) {
        this.minValueCallback = minValueCallback;
        this.maxValueCallback = maxValueCallback;
    }
    setTitle(title) {
        this.titleElements = title;
        this.leftText.textContent = this.titleElements;
    }
    setRedLine(value) {
        this.redLineElement.setAttribute("visibility", value != null ? "visible" : "hidden");
        this.redLineValue = value;
    }
    addColumns(columns) {
        let numColumns = columns.length;

        for (let c = 0; c < numColumns; c++) {
            let valueCallback = columns[c];

            let g = document.createElementNS(Avionics.SVG.NS, "g");
            g.setAttribute("fill", "white");
            this.rootSvg.appendChild(g);

            let horizontalMargin = 8;
            let topMargin = 4;
            let horizontalSpacing = 4;
            let verticalSpacing = 0.8;
            let columnWidth = (100 - horizontalMargin * 2) / numColumns - (horizontalSpacing * (numColumns - 1)) / numColumns;
            let columnHeight = this.height - 30 - topMargin;
            let barHeight = columnHeight / this.numberOfBars - (verticalSpacing * (this.numberOfBars - 1)) / this.numberOfBars;

            let bars = [];
            for (let i = 0; i < this.numberOfBars; i++) {
                let bar = document.createElementNS(Avionics.SVG.NS, "rect");
                bar.setAttribute("visibility", "hidden");
                bar.setAttribute("width", columnWidth);
                bar.setAttribute("height", barHeight);
                bar.setAttribute("x", horizontalMargin + c * (columnWidth + horizontalSpacing));
                bar.setAttribute("y", topMargin + i * (barHeight + verticalSpacing));
                g.appendChild(bar);
                bars.push(bar);
            }

            let barText = document.createElementNS(Avionics.SVG.NS, "text");
            barText.setAttribute("x", horizontalMargin + c * (columnWidth + horizontalSpacing) + columnWidth / 2);
            barText.setAttribute("y", this.height - 30 + 10);
            barText.setAttribute("font-size", "8");
            barText.setAttribute("font-family", "Roboto-Bold");
            barText.setAttribute("text-anchor", "middle");
            barText.textContent = c + 1;
            g.appendChild(barText);

            let redLine = document.createElementNS(Avionics.SVG.NS, "rect");
            redLine.setAttribute("visibility", "hidden");
            redLine.setAttribute("fill", "red");
            redLine.setAttribute("width", 100 - horizontalMargin * 2);
            redLine.setAttribute("height", "2");
            redLine.setAttribute("x", horizontalMargin);
            redLine.setAttribute("y", topMargin);
            this.rootSvg.appendChild(redLine);
            this.redLineElement = redLine;

            this.columns.push({
                valueCallback: valueCallback,
                lastValue: 0,
                g: g,
                text: barText,
                bars: bars
            });
        }

        this.selectColumn(0);
    }
    selectColumn(index) {
        this.peak = 0;
        if (this.selectedColumn != null) {
            this.selectedColumn.g.setAttribute("fill", "white");
        }
        this.selectedColumn = this.columns[index];
        this.selectedColumn.g.setAttribute("fill", "cyan");
    }
    update(_context) {
        let min = this.minValueCallback.getValueAsNumber(_context);
        let max = this.maxValueCallback.getValueAsNumber(_context);
        for (let column of this.columns) {
            let value = column.valueCallback.getValueAsNumber(_context);
            let ratio = (value - min) / (max - min);
            if (Math.abs(ratio - column.lastValue) * column.bars.length >= 1) {
                for (let b = 0; b < column.bars.length; b++) {
                    let bar = column.bars[b];
                    let oldValue = (1 - b / column.bars.length > column.lastValue);
                    let newValue = (1 - b / column.bars.length > ratio);
                    if (oldValue != newValue) {
                        bar.setAttribute("visibility", newValue ? "hidden" : "visible");
                    }
                }
                column.lastValue = ratio;
            }
        }
        if (this.selectedColumn != null && this.selectedColumn.valueCallback) {
            let selectedValue = this.selectedColumn.valueCallback.getValueAsNumber(_context).toFixed(0);
            if (selectedValue != this.lastSelectedValue) {
                this.rightText.textContent = selectedValue;
                this.lastSelectedValue = selectedValue;
            }
        }
        if (this.redLineValue) {
            let ratio = (this.redLineValue - min) / (max - min);
            let y = 4 + (1 - ratio) * (this.height - 30 - 4);
            if (this.redLineElement.getAttribute("y") != y) {
                this.redLineElement.setAttribute("y", y);
            }
        }
    }
    connectedCallback() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 " + this.height);
        this.appendChild(this.rootSvg);

        this.leftText = document.createElementNS(Avionics.SVG.NS, "text");
        this.leftText.setAttribute("y", this.height - 15 + 12.5);
        this.leftText.setAttribute("x", "10");
        this.leftText.setAttribute("fill", "white");
        this.leftText.setAttribute("font-size", "10");
        this.leftText.setAttribute("font-family", "Roboto-Bold");
        this.leftText.setAttribute("text-anchor", "start");
        this.rootSvg.appendChild(this.leftText);
        this.rightText = document.createElementNS(Avionics.SVG.NS, "text");
        this.rightText.setAttribute("y", this.height - 15 + 12.5);
        this.rightText.setAttribute("x", "90");
        this.rightText.setAttribute("fill", "white");
        this.rightText.setAttribute("font-size", "10");
        this.rightText.setAttribute("font-family", "Roboto-Bold");
        this.rightText.setAttribute("text-anchor", "end");
        this.rootSvg.appendChild(this.rightText);
    }
}
customElements.define('glasscockpit-xmlcolumngauge', XMLColumnGauge);
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
class XMLCircularGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.startAngle = -15;
        this.endAngle = 195;
        this.cursorType = 0;
        this.valuePos = 0;
        this.height = 63;
        this.textIncrement = 1;
        this.forceTextColor = "";
        this.textPrecision = 0;
        this.graduations = null;

        this.value$ = new rxjs.Subject();
        this.subscriptions = new Subscriptions();
    }
    setupObservers() {
        if (this.hasSetupObservers)
            return;
        this.hasSetupObservers = true;

        const valueText$ = this.value$.pipe(
            rxjs.operators.map(value => this.textIncrement != 1 ? Math.round(value / this.textIncrement) * this.textIncrement : value),
            rxjs.operators.map(value => value.toFixed(this.textPrecision)),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.shareReplay(1)
        );

        this.subscriptions.add(
            this.value$.pipe(
                rxjs.operators.map(value => this.valueToAngle(Math.max(Math.min(value, this.maxValue), this.minValue))),
                rxjs.operators.map(Math.round),
                rxjs.operators.distinctUntilChanged()
            ).subscribe(rotation => this.cursor.setAttribute("transform", `rotate(${rotation} 50 40)`)),

            this.state$.pipe(
                rxjs.operators.map(state => state != ""),
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.switchMap(computeBoundingBoxes => {
                    if (computeBoundingBoxes) {
                        return valueText$.pipe(rxjs.operators.map(() => this.valueElements.text.getBBox()))
                    }
                    return rxjs.empty();
                }),
                rxjs.operators.distinctUntilChanged((a, b) => a.x == b.x && a.y == b.y && a.width == b.width && a.height == b.height),
                rxjs.operators.map(this.mapBoundingBox.bind(this))
            ).subscribe(box => {
                DOMUtilities.setAttributes(this.valueElements.alert, box);
                DOMUtilities.setAttributes(this.valueElements.caution, box);
            }),

            valueText$.subscribe(text => this.valueElements.text.textContent = text)
        );

        if (this.forceTextColor != "") {
            this.valueElements.text.setAttribute("fill", this.forceTextColor);
        } else {
            this.subscriptions.add(
                this.value$.pipe(
                    WT_RX.distinctMap(value => {
                        for (let i = this.colorZones.length - 1; i >= 0; i--) {
                            if (value >= this.colorZones[i].lastBegin && value <= this.colorZones[i].lastEnd) {
                                return this.colorZones[i].element.getAttribute("fill");
                            }
                        }
                        return null;
                    }),
                    rxjs.operators.map(color => color == null ? "white" : color),
                    rxjs.operators.shareReplay(1),
                ).subscribe(color => this.valueElements.text.setAttribute("fill", color))
            );
        }
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setStyle(styleElement) {
        if (styleElement) {
            this.processStyleElement(styleElement, "ForceTextColor", v => this.forceTextColor = v);
            this.processStyleElement(styleElement, "TextIncrement", v => this.textIncrement = parseFloat(v));
            this.processStyleElement(styleElement, "ValuePrecision", v => this.textPrecision = parseInt(v));
            this.processStyleElement(styleElement, "BeginAngle", v => this.startAngle = parseFloat(v));
            this.processStyleElement(styleElement, "EndAngle", v => this.endAngle = parseFloat(v));
            this.processStyleElement(styleElement, "Graduations", v => this.graduations = v.split(','));
            this.processStyleElement(styleElement, "CursorType", v => {
                switch (v) {
                    case "Triangle":
                        this.cursorType = 1;
                        break;
                }
            });
            this.processStyleElement(styleElement, "ValuePos", v => {
                switch (v) {
                    case "End":
                        this.valuePos = 1;
                        break;
                }
            });

            this.height = Math.max(40 - 40 * Math.sin(this.startAngle * Math.PI / 180), 40 - 40 * Math.sin(this.endAngle * Math.PI / 180) + (this.valuePos == 1 ? 20 : 0), (this.valuePos == 1 ? 50 : 65)) + 3;
        }
    }
    drawBase() {
        this.rootSvg = DOMUtilities.createSvgElement("svg", {
            width: `${this.sizePercent}%`,
            viewBox: `0 -2 100 ${this.height}`
        });
        this.appendChild(this.rootSvg);

        this.setAttribute("mode", this.valuePos);

        this.decorationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.decorationGroup);

        this.graduationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.graduationGroup);

        this.customGraduationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.customGraduationGroup);

        const mainArc = DOMUtilities.createSvgElement("path", {
            d: `M${50 - 40 * Math.cos(this.startAngle * Math.PI / 180)} ${40 - 40 * Math.sin(this.startAngle * Math.PI / 180)} A 40 40 0 ${this.endAngle - this.startAngle > 180 ? "1" : "0"} 1 ${50 - 40 * Math.cos(this.endAngle * Math.PI / 180)} ${40 - 40 * Math.sin(this.endAngle * Math.PI / 180)}`,
            stroke: "white",
            "stroke-width": "1",
            fill: "none",
        });
        this.rootSvg.appendChild(mainArc);

        const beginLimit = DOMUtilities.createSvgElement("rect", { x: 10, y: 40, width: 10, height: 1, fill: "white", transform: `rotate(${this.startAngle} 50 40)` });
        this.rootSvg.appendChild(beginLimit);

        const endLimit = DOMUtilities.createSvgElement("rect", { x: 10, y: 40, width: 10, height: 1, fill: "white", transform: `rotate(${this.endAngle} 50 40)` });
        this.rootSvg.appendChild(endLimit);

        this.cursor = DOMUtilities.createSvgElement("polygon", { class: "cursor" });
        switch (this.cursorType) {
            case 0:
                this.cursor.setAttribute("points", "13.5,40, 22,36 24,39 45,39 45,41 24,41 22,44");
                break;
            case 1:
                this.cursor.setAttribute("points", "13.5,40, 25,35 25,45");
                break;
        }
        this.rootSvg.appendChild(this.cursor);

        const axle = DOMUtilities.createSvgElement("circle", { cx: 50, cy: 40, r: 3, class: "axle", });
        this.rootSvg.appendChild(axle);

        // Begin text
        this.beginText = DOMUtilities.createSvgElement("text", {
            x: (50 - 40 * Math.cos((this.startAngle - 15) * Math.PI / 180)),
            y: (40 - 40 * Math.sin((this.startAngle - 15) * Math.PI / 180)),
            class: "bottom-text",
        });
        this.rootSvg.appendChild(this.beginText);

        // End text
        this.endText = DOMUtilities.createSvgElement("text", {
            x: (50 - 40 * Math.cos((this.endAngle + 15) * Math.PI / 180)),
            y: (40 - 40 * Math.sin((this.endAngle + 15) * Math.PI / 180)),
            class: "bottom-text",
        });
        this.rootSvg.appendChild(this.endText);

        // Unit text
        this.unitElements = {
            caution: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, CautionBlink: "Background" }),
            alert: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, AlertBlink: "Background" }),
            text: DOMUtilities.createSvgElement("text", { x: 50, y: 50, AlertBlink: "Text", CautionBlink: "Text", class: "unit-text" }),
        }

        // Title text
        this.titleElements = {
            caution: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, CautionBlink: "Background" }),
            alert: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, AlertBlink: "Background" }),
            text: DOMUtilities.createSvgElement("text", { x: 50, y: 35, AlertBlink: "Text", CautionBlink: "Text", class: "title-text" }),
        }
        DOMUtilities.AppendChildren(this.rootSvg, Object.values(this.titleElements));

        // Value text
        this.valueElements = {
            caution: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, CautionBlink: "Background" }),
            alert: DOMUtilities.createSvgElement("rect", { "fill-opacity": 0, AlertBlink: "Background" }),
            text: DOMUtilities.createSvgElement("text", { class: "value-text", CautionBlink: "Text", AlertBlink: "Text" }),
        }
        switch (this.valuePos) {
            case 0:
                this.valueElements.text.setAttribute("x", 50);
                this.valueElements.text.setAttribute("y", 65);
                break;
            case 1:
                this.valueElements.text.setAttribute("x", 60 - 40 * Math.cos((this.endAngle + 25) * Math.PI / 180));
                this.valueElements.text.setAttribute("y", 40 - 40 * Math.sin((this.endAngle + 25) * Math.PI / 180));
                break;
        }

        DOMUtilities.AppendChildren(this.rootSvg, [
            this.unitElements.caution, this.unitElements.alert,
            this.titleElements.caution, this.titleElements.alert,
            this.valueElements.caution, this.valueElements.alert,

            this.unitElements.text,
            this.titleElements.text,
            this.valueElements.text,
        ]);
    }
    addColorZone(begin, end, color, context) {
        let colorZone = document.createElementNS(Avionics.SVG.NS, "path");
        colorZone.setAttribute("d", "");
        colorZone.setAttribute("fill", color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, begin, end));
        this.updateColorZone(colorZone, begin.getValueAsNumber(context), end.getValueAsNumber(context));
    }
    addColorLine(position, color, context) {
        let colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("x", "10");
        colorLine.setAttribute("y", "39");
        colorLine.setAttribute("height", "2");
        colorLine.setAttribute("width", "10");
        colorLine.setAttribute("fill", color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, position));
        this.updateColorLine(colorLine, position.getValueAsNumber(context));
    }
    updateColorZone(element, begin, end) {
        let beginAngle = this.valueToAngle(begin);
        let endAngle = this.valueToAngle(end);
        let longPath = endAngle - beginAngle > 180;
        let path = "M" + (50 - 38.5 * Math.cos(beginAngle * Math.PI / 180)) + " " + (40 - 38.5 * Math.sin(beginAngle * Math.PI / 180)) + "A 38.5 38.5 0 " + (longPath ? "1" : "0") + " 1" + (50 - 38.5 * Math.cos(endAngle * Math.PI / 180)) + " " + (40 - 38.5 * Math.sin(endAngle * Math.PI / 180));
        path += "L" + (50 - 36 * Math.cos(endAngle * Math.PI / 180)) + " " + (40 - 36 * Math.sin(endAngle * Math.PI / 180)) + "A 36 36 0 " + (longPath ? "1" : "0") + " 0" + (50 - 36 * Math.cos(beginAngle * Math.PI / 180)) + " " + (40 - 36 * Math.sin(beginAngle * Math.PI / 180));
        element.setAttribute("d", path);
    }
    updateColorLine(element, pos) {
        let angle = this.valueToAngle(pos);
        if (angle >= this.startAngle && angle <= this.endAngle) {
            element.setAttribute("transform", "rotate(" + angle + " 50 40)");
            element.setAttribute("display", "");
        }
        else {
            element.setAttribute("display", "none");
        }
    }
    updateValue(value) {
        this.setupObservers();
        this.value$.next(value);
    }
    valueToAngle(value) {
        return ((value - this.minValue) / (this.maxValue - this.minValue)) * (this.endAngle - this.startAngle) + this.startAngle;
    }
    setLimitValues(begin, end) {
        super.setLimitValues(begin, end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = begin;
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = end;
        }

        if (this.graduations != null) {
            this.customGraduationGroup.innerHTML = "";
            DOMUtilities.AppendChildren(this.customGraduationGroup, this.graduations.map(graduation => {
                return DOMUtilities.createSvgElement("rect", {
                    class: "graduation", x: 10, y: 39, width: 8, height: 1, transform: `rotate(${this.valueToAngle(graduation)} 50 40)`,
                })
            }));
        }
    }
    setTitleAndUnit(title, unit) {
        this.titleElements.text.textContent = title;
        this.unitElements.text.textContent = unit;
    }
    mapBoundingBox(bbox) {
        return { x: bbox.x - 1, y: bbox.y - 1, width: bbox.width + 2, height: bbox.height + 2 }
    }
    computeCautionBackgrounds() {
        DOMUtilities.setAttributes(this.titleElements.caution, this.mapBoundingBox(this.titleElements.text.getBBox()));
        DOMUtilities.setAttributes(this.unitElements.caution, this.mapBoundingBox(this.unitElements.text.getBBox()));
    }
    computeAlertBackgrounds() {
        DOMUtilities.setAttributes(this.titleElements.alert, this.mapBoundingBox(this.titleElements.text.getBBox()));
        DOMUtilities.setAttributes(this.unitElements.alert, this.mapBoundingBox(this.unitElements.text.getBBox()));
    }
    setGraduations(spaceBetween, withText = false) {
        for (let i = this.minValue + spaceBetween; i < this.maxValue; i += spaceBetween) {
            let grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", "10");
            grad.setAttribute("y", "39");
            grad.setAttribute("width", "6");
            grad.setAttribute("height", "1");
            grad.setAttribute("fill", "white");
            grad.setAttribute("transform", "rotate(" + this.valueToAngle(i) + " 50 40)");
            this.graduationGroup.appendChild(grad);
        }
    }
    forceBeginText(text) {
        this.beginText.textContent = text;
        this.forcedBeginText = text;
    }
    forceEndText(text) {
        this.endText.textContent = text;
        this.forcedEndText = text;
    }
    setCursorLabel(label1, label2) {
    }
}
customElements.define('glasscockpit-xmlcirculargauge', XMLCircularGauge);
class XMLHorizontalGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.valuePos = 0;
        this.beginX = 10;
        this.endX = 90;
        this.width = 100;
        this.cursorColor = "white";
        this.isReverseY = false;
        this.textIncrement = 1;
        this.textPrecision = 0;
        this.lastValue = 0;

        this.value$ = new rxjs.Subject();
        this.showFooter$ = new rxjs.BehaviorSubject(false);
        this.subscriptions = new Subscriptions();
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setupObservers() {
        if (this.hasSetupObservers)
            return;
        this.hasSetupObservers = true;

        this.subscriptions.add(
            this.showFooter$.pipe(
                rxjs.operators.map(() => this.beginText.textContent != "" || this.endText.textContent != "")
            ).subscribe(show => {
                DOMUtilities.ToggleAttribute(this, "show-footer", show);
                this.rootSvg.setAttribute("viewBox", `0 0 ${this.width} ${show ? 18 : 10}`);
            })
        );

        const mapValue = _value => ((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX);

        const handleValue = (value$, cursor, label, textElement, cautionBg, alertBg) => {
            this.subscriptions.add(
                value$.pipe(
                    rxjs.operators.map(mapValue),
                    rxjs.operators.map(v => Math.floor(v * 5) / 5),
                    rxjs.operators.distinctUntilChanged()
                ).subscribe(translate => {
                    cursor.setAttribute("transform", `translate(${translate} 0)`);
                    if (label)
                        label.setAttribute("transform", `translate(${translate} 0)`);
                })
            );

            if (textElement) {
                this.subscriptions.add(
                    value$.pipe(
                        rxjs.operators.map(_value => this.textIncrement != 1 ? Math.round(_value / this.textIncrement) * this.textIncrement : _value),
                        rxjs.operators.map(v => v.toFixed(this.textPrecision)),
                        rxjs.operators.distinctUntilChanged(),
                        rxjs.operators.tap(text => textElement.textContent = text)
                    ).subscribe(),
                    value$.pipe(
                        rxjs.operators.map(value => {
                            for (let i = this.colorZones.length - 1; i >= 0; i--) {
                                if (value >= this.colorZones[i].lastBegin && value <= this.colorZones[i].lastEnd) {
                                    return this.colorZones[i].element.getAttribute("fill");
                                }
                            }
                            return null;
                        }),
                        rxjs.operators.distinctUntilChanged(),
                    ).subscribe(color => textElement.style.setProperty("--color", color == null ? "white" : color))
                );
            }
        }

        handleValue(this.value$, this.cursor, this.cursorLabel, this.valueText, this.valueText_cautionbg, this.valueText_alertbg);
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            let textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseFloat(textIncrementElem[0].textContent);
            }
            let valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "End":
                        this.valuePos = 1;
                        break;
                    case "Right":
                        this.valuePos = 2;
                        this.endX = 70;
                }
            }
            let cursorColorElem = _styleElem.getElementsByTagName("CursorColor");
            if (cursorColorElem.length > 0) {
                this.cursorColor = cursorColorElem[0].textContent;
            }
            let widthElem = _styleElem.getElementsByTagName("Width");
            if (widthElem.length > 0) {
                this.width = parseFloat(widthElem[0].textContent);
                this.beginX = this.beginX / (100 / this.width);
                this.endX = this.endX / (100 / this.width);
            }
            let reverseYElem = _styleElem.getElementsByTagName("ReverseY");
            if (reverseYElem.length > 0) {
                this.isReverseY = reverseYElem[0].textContent == "True";
            }
            let precisionElem = _styleElem.getElementsByTagName("ValuePrecision");
            if (precisionElem.length > 0) {
                this.textPrecision = parseInt(precisionElem[0].textContent);
            }
        }
    }
    drawBase() {
        this.setAttribute("mode", this.valuePos);

        this.label = DOMUtilities.createElement("label");
        this.appendChild(this.label);

        this.valueText = DOMUtilities.createElement("div", { class: "value" });
        this.appendChild(this.valueText);

        this.rootSvg = DOMUtilities.createSvgElement("svg", {
            class: "bar",
            width: `${this.sizePercent}%`,
            viewBox: `0 0 ${this.width} 20`,
        });
        this.appendChild(this.rootSvg);

        /*const defs = DOMUtilities.createSvgElement("defs");
        const color1 = "#aaaaaa";
        const color2 = "#ffffff";
        defs.innerHTML = `<linearGradient id="cursor-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop stop-color="${color1}" offset="0%"/>
            <stop stop-color="${color2}" offset="30%"/>
            <stop stop-color="${color2}" offset="50%"/>
            <stop stop-color="${color2}" offset="70%"/>
            <stop stop-color="${color1}" offset="100%"/>
        </linearGradient>`;
        this.rootSvg.appendChild(defs);*/

        this.decorationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.decorationGroup);

        this.graduationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.graduationGroup);

        /*let bottomBar = DOMUtilities.createSvgElement("path", {
            d: `M${this.beginX} 0 L${this.beginX} 9 L${this.endX} 9 L${this.endX} 0`,
            class: "bar-outline"
        });
        this.rootSvg.appendChild(bottomBar);*/

        const barThickness = 1;
        const barHeight = 10;

        let bottomBar = DOMUtilities.createSvgElement("rect", {
            x: this.beginX,
            y: this.isReverseY ? 2 : (barHeight - barThickness),
            height: barThickness,
            width: this.endX - this.beginX,
            class: "bar-outline"
        });
        this.rootSvg.appendChild(bottomBar);

        let beginLimit = DOMUtilities.createSvgElement("rect", {
            x: this.beginX - 1,
            y: 2, height: (barHeight - 2),
            width: barThickness,
            class: "bar-outline"
        });
        this.rootSvg.appendChild(beginLimit);

        let endLimit = DOMUtilities.createSvgElement("rect", {
            x: this.endX - 1,
            y: 2, height: (barHeight - 2),
            width: barThickness,
            class: "bar-outline"
        });
        this.rootSvg.appendChild(endLimit);

        this.cursor = DOMUtilities.createSvgElement("polygon", {
            CautionBlink: "Yellow",
            AlertBlink: "Red",
            class: "cursor"
        });
        this.cursor.style.setProperty('--color', this.cursorColor);
        if (this.isReverseY) {
            this.cursor.setAttribute("points", `${this.beginX},2 ${this.beginX - 3},5 ${this.beginX - 3},10 ${this.beginX + 3},10 ${this.beginX + 3},5`);
        } else {
            this.cursor.setAttribute("points", `${this.beginX},8 ${this.beginX - 3},5 ${this.beginX - 3},0 ${this.beginX + 3},0 ${this.beginX + 3},5`);
        }
        this.rootSvg.appendChild(this.cursor);

        this.beginText = DOMUtilities.createSvgElement("text", { x: this.beginX, y: 18, class: "bar-graduation-text" });
        this.rootSvg.appendChild(this.beginText);

        this.endText = DOMUtilities.createSvgElement("text", { x: this.endX, y: 18, class: "bar-graduation-text" });
        this.rootSvg.appendChild(this.endText);
    }
    addColorZone(_begin, _end, _color, _context) {
        let colorZone = DOMUtilities.createSvgElement("rect", { height: 4, y: 4, fill: _color });
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        let begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        let end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        _element.setAttribute("x", begin.toString());
        _element.setAttribute("width", (end - begin).toString());
    }
    addColorLine(_position, _color, _context) {
        const colorLine = DOMUtilities.createSvgElement("rect", { x: 9, y: 4, height: 10, width: 2, fill: _color, });
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorLine(_element, _pos) {
        if (_pos >= this.minValue && _pos <= this.maxValue) {
            _element.setAttribute("transform", `translate(${((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)} 0)`);
            _element.setAttribute("display", "");
        } else {
            _element.setAttribute("display", "none");
        }
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            let grad = DOMUtilities.createSvgElement("rect", { x: ((i - this.minValue) / (this.maxValue - this.minValue)) * 80 + 9.5, y: 4, height: 6, width: 1, class: "bar-outline", });
            this.graduationGroup.appendChild(grad);
        }
    }
    updateValue(_value, _value2) {
        this.setupObservers();
        this.value$.next(_value);
    }
    setTitleAndUnit(_title, _unit) {
        this.label.textContent = _title + " " + _unit;
    }
    computeCautionBackgrounds() {
        /*let titleBbox = this.titleText.getBBox();
        this.titleText_cautionbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_cautionbg.setAttribute("y", (titleBbox.y - 1).toString());
        this.titleText_cautionbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_cautionbg.setAttribute("height", (titleBbox.height + 2).toString());*/
    }
    computeAlertBackgrounds() {
        /*let titleBbox = this.titleText.getBBox();
        this.titleText_alertbg.setAttribute("x", (titleBbox.x - 1).toString());
        this.titleText_alertbg.setAttribute("y", (titleBbox.y - 1).toString());
        this.titleText_alertbg.setAttribute("width", (titleBbox.width + 2).toString());
        this.titleText_alertbg.setAttribute("height", (titleBbox.height + 2).toString());*/
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
            this.showFooter$.next();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
            this.showFooter$.next();
        }
    }
    forceBeginText(_text) {
        this.beginText.textContent = _text;
        this.forcedBeginText = _text;
        this.showFooter$.next();
    }
    forceEndText(_text) {
        this.endText.textContent = _text;
        this.forcedEndText = _text;
        this.showFooter$.next();
    }
    setCursorLabel(_label1, _label2) {
        if (!this.cursorLabel) {
            this.cursorLabel = DOMUtilities.createSvgElement("text", { x: 10, y: this.isReverseY ? 9 : 19, class: "cursor-label" });
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = _label1;
    }
}
customElements.define('glasscockpit-xmlhorizontalgauge', XMLHorizontalGauge);
class XMLHorizontalDoubleGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.beginX = 10;
        this.endX = 90;
        this.valuePos = 0;
        this.textIncrement = 1;

        this.showFooter$ = new rxjs.BehaviorSubject(false);
        this.value1$ = new rxjs.Subject();
        this.value2$ = new rxjs.Subject();

        this.subscriptions = new Subscriptions();
    }
    setupObservers() {
        if (this.hasSetupObservers)
            return;
        this.hasSetupObservers = true;

        this.subscriptions.add(
            this.showFooter$.pipe(
                rxjs.operators.map(() => this.beginText.textContent != "" || this.endText.textContent != "")
            ).subscribe(show => {
                DOMUtilities.ToggleAttribute(this, "show-footer", show);
                const height = 22;
                this.rootSvg.setAttribute("viewBox", `0 10 ${this.valuePos == 2 ? 80 : 100} ${height + (show ? 8 : 0)}`);
            })
        );

        const mapValue = _value => ((Math.max(Math.min(_value, this.maxValue), this.minValue) - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX);

        const handleValue = (value$, cursor, label, textElement) => {
            this.subscriptions.add(
                value$.pipe(
                    rxjs.operators.map(mapValue),
                    rxjs.operators.map(Math.floor),
                    rxjs.operators.distinctUntilChanged()
                ).subscribe(translate => {
                    cursor.setAttribute("transform", `translate(${translate} 0)`);
                    if (label)
                        label.setAttribute("transform", `translate(${translate} 0)`);
                })
            );

            const color$ = value$.pipe(
                WT_RX.distinctMap(value => {
                    for (let i = this.colorZones.length - 1; i >= 0; i--) {
                        if (value >= this.colorZones[i].lastBegin && value <= this.colorZones[i].lastEnd) {
                            return this.colorZones[i].element.getAttribute("fill");
                        }
                    }
                    return null;
                }),
                rxjs.operators.map(color => color == null ? "white" : color),
                rxjs.operators.shareReplay(1),
            );

            this.subscriptions.add(
                color$.subscribe(color => cursor.style.setProperty("--color", color))
            );

            if (textElement) {
                this.subscriptions.add(
                    value$.pipe(
                        rxjs.operators.map(_value => this.textIncrement != 1 ? Math.round(_value / this.textIncrement) * this.textIncrement : _value.toFixed(0)),
                        rxjs.operators.distinctUntilChanged(),
                        rxjs.operators.tap(text => textElement.textContent = text)
                    ).subscribe(),
                    color$.subscribe(color => textElement.style.setProperty("--color", color))
                );
            }
        }

        handleValue(this.value1$, this.cursor, this.cursorLabel, this.valueText);
        handleValue(this.value2$, this.cursor2, this.cursor2Label, this.valueText2);
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setStyle(_styleElem) {
        if (_styleElem) {
            let textIncrementElem = _styleElem.getElementsByTagName("TextIncrement");
            if (textIncrementElem.length > 0) {
                this.textIncrement = parseInt(textIncrementElem[0].textContent);
            }
            let valuePosElem = _styleElem.getElementsByTagName("ValuePos");
            if (valuePosElem.length > 0) {
                switch (valuePosElem[0].textContent) {
                    case "Right":
                        this.valuePos = 2;
                        this.endX = 70;
                }

            }
        }
    }
    drawBase() {
        this.setAttribute("mode", this.valuePos);

        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.appendChild(this.rootSvg);
        let bottomBar = document.createElementNS(Avionics.SVG.NS, "rect");
        bottomBar.setAttribute("x", this.beginX.toString());
        bottomBar.setAttribute("y", "21");
        bottomBar.setAttribute("height", "1");
        bottomBar.setAttribute("width", (this.endX - this.beginX).toString());
        bottomBar.setAttribute("fill", "white");
        this.rootSvg.appendChild(bottomBar);
        this.decorationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.decorationGroup);
        this.graduationGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.rootSvg.appendChild(this.graduationGroup);
        let beginLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        beginLimit.setAttribute("x", (this.beginX - 1).toString());
        beginLimit.setAttribute("y", "17");
        beginLimit.setAttribute("height", "10");
        beginLimit.setAttribute("width", "1");
        beginLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(beginLimit);
        let endLimit = document.createElementNS(Avionics.SVG.NS, "rect");
        endLimit.setAttribute("x", (this.endX - 1).toString());
        endLimit.setAttribute("y", "17");
        endLimit.setAttribute("height", "10");
        endLimit.setAttribute("width", "1");
        endLimit.setAttribute("fill", "white");
        this.rootSvg.appendChild(endLimit);
        const cursorWidth = 6;
        this.cursor = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor.setAttribute("points", this.beginX + ",21 " + (this.beginX - cursorWidth) + ",12 " + (this.beginX + cursorWidth) + ",12");
        this.cursor.setAttribute("class", "cursor");
        this.rootSvg.appendChild(this.cursor);
        this.cursor2 = document.createElementNS(Avionics.SVG.NS, "polygon");
        this.cursor2.setAttribute("points", this.beginX + ",23 " + (this.beginX - cursorWidth) + ",32 " + (this.beginX + cursorWidth) + ",32");
        this.cursor2.setAttribute("class", "cursor");
        this.rootSvg.appendChild(this.cursor2);
        this.beginText = document.createElementNS(Avionics.SVG.NS, "text");
        this.beginText.setAttribute("x", this.beginX.toString());
        this.beginText.setAttribute("y", "40");
        this.beginText.setAttribute("fill", "white");
        this.beginText.setAttribute("font-size", "8");
        this.beginText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.beginText);
        this.endText = document.createElementNS(Avionics.SVG.NS, "text");
        this.endText.setAttribute("x", this.endX.toString());
        this.endText.setAttribute("y", "40");
        this.endText.setAttribute("fill", "white");
        this.endText.setAttribute("font-size", "8");
        this.endText.setAttribute("text-anchor", "middle");
        this.rootSvg.appendChild(this.endText);

        this.titleText = DOMUtilities.createElement("label", {
            CautionBlink: "Text",
            AlertBlink: "Text"
        });
        const labelContainer = DOMUtilities.createElement("div", {
            class: "label"
        });
        labelContainer.appendChild(this.titleText);
        this.appendChild(labelContainer);

        this.valueText = DOMUtilities.createElement("div", {
            class: "value-1",
            CautionBlink: "Text",
            AlertBlink: "Text"
        });
        this.appendChild(this.valueText);
        this.valueText2 = DOMUtilities.createElement("div", {
            class: "value-2",
            CautionBlink: "Text",
            AlertBlink: "Text"
        });
        this.appendChild(this.valueText2);
    }
    addColorZone(_begin, _end, _color, _context) {
        let colorZone = document.createElementNS(Avionics.SVG.NS, "rect");
        colorZone.setAttribute("height", "4");
        colorZone.setAttribute("y", "20");
        colorZone.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    updateColorZone(_element, _begin, _end) {
        let begin = ((_begin - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        let end = ((_end - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX;
        _element.setAttribute("x", begin.toString());
        _element.setAttribute("width", (end - begin).toString());
    }
    addColorLine(_position, _color, _context) {
        let colorLine = document.createElementNS(Avionics.SVG.NS, "rect");
        colorLine.setAttribute("height", "12");
        colorLine.setAttribute("width", "2");
        colorLine.setAttribute("x", (this.beginX - 1).toString());
        colorLine.setAttribute("y", "16");
        colorLine.setAttribute("fill", _color);
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, _position));
        this.updateColorLine(colorLine, _position.getValueAsNumber(_context));
    }
    updateColorLine(_element, _pos) {
        if (_pos >= this.minValue && _pos <= this.maxValue) {
            _element.setAttribute("transform", "translate(" + (((_pos - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX)) + " 0)");
            _element.setAttribute("display", "");
        }
        else {
            _element.setAttribute("display", "none");
        }
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            let grad = document.createElementNS(Avionics.SVG.NS, "rect");
            grad.setAttribute("x", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX - 0.5).toString());
            grad.setAttribute("y", "17");
            grad.setAttribute("height", "10");
            grad.setAttribute("width", "1");
            grad.setAttribute("fill", "white");
            this.graduationGroup.appendChild(grad);
            if (_withText) {
                let gradText = document.createElementNS(Avionics.SVG.NS, "text");
                gradText.setAttribute("x", (((i - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX - 0.5).toString());
                gradText.setAttribute("y", "40");
                gradText.setAttribute("fill", "white");
                gradText.setAttribute("font-size", "8");
                gradText.setAttribute("font-family", "Roboto-Regular");
                gradText.setAttribute("text-anchor", "middle");
                gradText.textContent = i.toString();
                this.graduationGroup.appendChild(gradText);
                this.showFooter$.next();
            }
        }
    }
    updateValue(_value, _value2) {
        this.setupObservers();
        this.value1$.next(_value);
        this.value2$.next(_value2);
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title + " " + _unit;
    }
    computeCautionBackgrounds() {
    }
    computeAlertBackgrounds() {
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = _begin.toString();
            this.showFooter$.next();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = _end.toString();
            this.showFooter$.next();
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
        if (!this.cursorLabel) {
            this.cursorLabel = DOMUtilities.createSvgElement("text", { x: this.beginX, y: 18, class: "cursor-label" });
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = _label1;
        if (_label2) {
            if (!this.cursor2Label) {
                this.cursor2Label = DOMUtilities.createSvgElement("text", { x: this.beginX, y: 31, class: "cursor-label" });
                this.rootSvg.appendChild(this.cursor2Label);
            }
            this.cursor2Label.textContent = _label2;
        }
    }
}
customElements.define('glasscockpit-xmlhorizontaldoublegauge', XMLHorizontalDoubleGauge);
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
class XMLFlapsGauge extends XMLGauge {
    constructor() {
        super(...arguments);
        this.takeOffValue = 10;
    }
    setStyle(_styleElem) {
    }
    drawBase() {
        this.rootSvg = document.createElementNS(Avionics.SVG.NS, "svg");
        this.rootSvg.setAttribute("width", this.sizePercent + "%");
        this.rootSvg.setAttribute("viewBox", "0 0 100 50");
        this.rootSvg.setAttribute("overflow", "visible");
        this.appendChild(this.rootSvg);
        this.cursor = document.createElementNS(Avionics.SVG.NS, "path");
        this.cursor.setAttribute("d", "M10 10 Q25 0 60 10 Q25 20 10 10");
        this.cursor.setAttribute("fill", "aqua");
        this.rootSvg.appendChild(this.cursor);
        this.titleText = document.createElementNS(Avionics.SVG.NS, "text");
        this.titleText.setAttribute("x", "5");
        this.titleText.setAttribute("y", "45");
        this.titleText.setAttribute("fill", "white");
        this.titleText.setAttribute("font-size", "12");
        this.titleText.textContent = "FLAPS";
        this.rootSvg.appendChild(this.titleText);
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
        this.cursor.setAttribute("transform", "rotate(" + _value + " 10 10)");
    }
    setTitleAndUnit(_title, _unit) {
        this.titleText.textContent = _title;
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
    setTakeOffValue(_value) {
        this.takeOffValue = _value;
    }
    setLimitValues(_begin, _end) {
        super.setLimitValues(_begin, _end);
        let angles = [this.minValue, this.takeOffValue, this.maxValue];
        let texts = ["UP", "T/O", "LDG"];
        for (let i = 0; i < angles.length; i++) {
            let graduation = document.createElementNS(Avionics.SVG.NS, "rect");
            graduation.setAttribute("x", "60");
            graduation.setAttribute("y", "10");
            graduation.setAttribute("height", "1");
            graduation.setAttribute("width", "10");
            graduation.setAttribute("fill", "white");
            graduation.setAttribute("transform", "rotate(" + angles[i] + " 10 10)");
            this.rootSvg.appendChild(graduation);
            let text = document.createElementNS(Avionics.SVG.NS, "text");
            let radAngle = angles[i] * Math.PI / 180;
            text.setAttribute("x", (10 + 65 * Math.cos(radAngle)).toString());
            text.setAttribute("y", (15 + 65 * Math.sin(radAngle)).toString());
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "10");
            text.textContent = texts[i];
            this.rootSvg.appendChild(text);
        }
    }
}
customElements.define('glasscockpit-xmlflapsgauge', XMLFlapsGauge);
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