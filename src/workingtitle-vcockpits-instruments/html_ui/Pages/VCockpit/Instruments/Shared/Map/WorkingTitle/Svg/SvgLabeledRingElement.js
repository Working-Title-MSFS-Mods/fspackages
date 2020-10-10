class SvgLabeledRingElement extends SvgMapElement {
    constructor() {
        super();
        
        this.radius = 250;                      // in SVG coordinate units
        this.centerPos = new Vec2(500, 500);    // in SVG coordinates for a 1000x1000 map
        this.labelPosAngle = 0;                 // angle along which the label is displaced from the center of the ring, in degrees. 0 = to the right, increasing clockwise
        this.labelPosOffset = 0;                // by default, label is placed along the ring, this defines the radial offset distance from the default, in SVG coordinate units
        this.showLabel = true;
    }
    
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        
        container.setAttribute("x", 0);
        container.setAttribute("y", 0);
        container.setAttribute("width", 1000);
        container.setAttribute("height", 1000);
        container.setAttribute("overflow", "hidden");
        
        this.rangeRing = this.createRing(map);
        container.appendChild(this.rangeRing);
        
        this.labelSvg = this.createLabel(map);
        container.appendChild(this.labelSvg);
        
        return container;
    }
    
    updateDraw(map) {
        this.updateRing(map);
        if (this.showLabel) {
            this.updateLabel(map);
            this.labelSvg.setAttribute("display", "inherit");
        } else {
            this.labelSvg.setAttribute("display", "none");
        }
    }
    
    createRing(map) {
        let rangeRing = document.createElementNS(Avionics.SVG.NS, "circle");
        rangeRing.setAttribute("fill-opacity", "0");
        return rangeRing;
    }
    
    createLabel(map) {
        return document.createElementNS(Avionics.SVG.NS, "svg");
    }
    
    updateRing(map) {
        this.rangeRing.setAttribute("cx", this.centerPos.x);
        this.rangeRing.setAttribute("cy", this.centerPos.y);
        this.rangeRing.setAttribute("r", this.radius);
    }
    
    updateLabel(map) {
        let angle = this.labelPosAngle * Math.PI / 180;
        let x = this.centerPos.x + this.radius * Math.cos(angle);
        let y = this.centerPos.y + this.radius * Math.sin(angle);
        
        this.labelSvg.setAttribute("x", x - this.labelSvg.width.baseVal.value / 2);
        this.labelSvg.setAttribute("y", y - this.labelSvg.height.baseVal.value / 2);
    }
}