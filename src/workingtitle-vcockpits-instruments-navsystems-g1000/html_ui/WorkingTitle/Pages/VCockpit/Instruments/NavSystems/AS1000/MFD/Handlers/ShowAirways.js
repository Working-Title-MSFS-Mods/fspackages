class WT_Show_Airways_Handler {
    /**
     * @param {Input_Stack} inputStack
     * @param {HTMLElement} pageContainer
     * @param {MapInstrument} map 
     */
    constructor(gps, inputStack, pageContainer, map) {
        this.gps = gps;
        this.inputStack = inputStack;
        this.pageContainer = pageContainer;
        this.map = map;
    }
    show(waypoint) {
        return new Promise((resolve, reject) => {
            const model = new WT_Airway_Selector_Model(this.gps, waypoint);
            const view = new WT_Airway_Selector_View(this.map);
            this.pageContainer.appendChild(view);
            view.setModel(model);

            view.onLoad.subscribe(waypoints => {
                resolve(waypoints);
                view.exit();
            });
            view.onCancel.subscribe(() => {
                view.exit();
            });
            view.onExit.subscribe(() => {
                view.deactivate();
                this.pageContainer.removeChild(view);
                reject();
            });

            view.enter(this.inputStack);
            view.activate();
        });
    }
}