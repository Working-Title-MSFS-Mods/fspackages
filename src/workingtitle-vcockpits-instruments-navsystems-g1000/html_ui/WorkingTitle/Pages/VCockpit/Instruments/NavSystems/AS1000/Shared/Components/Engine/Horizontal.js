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
    setStyle(styleElement) {
        this.processStyleElement(styleElement, "TextIncrement", v => this.textIncrement = parseFloat(v));
        this.processStyleElement(styleElement, "ValuePos", v => {
            switch (v) {
                case "End":
                    this.valuePos = 1;
                    break;
                case "Right":
                    this.valuePos = 2;
                    this.endX = 70;
            }
        });
        this.processStyleElement(styleElement, "CursorColor", v => this.cursorColor = v);
        this.processStyleElement(styleElement, "Width", width => {
            this.width = parseFloat(width);
            this.beginX = this.beginX / (100 / this.width);
            this.endX = this.endX / (100 / this.width);
        });
        this.processStyleElement(styleElement, "ReverseY", v => this.isReverseY = v == "True");
        this.processStyleElement(styleElement, "ValuePrecision", v => this.textPrecision = parseInt(v));
    }
    drawBase() {
        this.setAttribute("mode", this.valuePos);

        this.label = this.appendChild(DOMUtilities.createElement("label"));
        this.valueText = this.appendChild(DOMUtilities.createElement("div", { class: "value" }));
        this.rootSvg = this.appendChild(DOMUtilities.createSvgElement("svg", {
            class: "bar",
            width: `${this.sizePercent}%`,
            viewBox: `0 0 ${this.width} 20`,
        }));

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

        this.decorationGroup = this.rootSvg.appendChild(DOMUtilities.createSvgElement("g"));
        this.graduationGroup = this.rootSvg.appendChild(DOMUtilities.createSvgElement("g"));

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

        this.cursor = this.rootSvg.appendChild(DOMUtilities.createSvgElement("polygon", {
            CautionBlink: "Yellow",
            AlertBlink: "Red",
            class: "cursor"
        }));
        this.cursor.style.setProperty('--color', this.cursorColor);
        if (this.isReverseY) {
            this.cursor.setAttribute("points", `${this.beginX},2 ${this.beginX - 3},5 ${this.beginX - 3},10 ${this.beginX + 3},10 ${this.beginX + 3},5`);
        } else {
            this.cursor.setAttribute("points", `${this.beginX},8 ${this.beginX - 3},5 ${this.beginX - 3},0 ${this.beginX + 3},0 ${this.beginX + 3},5`);
        }

        this.beginText = this.rootSvg.appendChild(DOMUtilities.createSvgElement("text", {
            x: this.beginX,
            y: 18,
            class: "bar-graduation-text"
        }));

        this.endText = this.rootSvg.appendChild(DOMUtilities.createSvgElement("text", {
            x: this.endX,
            y: 18,
            class: "bar-graduation-text"
        }));
    }
    lerp(value) {
        return ((value - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX
    }
    addColorZone(begin, end, color, context) {
        let colorZone = DOMUtilities.createSvgElement("rect", { height: 4, y: 4, fill: color });
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, begin, end));
        this.updateColorZone(colorZone, begin.getValueAsNumber(context), end.getValueAsNumber(context));
    }
    updateColorZone(element, begin, end) {
        const beginX = this.lerp(begin);
        const endX = this.lerp(end);
        element.setAttribute("x", beginX);
        element.setAttribute("width", endX - beginX);
    }
    addColorLine(position, color, context) {
        const colorLine = DOMUtilities.createSvgElement("rect", { x: 9, y: 4, height: 10, width: 2, fill: color, });
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, position));
        this.updateColorLine(colorLine, position.getValueAsNumber(context));
    }
    updateColorLine(element, pos) {
        element.setAttribute("transform", `translate(${this.lerp(value) - this.beginX} 0)`);
        element.setAttribute("display", (value >= this.minValue && value <= this.maxValue) ? "" : "none");
    }
    setGraduations(_spaceBetween, _withText = false) {
        for (let i = this.minValue + _spaceBetween; i < this.maxValue; i += _spaceBetween) {
            let grad = DOMUtilities.createSvgElement("rect", { x: ((i - this.minValue) / (this.maxValue - this.minValue)) * 80 + 9.5, y: 4, height: 6, width: 1, class: "bar-outline", });
            this.graduationGroup.appendChild(grad);
        }
    }
    updateValue(value, value2) {
        this.setupObservers();
        this.value$.next(value);
    }
    setTitleAndUnit(title, unit) {
        this.label.textContent = `${title} ${unit}`;
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
    forceBeginText(text) {
        this.beginText.textContent = text;
        this.forcedBeginText = text;
        this.showFooter$.next();
    }
    forceEndText(text) {
        this.endText.textContent = text;
        this.forcedEndText = text;
        this.showFooter$.next();
    }
    setCursorLabel(label1, label2) {
        if (!this.cursorLabel) {
            this.cursorLabel = DOMUtilities.createSvgElement("text", { x: 10, y: this.isReverseY ? 9 : 19, class: "cursor-label" });
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = label1;
    }
}
customElements.define('glasscockpit-xmlhorizontalgauge', XMLHorizontalGauge);