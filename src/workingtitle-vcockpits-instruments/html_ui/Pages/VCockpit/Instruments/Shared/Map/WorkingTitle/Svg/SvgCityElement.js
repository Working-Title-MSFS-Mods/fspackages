var CitySize;
(function (CitySize) {
    CitySize[CitySize["Large"] = 0] = "Large";
    CitySize[CitySize["Medium"] = 1] = "Medium";
    CitySize[CitySize["Small"] = 2] = "Small";
})(CitySize || (CitySize = {}));
class SvgCityElement extends SvgMapElement {
    constructor(_city) {
        super();
        this.hasTextBox = true;
        this.city = _city;
        this._lastX = 0;
        this._lastY = 0;
        this.showText = true;
    }
    
    id(map) {
        return "city-" + this.name + "-map-" + map.index;
        ;
    }
    
    get name() {
        return this.city.name.replace("'", "");
    }
    
    get size() {
        return this.city.size;
    }
    
    get lat() {
        return this.city.lat;
    }
    
    get long() {
        return this.city.long;
    }
    
    appendToMap(map) {
        map.appendChild(this.svgElement, map.cityLayer);
        
        if (this._label) {
            map.appendChild(this._label, map.textLayer);
        }
    }
    
    imageFileName() {
        let fName = "ICON_MAP_MEDIUM_CITY.svg";
        if (this.size === CitySize.Small) {
            fName = "ICON_MAP_SMALL_CITY.svg";
        }
        else if (this.size === CitySize.Large) {
            fName = "ICON_MAP_LARGE_CITY.svg";
        }
        return fName;
    }
    
    createDraw(map) {
        this.icon = document.createElementNS(Avionics.SVG.NS, "circle");
        this.icon.id = this.id(map);
        this.icon.setAttribute("hasTextBox", "true");
        
        this.icon.setAttribute("r", map.config.cityIconSize[this.size] / 2);
        this.icon.setAttribute("fill", map.config.cityIconFillColor);
        this.icon.setAttribute("fill-opacity", "1");
        this.icon.setAttribute("stroke", map.config.cityIconStrokeColor);
        this.icon.setAttribute("stroke-width", map.config.cityIconStrokeWidth);
        this.icon.setAttribute("stroke-opacity", "1");
        
        this._label = document.createElementNS(Avionics.SVG.NS, "text");
        this._label.id = this.id(map) + "-text-" + map.index;
        this._label.textContent = this.name;
        this._label.setAttribute("text-anchor", "middle");
        this._label.setAttribute("fill", map.config.cityLabelColor);
        this._label.setAttribute("stroke", map.config.cityLabelStrokeColor);
        this._label.setAttribute("stroke-width", map.config.cityLabelStrokeWidth);
        this._label.setAttribute("font-size", map.config.cityLabelFontSize, 0);
        this._label.setAttribute("font-family", map.config.cityLabelFontFamily);
        
        return this.icon;
    }
    
    updateDraw(map) {
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            if (Math.abs(this.x - this._lastX) > 0.1 || Math.abs(this.y - this._lastY) > 0.1) {
                let iconSize = [30, 25, 20];
                
                this.icon.setAttribute("cx", this.x);
                this.icon.setAttribute("cy", this.y);
                
                this._label.setAttribute("x", this.x);
                this._label.setAttribute("y", this.y - map.config.cityIconSize[this.size] * 0.25 - map.config.cityLabelDistance);
                
                this._lastX = this.x;
                this._lastY = this.y;
            }
        }
    }
}
//# sourceMappingURL=SvgCityElement.js.map