/**
 * A context for WT_TouchDynamicSelectionListWindow.
 * @typedef WT_TouchDynamicSelectionListWindowContext
 * @property {string} title - the window title to use when this context is active.
 * @property {string} subclass - a class to append to the html element's class list when this context is active.
 * @property {object} elementConstructor - an object that returns the elements (buttons) to display when this context is active by implementing the .nextElement(index) method.
 *                                         .nextElement(index) should return an element object with the .button property containing the html element representing the button to
 *                                         be placed at position index. .nextElement(index) should return null or undefined when index is greater than the number of buttons
 *                                         to be displayed.
 * @property {object} currentIndexGetter - an object that returns the index of the button to highlight/scroll to when the window is opened by implementing the
 *                                         .getCurrentIndex() method. If no button should be highlighted, .getCurrentIndex() should return a negative number.
 * @property {object} elementUpdater - an object that updates each button element in the list per refresh cycle by implementing the .update(index, elem) method. elem is the
 *                                     element to update (created by elementConstructor) and index is its position in the list.
 * @property callback - the callback to invoke when the user selects a button. The callback should take a requirement argument of the position or index of the selected button,
 *                      and an optional argument of callback data defined by this context.
 * @property callbackData - data to optionally pass to the callback.
 * @property {boolean} closeOnSelect - indicates whether the window should automatically close when the user selects a button.
 */

/**
 * A touchscreen pop-up window that dynamically generates a list of buttons the user can choose from.
 * A single active button can optionally be highlighted and automatically scrolled to when the window is opened.
 */
class WT_TouchDynamicSelectionListWindow extends NavSystemElement {
    constructor() {
        super();
        this._elementList = [];
    }

    init(root) {
        this.root = root;
        this.content = root.getElementsByClassName("content")[0];
        this.title = root.getElementsByClassName("WindowTitle")[0];
    }

    onEnter() {
        this.root.classList.add(this.context.subclass);
        this.title.textContent = this.context.title;
        this.root.setAttribute("state", "Active");
        this.setElements();
        this.scrollToHighlightedButton();
    }

    onUpdate(_deltaTime) {
        if (this.root.getAttribute("state") != "Active") {
            return;
        }

        let currentIndex = this.context.currentIndexGetter.getCurrentIndex();
        for (let i = 0; i < this._elementList.length; i++) {
            this.context.elementUpdater.update(i, this._elementList[i]);
            Avionics.Utils.diffAndSetAttribute(this._elementList[i].button, "state", (currentIndex == i) ? "Highlight" : "Active");
        }
    }

    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.removeElements();
        this.root.classList.remove(this.context.subclass);
    }

    setElements() {
        let i = 0;
        let currentElement = this.context.elementConstructor.nextElement(i);
        while (currentElement) {
            if (this.content) {
                this.content.appendChild(currentElement.button);
            }
            this.gps.makeButton(currentElement.button, this.onElemClick.bind(this, i));
            this._elementList.push(currentElement);
            currentElement = this.context.elementConstructor.nextElement(++i);
        }
    }

    removeElements() {
        while (this._elementList.length > 0) {
            this.content.removeChild(this._elementList.pop().button);
        }
    }

    /**
     * Sets the context for this window. The context will be used until another context is set.
     * @param {WT_TouchDynamicSelectionListWindowContext} context - the new context definition.
     */
    setContext(context) {
        this.context = context;
    }

    onElemClick(id) {
        this.context.callback(id, this.context.callbackData);
        if (this.context.closeOnSelect) {
            this.gps.goBack();
        }
    }

    scrollToHighlightedButton() {
        let currentIndex = this.context.currentIndexGetter.getCurrentIndex();
        if (currentIndex < 0) {
            return;
        }
        let target = this._elementList[currentIndex].button;
        let pos = target.offsetTop - this.content.clientHeight / 2 + target.clientHeight / 2;
        this.content.scrollTop = pos;
    }
}

/**
 * A convenience class for generating a list of 'gradientButton'-type button elements for WT_TouchDynamicSelectionListWindow
 * from a list of string values. Each string value will be displayed in a button within a child div with the 'value' class.
 * This class also functions as an element updater; by default it leaves the button elements unchanged.
 * @property {string[]} values - an array of string values.
 */
class WT_TouchDynamicSelectionStandardElementHandler {
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
            button: document.createElement("div"),
            value: document.createElement("div")
        };
        elem.button.setAttribute("class", "gradientButton");
        elem.value.setAttribute("class", "value");
        Avionics.Utils.diffAndSet(elem.value, this.values[index]);
        elem.button.appendChild(elem.value);
        return elem;
    }

    update(index, elem) {
    }
}