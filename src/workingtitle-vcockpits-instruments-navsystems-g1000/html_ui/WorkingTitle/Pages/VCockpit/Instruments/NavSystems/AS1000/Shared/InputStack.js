class Input_Layer {
    onLargeInc(inputStack) { return false; }
    onLargeDec(inputStack) { return false; }
    onSmallInc(inputStack) { return false; }
    onSmallDec(inputStack) { return false; }
    onMenuPush(inputStack) { return false; }
    onNavigationPush(inputStack) { return false; }
    onEnter(inputStack) { return false; }
    onCLR(inputStack) { return false; }
    onProceduresPush(inputStack) { return false; }
    onFlightPlan(inputStack) { return false; }
    onSoftKey(index, inputStack) { return false; }

    onNavPush(inputStack) { return false; }
    onNavSwitch(inputStack) { return false; }
    onNavLargeInc(inputStack) { return false; }
    onNavLargeDec(inputStack) { return false; }
    onNavSmallInc(inputStack) { return false; }
    onNavSmallDec(inputStack) { return false; }
    onVolume1Inc(inputStack) { return false; }
    onVolume1Dec(inputStack) { return false; }

    onComPush(inputStack) { return false; }
    onComSwitch(inputStack) { return false; }
    onComSwitchLong(inputStack) { return false; }
    onComLargeInc(inputStack) { return false; }
    onComLargeDec(inputStack) { return false; }
    onComSmallInc(inputStack) { return false; }
    onComSmallDec(inputStack) { return false; }
    onVolume2Inc(inputStack) { return false; }
    onVolume2Dec(inputStack) { return false; }

    onCourseIncrement(inputStack) { return false; }
    onCourseDecrement(inputStack) { return false; }
    onCoursePush(inputStack) { return false; }

    processEvent(_event, inputStack) {
        switch (_event) {
            case "FMS_Lower_INC":
                return this.onLargeInc(inputStack);
            case "FMS_Lower_DEC":
                return this.onLargeDec(inputStack);
            case "FMS_Upper_INC":
                return this.onSmallInc(inputStack);
            case "FMS_Upper_DEC":
                return this.onSmallDec(inputStack);

            case "MENU_Push":
                return this.onMenuPush(inputStack);
            case "ENT_Push":
                return this.onEnter(inputStack);
            case "FMS_Upper_PUSH":
                return this.onNavigationPush(inputStack);
            case "PROC_Push":
                return this.onProceduresPush(inputStack);
            case "CLR":
                return this.onCLR(inputStack);

            case "FPL_Push":
                return this.onFlightPlan(inputStack);
            case "SOFTKEYS_1":
                return this.onSoftKey(1, inputStack);
            case "SOFTKEYS_2":
                return this.onSoftKey(2, inputStack);
            case "SOFTKEYS_3":
                return this.onSoftKey(3, inputStack);
            case "SOFTKEYS_4":
                return this.onSoftKey(4, inputStack);
            case "SOFTKEYS_5":
                return this.onSoftKey(5, inputStack);
            case "SOFTKEYS_6":
                return this.onSoftKey(6, inputStack);
            case "SOFTKEYS_7":
                return this.onSoftKey(7, inputStack);
            case "SOFTKEYS_8":
                return this.onSoftKey(8, inputStack);
            case "SOFTKEYS_9":
                return this.onSoftKey(9, inputStack);
            case "SOFTKEYS_10":
                return this.onSoftKey(10, inputStack);
            case "SOFTKEYS_11":
                return this.onSoftKey(11, inputStack);
            case "SOFTKEYS_12":
                return this.onSoftKey(12, inputStack);

            case "NAV_Push":
                return this.onNavPush(inputStack);
            case "NAV_Switch":
                return this.onNavSwitch(inputStack);
            case "NAV_Large_INC":
                return this.onNavLargeInc(inputStack);
            case "NAV_Large_DEC":
                return this.onNavLargeDec(inputStack);
            case "NAV_Small_INC":
                return this.onNavSmallInc(inputStack);
            case "NAV_Small_DEC":
                return this.onNavSmallDec(inputStack);
            case "VOL_1_INC":
                return this.onVolume1Inc(inputStack);
            case "VOL_1_DEC":
                return this.onVolume1Dec(inputStack);

            case "COM_Push":
                return this.onComPush(inputStack);
            case "COM_Switch":
                return this.onComSwitch(inputStack);
            case "COM_Switch_Long":
                return this.onComSwitchLong(inputStack);
            case "COM_Large_INC":
                return this.onComLargeInc(inputStack);
            case "COM_Large_DEC":
                return this.onComLargeDec(inputStack);
            case "COM_Small_INC":
                return this.onComSmallInc(inputStack);
            case "COM_Small_DEC":
                return this.onComSmallDec(inputStack);
            case "VOL_2_INC":
                return this.onVolume2Inc(inputStack);
            case "VOL_2_DEC":
                return this.onVolume2Dec(inputStack);

            case "CRS_INC":
                return this.onCourseIncrement(inputStack);
            case "CRS_DEC":
                return this.onCourseDecrement(inputStack);
            case "CRS_PUSH":
                return this.onCoursePush(inputStack);
        }
        return false;
    }

    onActivate() { }
    onDeactivate() { }
}

class Selectables_Input_Layer_Source {
    getIterator() {
    }
    current(iterator) {
    }
    next(iterator) {
    }
    previous(iterator) {
    }
    selectElement(iterator, element) {
    }
}

class Selectables_Input_Layer_Element_Source {
    constructor(elements) {
        this.elements = elements;
    }
    getIterator() {
        return {
            index: 0
        };
    }
    current(iterator) {
        return this.elements[iterator.index];
    }
    next(iterator) {
        iterator.index = (iterator.index + 1 + this.numElements) % this.numElements;
        return this.elements[iterator.index];
    }
    previous(iterator) {
        iterator.index = (iterator.index - 1 + this.numElements) % this.numElements;
        return this.elements[iterator.index];
    }
    selectElement(iterator, element) {
        iterator.index = this.elements.indexOf(element);
        return this.current(iterator);
    }
    get numElements() {
        return this.elements.length;
    }
}

class Selectables_Input_Layer_Dynamic_Source {
    constructor(element, selector = "numeric-input, drop-down-selector, time-input, selectable-button, toggle-switch, .selectable") {
        this.element = element;
        this.selector = selector;
    }
    getIterator() {
        return {
            element: null
        };
    }
    current(iterator) {
        if (iterator.element == null || !document.body.contains(iterator.element)) {
            let elements = this.elements;
            iterator.element = elements.length > 0 ? this.elements[0] : null;
        }
        return iterator.element;
    }
    next(iterator) {
        let elements = this.elements;
        if (elements.length == 0)
            return null;
        let selected = elements[0];
        let chooseNext = false;
        for (let element of elements) {
            if (chooseNext) {
                selected = element;
                break;
            }
            if (element == iterator.element) {
                chooseNext = true;
            }
        }
        iterator.element = selected;
        return iterator.element;
    }
    previous(iterator) {
        let elements = this.elements;
        if (elements.length == 0)
            return null;
        let selected = elements[elements.length - 1];
        let previous = elements[elements.length - 1];
        for (let element of elements) {
            if (element == iterator.element) {
                selected = previous;
            }
            previous = element;
        }
        iterator.element = selected;
        return iterator.element;
    }
    selectElement(iterator, element) {
        iterator.element = element;
        return iterator.element;
    }
    get elements() {
        return this.element.querySelectorAll(this.selector);
    }
}

class Selectables_Input_Layer extends Input_Layer {
    constructor(source, navigateWithSmall = false) {
        super();
        this._selectedElement = null;
        this.isActive = false;
        this.options = {
            navigateWithSmall: navigateWithSmall,
            reverseNavigation: true
        }
        this.iterator = null;
        this.source = source;
    }
    set selectedElement(element) {
        if (this.selectedElement)
            this.selectedElement.removeAttribute("state");

        this._selectedElement = element;
        if (this.selectedElement) {
            if (this.isActive) {
                this.selectedElement.setAttribute("state", "Selected");
                this.onHighlightedElement(this.selectedElement);
            }

            let scrollable = DOMUtilities.GetClosestParent(this.selectedElement, ".scrollable-container");
            if (scrollable) {
                let scrollableContainerY = scrollable.getBoundingClientRect().top;
                let selectedElementY = this.selectedElement.getBoundingClientRect().top;
                scrollable.scrollTop = scrollable.scrollTop + (selectedElementY - scrollableContainerY - scrollable.getBoundingClientRect().height / 2);
            }
        }
    }
    set source(source) {
        this._source = source;
        if (this._source) {
            this.iterator = this._source.getIterator();
            this.selectedElement = this._source.current(this.iterator);
        } else {
            this.iterator = null;
        }
    }
    get selectedElement() {
        return this._selectedElement;
    }
    selectElement(element) {
        if (this.iterator) {
            this.selectedElement = this._source.selectElement(this.iterator, element);
        }
    }
    onHighlightedElement(element) {
        let evt = new CustomEvent("highlighted", {
            bubbles: true,
            detail: {
                element: element,
            }
        });
        element.dispatchEvent(evt);
    }
    sendEventToSelected(event) {
        let evt = new CustomEvent(event, { bubbles: false });
        this.selectedElement.dispatchEvent(evt);
    }
    onSelectedElement(inputStack) {
        let evt = new CustomEvent("selected", {
            bubbles: true,
            detail: {
                element: this.selectedElement,
                inputStack: inputStack
            }
        });
        this.selectedElement.dispatchEvent(evt);
        return true;
    }
    setExitHandler(handler) {
        this.exitHandler = handler;
    }
    onLargeInc(inputStack) {
        if (this.iterator)
            this.selectedElement = this._source.next(this.iterator);
    }
    onLargeDec(inputStack) {
        if (this.iterator)
            this.selectedElement = this._source.previous(this.iterator);
    }
    onSmallInc(inputStack) {
        if (this.options.navigateWithSmall)
            return this.onLargeInc();
        if (this.selectedElement) {
            this.sendEventToSelected("increment");
            return this.onSelectedElement(inputStack);
        }
    }
    onSmallDec(inputStack) {
        if (this.options.navigateWithSmall)
            return this.onLargeDec();
        if (this.selectedElement) {
            this.sendEventToSelected("decrement");
            return this.onSelectedElement(inputStack);
        }
    }
    onNavigationPush(inputStack) {
        if (this.exitHandler) {
            this.exitHandler.back();
        } else {
            return false;
        }
    }
    onEnter(inputStack) {
        if (this.selectedElement) {
            return this.onSelectedElement(inputStack);
        }
    }
    onActivate() {
        this.isActive = true;
        if (this.iterator)
            this.selectedElement = this._source.current(this.iterator);
        if (this.selectedElement) {
            this.selectedElement.setAttribute("state", "Selected");
        }
    }
    onDeactivate() {
        this.isActive = false;
        if (this.iterator)
            this.selectedElement = null;
        if (this.selectedElement) {
            this.selectedElement.removeAttribute("state");
        }
    }
}

class Page_Input_Layer extends Input_Layer {
    constructor(page) {
        super();
        this.page = page;
        this.active = false;
    }
    onNavigationPush(inputStack) {
        this.page.activate();
    }
}

class Input_Stack {
    constructor() {
        this.stack = [];
    }
    get currentLayer() {
        return (this.stack.length > 0) ? this.stack[this.stack.length - 1] : null;
    }
    push(layer) {
        let stackSize = this.stack.length;
        if (this.currentLayer) {
            this.currentLayer.onDeactivate();
        }
        this.stack.push(layer);
        this.currentLayer.onActivate();
        console.log("Input stack pushed");
        return {
            pop: () => {
                this.pop(stackSize);
            }
        };
    }
    pop(index) {
        console.log("Input stack popped");
        while (this.stack.length > index) {
            this.currentLayer.onDeactivate();
            this.stack.pop();
        }
        if (this.currentLayer) {
            this.currentLayer.onActivate();
        }
    }
    processEvent(_event) {
        if (!this.currentLayer)
            return;
        let i = this.stack.length - 1;
        while (i >= 0) {
            let layer = this.stack[i];
            let handled = layer.processEvent(_event, this);
            if (handled !== false)
                return;
            i--;
        }
    }
}