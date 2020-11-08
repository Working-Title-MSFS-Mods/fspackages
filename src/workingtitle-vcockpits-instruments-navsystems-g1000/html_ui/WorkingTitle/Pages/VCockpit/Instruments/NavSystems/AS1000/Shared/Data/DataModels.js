class WT_Plane_Config {
    constructor() {
        this.config = new Subject(null);
        this.nodeWatchers = [];
        this.nodesWatchers = [];
    }
    watchNode(node) {
        const watcher = new Subject(this.getNodeValue(node));
        if (!(node in this.nodeWatchers)) {
            this.nodeWatchers[node] = watcher;
        }
        return watcher;
    }
    watchNodes(node) {
        const watcher = new Subject(this.getNodes(node));
        if (!(node in this.nodesWatchers)) {
            this.nodesWatchers[node] = watcher;
        }
        return watcher;
    }
    getNodes(node) {
        if (this.config.value == null)
            return [];
        return this.config.value.getElementsByTagName(node);
    }
    getNodeValue(node) {
        if (this.config.value == null)
            return null;
        const elements = this.config.value.getElementsByTagName(node);
        return elements.length > 0 ? elements[0] : null;
    }
    updateConfig(config) {
        this.config.value = config;
        for (let nodeName in this.nodeWatchers) {
            this.nodeWatchers[nodeName].value = this.getNodeValue(nodeName);
        }
        for (let nodeName in this.nodesWatchers) {
            this.nodesWatchers[nodeName].value = this.getNodes(nodeName);
        }
    }
}

class WT_Radio_Altimeter {
    /**
     * @param {WT_Plane_Config} config 
     */
    constructor(config) {
        this.isAvailable = true;
        config.watchNode("RadarAltitude").subscribe(node => this.isAvailable = node && node.textContent == "True");
    }
    isHeightAcceptable() {
        const radarAltitude = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        return radarAltitude > 0 && radarAltitude < 2500;
    }
    getAltitude() {
        const radarAltitude = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
        const xyz = Simplane.getOrientationAxis();
        const bankAcceptable = Math.abs(xyz.bank) < Math.PI * 0.35;
        const altitudeAcceptable = radarAltitude > 0 && radarAltitude < 2500;
        return (bankAcceptable && altitudeAcceptable) ? radarAltitude : 1000;
    }
}