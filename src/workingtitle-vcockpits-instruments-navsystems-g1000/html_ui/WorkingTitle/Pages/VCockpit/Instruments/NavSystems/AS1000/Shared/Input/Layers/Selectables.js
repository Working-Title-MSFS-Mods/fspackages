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
    /**
     * @param {HTMLElement[]} elements 
     */
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
        //iterator.index = (iterator.index + 1 + this.numElements) % this.numElements;
        iterator.index = Math.min(iterator.index + 1, this.numElements - 1);
        return this.elements[iterator.index];
    }
    previous(iterator) {
        //iterator.index = (iterator.index - 1 + this.numElements) % this.numElements;
        iterator.index = Math.max(iterator.index + 1, 0);
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
    /**
     * @param {HTMLElement} element 
     * @param {string} selector 
     */
    constructor(element, selector = Selectables_Input_Layer_Dynamic_Source.DEFAULT) {
        this.element = element;
        this.selector = selector;
    }
    getIterator() {
        return {
            element: null
        };
    }
    current(iterator) {
        if (iterator.element == null || !iterator.element.offsetParent || !iterator.element.matches(this.selector)) {
            let elements = this.elements;
            iterator.element = elements.length > 0 ? this.elements[0] : null;
        }
        return iterator.element;
    }
    next(iterator) {
        let elements = this.elements;
        if (elements.length == 0)
            return null;
        if (iterator.element == null) {
            iterator.element = elements[0];
            return;
        }
        let selected = null;//elements[0];
        let chooseNext = false;
        for (let element of elements) {
            if (chooseNext && element.offsetParent) {
                selected = element;
                break;
            }
            if (element == iterator.element) {
                chooseNext = true;
            }
        }
        if (selected)
            iterator.element = selected;
        return iterator.element;
    }
    previous(iterator) {
        let elements = this.elements;
        if (elements.length == 0)
            return null;
        if (iterator.element == null) {
            iterator.element = elements[elements.length - 1];
            return;
        }
        let selected = null;//elements[elements.length - 1];
        let previous = null;//elements[elements.length - 1];
        for (let element of elements) {
            if (element == iterator.element) {
                selected = previous;
                break;
            }
            if (element.offsetParent) {
                previous = element;
            }
        }
        if (selected)
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
Selectables_Input_Layer_Dynamic_Source.DEFAULT = "numeric-input, string-input, drop-down-selector, time-input, selectable-button, toggle-switch, icao-input, scrollable-container, adf-input, .selectable, g1000-external-link"
    .split(",").map(selector => `${selector}:not([disabled])`).join(",");

class Selectables_Input_Layer extends Input_Layer {
    /**
     * @param {Selectables_Input_Layer_Source} source 
     * @param {boolean} navigateWithSmall 
     */
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
        if (element == this.selectedElement)
            return;

        if (this.selectedElement) {
            this.selectedElement.dispatchEvent(new Event("blur"));
            this.selectedElement.removeAttribute("state");
        }

        this._selectedElement = element;
        if (this.selectedElement) {
            if (this.isActive) {
                this.selectedElement.setAttribute("state", "Selected");

                const focusInEvent = document.createEvent('Event');
                focusInEvent.initEvent('focusin', true, false);
                this.selectedElement.dispatchEvent(focusInEvent);

                this.selectedElement.dispatchEvent(new Event("focus"));
                this.onHighlightedElement(this.selectedElement);
            }

            const scrollable = DOMUtilities.GetClosestParent(this.selectedElement, ".scrollable-container");
            if (scrollable) {
                const scrollableContainerY = scrollable.getBoundingClientRect().top;
                const selectedElementY = this.selectedElement.getBoundingClientRect().top;
                const selectedElementHeight = this.selectedElement.getBoundingClientRect().height;
                if (scrollable.dataset.elementSelector) {
                    const parentElement = DOMUtilities.GetClosestParent(this.selectedElement, scrollable.dataset.elementSelector);
                    selectedElementHeight = parentElement.offsetHeight;
                }
                const scrollTop = scrollable.scrollTop + (selectedElementY - scrollableContainerY - scrollable.getBoundingClientRect().height / 2);
                scrollable.scrollTop = Math.floor(scrollTop / selectedElementHeight) * selectedElementHeight;
            }
        }
    }
    /**
     * @param {Selectables_Input_Layer_Source} source 
     */
    set source(source) {
        this._source = source;
        if (this._source) {
            this.iterator = this._source.getIterator();
            this.selectedElement = this._source.current(this.iterator);
        } else {
            this.iterator = null;
        }
    }
    /**
     * @returns {HTMLElement}
     */
    get selectedElement() {
        return this._selectedElement;
    }
    refreshSelected() {
        this.selectedElement = this._source.current(this.iterator);
    }
    selectElement(element) {
        if (this.iterator) {
            this.selectedElement = this._source.selectElement(this.iterator, element);
        }
    }
    onHighlightedElement(element) {
        element.dispatchEvent(new CustomEvent("highlighted", {
            bubbles: true,
            detail: {
                element: element,
            }
        }));
    }
    sendEventToSelected(event, inputStack) {
        if (!this.selectedElement)
            return;
        this.selectedElement.dispatchEvent(new CustomEvent(event, {
            bubbles: false,
            detail: {
                inputStack: inputStack,
            }
        }));
    }
    onSelectedElement(inputStack) {
        if (!this.selectedElement)
            return;
        this.selectedElement.dispatchEvent(new CustomEvent("selected", {
            bubbles: true,
            detail: {
                element: this.selectedElement,
                inputStack: inputStack
            }
        }));
        return true;
    }
    setExitHandler(handler) {
        this.exitHandler = handler;
    }
    onLargeInc(inputStack) {
        if (this.iterator)
            this.selectedElement = Selectables_Input_Layer.SCROLL_DIRECTION == "Normal" ? this._source.next(this.iterator) : this._source.previous(this.iterator);
    }
    onLargeDec(inputStack) {
        if (this.iterator)
            this.selectedElement = Selectables_Input_Layer.SCROLL_DIRECTION == "Normal" ? this._source.previous(this.iterator) : this._source.next(this.iterator);
    }
    onSmallInc(inputStack) {
        if (this.options.navigateWithSmall)
            return this.onLargeInc();
        if (this.selectedElement) {
            this.sendEventToSelected("increment", inputStack);
            this.onSelectedElement(inputStack);
            return true;
        }
    }
    onSmallDec(inputStack) {
        if (this.options.navigateWithSmall)
            return this.onLargeDec();
        if (this.selectedElement) {
            this.sendEventToSelected("decrement", inputStack);
            this.onSelectedElement(inputStack);
            return true;
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
        super.onActivate();
        this.isActive = true;
        if (this.iterator) {
            this.selectedElement = this._source.current(this.iterator);
        }
        if (this.selectedElement) {
            this.selectedElement.setAttribute("state", "Selected");
            this.selectedElement.dispatchEvent(new Event("focus"));
        }
    }
    onDeactivate() {
        super.onDeactivate();
        this.isActive = false;
        if (this.selectedElement) {
            this.selectedElement.removeAttribute("state");
            this.selectedElement.dispatchEvent(new Event("blur"));
        }
        if (this.iterator) {
            this.selectedElement = null;
        }
    }
}
Selectables_Input_Layer.SCROLL_DIRECTION = "Normal";