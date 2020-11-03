/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class UIElement extends HTMLElement {
    constructor() {
        super();
        this.m_DummyUIElement = true;
        this.onDefaultKeyDown = (e) => {
            this.onKeyDown(e.keyCode);
        };
        this.onDefaultKeyUp = (e) => {
            this.onKeyUp(e.keyCode);
        };
        this.m_localGrid = null;
        this.sendSizeUpdate = () => {
            this.dispatchEvent(new CustomEvent("virtualScrollSizeUpdate", { bubbles: true }));
        };
        this.previousButton = null;
    }
    static getUIElement(elem) {
        if (elem) {
            if (elem.m_DummyUIElement === true)
                return elem;
        }
        return null;
    }
    disconnectedCallback() {
        this.blur();
    }
    get childActiveClass() { return "ChildActive"; }
    onActiveChildBlurred(child) {
        this.classList.remove(this.childActiveClass);
    }
    onActiveChildFocused(child) {
        this.classList.add(this.childActiveClass);
    }
    registerDefaultKeyEvents() {
        this.tabIndex = 1;
        this.addEventListener("keydown", this.onDefaultKeyDown);
        this.addEventListener("keyup", this.onDefaultKeyUp);
    }
    get _localgridColumn() {
        if (this.hasAttribute("local-grid-column"))
            return this.getAttribute("local-grid-column").padStart(2, "0");
        else
            return "";
    }
    get _localgridColumnEnd() {
        if (this.hasAttribute("local-grid-column-end"))
            return this.getAttribute("local-grid-column-end").padStart(2, "0");
        else
            return this._localgridColumn;
    }
    get _localgridRow() {
        if (this.hasAttribute("local-grid-row"))
            return this.getAttribute("local-grid-row").padStart(2, "0");
        else
            return "";
    }
    get _localgridRowEnd() {
        if (this.hasAttribute("local-grid-row-end"))
            return this.getAttribute("local-grid-row-end").padStart(2, "0");
        else
            return this._localgridRow;
    }
    get localGrid() {
        if (this.m_localGrid)
            return this.m_localGrid;
        let ret = null;
        if (this.hasAttribute("local-grid")) {
            let attr = this.getAttribute("local-grid").split("/");
            let colStartEnd = attr[0].split("-");
            let rowStartEnd = attr[1].split("-");
            ret = {
                col: colStartEnd[0],
                colEnd: colStartEnd[1] || colStartEnd[0],
                row: rowStartEnd[0],
                rowEnd: rowStartEnd[1] || rowStartEnd[0]
            };
        }
        else {
            if (this.hasAttribute("local-grid-column") || this.hasAttribute("local-grid-row")) {
                ret = {
                    col: this._localgridColumn,
                    row: this._localgridRow,
                    rowEnd: this._localgridRowEnd,
                    colEnd: this._localgridColumnEnd
                };
            }
        }
        if (ret) {
            if (ret.col != "")
                ret.col = ret.col.padStart(2, "0");
            if (ret.colEnd != "")
                ret.colEnd = ret.colEnd.padStart(2, "0");
            if (ret.row != "")
                ret.row = ret.row.padStart(2, "0");
            if (ret.rowEnd != "")
                ret.rowEnd = ret.rowEnd.padStart(2, "0");
        }
        this.m_localGrid = ret;
        return ret;
    }
    get localgridColumn() { return this.localGrid ? this.localGrid.col : ""; }
    get localgridColumnEnd() { return this.localGrid ? this.localGrid.colEnd : ""; }
    get localgridRow() { return this.localGrid ? this.localGrid.row : ""; }
    get localgridRowEnd() { return this.localGrid ? this.localGrid.rowEnd : ""; }
    set localgridColumn(value) { this.setAttribute("local-grid-column", value); }
    get globalGridColumn() {
        if (this.m_globalGridColumn)
            return this.m_globalGridColumn;
        let ret = [this.localgridColumn];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI) {
                if (parentUI.localgridColumn != "")
                    ret.push(parentUI.localgridColumn);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridColumn = ret;
        return ret;
    }
    get globalGridColumnEnd() {
        if (this.m_globalGridColumnEnd)
            return this.m_globalGridColumnEnd;
        let ret = [this.localgridColumnEnd];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI) {
                if (parentUI.localgridColumnEnd != "")
                    ret.push(parentUI.localgridColumn);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridColumnEnd = ret;
        return ret;
    }
    get globalGridRow() {
        if (this.m_globalGridRow)
            return this.m_globalGridRow;
        let ret = [this.localgridRow];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI && parentUI.localgridRow != "") {
                ret.push(parentUI.localgridRow);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridRow = ret;
        return ret;
    }
    get globalGridRowEnd() {
        if (this.m_globalGridRowEnd)
            return this.m_globalGridRowEnd;
        let ret = [this.localgridRowEnd];
        let parent = this.parentElement;
        while (parent) {
            let parentUI = UIElement.getUIElement(parent);
            if (parentUI && parentUI.localgridRowEnd != "") {
                ret.push(parentUI.localgridRowEnd);
            }
            parent = parent.parentElement;
        }
        ret = ret.reverse();
        this.m_globalGridRowEnd = ret;
        return ret;
    }
    unregisterDefaultKeyEvents() {
        this.tabIndex = -1;
        this.removeEventListener("keydown", this.onDefaultKeyDown);
        this.removeEventListener("keyup", this.onDefaultKeyUp);
    }
    spreadToChildren(parent, parentClass, childClass) {
        for (var ch of parent.children) {
            ch.classList.add(childClass);
            if (!ch.classList.contains(parentClass))
                this.spreadToChildren(ch, parentClass, childClass);
        }
    }
    unspreadToChildren(parent, parentClass, childClass) {
        for (let ch of parent.children) {
            if (!ch.classList.contains(parentClass)) {
                ch.classList.remove(childClass);
                this.unspreadToChildren(ch, parentClass, childClass);
            }
        }
    }
    setVisible(val) {
        this.classList.toggle("hide", !val);
        if (!val) {
            if (UINavigation.current) {
                if (UINavigation.current == this || UINavigation.current.isChildOf(this)) {
                    UINavigation.current.blur();
                }
            }
        }
        this.onVisibilityChange(val);
    }
    isVisible() {
        return !this.classList.contains("hide") && !this.classList.contains("panelInvisible") && !this.classList.contains("invisible");
    }
    onVisibilityChange(visible) {
    }
    get enabled() {
        return !this.classList.contains("disabled");
    }
    enable(bool) {
        this.classList.toggle("disabled", !bool);
    }
    disable(bool) {
        this.enable(!bool);
    }
    set disabled(bool) {
        if (this.disabled != bool)
            this.disable(bool);
    }
    isOneParentHidden() {
        if (!this.isVisible())
            return false;
        let parent = this.parentElement;
        while (parent) {
            if (parent.classList.contains("hide") || parent.classList.contains("panelInvisible"))
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    get disabled() {
        return this.classList.contains("disabled");
    }
    canBeSelectedDisabled() { return false; }
    canBeSelectedWithKeys() {
        if (this.getRootNode() != document)
            return false;
        return !this.forceNoKeyNavigation && this.canBeSelected && this.isVisible() && !this.isOneParentHidden() && (this.canBeSelectedDisabled() || this.enabled);
    }
    get forceNoKeyNavigation() {
        return (this.hasAttribute("no-key-navigation"));
    }
    get canBeSelected() {
        if (this.hasAttribute("can-be-selected"))
            return true;
        if (this.hasAttribute("default-child-button"))
            return true;
        return false;
    }
    get locked() { return this.hasAttribute("locked"); }
    set locked(val) {
        if (val)
            this.setAttribute("locked", "");
        else
            this.removeAttribute("locked");
        this.classList.toggle("locked", this.hasAttribute("locked"));
        if (val)
            this.spreadToChildren(this, "locked", "parentLocked");
        else
            this.unspreadToChildren(this, "locked", "parentLocked");
    }
    get loading() {
        return this.classList.contains("activeLoading");
    }
    set loading(val) {
        let previousState = this.classList.contains("activeLoading");
        if (previousState != val) {
            if (val) {
                let overlay = document.createElement("div");
                overlay.classList.add("loading-overlay");
                let overlayContent = document.createElement("div");
                overlayContent.classList.add("loading-overlay__content");
                overlay.appendChild(overlayContent);
                let stack = new IconStackElement();
                let loaderIcon = new IconElement();
                loaderIcon.setAttribute("data-url", "/icons/ICON_LOADING.svg");
                stack.appendChild(loaderIcon);
                overlayContent.appendChild(stack);
                let title = new LabelizeElement();
                title.setAttribute('key', "TT:MENU.LOADING");
                overlayContent.appendChild(title);
                this.appendChild(overlay);
            }
            else {
                let loadingOverlay = this.querySelector(":scope > .loading-overlay");
                if (loadingOverlay)
                    this.removeChild(loadingOverlay);
            }
            this.classList.toggle("activeLoading", val);
        }
    }
    connectedCallback() {
        this.m_globalGridColumn = null;
        this.m_globalGridColumnEnd = null;
        this.m_globalGridRow = null;
        this.m_globalGridRowEnd = null;
        this.setAttribute("data-input-group", this.tagName);
    }
    static get observedAttributes() { return ["local-grid", "local-grid-column", "local-grid-column-end", "local-grid-row", "local-grid-row-end"]; }
    attributeChangedCallback(name, oldValue, newValue) {
        if (["local-grid", "local-grid-column", "local-grid-column-end", "local-grid-row", "local-grid-row-end"].includes(name)) {
            this.m_localGrid = null;
            this.localGrid;
        }
    }
    isParentOf(child) {
        if (child == this)
            return true;
        if (!child)
            return false;
        let parent = child.parentElement;
        while (parent) {
            if (parent == this)
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    isChildOf(parentToTest) {
        if (!parentToTest)
            return false;
        let parent = this.parentElement;
        while (parent) {
            if (parent == parentToTest)
                return true;
            parent = parent.parentElement;
        }
        let thisWindow = this.ownerDocument.defaultView;
        if (thisWindow.frameElement) {
            let allFrames = parentToTest.querySelectorAll("iframe");
            for (let iframe of allFrames) {
                if (iframe == thisWindow.frameElement) {
                    return true;
                }
            }
        }
        return false;
    }
    hasParentHidden() {
        if (this.classList.contains("hide") || this.classList.contains("invisible") || this.classList.contains("panelInvisible"))
            return true;
        let parent = this.parentElement;
        while (parent) {
            if (parent.classList.contains("hide") || parent.classList.contains("invisible") || parent.classList.contains("panelInvisible"))
                return true;
            parent = parent.parentElement;
        }
        return false;
    }
    focus() {
        super.focus();
    }
    queryElement(selector) {
        return this.querySelector(selector);
    }
    setJSONData(data) { }
    setAnyData(data) { }
    getKeyNavigationDirection() {
        if (this.hasAttribute("grid-navigation"))
            return KeyNavigationDirection.KeyNavigation_Grid;
        else if (this.hasAttribute("vertical-navigation"))
            return KeyNavigationDirection.KeyNavigation_Vertical;
        else if (this.hasAttribute("horizontal-navigation"))
            return KeyNavigationDirection.KeyNavigation_Horizontal;
        return KeyNavigationDirection.KeyNavigation_None;
    }
    getAllFocusableChildren() {
        if (this.hasAttribute("navigation-query")) {
            console.error("deprecated navigation-query");
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("navigation-query")));
            return ret;
        }
        else if (this.hasAttribute("vertical-navigation") && this.getAttribute("vertical-navigation") != "") {
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("vertical-navigation")));
            return ret;
        }
        else if (this.hasAttribute("horizontal-navigation") && this.getAttribute("horizontal-navigation") != "") {
            let ret = Utils.toArray(this.querySelectorAll(this.getAttribute("horizontal-navigation")));
            return ret;
        }
        return null;
    }
    getKeyNavigationStayInside(keycode) {
        let attrib = this.getAttribute("navigation-stay-inside");
        switch (attrib) {
            case "down":
                if (keycode == KeyCode.KEY_DOWN)
                    return true;
                break;
            case "up":
                if (keycode == KeyCode.KEY_UP)
                    return true;
                break;
            case "left":
                if (keycode == KeyCode.KEY_LEFT)
                    return true;
                break;
            case "right":
                if (keycode == KeyCode.KEY_RIGHT)
                    return true;
                break;
            default: return this.hasAttribute("navigation-stay-inside");
        }
    }
    selectDefaultButton() {
        let button = this.getDefaultButton();
        if (bDebugKeyNavigation)
            console.warn("select default button", button);
        if (button) {
            button.focusByKeys(0);
        }
    }
    selectDefaultChildButton() {
        let button = this.getDefaultChildButton();
        if (bDebugKeyNavigation)
            console.warn("select default child button", button);
        if (button) {
            button.focusByKeys(0);
        }
    }
    getDefaultButton() {
        if (this.canBeSelectedWithKeys())
            return this;
        return this.getDefaultChildButton();
    }
    getDefaultChildButton() {
        if (this.hasAttribute("default-child-button")) {
            let children = this.querySelectorAll(this.getAttribute("default-child-button"));
            for (let child of children) {
                let UIElem = UIElement.getUIElement(child);
                if (UIElem && UIElem.canBeSelectedWithKeys()) {
                    return UIElem;
                }
            }
        }
        let selected = this.querySelector(".selected, .Focused");
        if (selected && UIElement.getUIElement(selected)) {
            if (selected.canBeSelectedWithKeys()) {
                return UIElement.getUIElement(selected);
            }
        }
        let allDefaultButtons = this.querySelectorAll("[default-button]");
        for (let button of allDefaultButtons) {
            let uiElem = UIElement.getUIElement(button);
            if (uiElem) {
                if (uiElem.canBeSelectedWithKeys()) {
                    return uiElem;
                }
            }
        }
        let allFocusable = this.getAllFocusableChildren();
        if (!allFocusable)
            return null;
        for (let child of allFocusable) {
            let uiChild = UIElement.getUIElement(child);
            if (uiChild && uiChild.canBeSelectedWithKeys()) {
                let defaultButton = uiChild.getDefaultButton();
                if (bDebugKeyNavigation)
                    console.warn("default button", this, defaultButton);
                if (defaultButton)
                    return defaultButton;
            }
        }
        return null;
    }
    virtualScrollIntoView(elt) {
        (elt ? elt : this).dispatchEvent(new CustomEvent("virtualScrollIntoView", { bubbles: true }));
    }
    onButtonSelected(button) { }
    onButtonUnselected(button) { }
    onKeyUp(keycode) {
        let parent = this.parentElement;
        while (parent && parent["onKeyUp"] == null) {
            parent = parent.parentElement;
        }
        if (parent) {
            parent.onKeyUp(keycode);
        }
        return false;
    }
    onKeyDown(keycode) {
        if (!UINavigation.current || UINavigation.current != this) {
            if (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Grid && [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode)) {
                if (bDebugKeyNavigation) {
                    console.warn("********** GRID NAVIGATION *******", this);
                }
                let horizontal = [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT].includes(keycode);
                let currentGridColumn = (UINavigation.current ? UINavigation.current.globalGridColumn : ["0"]);
                let currentGridColumnEnd = (UINavigation.current ? UINavigation.current.globalGridColumnEnd : currentGridColumn);
                let currentGridColumnStr = currentGridColumn.toString();
                let currentGridRow = (UINavigation.current ? UINavigation.current.globalGridRow : ["0"]);
                let currentGridRowEnd = (UINavigation.current ? UINavigation.current.globalGridRowEnd : currentGridRow);
                let currentGridRowStr = currentGridRow.toString();
                let isCandidate = (elem) => {
                    if (elem == UINavigation.current) {
                        return false;
                    }
                    if (!elem.canBeSelectedWithKeys) {
                        return false;
                    }
                    if (!elem.canBeSelectedWithKeys() || elem.locked) {
                        if (bDebugKeyNavigation)
                            console.warn("cannot be selected with keys", elem);
                        return false;
                    }
                    let elemRows = elem.globalGridRow;
                    let elemRowsEnd = elem.globalGridRowEnd;
                    let elemColumn = elem.globalGridColumn;
                    let elemColumnEnd = elem.globalGridColumnEnd;
                    let nbToTest = horizontal ? Math.min(currentGridRow.length, elemRows.length) : Math.min(currentGridColumn.length, elemColumn.length);
                    let elemStartValue = (horizontal ? elemRows : elemColumn).slice(0, nbToTest).toString();
                    let elemEndValue = (horizontal ? elemRowsEnd : elemColumnEnd).slice(0, nbToTest).toString();
                    let currentStartValue = (horizontal ? currentGridRow : currentGridColumn).slice(0, nbToTest).toString();
                    let currentEndValue = (horizontal ? currentGridRowEnd : currentGridColumnEnd).slice(0, nbToTest).toString();
                    let contains = (currentStartValue >= elemStartValue && currentStartValue <= elemEndValue) || (elemStartValue >= currentStartValue && elemStartValue <= currentEndValue);
                    if (!contains) {
                        if (bDebugKeyNavigation) {
                            if (horizontal)
                                console.warn("different row", elem, "nbToTest " + nbToTest, "current : " + currentStartValue + "/" + currentEndValue, "elem : " + elemStartValue + "/" + elemEndValue);
                            else
                                console.warn("different column", elem, "nbToTest " + nbToTest, "current : " + currentStartValue + "/" + currentEndValue, "elem : " + elemStartValue + "/" + elemEndValue);
                        }
                        return false;
                    }
                    let elemTestStr = horizontal ? elem.globalGridColumn.toString() : elem.globalGridRow.toString();
                    let currentTestStr = horizontal ? currentGridColumnStr : currentGridRowStr;
                    if ((keycode == KeyCode.KEY_RIGHT || keycode == KeyCode.KEY_DOWN) && elemTestStr < currentTestStr) {
                        if (bDebugKeyNavigation)
                            console.warn("not on the right", elem);
                        return false;
                    }
                    else if ((keycode == KeyCode.KEY_LEFT || keycode == KeyCode.KEY_UP) && elemTestStr > currentTestStr) {
                        if (bDebugKeyNavigation)
                            console.warn("not on the left", elem);
                        return false;
                    }
                    if (UINavigation.current && UINavigation.current.isChildOf(elem)) {
                        if (bDebugKeyNavigation)
                            console.warn("parent of the current element", elem);
                        return false;
                    }
                    return true;
                };
                let allElems = null;
                let allCandidates = [];
                if (this.previousButton) {
                    if (isCandidate(this.previousButton)) {
                        allElems = [this.previousButton];
                    }
                }
                if (!allElems) {
                    let queryStr = "";
                    if (horizontal) {
                        queryStr = "[local-grid-column]";
                    }
                    else
                        queryStr = "[local-grid-row]";
                    let queryStrGroup = "";
                    if (this.hasAttribute("main-grid-group")) {
                        queryStrGroup = "[grid-group='" + this.getAttribute("main-grid-group") + "']";
                    }
                    else {
                        queryStrGroup = ":not([grid-group])";
                    }
                    queryStrGroup += ":not(.hide)";
                    queryStr += queryStrGroup + ",[local-grid]" + queryStrGroup;
                    allElems = Utils.toArray(this.querySelectorAll(queryStr));
                }
                for (let elem of allElems) {
                    if (!isCandidate(elem)) {
                        continue;
                    }
                    allCandidates.push(elem);
                }
                let order = (keycode == KeyCode.KEY_RIGHT || keycode == KeyCode.KEY_DOWN) ? 1 : -1;
                allCandidates = allCandidates.sort((a, b) => {
                    let aTest1 = horizontal ? a.globalGridColumn.toString() : a.globalGridRow.toString();
                    let bTest1 = horizontal ? b.globalGridColumn.toString() : b.globalGridRow.toString();
                    if (aTest1 < bTest1)
                        return order * -1;
                    if (aTest1 > bTest1)
                        return order * 1;
                    let aTest2 = horizontal ? a.globalGridRow.toString() : a.globalGridColumn.toString();
                    let bTest2 = horizontal ? b.globalGridRow.toString() : b.globalGridColumn.toString();
                    if (aTest2 < bTest2)
                        return -1;
                    if (aTest2 > bTest2)
                        return -1;
                    return 0;
                });
                if (allCandidates.length > 0) {
                    let buttonToSelect = allCandidates[0];
                    let isPartOf = (elem, parent) => {
                        if (elem.length < parent.length) {
                            return false;
                        }
                        for (let it = 0; it < parent.length; it++) {
                            if (elem[it] != parent[it]) {
                                return false;
                            }
                        }
                        return true;
                    };
                    for (let elem of allCandidates) {
                        if (horizontal) {
                            if (isPartOf(elem.globalGridColumn, UINavigation.current.globalGridColumn)) {
                                continue;
                            }
                            if (isPartOf(elem.globalGridColumn, buttonToSelect.globalGridColumn)) {
                                buttonToSelect = elem;
                            }
                        }
                        else {
                            if (isPartOf(elem.globalGridRow, UINavigation.current.globalGridRow))
                                continue;
                            if (isPartOf(elem.globalGridRow, buttonToSelect.globalGridRow)) {
                                buttonToSelect = elem;
                            }
                        }
                    }
                    this.previousButton = UINavigation.current;
                    if (buttonToSelect) {
                        if (bDebugKeyNavigation)
                            console.warn("buttonToSelect", buttonToSelect);
                        buttonToSelect.focusByKeys(keycode);
                        return true;
                    }
                    else if (this.getKeyNavigationStayInside(keycode)) {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select + stay inside");
                    }
                    else {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select");
                    }
                }
                else {
                    if (this.getKeyNavigationStayInside(keycode)) {
                        if (bDebugKeyNavigation)
                            console.warn("no button to select + stay inside");
                        return true;
                    }
                }
            }
            else if ([KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT, KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode) && (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Vertical || this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Horizontal)) {
                if ((this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Vertical && [KeyCode.KEY_UP, KeyCode.KEY_DOWN].includes(keycode)) ||
                    (this.getKeyNavigationDirection() == KeyNavigationDirection.KeyNavigation_Horizontal && [KeyCode.KEY_RIGHT, KeyCode.KEY_LEFT].includes(keycode))) {
                    let selectedButton = UINavigation.current;
                    let buttonToSelect = null;
                    let buttons = this.getAllFocusableChildren();
                    if (bDebugKeyNavigation) {
                        console.warn("this", this);
                        console.warn("selectedButton", selectedButton);
                    }
                    if (buttons) {
                        if (bDebugKeyNavigation)
                            console.warn("buttons", buttons);
                        let previousButton = null;
                        for (let buttonH of buttons) {
                            let button = UIElement.getUIElement(buttonH);
                            if (!button || !button.canBeSelectedWithKeys()) {
                                if (bDebugKeyNavigation) {
                                    if (button)
                                        console.warn("dismissed ", button, "!forceNoKeyNavigation " + !button.forceNoKeyNavigation, "can be selected " + button.canBeSelected, "visible " + button.isVisible(), "enabled " + button.enabled, "no parent hidden " + !button.isOneParentHidden());
                                    else
                                        console.warn("dismissed ", button);
                                }
                                continue;
                            }
                            if (bDebugKeyNavigation)
                                console.warn("button", button);
                            switch (keycode) {
                                case KeyCode.KEY_UP:
                                case KeyCode.KEY_LEFT:
                                    if (button == selectedButton || button.isParentOf(selectedButton)) {
                                        buttonToSelect = previousButton;
                                    }
                                    else {
                                        if (bDebugKeyNavigation)
                                            console.warn("button is not a parent of selected ");
                                    }
                                    break;
                                case KeyCode.KEY_DOWN:
                                case KeyCode.KEY_RIGHT:
                                    if (previousButton && (previousButton == selectedButton || previousButton.isParentOf(selectedButton))) {
                                        buttonToSelect = button;
                                    }
                                    else {
                                        if (bDebugKeyNavigation)
                                            console.warn("previous button is not child of", previousButton, selectedButton);
                                    }
                                    break;
                            }
                            previousButton = button;
                            if (buttonToSelect)
                                break;
                        }
                        if (buttonToSelect) {
                            if (bDebugKeyNavigation)
                                console.warn("buttonToSelect", buttonToSelect);
                            selectedButton.blur();
                            buttonToSelect.focusByKeys(keycode);
                            return true;
                        }
                        if (this.getKeyNavigationStayInside(keycode)) {
                            if (bDebugKeyNavigation)
                                console.warn("no button to select + stay inside");
                            return true;
                        }
                        else {
                            if (bDebugKeyNavigation)
                                console.warn("no button to select");
                        }
                    }
                }
            }
        }
        let parent = this.parentElement;
        while (parent && parent["onKeyDown"] == null) {
            parent = parent.parentElement;
        }
        if (parent) {
            return parent.onKeyDown(keycode);
        }
        else {
            if (!this.getKeyNavigationStayInside(keycode))
                UINavigation.onKeyDownOnRoot(keycode);
        }
        return false;
    }
    get autoInside() { return this.hasAttribute("auto-inside"); }
    focusByKeys(keycode = -1) {
        if (this.autoInside && this.getDefaultChildButton()) {
            this.getDefaultChildButton().focusByKeys(keycode);
        }
        else {
            this.focus();
            this.dispatchEvent(new Event("focusbykeys", { bubbles: true }));
            let parent = this.parentElement;
            while (parent) {
                if (UIElement.getUIElement(parent)) {
                    parent.onButtonSelected(this);
                    return;
                }
                parent = parent.parentElement;
            }
            this.virtualScrollIntoView();
        }
    }
    unFocusByKeys() {
        this.blur();
    }
}