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
            WT_RX.shareReplay()
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
                    WT_RX.shareReplay(),
                ).subscribe(color => this.valueElements.text.setAttribute("fill", color))
            );
        }
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setStyle(styleElement) {
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