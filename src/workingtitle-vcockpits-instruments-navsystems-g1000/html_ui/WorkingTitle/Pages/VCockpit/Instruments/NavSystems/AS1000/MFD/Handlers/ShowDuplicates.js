class WT_MFD_Show_Duplicates_Handler extends WT_Show_Duplicates_Handler {
    constructor(dialogContainer, waypointRepository, inputStack) {
        super();
        this.dialogContainer = dialogContainer;
        this.waypointRepository = waypointRepository;
        this.inputStack = inputStack;
    }
    show(duplicates) {
        const model = new WT_Duplicate_Waypoints_Model(this.waypointRepository, duplicates);
        const view = new WT_MFD_Duplicate_Waypoints_View();
        this.dialogContainer.appendChild(view);
        view.setModel(model);
        const close = () => {
            this.dialogContainer.removeChild(view);
            view.exit();
        }
        return {
            promise: view.enter(this.inputStack)
                .catch(e => close())
                .then(icao => {
                    close();
                    return icao;
                }),
            cancel: close,
        }
    }
}