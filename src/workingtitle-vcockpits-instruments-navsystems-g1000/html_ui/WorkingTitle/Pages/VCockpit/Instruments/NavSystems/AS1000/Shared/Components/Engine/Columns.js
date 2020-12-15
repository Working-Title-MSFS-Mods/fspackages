class XMLColumnGauge extends HTMLElement {
    constructor() {
        super(...arguments);

        this.minValueCallback = null;
        this.maxValueCallback = null;
        this.peak = 0;
        this.numberOfBars = 16;
        this.columnsContainer = null;
        this.height = 60;
        this.sizePercent = 100;
        this.redLineElement = null;

        this.context$ = new rxjs.Subject();
        this.redLineValue$ = new rxjs.BehaviorSubject(null);
        this.selectedColumn$ = new rxjs.BehaviorSubject(null);

        this.subscriptions = new Subscriptions();
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setLimits(minValueCallback, maxValueCallback) {
        this.min$ = this.context$.pipe(
            WT_RX.distinctMap(context => minValueCallback.getValueAsNumber(context)),
            WT_RX.shareReplay()
        );
        this.max$ = this.context$.pipe(
            WT_RX.distinctMap(context => maxValueCallback.getValueAsNumber(context)),
            WT_RX.shareReplay()
        );
    }
    setTitle(title) {
        this.titleElements = title;
        this.leftText.textContent = this.titleElements;
    }
    setRedLine(value) {
        this.redLineValue$.next(value);
    }
    addColumns(columns) {
        // Columns
        const numColumns = columns.length;
        const horizontalMargin = 8;
        const topMargin = 4;
        const horizontalSpacing = 4;
        const verticalSpacing = 0.8;
        const columnWidth = (100 - horizontalMargin * 2) / numColumns - (horizontalSpacing * (numColumns - 1)) / numColumns;
        const columnHeight = this.height - 10 - topMargin;
        const barHeight = columnHeight / this.numberOfBars - (verticalSpacing * (this.numberOfBars - 1)) / this.numberOfBars;

        const mapRatio = (value, min, max) => (value - min) / (max - min);

        columns.forEach((valueCallback, c) => {
            const g = this.rootSvg.appendChild(DOMUtilities.createSvgElement("g", { class: "bar" }));

            // Visual bars
            const bars = [];
            for (let i = this.numberOfBars - 1; i >= 0; i--) {
                const bar = g.appendChild(DOMUtilities.createSvgElement("rect", {
                    visibility: "hidden",
                    width: columnWidth,
                    height: barHeight,
                    x: horizontalMargin + c * (columnWidth + horizontalSpacing),
                    y: topMargin + i * (barHeight + verticalSpacing),
                }));
                bars.push(bar);
            }

            // Text
            const barText = g.appendChild(DOMUtilities.createSvgElement("text", {
                x: horizontalMargin + c * (columnWidth + horizontalSpacing) + columnWidth / 2,
                y: this.height,
                class: "bar-text"
            }));
            barText.textContent = c + 1;

            // Value
            const value$ = this.context$.pipe(
                rxjs.operators.map(context => valueCallback.getValueAsNumber(context)),
                WT_RX.shareReplay()
            );
            const selected$ = this.selectedColumn$.pipe(
                rxjs.operators.map(selectedColumn => selectedColumn == c)
            );
            this.subscriptions.add(
                rxjs.combineLatest(value$, this.min$, this.max$, mapRatio).pipe(
                    rxjs.operators.map(v => Math.floor(v * this.numberOfBars)),
                    rxjs.operators.map(v => Math.min(this.numberOfBars - 1, Math.max(0, v))),
                    rxjs.operators.distinctUntilChanged(),
                    rxjs.operators.startWith(0),
                    rxjs.operators.pairwise(),
                ).subscribe(([previousBarsVisible, barsVisible]) => {
                    const start = Math.min(previousBarsVisible, barsVisible);
                    const end = Math.max(previousBarsVisible, barsVisible);
                    for (let b = start; b < end; b++) {
                        bars[b].setAttribute("visibility", barsVisible > b ? "visible" : "hidden");
                    }
                }),

                selected$.pipe(
                    rxjs.operators.switchMap(selected => selected ? value$ : rxjs.empty()),
                    WT_RX.distinctMap(v => Math.round(v))
                ).subscribe(v => this.rightText.textContent = v),

                selected$.subscribe(selected => DOMUtilities.ToggleAttribute(g, "selected", selected))
            );
        });

        // Red line
        this.redLineElement = this.rootSvg.appendChild(DOMUtilities.createSvgElement("rect", {
            class: "red-line",
            visibility: "hidden",
            width: 100 - horizontalMargin * 2,
            height: "2",
            x: horizontalMargin,
            y: topMargin,
        }));

        const redLineVisible$ = this.redLineValue$.pipe(rxjs.operators.map(value => value !== null));
        const redLinePosition$ = rxjs.combineLatest(this.redLineValue$, this.min$, this.max$, mapRatio).pipe(
            rxjs.operators.map(ratio => topMargin + (1 - ratio) * columnHeight)
        );
        this.subscriptions.add(
            redLineVisible$.subscribe(visible => this.redLineElement.setAttribute("visibility", visible ? "visible" : "hidden")),
            redLineVisible$.pipe(
                rxjs.operators.switchMap(visible => visible ? redLinePosition$ : rxjs.empty()),
                rxjs.operators.distinctUntilChanged()
            ).subscribe(y => this.redLineElement.setAttribute("y", y))
        );

        this.selectColumn(0);
    }
    selectColumn(index) {
        this.peak = 0;
        this.selectedColumn$.next(index);
    }
    update(context) {
        this.context$.next(context);
    }
    connectedCallback() {
        this.rootSvg = this.appendChild(DOMUtilities.createSvgElement("svg", {
            width: `${this.sizePercent}%`,
            viewBox: `0 0 100 ${this.height}`,
        }));

        const createText = (x, className) => this.appendChild(DOMUtilities.createElement("div", {
            y: this.height - 15 + 12.5,
            x: x,
            class: className
        }));

        this.leftText = createText(10, "left-text");
        this.rightText = createText(90, "right-text");
    }
}
customElements.define('glasscockpit-xmlcolumngauge', XMLColumnGauge);