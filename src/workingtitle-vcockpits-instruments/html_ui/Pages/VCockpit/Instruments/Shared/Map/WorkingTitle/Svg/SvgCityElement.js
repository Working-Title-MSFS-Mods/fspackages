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
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        
        let icon;
        icon = document.createElementNS(Avionics.SVG.NS, "image");
        icon.classList.add("map-city-icon");
        icon.setAttribute("width", "100%");
        icon.setAttribute("height", "100%");
        icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", map.config.imagesDir + this.imageFileName() + "?_= " + new Date().getTime());
        container.appendChild(icon);
        container.setAttribute("width", fastToFixed(map.config.cityIconSize, 0));
        container.setAttribute("height", fastToFixed(map.config.cityIconSize, 0));
        
        this._label = document.createElementNS(Avionics.SVG.NS, "text");
        this._label.classList.add("map-city-text");
        this._label.textContent = this.name;
        this._label.setAttribute("text-anchor", "middle");
        this._label.setAttribute("x", fastToFixed(map.config.cityIconSize * 0.5, 0));
        this._label.setAttribute("y", fastToFixed(map.config.cityIconSize * 0.5 - map.config.cityLabelDistance, 0));
        this._label.setAttribute("fill", map.config.cityLabelColor);
        this._label.setAttribute("stroke", map.config.cityLabelStrokeColor);
        this._label.setAttribute("stroke-width", map.config.cityLabelStrokeWidth);
        this._label.setAttribute("font-size", map.config.cityLabelFontSize, 0);
        this._label.setAttribute("font-family", map.config.cityLabelFontFamily);
        container.appendChild(this._label);
        
        if (map.config.cityLabelUseBackground) {
            setTimeout(() => {
                let bbox = this._label.getBBox();
                let rect = document.createElementNS(Avionics.SVG.NS, "rect");
                rect.classList.add("map-city-text-background");
                rect.setAttribute("width", fastToFixed((bbox.width - 4 + map.config.cityLabelBackgroundPaddingRight + map.config.cityLabelBackgroundPaddingLeft), 0));
                rect.setAttribute("height", fastToFixed(Math.max((bbox.height - 17 + map.config.cityLabelBackgroundPaddingTop + map.config.cityLabelBackgroundPaddingBottom), 1), 0));
                rect.setAttribute("x", fastToFixed((bbox.x + 4 - map.config.cityLabelBackgroundPaddingLeft), 0));
                rect.setAttribute("y", fastToFixed((bbox.y + 10 - map.config.cityLabelBackgroundPaddingTop), 0));
                rect.setAttribute("fill", map.config.cityLabelBackgroundColor);
                rect.setAttribute("stroke", map.config.cityLabelBackgroundStrokeColor);
                rect.setAttribute("stroke-width", fastToFixed(map.config.cityLabelBackgroundStrokeWidth, 0));
                container.insertBefore(rect, this._label);
            }, 0);
        }
        return container;
    }
    
    updateDraw(map) {
        map.latLongToXYToRef(this.lat, this.long, this);
        if (isFinite(this.x) && isFinite(this.y)) {
            if (Math.abs(this.x - this._lastX) > 0.1 || Math.abs(this.y - this._lastY) > 0.1) {
                this.svgElement.setAttribute("x", this.x - map.config.cityIconSize * 0.5);
                this.svgElement.setAttribute("y", this.y - map.config.cityIconSize * 0.5);
                this._lastX = this.x;
                this._lastY = this.y;
            }
        }
    }
}
//# sourceMappingURL=SvgCityElement.js.map