class XMLTextZone extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;

        this.context$ = new rxjs.Subject();

        this.leftText$ = new rxjs.BehaviorSubject("");
        this.leftCallback$ = new rxjs.BehaviorSubject(null);
        this.leftColorCallback$ = new rxjs.BehaviorSubject(null);

        this.centerText$ = new rxjs.BehaviorSubject("");
        this.centerCallback$ = new rxjs.BehaviorSubject(null);
        this.centerColorCallback$ = new rxjs.BehaviorSubject(null);

        this.rightText$ = new rxjs.BehaviorSubject("");
        this.rightCallback$ = new rxjs.BehaviorSubject(null);
        this.rightColorCallback$ = new rxjs.BehaviorSubject(null);

        this.subscriptions = new Subscriptions();
    }
    connectedCallback() {
        this.leftText = this.appendChild(DOMUtilities.createElement("div", { class: "left-text" }));
        this.centerText = this.appendChild(DOMUtilities.createElement("div", { class: "center-text" }));
        this.rightText = this.appendChild(DOMUtilities.createElement("div", { class: "right-text" }));

        const handleText = (callback$, manual$, element) => callback$.pipe(
            rxjs.operators.switchMap(callback => {
                if (callback) {
                    return this.context$.pipe(
                        rxjs.operators.map(context => callback.getValueAsString(context))
                    );
                } else {
                    return manual$;
                }
            }),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(text => element.textContent = text)

        this.subscriptions.add(
            handleText(this.leftCallback$, this.leftText$, this.leftText),
            handleText(this.centerCallback$, this.centerText$, this.centerText),
            handleText(this.rightCallback$, this.rightText$, this.rightText),
        );

        const handleColor = (callback$, element) => callback$.pipe(
            rxjs.operators.switchMap(callback => {
                if (callback) {
                    return this.context$.pipe(
                        rxjs.operators.map(context => callback.getValueAsString(context))
                    );
                } else {
                    return rxjs.empty();
                }
            }),
            rxjs.operators.distinctUntilChanged()
        ).subscribe(color => element.setAttribute("color", color));

        this.subscriptions.add(
            handleColor(this.leftCallback$, this.leftText),
            handleColor(this.centerCallback$, this.centerText),
            handleColor(this.rightCallback$, this.rightText),
        );
    }
    disconnectedCallback() {
        this.subscriptions.unsubscribe();
    }
    setLeftText(text) {
        this.leftText$.next(text);
    }
    setCenterText(text) {
        this.centerText$.next(text);
    }
    setRightText(text) {
        this.rightText$.next(text);
    }
    setLeftCallback(callback) {
        this.leftCallback$.next(callback);
    }
    setCenterCallback(callback) {
        this.centerCallback$.next(callback);
    }
    setRightCallback(callback) {
        this.rightCallback$.next(callback);
    }
    setLeftFontSize(size) {
        this.leftText.setAttribute("font-size", size);
    }
    setCenterFontSize(size) {
        this.centerText.setAttribute("font-size", size);
    }
    setRightFontSize(size) {
        this.rightText.setAttribute("font-size", size);
    }
    setLeftClass(value) {
        this.leftText.classList.add(value);
    }
    setCenterClass(value) {
        this.centerText.classList.add(value);
    }
    setRightClass(value) {
        this.rightText.classList.add(value);
    }
    update(context) {
        this.context$.next(context);
    }
}
customElements.define('glasscockpit-xmltextzone', XMLTextZone);