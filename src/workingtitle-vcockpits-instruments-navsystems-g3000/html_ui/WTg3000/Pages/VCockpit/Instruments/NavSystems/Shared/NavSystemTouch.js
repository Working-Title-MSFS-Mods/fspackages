class NavSystemTouch extends NavSystem {
    get IsGlassCockpit() { return true; }
    get isInteractive() { return true; }
    connectedCallback() {
        super.connectedCallback();
        this.selectionList = new NavSystemElementContainer("Selection List", "SelectionList", new NavSystemTouch_SelectionList());
        this.selectionList.setGPS(this);
    }
    makeButton(_button, _callback) {
        if (!_button) {
            console.warn("Trying to add an interaction on null element, ignoring");
            return;
        }
        _button.addEventListener("mouseup", this.onButtonPressed.bind(this, _callback));
    }
    onButtonPressed(_callback, _event) {
        if (_event.button == 0 && _event.currentTarget.getAttribute("state") !== "Greyed") {
            _callback();
            this.playInstrumentSound("tone_NavSystemTouch_touch");
        }
    }
    openConfirmationWindow(_message, _button) {
    }
    getFullKeyboard() {
        console.error("getFullKeyboard called but not overrided !");
        return null;
    }
}
class NavSystemTouch_Transponder extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.transponderState = -1;
        this.currentInput = [-1, -1, -1, -1];
        this.inputIndex = -1;
        this.inputChanged = true;
    }

    _defineChildren() {
        this.transponder_CodeDisplay = this.gps.getChildById("transponder_Code");
        this.transponder_Bksp = this.gps.getChildById("transponder_Bksp");
        this.transponder_Vfr = this.gps.getChildById("transponder_Vfr");
        this.transponder_0 = this.gps.getChildById("transponder_0");
        this.transponder_1 = this.gps.getChildById("transponder_1");
        this.transponder_2 = this.gps.getChildById("transponder_2");
        this.transponder_3 = this.gps.getChildById("transponder_3");
        this.transponder_4 = this.gps.getChildById("transponder_4");
        this.transponder_5 = this.gps.getChildById("transponder_5");
        this.transponder_6 = this.gps.getChildById("transponder_6");
        this.transponder_7 = this.gps.getChildById("transponder_7");
        this.transponder_Stby = this.gps.getChildById("transponder_Stby");
        this.transponder_On = this.gps.getChildById("transponder_On");
        this.transponder_Alt = this.gps.getChildById("transponder_Alt");
    }

    _initKeyboardButtons() {
        this.gps.makeButton(this.transponder_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.transponder_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.transponder_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.transponder_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.transponder_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.transponder_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.transponder_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.transponder_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.transponder_Bksp, this.backpacePress.bind(this));
    }

    _initModeButtons() {
        this.gps.makeButton(this.transponder_Stby, this.setTransponderState.bind(this, 1));
        this.gps.makeButton(this.transponder_On, this.setTransponderState.bind(this, 3));
        this.gps.makeButton(this.transponder_Alt, this.setTransponderState.bind(this, 4));
    }

    _initVFRButton() {
        this.gps.makeButton(this.transponder_Vfr, this.setCurrentCode.bind(this, [1, 2, 0, 0]));
    }

    _initButtons() {
        this._initKeyboardButtons();
        this._initModeButtons();
        this._initVFRButton();
    }

    init(root) {
        this.window = root;
        this._defineChildren();
        this._initButtons();

        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == 0) {
            this.setTransponderState(1);
        }
    }

    onEnter() {
        this.window.setAttribute("state", "Active");
        this.currentInput = [-1, -1, -1, -1];
        this.inputIndex = -1;
    }

    _updateModeButtons() {
        let transponderState = SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
        if (this.transponderState != transponderState) {
            this.transponderState = transponderState;
            this.transponder_Stby.setAttribute("state", (transponderState == 1 ? "Active" : ""));
            this.transponder_On.setAttribute("state", (transponderState == 3 ? "Active" : ""));
            this.transponder_Alt.setAttribute("state", (transponderState == 4 ? "Active" : ""));
        }
    }

    _updateKeyboard() {
        let transponderCode;
        if (this.inputIndex == -1) {
            transponderCode = '<span class="Fixed">' + ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4) + '</span>';
            if (this.transponder_CodeDisplay.innerHTML != transponderCode) {
                this.transponder_CodeDisplay.innerHTML = transponderCode;
            }
            this.inputChanged = true;
        }
        else if (this.inputChanged) {
            var regex = new RegExp('^(.{' + this.inputIndex + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
            transponderCode = "";
            for (let i = 0; i < this.currentInput.length; i++) {
                transponderCode += (this.currentInput[i] == -1 ? "_" : this.currentInput[i]);
            }
            transponderCode = (transponderCode + " ").replace(regex, replace);
            this.transponder_CodeDisplay.innerHTML = transponderCode;
            this.inputChanged = false;
        }
    }

    onUpdate(_deltaTime) {
        this._updateModeButtons();
        this._updateKeyboard();
    }

    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.currentInput = [-1, -1, -1, -1];
            this.inputIndex = 0;
        }
        if (this.inputIndex < 4) {
            this.currentInput[this.inputIndex] = _digit;
            this.inputIndex++;
        }
        this.inputChanged = true;
    }
    backpacePress() {
        if (this.inputIndex == -1) {
            this.currentInput = [-1, -1, -1, -1];
            this.inputIndex = 0;
        }
        else if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput[this.inputIndex] = -1;
        }
        this.inputChanged = true;
    }
    setTransponderState(_state) {
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", _state);
    }
    cancelCode() {
        this.gps.closePopUpElement();
    }
    validateCode() {
        if (this.inputIndex != -1) {
            for (let i = 0; i < this.currentInput.length; i++) {
                if (this.currentInput[i] == -1) {
                    return;
                }
            }
            var code = this.currentInput[0] * 4096 + this.currentInput[1] * 256 + this.currentInput[2] * 16 + this.currentInput[3];
            SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
        }
        this.cancelCode();
    }
    setCurrentCode(_code) {
        this.currentInput = _code;
        this.inputIndex = 4;
        this.inputChanged = true;
    }
}
class NavSystemTouch_ScrollElement {
    constructor() {
        this.nbElements = NaN;
        this.lastNbElements = 0;
        this.scrollObjective = 0;
        this.isScrollLocked = false;
        this.frameWithoutMovement = 0;
        this.toBottom = false;
        this.isInit = false;
        this.snapToGrid = false;
    }
    init() {
        this.elementContainer.addEventListener("mouseup", this.mouseUp.bind(this));
        this.elementContainer.addEventListener("mouseleave", this.mouseUp.bind(this));
        this.elementContainer.addEventListener("mousedown", this.mouseDown.bind(this));
        this.elementContainer.addEventListener("mousemove", this.mouseMove.bind(this));
    }
    mouseDown(event) {
        this.mouseMoveLastPosY = event.y;
        this.isMouseDragging = true;
    }
    mouseUp(event) {
        this.isMouseDragging = false;
    }
    mouseMove(event) {
    }
    update() {
        if (!this.isInit) {
            this.init();
            this.isInit = true;
        }
        let speed = 100;
        if (this.elementContainer.scrollHeight - this.elementContainerSize < this.scrollObjective) {
            this.scrollObjective = Math.round(this.elementContainer.scrollHeight - this.elementContainerSize);
        }
        if (!isNaN(this.nbElements) && this.lastNbElements != this.nbElements) {
            this.lastNbElements = this.nbElements;
            this.elementSize = this.elementContainer.scrollHeight / this.nbElements;
        }
        if (this.isScrollLocked) {
            if (this.elementContainer.scrollTop < this.scrollObjective) {
                if (this.scrollObjective - this.elementContainer.scrollTop < speed) {
                    this.elementContainer.scrollTop = this.scrollObjective;
                }
                else {
                    this.elementContainer.scrollTop += speed;
                }
            }
            else if (this.elementContainer.scrollTop > this.scrollObjective) {
                if (this.elementContainer.scrollTop - this.scrollObjective < speed) {
                    this.elementContainer.scrollTop = this.scrollObjective;
                }
                else {
                    this.elementContainer.scrollTop -= speed;
                }
            }
            else {
                this.isScrollLocked = false;
            }
            if (this.scrollObjective == this.elementContainer.scrollTop) {
                this.isScrollLocked = false;
            }
        }
        else {
            if (this.lastScroll == this.elementContainer.scrollTop) {
                this.frameWithoutMovement++;
            }
            else {
                this.frameWithoutMovement = 0;
                this.toBottom = this.lastScroll < this.elementContainer.scrollTop;
                this.lastScroll = this.elementContainer.scrollTop;
            }
            if (this.frameWithoutMovement > 3 && (this.elementContainer.scrollTop % this.elementSize) != 0 && !this.isMouseDragging) {
                if (this.snapToGrid) {
                    if (this.toBottom) {
                        this.scrollObjective = Math.round(Math.min((this.elementContainer.scrollTop + this.elementSize) - (this.elementContainer.scrollTop % this.elementSize), this.elementContainer.scrollHeight - this.elementContainer.getBoundingClientRect().height));
                    }
                    else {
                        this.scrollObjective = Math.round(this.elementContainer.scrollTop - this.elementContainer.scrollTop % this.elementSize);
                    }
                }
                else {
                    this.scrollObjective = this.elementContainer.scrollTop;
                }
                this.isScrollLocked = true;
            }
        }
    }
    scrollUp(_oneStep = false) {
        if (_oneStep) {
            this.scrollObjective = this.elementContainer.scrollTop - this.elementSize;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        }
        else {
            let height = this.elementContainer.getBoundingClientRect().height;
            this.scrollObjective = this.elementContainer.scrollTop - height;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        }
        this.isScrollLocked = true;
    }
    scrollDown(_oneStep = false) {
        if (_oneStep) {
            this.scrollObjective = this.elementContainer.scrollTop + this.elementSize;
            if (this.scrollObjective < 0) {
                this.scrollObjective = 0;
            }
            this.scrollObjective -= this.scrollObjective % this.elementSize;
        }
        else {
            let height = this.elementContainer.getBoundingClientRect().height;
            this.scrollObjective = this.elementContainer.scrollTop + height;
            if (this.scrollObjective > (this.elementContainer.scrollHeight - height)) {
                this.scrollObjective = this.elementContainer.scrollHeight - height;
            }
            else {
                let elementHeight = this.elementSize;
                this.scrollObjective -= (this.scrollObjective) % elementHeight;
            }
        }
        this.isScrollLocked = true;
    }
}
class NavSystemTouch_FrequencyKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.inputIndex = -1;
        this.waitingTitle = "";
        this.inputChanged = true;
        this.nbDigits = 2;
        this.unit = "MHz";
    }
    init(root) {
        this.window = root;
        this.title = this.window.getElementsByClassName("WindowTitle")[0];
        this.title.innerHTML = this.waitingTitle;
        this.findButton = this.gps.getChildById("FK_Find");
        this.activeFrequency = this.gps.getChildById("FK_ActiveFrequency");
        this.frequencyDisplay = this.gps.getChildById("FK_FreqDisplay");
        this.backspaceButton = this.gps.getChildById("FK_Bksp");
        this.xferButton = this.gps.getChildById("FK_Xfer");
        this.button_0 = this.gps.getChildById("FK_0");
        this.button_1 = this.gps.getChildById("FK_1");
        this.button_2 = this.gps.getChildById("FK_2");
        this.button_3 = this.gps.getChildById("FK_3");
        this.button_4 = this.gps.getChildById("FK_4");
        this.button_5 = this.gps.getChildById("FK_5");
        this.button_6 = this.gps.getChildById("FK_6");
        this.button_7 = this.gps.getChildById("FK_7");
        this.button_8 = this.gps.getChildById("FK_8");
        this.button_9 = this.gps.getChildById("FK_9");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
        this.gps.makeButton(this.xferButton, this.validateAndTransferEdit.bind(this));
    }
    setContext(_title, _minFreq, _maxFreq, _activeFreqSimVar, _stbyFreqSimVar, _endCallback, _backPage, _frequencySpacingModeSimVar) {
        if (this.title) {
            this.title.innerHTML = _title;
        }
        else {
            this.waitingTitle = _title;
        }
        this.minFreq = _minFreq;
        this.maxFreq = _maxFreq;
        this.activeFreqSimVar = _activeFreqSimVar;
        this.stbyFreqSimVar = _stbyFreqSimVar;
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.frequencySpacingModeSimVar = _frequencySpacingModeSimVar;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.inputIndex = -1;
    }
    onUpdate(_deltaTime) {
        this.frequencySpacingMode = 0;
        if (this.frequencySpacingModeSimVar && this.frequencySpacingModeSimVar != "") {
            this.frequencySpacingMode = SimVar.GetSimVarValue(this.frequencySpacingModeSimVar, "Enum");
        }
        let nbDigits = this.frequencySpacingMode == 0 ? this.nbDigits : this.nbDigits + 1;
        let freqActive = SimVar.GetSimVarValue(this.activeFreqSimVar, this.unit).toFixed(nbDigits);
        if (this.activeFrequency.innerHTML != freqActive) {
            this.activeFrequency.innerHTML = freqActive;
        }
        let freqStby;
        if (this.inputIndex == -1) {
            let stbyFreq = SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit);
            this.currentInput = stbyFreq;
            freqStby = '<span class="StbyFreq">' + stbyFreq.toFixed(nbDigits) + '</span>';
            if (this.frequencyDisplay.innerHTML != freqStby) {
                this.frequencyDisplay.innerHTML = freqStby;
            }
        }
        else if (this.inputChanged) {
            var regex = new RegExp('^(.{' + (this.inputIndex > (5 - this.nbDigits - 1) ? this.inputIndex + 1 : this.inputIndex) + '})(.)(.*)');
            var replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
            let value = ((this.currentInput / (this.unit == "KHz" ? 1 : 1000000)).toFixed(nbDigits) + " ");
            for (let i = 0; i < Math.floor(Math.log10(this.maxFreq * (this.unit == "KHz" ? 1 : 1000000))) - Math.floor(Math.log10(this.currentInput)); i++) {
                value = "0" + value;
            }
            freqStby = value.replace(regex, replace);
            this.inputChanged = false;
            this.frequencyDisplay.innerHTML = freqStby;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.inputIndex = 0;
            this.currentInput = this.minFreq * 1000000;
        }
        if (this.inputIndex < (5 + this.frequencySpacingMode) && (this.frequencySpacingMode == 1 || !(this.inputIndex == 4 && !(_digit == 2 || _digit == 5 || _digit == 7)))) {
            let newInput = Math.pow(10, 9 - this.inputIndex) * Math.floor((this.currentInput + 1) / Math.pow(10, 9 - this.inputIndex)) + Math.pow(10, 8 - this.inputIndex) * _digit;
            if (newInput <= this.maxFreq * 1000000 && newInput >= this.minFreq * 1000000) {
                this.currentInput = newInput;
                this.inputIndex++;
            }
            else if (newInput < this.minFreq * 1000000 && Math.pow(10, 8 - this.inputIndex) > this.minFreq * 1000000 - newInput) {
                this.currentInput = this.minFreq * 1000000;
                this.inputIndex++;
            }
        }
        this.inputChanged = true;
    }
    onBackSpacePress() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 9 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 9 - this.inputIndex));
            if (this.currentInput < this.minFreq * 1000000) {
                this.currentInput = this.minFreq * 1000000;
            }
        }
        this.inputChanged = true;
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
    }
    validateEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * 1000000 : this.currentInput, false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) * 1000000 : this.currentInput, true);
        this.cancelEdit();
    }
}
class NavSystemTouch_ADFFrequencyKeyboard extends NavSystemTouch_FrequencyKeyboard {
    constructor() {
        super();
        this.nbDigits = 1;
        this.unit = "KHz";
    }
    onDigitPress(_digit) {
        if (this.inputIndex == -1) {
            this.inputIndex = 0;
            this.currentInput = this.minFreq;
        }
        if (this.inputIndex < 5) {
            let newInput = Math.pow(10, 4 - this.inputIndex) * Math.floor((this.currentInput + 0.001) / Math.pow(10, 4 - this.inputIndex)) + Math.pow(10, 3 - this.inputIndex) * _digit;
            if (newInput <= this.maxFreq && newInput >= this.minFreq) {
                this.currentInput = newInput;
                this.inputIndex++;
            }
            else if (newInput < this.minFreq && Math.pow(10, 3 - this.inputIndex) > this.minFreq - newInput) {
                this.currentInput = this.minFreq;
                this.inputIndex++;
            }
        }
        this.inputChanged = true;
    }
    onBackSpacePress() {
        if (this.inputIndex > 0) {
            this.inputIndex--;
            this.currentInput = Math.pow(10, 4 - this.inputIndex) * Math.floor(this.currentInput / Math.pow(10, 4 - this.inputIndex));
            if (this.currentInput < this.minFreq) {
                this.currentInput = this.minFreq;
            }
        }
        this.inputChanged = true;
    }
    validateEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) : this.currentInput, false);
        this.cancelEdit();
    }
    validateAndTransferEdit() {
        this.endCallback(this.inputIndex == -1 ? SimVar.GetSimVarValue(this.stbyFreqSimVar, this.unit) : this.currentInput, true);
        this.cancelEdit();
    }
}
class NavSystemTouch_TimeKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0, 0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("TK_Bksp");
        this.button_0 = this.gps.getChildById("TK_0");
        this.button_1 = this.gps.getChildById("TK_1");
        this.button_2 = this.gps.getChildById("TK_2");
        this.button_3 = this.gps.getChildById("TK_3");
        this.button_4 = this.gps.getChildById("TK_4");
        this.button_5 = this.gps.getChildById("TK_5");
        this.button_6 = this.gps.getChildById("TK_6");
        this.button_7 = this.gps.getChildById("TK_7");
        this.button_8 = this.gps.getChildById("TK_8");
        this.button_9 = this.gps.getChildById("TK_9");
        this.timeDisplay = this.gps.getChildById("TK_TimeDisplay");
        this.gps.makeButton(this.button_0, this.onDigitPress.bind(this, 0));
        this.gps.makeButton(this.button_1, this.onDigitPress.bind(this, 1));
        this.gps.makeButton(this.button_2, this.onDigitPress.bind(this, 2));
        this.gps.makeButton(this.button_3, this.onDigitPress.bind(this, 3));
        this.gps.makeButton(this.button_4, this.onDigitPress.bind(this, 4));
        this.gps.makeButton(this.button_5, this.onDigitPress.bind(this, 5));
        this.gps.makeButton(this.button_6, this.onDigitPress.bind(this, 6));
        this.gps.makeButton(this.button_7, this.onDigitPress.bind(this, 7));
        this.gps.makeButton(this.button_8, this.onDigitPress.bind(this, 8));
        this.gps.makeButton(this.button_9, this.onDigitPress.bind(this, 9));
        this.gps.makeButton(this.backspaceButton, this.onBackSpacePress.bind(this));
    }
    setContext(_endCallback, _backPage, _startingValue) {
        this.endCallback = _endCallback;
        this.backPage = _backPage;
        this.currentInput = _startingValue;
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.isInputing = false;
        this.digits = [0, 0, 0, 0, 0, 0];
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    if (i % 2 == 1) {
                        text += '<span class="Writed">:<span>';
                    }
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.timeDisplay.innerHTML = text;
            }
        }
        else {
            let seconds = fastToFixed(Math.floor(this.currentInput / 1000) % 60, 0);
            let minutes = fastToFixed(Math.floor(this.currentInput / 60000) % 60, 0);
            let hours = fastToFixed(Math.floor(this.currentInput / 3600000) % 24, 0);
            this.timeDisplay.innerHTML = "00".slice(0, 2 - hours.length) + hours + ":" + "00".slice(0, 2 - minutes.length) + minutes + ":" + "00".slice(0, 2 - seconds.length) + seconds;
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onDigitPress(_digit) {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = (10 * this.digits[0] + this.digits[1]) * 3600000 + (10 * this.digits[2] + this.digits[3]) * 60000 + (10 * this.digits[4] + this.digits[5]) * 1000;
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = (10 * this.digits[0] + this.digits[1]) * 3600000 + (10 * this.digits[2] + this.digits[3]) * 60000 + (10 * this.digits[4] + this.digits[5]) * 1000;
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
    }
    validateEdit() {
        let maxDigits = [2, 3, 5, 9, 5, 9];
        let isValid = true;
        for (let i = 0; i < this.digits.length; i++) {
            if (this.digits[i] > maxDigits[i]) {
                isValid = false;
            }
        }
        if (isValid) {
            this.endCallback(this.currentInput);
            this.cancelEdit();
        }
        else {
            this.isInputing = false;
            this.gps.openConfirmationWindow("Invalid Entry <br/> Valid range is 00:00:00 to 23:59:59", "OK");
        }
    }
}

class NavSystemTouch_SelectionListElement {
}
class NavSystemTouch_SelectionList extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.buttons = [];
    }
    init(root) {
        this.root = root;
        this.content = root.getElementsByClassName("content")[0];
        for (let i = 0; i < this.buttons.length; i++) {
            this.content.appendChild(this.buttons[i].button);
        }
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.content;
        this.title = root.getElementsByClassName("WindowTitle")[0];
    }
    onEnter() {
        this.root.setAttribute("state", "Active");
        this.scrollElement.elementSize = this.buttons.length > 0 ? this.buttons[0].button.getBoundingClientRect().height : 0;
    }
    onUpdate(_deltaTime) {
        this.scrollElement.update();
    }
    onExit() {
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setElements(_title, _elements, _callback) {
        this.title.textContent = _title;
        this.callback = _callback;
        for (let i = 0; i < _elements.length; i++) {
            if (i >= this.buttons.length) {
                let elem = new NavSystemTouch_SelectionListElement();
                elem.button = document.createElement("div");
                elem.button.setAttribute("class", "gradientButton");
                elem.value = document.createElement("div");
                elem.value.setAttribute("class", "value");
                elem.button.appendChild(elem.value);
                if (this.content) {
                    this.content.appendChild(elem.button);
                }
                this.gps.makeButton(elem.button, this.onElemClick.bind(this, i));
                this.buttons.push(elem);
            }
            diffAndSetAttribute(this.buttons[i].button, "state", "Active");
            diffAndSetText(this.buttons[i].value, _elements[i]);
        }
        for (let i = _elements.length; i < this.buttons.length; i++) {
            diffAndSetAttribute(this.buttons[i].button, "state", "Inactive");
        }
    }
    onElemClick(_id) {
        this.gps.closePopUpElement();
        this.callback(_id);
    }
}
//# sourceMappingURL=NavSystemTouch.js.map