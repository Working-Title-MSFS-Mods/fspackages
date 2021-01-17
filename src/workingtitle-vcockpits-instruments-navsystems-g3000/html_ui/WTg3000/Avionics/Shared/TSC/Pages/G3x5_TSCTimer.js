class WT_G3x5_TSCTimer extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, timerID) {
        super(homePageGroup, homePageName);

        this._timer = new WT_Timer(timerID);
    }

    /**
     * @readonly
     * @property {WT_Timer} timer
     * @type {WT_Timer}
     */
    get timer() {
        return this._timer;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPFDSettingsHTMLElement} htmlElement
     * @type {WT_G3x5_TSCPFDSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    init(root) {
        this._htmlElement = new WT_G3x5_TSCTimerHTMLElement();
        this.htmlElement.setParentPage(this);
        root.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCTimerHTMLElement extends HTMLElement {
    constructor() {
        super();

        this._formatter = new WT_TimeFormatter({round: 0});

        this._tempTime = new WT_NumberUnit(0, WT_Unit.SECOND);
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCTimer} parentPage
     * @type {WT_G3x5_TSCTimer}
     */
    get parentPage() {
        return this._parentPage;
    }

    setParentPage(page) {
        this._parentPage = page;
    }

    _initDisplay() {
        this._display = new WT_TSCValueButton();
        this._display.classList.add(WT_G3x5_TSCTimerHTMLElement.DISPLAY_CLASS);
        this._display.labelText = "Time";
        this._display.addButtonListener(this._onDisplayPressed.bind(this));
        this.appendChild(this._display);
    }

    _initStartStop() {
        this._startStop = new WT_TSCLabeledButton();
        this._startStop.classList.add(WT_G3x5_TSCTimerHTMLElement.STARTSTOP_CLASS);
        this._startStop.addButtonListener(this._onStartStopPressed.bind(this));
        this.appendChild(this._startStop);
    }

    _initReset() {
        this._reset = new WT_TSCLabeledButton();
        this._reset.classList.add(WT_G3x5_TSCTimerHTMLElement.RESET_CLASS);
        this._reset.labelText = "Reset";
        this._reset.addButtonListener(this._onResetPressed.bind(this));
        this.appendChild(this._reset);
    }

    _initCountBox() {
        this._countBox = new WT_G3x5_TSCGradientDiv();
        this._countBox.classList.add(WT_G3x5_TSCTimerHTMLElement.COUNT_CLASS);
        this._countBoxInner = document.createElement("div");
        this._countBoxInner.style.display = "flex";
        this._countBoxInner.style.flexFlow = "column nowrap";
        this._countBoxInner.style.alignItems = "center";
        this._countBoxInner.slot = "content";
        this._countBox.appendChild(this._countBoxInner);

        this._countTitle = document.createElement("div");
        this._countTitle.classList.add(WT_G3x5_TSCTimerHTMLElement.COUNT_TITLE_CLASS);
        this._countTitle.style.textAlign = "center";
        this._countTitle.innerHTML = "Count";
        this._countTitle.slot = "content";
        this._countBoxInner.appendChild(this._countTitle);

        this._countUp = new WT_TSCStatusBarButton();
        this._countUp.classList.add(WT_G3x5_TSCTimerHTMLElement.COUNT_UP_CLASS);
        this._countUp.labelText = "Up";
        this._countUp.slot = "content";
        this._countUp.addButtonListener(this._onCountUpPressed.bind(this));
        this._countBoxInner.appendChild(this._countUp);

        this._countDown = new WT_TSCStatusBarButton();
        this._countDown.classList.add(WT_G3x5_TSCTimerHTMLElement.COUNT_DOWN_CLASS);
        this._countDown.labelText = "Down";
        this._countDown.slot = "content";
        this._countDown.addButtonListener(this._onCountDownPressed.bind(this));
        this._countBoxInner.appendChild(this._countDown);

        this.appendChild(this._countBox);
    }

    _initChildren() {
        this._initDisplay();
        this._initStartStop();
        this._initReset();
        this._initCountBox();
    }

    connectedCallback() {
        this._initChildren();
    }

    _onKeyboardClosed(value) {
        this.parentPage.timer.setInitialValue(this._tempTime.set(value / 1000));
        this.parentPage.timer.syncToInitialValue();
    }

    _onDisplayPressed(button) {
        this.parentPage.timer.stop();
        let keyboard = this.parentPage.instrument.timeKeyboard;
        keyboard.element.setContext(this._onKeyboardClosed.bind(this), this.parentPage.timer.value.number * 1000, this.parentPage.homePageGroup, this.parentPage.homePageName);
        this.parentPage.instrument.switchToPopUpPage(keyboard);
    }

    _onStartStopPressed(button) {
        if (this.parentPage.timer.isPaused()) {
            this.parentPage.timer.start();
        } else {
            this.parentPage.timer.stop();
        }
    }

    _onResetPressed(button) {
        this.parentPage.timer.reset();
    }

    _onCountUpPressed(button) {
        this.parentPage.timer.setMode(WT_Timer.Mode.COUNT_UP);
    }

    _onCountDownPressed(button) {
        this.parentPage.timer.setMode(WT_Timer.Mode.COUNT_DOWN);
    }

    _updateDisplay() {
        this._display.valueText = this._formatter.getFormattedString(this.parentPage.timer.value);
    }

    _updateStartStop() {
        this._startStop.labelText = this.parentPage.timer.isPaused() ? "Start" : "Stop";
    }

    _updateCountBox() {
        let mode = this.parentPage.timer.getMode();

        this._countUp.toggle = (mode === WT_Timer.Mode.COUNT_UP) ? "on" : "off";
        this._countDown.toggle = (mode === WT_Timer.Mode.COUNT_DOWN) ? "on" : "off";
    }

    update() {
        this._updateDisplay();
        this._updateStartStop();
        this._updateCountBox();
    }
}
WT_G3x5_TSCTimerHTMLElement.DISPLAY_CLASS = "timerDisplayButton";
WT_G3x5_TSCTimerHTMLElement.STARTSTOP_CLASS = "timerStartStopButton";
WT_G3x5_TSCTimerHTMLElement.RESET_CLASS = "timerResetButton";
WT_G3x5_TSCTimerHTMLElement.COUNT_CLASS = "timerCountBox";
WT_G3x5_TSCTimerHTMLElement.COUNT_TITLE_CLASS = "timerCountTitle";
WT_G3x5_TSCTimerHTMLElement.COUNT_UP_CLASS = "timerCountUpButton";
WT_G3x5_TSCTimerHTMLElement.COUNT_DOWN_CLASS = "timerCountDownButton";

customElements.define("tsc-timer", WT_G3x5_TSCTimerHTMLElement);