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