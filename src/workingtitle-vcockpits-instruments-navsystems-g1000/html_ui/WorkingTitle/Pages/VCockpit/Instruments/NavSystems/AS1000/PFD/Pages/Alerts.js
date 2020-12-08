class WT_PFD_Alert extends WT_HTML_View {
    constructor(title, body, action) {
        super();

        this.title$ = new rxjs.BehaviorSubject(title);
        this.body$ = new rxjs.BehaviorSubject(body);
        this.action = action;

        this.subscriptions = new Subscriptions();
    }
    connectedCallback() {
        if (!this.initialised) {
            this.innerHTML = `<label data-element="title" class="selectable" data-click="doAction"></label> - <span data-element="body"></span>`;
            super.connectedCallback();
            this.initialised = true;
        }

        this.subscriptions.add(
            this.title$.subscribe(title => this.elements.title.textContent = title),
            this.body$.subscribe(body => this.elements.body.textContent = body),
        )
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    doAction() {
        if (this.action) {
            this.action();
        }
    }
}
customElements.define("g1000-pfd-alert", WT_PFD_Alert);

class WT_PFD_Alerts_Model {
    constructor() {
        this.alerts = [];
        this.alerts$ = new rxjs.BehaviorSubject([]);

        this.addAlert(new WT_PFD_Alert("Thanks", `Thanks for using WorkingTitle's G1000 mod`));

        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        if (day == 25 && month == 12) {
            this.addAlert(new WT_PFD_Alert("Merry Christmas", `From the WorkingTitle team!`));
        }
        if (day == 1 && month == 1) {
            this.addAlert(new WT_PFD_Alert("Happy New Year", `From the WorkingTitle team!`));
        }
    }
    /**
     * @param {WT_PFD_Alert} alert 
     */
    addAlert(alert) {
        this.alerts.unshift(alert);
        this.alerts$.next(this.alerts);
    }
    /**
     * @param {WT_PFD_Alert} alert 
     */
    removeAlert(alert) {
        const index = this.alerts.findIndex(alert);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
        this.alerts$.next(this.alerts);
    }
}

class WT_PFD_Alerts_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
    }
    connectedCallback() {
        super.connectedCallback();
    }
    /**
     * @param {WT_PFD_Alerts_Model} model 
     */
    setModel(model) {
        model.alerts$.subscribe(alerts => {
            DOMUtilities.repopulateElement(this.elements.alerts, alerts);
            this.inputLayer.refreshSelected();
        });
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("g1000-pfd-alerts", WT_PFD_Alerts_View);