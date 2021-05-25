/**
 * A touchscreen pop-up window that dynamically generates a list of buttons the user can choose from.
 * A single active button can optionally be highlighted and automatically scrolled to when the window is opened.
 */
class WT_TSCSelectionList extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._elementList = [];
        this._isInit = false;
        this._isOpen = false;
    }

    _getTemplate() {
        return WT_TSCSelectionList.TEMPLATE;
    }

    /**
     * @readonly
     * @property {WT_TSCSelectionListWindowContext} context
     * @type {WT_TSCSelectionListContext}
     */
    get context() {
        return this._context;
    }

    _initScrollList() {
        this._scrollList = new WT_TSCScrollList();
        this._scrollList.slot = "scrolllist";
        this._scrollList.style.position = "relative";
        this._scrollList.style.width = "100%";
        this._scrollList.style.height = "100%";
        this.appendChild(this._scrollList);
    }

    connectedCallback() {
        this._initScrollList();
        this._isInit = true;
    }

    _setElements() {
        let i = 0;
        let currentElement = this._context.elementConstructor.nextElement(i);
        while (currentElement) {
            this._scrollList.appendChild(currentElement.button);
            currentElement.button.slot = "content";
            currentElement.button.classList.add(WT_TSCSelectionList.BUTTON_CLASS);
            currentElement.button.addButtonListener(this._onElemSelected.bind(this, i));
            this._elementList.push(currentElement);
            currentElement = this._context.elementConstructor.nextElement(++i);
        }
    }

    _removeElements() {
        while (this._elementList.length > 0) {
            let element = this._elementList.pop();
            element.button.clearButtonListeners();
            this._scrollList.removeChild(element.button);
        }
    }

    /**
     * Sets the context for this window. The context will be used until another context is set.
     * @param {WT_TSCSelectionListContext} context - the new context definition.
     */
    setContext(context) {
        if (this._isOpen) {
            return;
        }

        this._context = context;
    }

    _onElemSelected(id) {
        this._context.callback(id, this._context.callbackData);
    }

    _scrollToHighlightedButton() {
        let currentIndex = this._context.currentIndexGetter.getCurrentIndex();
        if (currentIndex < 0) {
            return;
        }
        let target = this._elementList[currentIndex].button;
        this._scrollList.scrollManager.snapToElement(target, true);
    }

    open() {
        if (!this._isInit) {
            return;
        }

        this.classList.add(this._context.subclass);
        this._setElements();
        this._scrollToHighlightedButton();
        this._isOpen = true;
    }

    _updateHighlight() {
        let currentIndex = this._context.currentIndexGetter.getCurrentIndex();
        for (let i = 0; i < this._elementList.length; i++) {
            let element = this._elementList[i];
            this._context.elementUpdater.update(i, element);
            element.button.highlight = i === currentIndex ? "true" : "false";
        }
    }

    _updateScroll() {
        this._scrollList.scrollManager.update();
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._updateHighlight();
        this._updateScroll();
    }

    close() {
        if (!this._isInit) {
            return;
        }

        this._isOpen = false;
        this._scrollList.scrollManager.cancelScroll();
        this._removeElements();
        this.classList.remove(this._context.subclass);
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.scrollUp();
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        this._scrollList.scrollManager.scrollDown();
    }
}
WT_TSCSelectionList.BUTTON_CLASS = "dynamicSelectionListWindowButton";
WT_TSCSelectionList.NAME = "wt-tsc-selectionlist";
WT_TSCSelectionList.TEMPLATE = document.createElement("template");
WT_TSCSelectionList.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        #scrolllist {
            position: relative;
            width: 100%;
            height: 100%;
        }
    </style>
    <slot name="scrolllist" id="scrolllist"></slot>
`;

customElements.define(WT_TSCSelectionList.NAME, WT_TSCSelectionList);

/**
 * A context for WT_TSCSelectionList.
 * @typedef WT_TSCSelectionListContext
 * @property {String} subclass - a class to append to the selection list's class list when this context is active.
 * @property {{nextElement(index:Number):{button:WT_TSCButton}}} elementConstructor - an object that returns the elements (buttons) to display when this context is active by implementing the
 *                                                                                    .nextElement(index) method. nextElement(index) should return an element object with the .button property
 *                                                                                    containing the html element representing the button to be placed at position index. nextElement(index)
 *                                                                                    should return null or undefined when index is greater than the number of buttons to be displayed.
 * @property {{getCurrentIndex():Number}} currentIndexGetter - an object that returns the index of the button to highlight/scroll to when the list is opened by implementing the
 *                                                             .getCurrentIndex() method. If no button should be highlighted, getCurrentIndex() should return a negative number.
 * @property {{update(index:Number,elem:Object)}} elementUpdater - an object that updates each button element in the list per refresh cycle by implementing the .update(index, elem) method.
 *                                                                 elem is the element to update (created by elementConstructor) and index is its position in the list.
 * @property {Function} callback - the callback to invoke when the user selects a button. The callback should take a requirement argument of the position or index of the selected button,
 *                                 and an optional argument of callback data defined by this context.
 * @property {*} callbackData - data to optionally pass to the callback.
 */

/**
 * A convenience class for generating a list of 'gradientButton'-type button elements for WT_TouchDynamicSelectionListWindow
 * from a list of string values. Each string value will be displayed in a button within a child div with the 'value' class.
 * This class also functions as an element updater; by default it leaves the button elements unchanged.
 * @property {string[]} values - an array of string values.
 */
class WT_TSCStandardSelectionElementHandler {
    /**
     * @param values - an iterable of string values. One button element will be created per value in the order returned by the iterable.
     */
    constructor(values) {
        this.values = Array.from(values);
    }

    nextElement(index) {
        if (index >= this.values.length) {
            return null;
        }

        let elem = {
            button: new WT_TSCLabeledButton()
        };
        elem.button.labelText = this.values[index];
        return elem;
    }

    update(index, elem) {
    }
}