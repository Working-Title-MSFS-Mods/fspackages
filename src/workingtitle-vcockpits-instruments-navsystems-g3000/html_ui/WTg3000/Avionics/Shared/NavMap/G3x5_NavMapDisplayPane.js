class WT_G3x5_NavMapDisplayPane extends WT_G3x5_DisplayPane {
    constructor(navMap) {
        super();

        this._navMap = navMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    getTitle() {
        return "Navigation Map";
    }

    init(root) {
        this.navMap.init(root);
    }

    wake() {
        this.navMap.wake();
    }

    sleep() {
        this.navMap.sleep();
    }

    update() {
        this.navMap.update();
    }
}

class WT_G3x5_NavMapDisplayPaneHTMLElement extends HTMLElement {

}