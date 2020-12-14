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
                WT_RX.shareReplay(),
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
    setStyle(styleElement) {
        this.processStyleElement(styleElement, "TextIncrement", v => this.textIncrement = parseInt(v));
        this.processStyleElement(styleElement, "ValuePos", v => {
            switch (v) {
                case "Right":
                    this.valuePos = 2;
                    this.endX = 70;
            }
        });
    }
    drawBase() {
        this.setAttribute("mode", this.valuePos);

        this.rootSvg = DOMUtilities.createSvgElement("svg", {
            width: `${this.sizePercent}%`
        });
        this.appendChild(this.rootSvg);

        this.rootSvg.appendChild(DOMUtilities.createSvgElement("rect", {
            x: this.beginX,
            y: 21,
            height: 1,
            width: this.endX - this.beginX,
            fill: "white"
        }));

        this.decorationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.decorationGroup);

        this.graduationGroup = DOMUtilities.createSvgElement("g");
        this.rootSvg.appendChild(this.graduationGroup);

        // begin / end element
        this.rootSvg.appendChild(DOMUtilities.createSvgElement("rect", {
            x: this.beginX - 1, y: 17, height: 10, width: 1, fill: "white"
        }));
        this.rootSvg.appendChild(DOMUtilities.createSvgElement("rect", {
            x: this.endX - 1, y: 17, height: 10, width: 1, fill: "white"
        }));

        // cursors
        const cursorWidth = 6;
        this.cursor = DOMUtilities.createSvgElement("polygon", {
            points: `${this.beginX},21 ${this.beginX - cursorWidth},12 ${this.beginX + cursorWidth},12`,
            class: "cursor",
        });
        this.rootSvg.appendChild(this.cursor);

        this.cursor2 = DOMUtilities.createSvgElement("polygon", {
            points: `${this.beginX},23 ${this.beginX - cursorWidth},32 ${this.beginX + cursorWidth},32`,
            class: "cursor",
        });
        this.rootSvg.appendChild(this.cursor2);

        // begin / end text
        this.beginText = DOMUtilities.createSvgElement("text", {
            x: this.beginX,
            y: 40,
            "fill": "white",
            "font-size": 8,
            "text-anchor": "middle"
        });
        this.rootSvg.appendChild(this.beginText);

        this.endText = DOMUtilities.createSvgElement("text", {
            x: this.endX,
            y: 40,
            "fill": "white",
            "font-size": 8,
            "text-anchor": "middle"
        });
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
        let colorZone = DOMUtilities.createSvgElement("rect", {
            height: 4,
            y: 20,
            fill: _color,
        });
        this.decorationGroup.appendChild(colorZone);
        this.colorZones.push(new XMLGaugeColorZone(colorZone, _begin, _end));
        this.updateColorZone(colorZone, _begin.getValueAsNumber(_context), _end.getValueAsNumber(_context));
    }
    lerp(value) {
        return ((value - this.minValue) / (this.maxValue - this.minValue)) * (this.endX - this.beginX) + this.beginX
    }
    updateColorZone(element, begin, end) {
        const beginX = this.lerp(begin);
        const endX = this.lerp(end);
        element.setAttribute("x", beginX);
        element.setAttribute("width", endX - beginX);
    }
    addColorLine(position, color, context) {
        const colorLine = DOMUtilities.createSvgElement("rect", {
            height: "12",
            width: "2",
            x: this.beginX - 1,
            y: "16",
            fill: color,
        });
        this.decorationGroup.appendChild(colorLine);
        this.colorLines.push(new XMLGaugeColorLine(colorLine, position));
        this.updateColorLine(colorLine, position.getValueAsNumber(context));
    }
    updateColorLine(element, value) {
        element.setAttribute("transform", `translate(${this.lerp(value) - this.beginX} 0)`);
        element.setAttribute("display", (value >= this.minValue && value <= this.maxValue) ? "" : "none");
    }
    setGraduations(spaceBetween, withText = false) {
        for (let i = this.minValue + spaceBetween; i < this.maxValue; i += spaceBetween) {
            const grad = DOMUtilities.createSvgElement("rect", {
                x: this.lerp(i) - 0.5,
                y: 17,
                height: 10,
                width: 1,
                fill: "white",
            });
            this.graduationGroup.appendChild(grad);
            if (withText) {
                const gradText = DOMUtilities.createSvgElement("text", {
                    x: this.lerp(i) - 0.5,
                    y: 40,
                    fill: "white",
                    "font-size": "8",
                    "font-family": "Roboto-Regular",
                    "text-anchor": "middle"
                });
                gradText.textContent = i.toString();
                this.graduationGroup.appendChild(gradText);
                this.showFooter$.next();
            }
        }
    }
    updateValue(value, value2) {
        this.setupObservers();
        this.value1$.next(value);
        this.value2$.next(value2);
    }
    setTitleAndUnit(title, unit) {
        this.titleText.textContent = `${title} ${unit}`;
    }
    computeCautionBackgrounds() {
    }
    computeAlertBackgrounds() {
    }
    setLimitValues(begin, end) {
        super.setLimitValues(begin, end);
        if (this.forcedBeginText == null) {
            this.beginText.textContent = begin;
            this.showFooter$.next();
        }
        if (this.forcedEndText == null) {
            this.endText.textContent = end;
            this.showFooter$.next();
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
        if (!this.cursorLabel) {
            this.cursorLabel = DOMUtilities.createSvgElement("text", { x: this.beginX, y: 18, class: "cursor-label" });
            this.rootSvg.appendChild(this.cursorLabel);
        }
        this.cursorLabel.textContent = label1;
        if (label2) {
            if (!this.cursor2Label) {
                this.cursor2Label = DOMUtilities.createSvgElement("text", { x: this.beginX, y: 31, class: "cursor-label" });
                this.rootSvg.appendChild(this.cursor2Label);
            }
            this.cursor2Label.textContent = label2;
        }
    }
}
customElements.define('glasscockpit-xmlhorizontaldoublegauge', XMLHorizontalDoubleGauge);