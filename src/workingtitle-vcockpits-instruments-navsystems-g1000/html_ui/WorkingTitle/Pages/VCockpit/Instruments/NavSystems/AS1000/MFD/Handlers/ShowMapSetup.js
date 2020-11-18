class WT_Show_Map_Setup_Handler {
    /**
     * @param {WT_Map_Setup_Model} model 
     * @param {WT_Map_Setup_View} view 
     * @param {WT_HTML_View} paneContainer 
     * @param {Input_Stack} inputStack 
     */
    constructor(model, view, paneContainer, inputStack) {
        this.model = model;
        this.view = view;
        this.paneContainer = paneContainer;
        this.inputStack = inputStack;
    }
    show() {
        this.paneContainer.appendChild(this.view);
        const subscriptions = new Subscriptions();
        this.view.setModel(this.model);
        subscriptions.add(this.view.onExit.subscribe(() => {
            this.paneContainer.removeChild(this.view);
            this.view.deactivate();
            subscriptions.unsubscribe();
        }));
        this.view.enter(this.inputStack);
        this.view.activate();
    }
}