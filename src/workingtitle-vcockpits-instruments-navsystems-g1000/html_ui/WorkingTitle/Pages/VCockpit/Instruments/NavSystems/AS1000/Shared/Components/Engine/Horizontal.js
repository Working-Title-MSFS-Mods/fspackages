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