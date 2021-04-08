class WT_Weather_Page_Model {
    constructor() {
        this.radarMode = new Subject(EWeatherRadar.HORIZONTAL);
    }
    setRadarMode(mode) {
        this.radarMode.value = mode;
    }
}

class WT_Weather_Page_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Weather_Page_Model} model 
     */
    constructor(model) {
        super(true);
        this.buttons = {
            horizontal: new WT_Soft_Key("HORIZON", () => model.setRadarMode(EWeatherRadar.HORIZONTAL)),
            vertical: new WT_Soft_Key("VERTICAL", () => model.setRadarMode(EWeatherRadar.VERTICAL)),
        }
        this.addSoftKey(5, this.buttons.horizontal);
        this.addSoftKey(6, this.buttons.vertical);

        model.radarMode.subscribe(mode => {
            this.buttons.horizontal.selected = mode == EWeatherRadar.HORIZONTAL;
            this.buttons.vertical.selected = mode == EWeatherRadar.VERTICAL;
        })
    }
}

class WT_Weather_Page_View extends WT_HTML_View {
    /**
     * @param {MapInstrument} map 
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(map, softKeyMenuHandler) {
        super();
        this.map = map;
        this.softKeyMenuHandler = softKeyMenuHandler;
    }
    /**
     * @param {WT_Weather_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.radarMode.subscribe(mode => this.setMapWeather(mode))
        this.softKeyMainMenu = new WT_Weather_Page_Main_Menu(model);
    }
    connectedCallback() {
        const template = document.getElementById('template-weather-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    }
    setMapWeather(mode) {
        this.map.showWeather(mode);

        const svgRoot = this.map.weatherSVG;
        if (svgRoot) {
            Utils.RemoveAllChildren(svgRoot);
            this.weatherTexts = null;
            if (mode == EWeatherRadar.HORIZONTAL || mode == EWeatherRadar.VERTICAL) {
                var circleRadius = 575;
                var dashNbRect = 10;
                var dashWidth = 8;
                var dashHeight = 6;
                if (mode == EWeatherRadar.HORIZONTAL) {
                    this.map.setBingMapStyle("10.3%", "-13.3%", "127%", "157%");
                    var coneAngle = 90;
                    svgRoot.setAttribute("viewBox", "0 0 400 400");
                    var trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    trsGroup.setAttribute("transform", "translate(-125, 29) scale(1.63)");
                    svgRoot.appendChild(trsGroup);
                    let viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
                    viewBox.setAttribute("viewBox", "-600 -600 1200 1200");
                    trsGroup.appendChild(viewBox);
                    var circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    circleGroup.setAttribute("id", "Circles");
                    viewBox.appendChild(circleGroup);
                    {
                        let rads = [0.25, 0.50, 0.75, 1.0];
                        for (let r = 0; r < rads.length; r++) {
                            let rad = circleRadius * rads[r];
                            let startDegrees = -coneAngle * 0.5;
                            let endDegrees = coneAngle * 0.5;
                            while (Math.floor(startDegrees) <= endDegrees) {
                                let line = document.createElementNS(Avionics.SVG.NS, "rect");
                                let degree = (180 + startDegrees + 0.5);
                                line.setAttribute("x", "0");
                                line.setAttribute("y", rad.toString());
                                line.setAttribute("width", dashWidth.toString());
                                line.setAttribute("height", dashHeight.toString());
                                line.setAttribute("transform", "rotate(" + degree + " 0 0)");
                                line.setAttribute("fill", "white");
                                circleGroup.appendChild(line);
                                startDegrees += coneAngle / dashNbRect;
                            }
                        }
                    }
                    var lineGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    lineGroup.setAttribute("id", "Lines");
                    viewBox.appendChild(lineGroup);
                    {
                        var coneStart = 180 - coneAngle * 0.5;
                        var coneStartLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneStartLine.setAttribute("x1", "0");
                        coneStartLine.setAttribute("y1", "0");
                        coneStartLine.setAttribute("x2", "0");
                        coneStartLine.setAttribute("y2", circleRadius.toString());
                        coneStartLine.setAttribute("transform", "rotate(" + coneStart + " 0 0)");
                        coneStartLine.setAttribute("stroke", "white");
                        coneStartLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneStartLine);
                        var coneEnd = 180 + coneAngle * 0.5;
                        var coneEndLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneEndLine.setAttribute("x1", "0");
                        coneEndLine.setAttribute("y1", "0");
                        coneEndLine.setAttribute("x2", "0");
                        coneEndLine.setAttribute("y2", circleRadius.toString());
                        coneEndLine.setAttribute("transform", "rotate(" + coneEnd + " 0 0)");
                        coneEndLine.setAttribute("stroke", "white");
                        coneEndLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneEndLine);
                    }
                    var textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("id", "Texts");
                    viewBox.appendChild(textGroup);
                    {
                        this.weatherTexts = [];
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "100");
                        text.setAttribute("y", "-85");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "200");
                        text.setAttribute("y", "-185");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "300");
                        text.setAttribute("y", "-285");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "400");
                        text.setAttribute("y", "-385");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                    }
                }
                else if (mode == EWeatherRadar.VERTICAL) {
                    this.map.setBingMapStyle("-75%", "-88%", "201%", "250%");
                    var coneAngle = 51.43;
                    svgRoot.setAttribute("viewBox", "0 0 400 400");
                    var trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    trsGroup.setAttribute("transform", "translate(402, -190) scale(1.95) rotate(90)");
                    svgRoot.appendChild(trsGroup);
                    let viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
                    viewBox.setAttribute("viewBox", "-600 -600 1200 1200");
                    trsGroup.appendChild(viewBox);
                    var circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    circleGroup.setAttribute("id", "Circles");
                    viewBox.appendChild(circleGroup);
                    {
                        let rads = [0.25, 0.50, 0.75, 1.0];
                        for (let r = 0; r < rads.length; r++) {
                            let rad = circleRadius * rads[r];
                            let startDegrees = -coneAngle * 0.5;
                            let endDegrees = coneAngle * 0.5;
                            while (Math.floor(startDegrees) <= endDegrees) {
                                let line = document.createElementNS(Avionics.SVG.NS, "rect");
                                let degree = (180 + startDegrees + 0.5);
                                line.setAttribute("x", "0");
                                line.setAttribute("y", rad.toString());
                                line.setAttribute("width", dashWidth.toString());
                                line.setAttribute("height", dashHeight.toString());
                                line.setAttribute("transform", "rotate(" + degree + " 0 0)");
                                line.setAttribute("fill", "white");
                                circleGroup.appendChild(line);
                                startDegrees += coneAngle / dashNbRect;
                            }
                        }
                    }
                    var limitGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    limitGroup.setAttribute("id", "Limits");
                    viewBox.appendChild(limitGroup);
                    {
                        let endPosY = circleRadius + 50;
                        let posX = -130;
                        let posY = 50;
                        while (posY <= endPosY) {
                            let line = document.createElementNS(Avionics.SVG.NS, "rect");
                            line.setAttribute("x", posX.toString());
                            line.setAttribute("y", (-posY).toString());
                            line.setAttribute("width", dashHeight.toString());
                            line.setAttribute("height", dashWidth.toString());
                            line.setAttribute("fill", "white");
                            limitGroup.appendChild(line);
                            posY += dashWidth * 2;
                        }
                        posX = 130;
                        posY = 50;
                        while (posY <= endPosY) {
                            let line = document.createElementNS(Avionics.SVG.NS, "rect");
                            line.setAttribute("x", posX.toString());
                            line.setAttribute("y", (-posY).toString());
                            line.setAttribute("width", dashHeight.toString());
                            line.setAttribute("height", dashWidth.toString());
                            line.setAttribute("fill", "white");
                            limitGroup.appendChild(line);
                            posY += dashWidth * 2;
                        }
                    }
                    var lineGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    lineGroup.setAttribute("id", "Lines");
                    viewBox.appendChild(lineGroup);
                    {
                        var coneStart = 180 - coneAngle * 0.5;
                        var coneStartLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneStartLine.setAttribute("x1", "0");
                        coneStartLine.setAttribute("y1", "0");
                        coneStartLine.setAttribute("x2", "0");
                        coneStartLine.setAttribute("y2", circleRadius.toString());
                        coneStartLine.setAttribute("transform", "rotate(" + coneStart + " 0 0)");
                        coneStartLine.setAttribute("stroke", "white");
                        coneStartLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneStartLine);
                        var coneEnd = 180 + coneAngle * 0.5;
                        var coneEndLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneEndLine.setAttribute("x1", "0");
                        coneEndLine.setAttribute("y1", "0");
                        coneEndLine.setAttribute("x2", "0");
                        coneEndLine.setAttribute("y2", circleRadius.toString());
                        coneEndLine.setAttribute("transform", "rotate(" + coneEnd + " 0 0)");
                        coneEndLine.setAttribute("stroke", "white");
                        coneEndLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneEndLine);
                    }
                    var textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("id", "Texts");
                    viewBox.appendChild(textGroup);
                    {
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "+60000FT";
                        text.setAttribute("x", "50");
                        text.setAttribute("y", "-150");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "-60000FT";
                        text.setAttribute("x", "50");
                        text.setAttribute("y", "160");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "20");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts = [];
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "85");
                        text.setAttribute("y", "85");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "18");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "215");
                        text.setAttribute("y", "160");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "18");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "345");
                        text.setAttribute("y", "220");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "18");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "475");
                        text.setAttribute("y", "280");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "18");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                    }
                }
                var legendGroup = document.createElementNS(Avionics.SVG.NS, "g");
                legendGroup.setAttribute("id", "legendGroup");
                svgRoot.appendChild(legendGroup);
                {
                    var x = -5;
                    var y = 325;
                    var w = 70;
                    var h = 125;
                    var titleHeight = 20;
                    var scaleOffsetX = 5;
                    var scaleOffsetY = 5;
                    var scaleWidth = 13;
                    var scaleHeight = 24;
                    var left = x - w * 0.5;
                    var top = y - h * 0.5;
                    var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", left.toString());
                    rect.setAttribute("y", top.toString());
                    rect.setAttribute("width", w.toString());
                    rect.setAttribute("height", h.toString());
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                    rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", left.toString());
                    rect.setAttribute("y", top.toString());
                    rect.setAttribute("width", w.toString());
                    rect.setAttribute("height", titleHeight.toString());
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                    var text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = "SCALE";
                    text.setAttribute("x", x.toString());
                    text.setAttribute("y", (top + titleHeight * 0.5).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "11");
                    text.setAttribute("text-anchor", "middle");
                    legendGroup.appendChild(text);
                    var scaleIndex = 0;
                    rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (left + scaleOffsetX).toString());
                    rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                    rect.setAttribute("width", scaleWidth.toString());
                    rect.setAttribute("height", scaleHeight.toString());
                    rect.setAttribute("fill", "red");
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                    text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = "HEAVY";
                    text.setAttribute("x", (left + scaleOffsetX + scaleWidth + 5).toString());
                    text.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight + scaleHeight * 0.5).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "11");
                    legendGroup.appendChild(text);
                    scaleIndex++;
                    rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (left + scaleOffsetX).toString());
                    rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                    rect.setAttribute("width", scaleWidth.toString());
                    rect.setAttribute("height", scaleHeight.toString());
                    rect.setAttribute("fill", "yellow");
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                    scaleIndex++;
                    rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (left + scaleOffsetX).toString());
                    rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                    rect.setAttribute("width", scaleWidth.toString());
                    rect.setAttribute("height", scaleHeight.toString());
                    rect.setAttribute("fill", "green");
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                    text = document.createElementNS(Avionics.SVG.NS, "text");
                    text.textContent = "LIGHT";
                    text.setAttribute("x", (left + scaleOffsetX + scaleWidth + 5).toString());
                    text.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight + scaleHeight * 0.5).toString());
                    text.setAttribute("fill", "white");
                    text.setAttribute("font-size", "11");
                    legendGroup.appendChild(text);
                    scaleIndex++;
                    rect = document.createElementNS(Avionics.SVG.NS, "rect");
                    rect.setAttribute("x", (left + scaleOffsetX).toString());
                    rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                    rect.setAttribute("width", scaleWidth.toString());
                    rect.setAttribute("height", scaleHeight.toString());
                    rect.setAttribute("fill", "black");
                    rect.setAttribute("stroke", "white");
                    rect.setAttribute("stroke-width", "2");
                    rect.setAttribute("stroke-opacity", "1");
                    legendGroup.appendChild(rect);
                }
            }
        }
    }
    activate() {
        this.appendChild(this.map);
        this.setMapWeather(this.model.radarMode.value);
        this.menuHandler = this.softKeyMenuHandler.show(this.softKeyMainMenu)
    }
    deactivate() {
        this.map.showWeather(EWeatherRadar.OFF);
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
    }
}
customElements.define("g1000-weather-page", WT_Weather_Page_View);