class WT_Confirm_Dialog_Input_Layer extends Selectables_Input_Layer {
    constructor(confirmDialog, selectables) {
        super(selectables);
        this.confirmDialog = confirmDialog;
    }
    onMenuPush(inputStack) { return true; }
    onProceduresPush(inputStack) { return true; }
    onFlightPlan(inputStack) { return true; }
    onSoftKey(index, inputStack) { return true; }
    onCLR(inputStack) { this.confirmDialog.cancel(); }
    onNavigationPush(inputStack) { this.confirmDialog.cancel(); }
}

class WT_Confirm_Dialog extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new WT_Confirm_Dialog_Input_Layer(this, new Selectables_Input_Layer_Dynamic_Source(this, "selectable-button"));
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        
        let template = document.getElementById('confirm-dialog');
        let templateContent = template.content;
        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();
    }
    show(htmlMessage, inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.elements.message.innerHTML = htmlMessage;
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    confirm() {
        this.hide();
        this.resolve();
    }
    cancel() {
        this.hide();
        this.reject();
    }
    hide() {
        this.inputStackHandle.pop();
    }
}
customElements.define("g1000-confirm-dialog", WT_Confirm_Dialog);
