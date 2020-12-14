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