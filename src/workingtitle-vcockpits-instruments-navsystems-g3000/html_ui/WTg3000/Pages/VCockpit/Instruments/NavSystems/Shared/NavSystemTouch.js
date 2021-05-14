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
class NavSystemTouch_AltitudeKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.digits = [0, 0, 0, 0, 0];
        this.isInputing = false;
        this.nbInput = 0;
        this.inputChanged = true;
    }
    init(root) {
        this.window = root;
        this.backspaceButton = this.gps.getChildById("AK_Bksp");
        this.button_0 = this.gps.getChildById("AK_0");
        this.button_1 = this.gps.getChildById("AK_1");
        this.button_2 = this.gps.getChildById("AK_2");
        this.button_3 = this.gps.getChildById("AK_3");
        this.button_4 = this.gps.getChildById("AK_4");
        this.button_5 = this.gps.getChildById("AK_5");
        this.button_6 = this.gps.getChildById("AK_6");
        this.button_7 = this.gps.getChildById("AK_7");
        this.button_8 = this.gps.getChildById("AK_8");
        this.button_9 = this.gps.getChildById("AK_9");
        this.display = this.gps.getChildById("AK_Display");
        this.cancelButton = this.gps.getChildById("AK_Cancel");
        this.enterButton = this.gps.getChildById("AK_Enter");
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
        this.gps.makeButton(this.cancelButton, this.cancelEdit.bind(this));
        this.gps.makeButton(this.enterButton, this.validateEdit.bind(this));
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
        this.digits = [0, 0, 0, 0, 0];
    }
    onUpdate(_deltaTime) {
        if (this.isInputing) {
            if (this.inputChanged) {
                let text = "";
                for (let i = 0; i < this.digits.length - 1; i++) {
                    text += '<span class="' + (i < this.digits.length - this.nbInput ? "ToWrite" : "Writed") + '">';
                    text += this.digits[i];
                    text += '</span>';
                }
                text += '<span class="Writing">' + this.digits[this.digits.length - 1] + '</span>';
                this.inputChanged = false;
                this.display.innerHTML = text;
            }
        }
        else {
            this.display.innerHTML = this.currentInput + "FT";
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
            this.digits = [0, 0, 0, 0, 0];
        }
        if (this.digits[0] == 0) {
            for (let i = 0; i < this.digits.length - 1; i++) {
                this.digits[i] = this.digits[i + 1];
            }
        }
        this.digits[this.digits.length - 1] = _digit;
        this.currentInput = 10000 * this.digits[0] + 1000 * this.digits[1] + 100 * this.digits[2] + 10 * this.digits[3] + this.digits[4];
        this.inputChanged = true;
        if (this.nbInput < this.digits.length) {
            this.nbInput++;
        }
    }
    onBackSpacePress() {
        if (!this.isInputing) {
            this.isInputing = true;
            this.nbInput = 0;
            this.digits = [0, 0, 0, 0, 0];
        }
        for (let i = this.digits.length - 1; i > 0; i--) {
            this.digits[i] = this.digits[i - 1];
        }
        this.digits[0] = 0;
        this.currentInput = 10000 * this.digits[0] + 1000 * this.digits[1] + 100 * this.digits[2] + 10 * this.digits[3] + this.digits[4];
        this.inputChanged = true;
        if (this.nbInput > 0) {
            this.nbInput--;
        }
    }
    backHome() {
        this.gps.closePopUpElement();
    }
    cancelEdit() {
        this.gps.closePopUpElement();
    }
    validateEdit() {
        this.endCallback(this.currentInput);
        this.cancelEdit();
    }
}
class NavSystemTouch_FullKeyboard extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.maxChars = 6;
        this.currentValue = ["_", "_", "_", "_", "_", "_"];
        this.displayedValue = "______";
        this.currentIndex = -1;
        this.needUpdate = true;
        this.keyboardDisplayed = 1;
    }
    init(root) {
        this.window = root;
        this.EditText = this.gps.getChildById("EditText");
        this.Keyboard_LetterTable = this.gps.getChildById("Keyboard_LetterTable");
        this.Keyboard_NumberTable = this.gps.getChildById("Keyboard_NumberTable");
        this.InfosContent = this.gps.getChildById("InfosContent");
        this.InfosSymbol = this.gps.getChildById("InfosSymbol");
        this.K_Bksp = this.gps.getChildById("K_Bksp");
        this.KN_Bksp = this.gps.getChildById("KN_Bksp");
        this.K_SwitchToNum = this.gps.getChildById("K_SwitchToNum");
        this.KN_SwitchToLetters = this.gps.getChildById("KN_SwitchToLetters");
        this.K_A = this.gps.getChildById("K_A");
        this.K_B = this.gps.getChildById("K_B");
        this.K_C = this.gps.getChildById("K_C");
        this.K_D = this.gps.getChildById("K_D");
        this.K_E = this.gps.getChildById("K_E");
        this.K_F = this.gps.getChildById("K_F");
        this.K_G = this.gps.getChildById("K_G");
        this.K_H = this.gps.getChildById("K_H");
        this.K_I = this.gps.getChildById("K_I");
        this.K_J = this.gps.getChildById("K_J");
        this.K_K = this.gps.getChildById("K_K");
        this.K_L = this.gps.getChildById("K_L");
        this.K_M = this.gps.getChildById("K_M");
        this.K_N = this.gps.getChildById("K_N");
        this.K_O = this.gps.getChildById("K_O");
        this.K_P = this.gps.getChildById("K_P");
        this.K_Q = this.gps.getChildById("K_Q");
        this.K_R = this.gps.getChildById("K_R");
        this.K_S = this.gps.getChildById("K_S");
        this.K_T = this.gps.getChildById("K_T");
        this.K_U = this.gps.getChildById("K_U");
        this.K_V = this.gps.getChildById("K_V");
        this.K_W = this.gps.getChildById("K_W");
        this.K_X = this.gps.getChildById("K_X");
        this.K_Y = this.gps.getChildById("K_Y");
        this.K_Z = this.gps.getChildById("K_Z");
        this.KN_0 = this.gps.getChildById("KN_0");
        this.KN_1 = this.gps.getChildById("KN_1");
        this.KN_2 = this.gps.getChildById("KN_2");
        this.KN_3 = this.gps.getChildById("KN_3");
        this.KN_4 = this.gps.getChildById("KN_4");
        this.KN_5 = this.gps.getChildById("KN_5");
        this.KN_6 = this.gps.getChildById("KN_6");
        this.KN_7 = this.gps.getChildById("KN_7");
        this.KN_8 = this.gps.getChildById("KN_8");
        this.KN_9 = this.gps.getChildById("KN_9");
        this.KN_N = this.gps.getChildById("KN_N");
        this.KN_S = this.gps.getChildById("KN_S");
        this.KN_E = this.gps.getChildById("KN_E");
        this.KN_W = this.gps.getChildById("KN_W");
        this.gps.makeButton(this.K_Bksp, this.backSpace.bind(this));
        this.gps.makeButton(this.KN_Bksp, this.backSpace.bind(this));
        this.gps.makeButton(this.K_SwitchToNum, this.switchToKeyboard.bind(this, "Numbers"));
        this.gps.makeButton(this.KN_SwitchToLetters, this.switchToKeyboard.bind(this, "Letters"));
        this.gps.makeButton(this.K_A, this.characterPressed.bind(this, "A"));
        this.gps.makeButton(this.K_B, this.characterPressed.bind(this, "B"));
        this.gps.makeButton(this.K_C, this.characterPressed.bind(this, "C"));
        this.gps.makeButton(this.K_D, this.characterPressed.bind(this, "D"));
        this.gps.makeButton(this.K_E, this.characterPressed.bind(this, "E"));
        this.gps.makeButton(this.K_F, this.characterPressed.bind(this, "F"));
        this.gps.makeButton(this.K_G, this.characterPressed.bind(this, "G"));
        this.gps.makeButton(this.K_H, this.characterPressed.bind(this, "H"));
        this.gps.makeButton(this.K_I, this.characterPressed.bind(this, "I"));
        this.gps.makeButton(this.K_J, this.characterPressed.bind(this, "J"));
        this.gps.makeButton(this.K_K, this.characterPressed.bind(this, "K"));
        this.gps.makeButton(this.K_L, this.characterPressed.bind(this, "L"));
        this.gps.makeButton(this.K_M, this.characterPressed.bind(this, "M"));
        this.gps.makeButton(this.K_N, this.characterPressed.bind(this, "N"));
        this.gps.makeButton(this.K_O, this.characterPressed.bind(this, "O"));
        this.gps.makeButton(this.K_P, this.characterPressed.bind(this, "P"));
        this.gps.makeButton(this.K_Q, this.characterPressed.bind(this, "Q"));
        this.gps.makeButton(this.K_R, this.characterPressed.bind(this, "R"));
        this.gps.makeButton(this.K_S, this.characterPressed.bind(this, "S"));
        this.gps.makeButton(this.K_T, this.characterPressed.bind(this, "T"));
        this.gps.makeButton(this.K_U, this.characterPressed.bind(this, "U"));
        this.gps.makeButton(this.K_V, this.characterPressed.bind(this, "V"));
        this.gps.makeButton(this.K_W, this.characterPressed.bind(this, "W"));
        this.gps.makeButton(this.K_X, this.characterPressed.bind(this, "X"));
        this.gps.makeButton(this.K_Y, this.characterPressed.bind(this, "Y"));
        this.gps.makeButton(this.K_Z, this.characterPressed.bind(this, "Z"));
        this.gps.makeButton(this.KN_0, this.characterPressed.bind(this, "0"));
        this.gps.makeButton(this.KN_1, this.characterPressed.bind(this, "1"));
        this.gps.makeButton(this.KN_2, this.characterPressed.bind(this, "2"));
        this.gps.makeButton(this.KN_3, this.characterPressed.bind(this, "3"));
        this.gps.makeButton(this.KN_4, this.characterPressed.bind(this, "4"));
        this.gps.makeButton(this.KN_5, this.characterPressed.bind(this, "5"));
        this.gps.makeButton(this.KN_6, this.characterPressed.bind(this, "6"));
        this.gps.makeButton(this.KN_7, this.characterPressed.bind(this, "7"));
        this.gps.makeButton(this.KN_8, this.characterPressed.bind(this, "8"));
        this.gps.makeButton(this.KN_9, this.characterPressed.bind(this, "9"));
        this.gps.makeButton(this.KN_N, this.characterPressed.bind(this, "N"));
        this.gps.makeButton(this.KN_S, this.characterPressed.bind(this, "S"));
        this.gps.makeButton(this.KN_E, this.characterPressed.bind(this, "E"));
        this.gps.makeButton(this.KN_W, this.characterPressed.bind(this, "W"));
        this.currentWaypoint = new WayPoint(this.gps);
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.currentValue = ["_", "_", "_", "_", "_", "_"];
        this.displayedValue = "______";
        this.currentIndex = -1;
        this.needUpdate = true;
    }
    onUpdate(_deltaTime) {
        let updateDisplay = false;
        if (this.needUpdate) {
            let string = "";
            let icao = "";
            for (let i = 0; i < this.currentValue.length; i++) {
                string += this.currentValue[i];
                if (this.currentValue[i] != "_") {
                    icao += this.currentValue[i];
                }
            }
            string += " ";
            this.displayedValue = string;
            this.needUpdate = false;
            updateDisplay = true;
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", icao, this.gps.instrumentIdentifier);
        }
        else if (this.currentIndex != -1) {
            let ident = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.gps.instrumentIdentifier);
            let icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.gps.instrumentIdentifier);
            let type = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcaoType", "string", this.gps.instrumentIdentifier);
            let nbMatched = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.gps.instrumentIdentifier);
            if (nbMatched > 1) {
                this.InfosContent.innerHTML = "Duplicates found";
            }
            else if (nbMatched == 0) {
                this.InfosContent.innerHTML = "No matches found";
            }
            else {
                if (this.lastIcao != icao) {
                    this.gps.facilityLoader.getFacilityCB(icao, (waypoint) => {
                        this.currentWaypoint = waypoint;
                        if (waypoint) {
                            let infos = this.currentWaypoint.infos;
                            this.InfosContent.innerHTML = infos.name;
                            let newValue = ident + "______".slice(ident.length);
                            if (this.displayedValue != newValue && ident.charAt(0) == this.currentValue[0]) {
                                this.displayedValue = newValue;
                                updateDisplay = true;
                            }
                        }
                    });
                    this.lastIcao = icao;
                }
            }
        }
        else {
            this.InfosContent.innerHTML = "Waypoint Identifier Lookup";
        }
        if (updateDisplay) {
            if (this.currentIndex == -1) {
                this.EditText.innerHTML = '<span class="NoEdit">' + this.displayedValue + '</span>';
            }
            else {
                var regex = new RegExp('^(.{' + this.currentIndex + '})(.)(.*)');
                var replace = '<span class="Writed">$1</span><span class="Writing">$2</span><span class = "ToWrite">$3</span>';
                this.EditText.innerHTML = this.displayedValue.replace(regex, replace);
            }
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    setContext(_endCallback, _types = "AVNW") {
        this.endCallback = _endCallback;
        this.searchTypes = _types;
    }
    characterPressed(_character) {
        if (this.currentIndex < this.currentValue.length) {
            if (this.currentIndex == -1) {
                this.currentIndex = 0;
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", this.searchTypes, this.gps.instrumentIdentifier);
            }
            this.currentValue[this.currentIndex] = _character;
            this.currentIndex++;
            for (let i = this.currentIndex; i < this.currentValue.length; i++) {
                this.currentValue[i] = "_";
            }
            this.needUpdate = true;
            return true;
        }
        return false;
    }
    backSpace() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            for (let i = this.currentIndex; i < this.currentValue.length; i++) {
                this.currentValue[i] = "_";
            }
            this.needUpdate = true;
            return true;
        }
        return false;
    }
    switchToKeyboard(_keyboard) {
        this.window.setAttribute("keyboard", _keyboard);
        return true;
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
class NavSystemTouch_DupWPLine {
    constructor(_gps) {
        this.geoCalc = new GeoCalcInfo(_gps);
        this.base = window.document.createElement("tr");
        {
            let td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.identButton_Ident = window.document.createElement("div");
                    this.identButton_Ident.setAttribute("class", "Ident");
                    this.identButton.appendChild(this.identButton_Ident);
                    this.identButton_Logo = window.document.createElement("img");
                    this.identButton_Logo.setAttribute("class", "Logo");
                    this.identButton.appendChild(this.identButton_Logo);
                    this.identButton_Name = window.document.createElement("div");
                    this.identButton_Name.setAttribute("class", "Name");
                    this.identButton.appendChild(this.identButton_Name);
                    this.identButton_City = window.document.createElement("div");
                    this.identButton_City.setAttribute("class", "City");
                    this.identButton.appendChild(this.identButton_City);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            let td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("class", "BearingArrow");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                this.bearingText.setAttribute("class", "BearingText");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            let td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                this.distance.setAttribute("class", "Distance");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
        }
    }
    onEndGeoCalcCompute() {
        Avionics.Utils.diffAndSetAttribute(this.bearingArrow, "style", "transform: rotate(" + fastToFixed(this.geoCalc.bearing, 3) + "deg)");
        Avionics.Utils.diffAndSet(this.bearingText, fastToFixed(this.geoCalc.bearing, 0) + "°");
        Avionics.Utils.diffAndSet(this.distance, fastToFixed(this.geoCalc.distance, 0) + "NM");
    }
}
class NavSystemTouch_DuplicateWaypointSelection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.wayPoints = [];
    }
    setContext(_endCallback) {
        this.endCallback = _endCallback;
    }
    init(root) {
        this.window = root;
        this.lines = [];
        this.table = this.gps.getChildById("WPDup_WayPointsTable");
        this.tableBody = this.gps.getChildById("WPDup_WaypointsBody");
        this.searchTitle = this.gps.getChildById("WPDup_SearchTitle");
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.tableBody;
        this.scrollElement.elementSize = this.lines.length > 0 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.batch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcaoType", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIdent", "string", "string");
    }
    onEnter() {
        this.window.setAttribute("state", "Active");
        this.searchTitle.textContent = 'Search Results for "' + SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.gps.instrumentIdentifier) + '"';
        SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
            this.wayPoints = [];
            for (var i = 0; i < _Values.length; i++) {
                let waypoint = new WayPoint(this.gps);
                waypoint.type = _Values[i][0];
                waypoint.SetIdent(_Values[i][2]);
                waypoint.SetICAO(_Values[i][1]);
                this.wayPoints.push(waypoint);
            }
            this.endLoad();
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.gps.instrumentIdentifier);
        }.bind(this), this.gps.instrumentIdentifier);
    }
    endLoad() {
        for (let i = 0; i < this.wayPoints.length; i++) {
            if (i >= this.lines.length) {
                let newLine = new NavSystemTouch_DupWPLine(this.gps);
                this.tableBody.appendChild(newLine.base);
                this.lines.push(newLine);
                this.gps.makeButton(newLine.identButton, this.onButtonClick.bind(this, i));
            }
        }
        for (let i = this.wayPoints.length; i < this.lines.length; i++) {
            this.lines[i].base.setAttribute("state", "Inactive");
        }
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 0 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        for (let i = 0; i < this.wayPoints.length; i++) {
            let infos = this.wayPoints[i].GetInfos();
            Avionics.Utils.diffAndSet(this.lines[i].identButton_Ident, infos.ident);
            Avionics.Utils.diffAndSet(this.lines[i].identButton_Name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].identButton_City, infos.city + "," + infos.region);
            let logo = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].identButton_Logo, "src", logo == "" ? "" : "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            if (infos.coordinates && infos.coordinates.lat) {
                this.lines[i].geoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
                this.lines[i].geoCalc.Compute(this.lines[i].onEndGeoCalcCompute.bind(this.lines[i]));
            }
        }
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
    }
    onButtonClick(_index) {
        this.endCallback(this.wayPoints[_index].icao);
    }
}
class NavSystemTouch_NRST_Airport_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            let td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            let td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            let td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            let td4 = window.document.createElement("td");
            {
                this.appr = window.document.createElement("div");
                td4.appendChild(this.appr);
                this.runway = window.document.createElement("div");
                td4.appendChild(this.runway);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_Airport extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.airportLines = [];
        this.selectedElement = -1;
        this.showOnMap = false;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstAirport_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstAirport_InsertInFpl");
        this.airportInfos_button = this.gps.getChildById("NrstAirport_AirportInfo");
        this.airportChart_button = this.gps.getChildById("NrstAirport_AirportChart");
        this.showOnMap_button = this.gps.getChildById("NrstAirport_ShowOnMap");
        this.nearestAirports = new NearestAirportList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
        this.gps.makeButton(this.airportInfos_button, this.airportInfo.bind(this));
        this.gps.makeButton(this.showOnMap_button, this.showOnMapToggle.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.airportLines.length > 2 ? this.airportLines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearestAirports.Update(25, 200);
        for (let i = 0; i < this.nearestAirports.airports.length; i++) {
            if (this.airportLines.length < i + 1) {
                let newLine = new NavSystemTouch_NRST_Airport_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.airportLines.push(newLine);
            }
            let infos = this.nearestAirports.airports[i];
            Avionics.Utils.diffAndSet(this.airportLines[i].ident, infos.ident);
            Avionics.Utils.diffAndSet(this.airportLines[i].name, infos.name);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.airportLines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.airportLines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.airportLines[i].runway, fastToFixed(infos.longestRunwayLength, 0) + "FT");
            Avionics.Utils.diffAndSet(this.airportLines[i].appr, infos.bestApproach);
        }
        for (let i = this.nearestAirports.airports.length; i < this.airportLines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.airportLines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
        SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.airportLines[_index].identButton.setAttribute("state", "None");
        }
        else {
            if (this.selectedElement != -1) {
                this.airportLines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.airportLines[_index].identButton.setAttribute("state", "SelectedWP");
        }
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[_index].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[_index].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearestAirports.airports[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearestAirports.airports[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearestAirports.airports[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
    airportInfo() {
        this.gps.SwitchToPageName("MFD", "Airport Info");
    }
    showOnMapToggle() {
        this.showOnMap = !this.showOnMap;
        this.showOnMap_button.setAttribute("state", this.showOnMap ? "Active" : "");
        if (this.showOnMap) {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.lat);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", this.nearestAirports.airports[this.selectedElement].coordinates.long);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 1);
        }
        else {
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLatitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_OverrideLongitude", "number", 0);
            SimVar.SetSimVarValue("L:AS3000_MFD_IsPositionOverride", "number", 0);
        }
    }
}
class NavSystemTouch_NRST_Intersection_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            let td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            let td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            let td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
        }
    }
}
class NavSystemTouch_NRST_Intersection extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstIntersection_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstIntersection_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstIntersection_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstAirport_ShowOnMap");
        this.nearest = new NearestIntersectionList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.intersections.length; i++) {
            if (this.lines.length < i + 1) {
                let newLine = new NavSystemTouch_NRST_Intersection_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.lines.push(newLine);
            }
            let infos = this.nearest.intersections[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
        }
        for (let i = this.nearest.intersections.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        }
        else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.intersections[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.intersections[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.intersections[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_NRST_VOR_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            let td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            let td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            let td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            let td4 = window.document.createElement("td");
            {
                this.frequencyButton = window.document.createElement("div");
                this.frequencyButton.setAttribute("class", "gradientButton");
                {
                    this.frequency = window.document.createElement("div");
                    this.frequency.setAttribute("class", "mainNumber");
                    this.frequencyButton.appendChild(this.frequency);
                }
                td4.appendChild(this.frequencyButton);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_VOR extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstVOR_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstVOR_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstVOR_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstVOR_ShowOnMap");
        this.nearest = new NearestVORList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.vors.length; i++) {
            if (this.lines.length < i + 1) {
                let newLine = new NavSystemTouch_NRST_VOR_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.gps.makeButton(newLine.frequencyButton, this.clickOnFrequency.bind(this, i));
                this.lines.push(newLine);
            }
            let infos = this.nearest.vors[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.lines[i].name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].frequency, infos.frequencyMHz.toFixed(2));
        }
        for (let i = this.nearest.vors.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        }
        else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    clickOnFrequency(_index) {
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.vors[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.vors[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.vors[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_NRST_NDB_Line {
    constructor() {
        this.base = window.document.createElement("tr");
        {
            let td1 = window.document.createElement("td");
            {
                this.identButton = window.document.createElement("div");
                this.identButton.setAttribute("class", "gradientButton");
                {
                    this.ident = window.document.createElement("div");
                    this.ident.setAttribute("class", "mainValue");
                    this.identButton.appendChild(this.ident);
                    this.name = window.document.createElement("div");
                    this.name.setAttribute("class", "title");
                    this.identButton.appendChild(this.name);
                    this.symbol = window.document.createElement("img");
                    this.symbol.setAttribute("class", "symbol");
                    this.identButton.appendChild(this.symbol);
                }
                td1.appendChild(this.identButton);
            }
            this.base.appendChild(td1);
            let td2 = window.document.createElement("td");
            {
                this.bearingArrow = window.document.createElement("img");
                this.bearingArrow.setAttribute("src", "/Pages/VCockpit/Instruments/NavSystems/Shared/Images/Misc/BlueArrow.svg");
                td2.appendChild(this.bearingArrow);
                this.bearingText = window.document.createElement("div");
                td2.appendChild(this.bearingText);
            }
            this.base.appendChild(td2);
            let td3 = window.document.createElement("td");
            {
                this.distance = window.document.createElement("div");
                td3.appendChild(this.distance);
            }
            this.base.appendChild(td3);
            let td4 = window.document.createElement("td");
            {
                this.frequency = window.document.createElement("div");
                this.frequency.setAttribute("class", "Frequency");
                td4.appendChild(this.frequency);
            }
            this.base.appendChild(td4);
        }
    }
}
class NavSystemTouch_NRST_NDB extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.lines = [];
        this.selectedElement = -1;
    }
    init(root) {
        this.table = root.getElementsByClassName("NearestList")[0];
        this.body = this.table.getElementsByTagName("tbody")[0];
        this.menu = root.getElementsByClassName("SelectionMenu")[0];
        this.drct_button = this.gps.getChildById("NrstNDB_Drct");
        this.insertFpl_button = this.gps.getChildById("NrstNDB_InsertInFpl");
        this.infos_button = this.gps.getChildById("NrstNDB_InterInfo");
        this.showOnMap_button = this.gps.getChildById("NrstNDB_ShowOnMap");
        this.nearest = new NearestNDBList(this.gps);
        this.scrollElement = new NavSystemTouch_ScrollElement();
        this.scrollElement.elementContainer = this.body;
        this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        this.gps.makeButton(this.drct_button, this.directTo.bind(this));
        this.gps.makeButton(this.insertFpl_button, this.insertInFpl.bind(this));
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.scrollElement.elementSize == 0) {
            this.scrollElement.elementSize = this.lines.length > 2 ? this.lines[1].base.getBoundingClientRect().height : 0;
        }
        this.scrollElement.update();
        this.nearest.Update(25, 200);
        for (let i = 0; i < this.nearest.ndbs.length; i++) {
            if (this.lines.length < i + 1) {
                let newLine = new NavSystemTouch_NRST_NDB_Line();
                this.body.appendChild(newLine.base);
                this.gps.makeButton(newLine.identButton, this.clickOnElement.bind(this, i));
                this.lines.push(newLine);
            }
            let infos = this.nearest.ndbs[i];
            Avionics.Utils.diffAndSet(this.lines[i].ident, infos.ident);
            let symbol = infos.imageFileName();
            Avionics.Utils.diffAndSetAttribute(this.lines[i].symbol, "src", symbol != "" ? "/Pages/VCockpit/Instruments/Shared/Map/Images/" + symbol : "");
            Avionics.Utils.diffAndSetAttribute(this.lines[i].bearingArrow, "style", "transform: rotate(" + fastToFixed(infos.bearing - SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 3) + "deg)");
            Avionics.Utils.diffAndSet(this.lines[i].bearingText, fastToFixed(infos.bearing, 0) + "°");
            Avionics.Utils.diffAndSet(this.lines[i].distance, fastToFixed(infos.distance, 1) + "NM");
            Avionics.Utils.diffAndSet(this.lines[i].name, infos.name);
            Avionics.Utils.diffAndSet(this.lines[i].frequency, infos.frequencyMHz.toFixed(1));
        }
        for (let i = this.nearest.ndbs.length; i < this.lines.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.lines[i].base, "state", "Inactive");
        }
    }
    onExit() {
        if (this.selectedElement != -1) {
            this.gps.lastRelevantICAOType = "A";
            this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
            this.menu.setAttribute("state", "Inactive");
            this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            this.selectedElement = -1;
        }
    }
    onEvent(_event) {
    }
    clickOnElement(_index) {
        if (this.selectedElement == _index) {
            this.selectedElement = -1;
            this.menu.setAttribute("state", "Inactive");
            this.lines[_index].identButton.setAttribute("state", "None");
        }
        else {
            if (this.selectedElement != -1) {
                this.lines[this.selectedElement].identButton.setAttribute("state", "None");
            }
            this.selectedElement = _index;
            Avionics.Utils.diffAndSetAttribute(this.menu, "state", "Active");
            this.lines[_index].identButton.setAttribute("state", "SelectedWP");
        }
    }
    directTo() {
        this.gps.lastRelevantICAO = this.nearest.ndbs[this.selectedElement].icao;
        this.gps.lastRelevantICAOType = this.nearest.ndbs[this.selectedElement].type;
        this.gps.SwitchToPageName("MFD", "Direct To");
    }
    insertInFpl() {
        this.gps.insertBeforeWaypoint.getElementOfType(AS3000_TSC_InsertBeforeWaypoint).setContext(this.insertInFplIndexSelectionCallback.bind(this));
        this.gps.switchToPopUpPage(this.gps.insertBeforeWaypoint);
    }
    insertInFplIndexSelectionCallback(_index) {
        this.gps.currFlightPlanManager.addWaypoint(this.nearest.ndbs[this.selectedElement].icao, _index, () => {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this.gps.SwitchToPageName("MFD", "Active Flight Plan");
        });
    }
}
class NavSystemTouch_DirectTo extends NavSystemElement {
    init(root) {
        this.SelectedWaypoint = this.gps.getChildById("SelectedWaypoint");
        this.SelectedWaypoint_Symbol = this.SelectedWaypoint.getElementsByClassName("waypointSymbol")[0];
        this.SelectedWaypoint_MainText = this.SelectedWaypoint.getElementsByClassName("mainText")[0];
        this.SelectedWaypoint_MainValue = this.SelectedWaypoint.getElementsByClassName("mainValue")[0];
        this.SelectedWaypoint_SubText = this.SelectedWaypoint.getElementsByClassName("title")[0];
        this.DRCT_City = this.gps.getChildById("DRCT_City");
        this.DRCT_Region = this.gps.getChildById("DRCT_Region");
        this.DRCT_Bearing = this.gps.getChildById("DRCT_Bearing");
        this.DRCT_Distance = this.gps.getChildById("DRCT_Distance");
        this.DRCT_CancelButton = this.gps.getChildById("DRCT_CancelButton");
        this.DRCT_CancelButton_MainValue = this.DRCT_CancelButton.getElementsByClassName("mainValue")[0];
        this.DRCT_ActivateDirect = this.gps.getChildById("DRCT_ActivateDirect");
        this.DRCT_ActivateDirect_MainValue = this.DRCT_ActivateDirect.getElementsByClassName("mainValue")[0];
        this.gps.makeButton(this.SelectedWaypoint, this.openKeyboard.bind(this));
        this.gps.makeButton(this.DRCT_CancelButton, this.cancelDirectTo.bind(this));
        this.gps.makeButton(this.DRCT_ActivateDirect, this.activateDirectTo.bind(this));
        this.GeoCalc = new GeoCalcInfo(this.gps);
    }
    onEnter() {
        if (this.gps.lastRelevantICAO) {
            this.endKeyboard(this.gps.lastRelevantICAO);
            this.gps.lastRelevantICAO = null;
        }
    }
    onUpdate(_deltaTime) {
        let isDirectTo = this.gps.currFlightPlanManager.getIsDirectTo();
        if (isDirectTo) {
            let nextIdent = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            this.DRCT_CancelButton_MainValue.innerHTML = nextIdent;
        }
        else {
            this.DRCT_CancelButton_MainValue.innerHTML = "_____";
        }
        if (!this.CurrentWaypoint) {
            this.SelectedWaypoint_MainText.setAttribute("style", "visibility: visible");
            this.DRCT_City.innerHTML = "";
            this.DRCT_Region.innerHTML = "";
            this.DRCT_Bearing.innerHTML = "___°";
            this.DRCT_Distance.innerHTML = "__._NM";
        }
    }
    onLoadEnd() {
        let infos = this.CurrentWaypoint.GetInfos();
        this.SelectedWaypoint_MainText.setAttribute("style", "visibility: hidden");
        this.SelectedWaypoint_MainValue.innerHTML = infos.ident;
        this.DRCT_ActivateDirect_MainValue.innerHTML = infos.ident;
        this.SelectedWaypoint_SubText.innerHTML = infos.name;
        this.DRCT_City.innerHTML = infos.city;
        this.DRCT_Region.innerHTML = infos.region;
        this.GeoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
        this.GeoCalc.Compute(this.onCalcEnd.bind(this));
    }
    onCalcEnd() {
        this.DRCT_Bearing.innerHTML = fastToFixed(this.GeoCalc.bearing, 0) + "°";
        this.DRCT_Distance.innerHTML = fastToFixed(this.GeoCalc.distance, 1) + "NM";
        let infos = this.CurrentWaypoint.GetInfos();
        this.GeoCalc.SetParams(SimVar.GetSimVarValue("PLANE LATITUDE", "degree", this.gps.instrumentIdentifier), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree", this.gps.instrumentIdentifier), infos.coordinates.lat, infos.coordinates.long, true);
        this.GeoCalc.Compute(this.onCalcEnd.bind(this));
    }
    onExit() {
    }
    onEvent(_event) {
    }
    openKeyboard() {
    }
    endKeyboard(_icao) {
        if (_icao != "") {
            this.CurrentWaypoint = new WayPoint(this.gps);
            this.CurrentWaypoint.type = _icao.charAt(0);
            this.gps.facilityLoader.getFacilityCB(_icao, (wp) => {
                this.CurrentWaypoint = wp;
                this.onLoadEnd();
            });
        }
        else {
            this.CurrentWaypoint = null;
        }
    }
    activateDirectTo() {
        this.gps.currFlightPlanManager.activateDirectTo(this.CurrentWaypoint.GetInfos().icao, () => {
            this.back();
        });
    }
    cancelDirectTo() {
        this.gps.currFlightPlanManager.cancelDirectTo(() => {
            this.back();
        });
    }
    back() {
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
            Avionics.Utils.diffAndSetAttribute(this.buttons[i].button, "state", "Active");
            Avionics.Utils.diffAndSet(this.buttons[i].value, _elements[i]);
        }
        for (let i = _elements.length; i < this.buttons.length; i++) {
            Avionics.Utils.diffAndSetAttribute(this.buttons[i].button, "state", "Inactive");
        }
    }
    onElemClick(_id) {
        this.gps.closePopUpElement();
        this.callback(_id);
    }
}
//# sourceMappingURL=NavSystemTouch.js.map