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