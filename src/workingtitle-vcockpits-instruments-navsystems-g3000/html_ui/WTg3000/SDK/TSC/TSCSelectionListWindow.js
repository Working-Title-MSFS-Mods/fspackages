/**
 * A context for WT_TouchDynamicSelectionListWindow.
 * @typedef WT_TSCSelectionListWindowContext
 * @property {String} title - the window title to use when this context is active.
 * @property {String} subclass - a class to append to the html element's class list when this context is active.
 * @property {{nextElement(index:Number):{button:WT_TSCButton}}} elementConstructor - an object that returns the elements (buttons) to display when this context is active by implementing the
 *                                                                                    .nextElement(index) method. nextElement(index) should return an element object with the .button property
 *                                                                                    containing the html element representing the button to be placed at position index. nextElement(index)
 *                                                                                    should return null or undefined when index is greater than the number of buttons to be displayed.
 * @property {{getCurrentIndex():Number}} currentIndexGetter - an object that returns the index of the button to highlight/scroll to when the window is opened by implementing the
 *                                                             .getCurrentIndex() method. If no button should be highlighted, getCurrentIndex() should return a negative number.
 * @property {{update(index:Number,elem:Object)}} elementUpdater - an object that updates each button element in the list per refresh cycle by implementing the .update(index, elem) method.
 *                                                                 elem is the element to update (created by elementConstructor) and index is its position in the list.
 * @property {Function} callback - the callback to invoke when the user selects a button. The callback should take a requirement argument of the position or index of the selected button,
 *                                 and an optional argument of callback data defined by this context.
 * @property {*} callbackData - data to optionally pass to the callback.
 * @property {Boolean} closeOnSelect - indicates whether the window should automatically close when the user selects a button.
 */

/**
 * A touchscreen pop-up window that dynamically generates a list of buttons the user can choose from.
 * A single active button can optionally be highlighted and automatically scrolled to when the window is opened.
 */
class WT_TSCSelectionListWindow extends NavSystemElement {
    constructor() {
        super();
        this._elementList = [];
    }

    /**
     * @readonly
     * @property {WT_TSCSelectionListWindowContext} context
     * @type {WT_TSCSelectionListWindowContext}
     */
    get context() {
        return this._context;
    }

    init(root) {
        this._root = root;
        this._content = root.getElementsByClassName("content")[0];
        this._title = root.getElementsByClassName("WindowTitle")[0];
    }

    onEnter() {
        this._root.classList.add(this._context.subclass);
        this._title.textContent = this._context.title;
        this._root.setAttribute("state", "Active");
        this._setElements();
        this._scrollToHighlightedButton();
    }

    onEvent(event) {}

    onUpdate(deltaTime) {
        if (this._root.getAttribute("state") != "Active") {
            return;
        }

        let currentIndex = this._context.currentIndexGetter.getCurrentIndex();
        for (let i = 0; i < this._elementList.length; i++) {
            let element = this._elementList[i];
            this._context.elementUpdater.update(i, element);
            element.button.highlight = i === currentIndex ? "true" : "false";
        }
    }

    onExit() {
        this._root.setAttribute("state", "Inactive");
        this._removeElements();
        this._root.classList.remove(this._context.subclass);
    }

    _setElements() {
        let i = 0;
        let currentElement = this._context.elementConstructor.nextElement(i);
        while (currentElement) {
            if (this._content) {
                this._content.appendChild(currentElement.button);
            }
            currentElement.button.classList.add(WT_TSCSelectionListWindow.BUTTON_CLASS);
            currentElement.button.addButtonListener(this._onElemSelected.bind(this, i));
            this._elementList.push(currentElement);
            currentElement = this._context.elementConstructor.nextElement(++i);
        }
    }

    _removeElements() {
        while (this._elementList.length > 0) {
            let element = this._elementList.pop();
            element.button.clearButtonListeners();
            this._content.removeChild(element.button);
        }
    }

    /**
     * Sets the context for this window. The context will be used until another context is set.
     * @param {WT_TSCSelectionListWindowContext} context - the new context definition.
     */
    setContext(context) {
        this._context = context;
    }

    _onElemSelected(id) {
        this._context.callback(id, this._context.callbackData);
        if (this._context.closeOnSelect) {
            this.gps.goBack();
        }
    }

    _scrollToHighlightedButton() {
        let currentIndex = this._context.currentIndexGetter.getCurrentIndex();
        if (currentIndex < 0) {
            return;
        }
        let target = this._elementList[currentIndex].button;
        let pos = target.offsetTop - this._content.clientHeight / 2 + target.clientHeight / 2;
        this._content.scrollTop = pos;
    }
}
WT_TSCSelectionListWindow.BUTTON_CLASS = "dynamicSelectionListWindowButton";

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