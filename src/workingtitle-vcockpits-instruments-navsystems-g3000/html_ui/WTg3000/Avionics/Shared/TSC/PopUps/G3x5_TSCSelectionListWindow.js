class WT_G3x5_TSCSelectionListWindow extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_TSCSelectionList}
     */
    get selectionList() {
        return this._selectionList;
    }

    _createSelectionList() {
        return new WT_TSCSelectionList();
    }

    onInit() {
        this._selectionList = this._createSelectionList();
        this.popUpWindow.appendChild(this.selectionList);
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), true, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), true, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
    }

    onEnter() {
        super.onEnter();

        this.setTitle(this.context.title);
        this.selectionList.setContext({
            subclass: this.context.subclass,
            elementConstructor: this.context.elementConstructor,
            currentIndexGetter: this.context.currentIndexGetter,
            elementUpdater: this.context.elementUpdater,
            callback: this._onSelectionMade.bind(this),
            callbackData: this.context.callbackData
        });
        this.selectionList.open();
    }

    onExit() {
        this.selectionList.close();

        super.onExit();
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);

        this.selectionList.update();
    }

    _onUpPressed() {
        this.selectionList.scrollUp();
    }

    _onDownPressed() {
        this.selectionList.scrollDown();
    }

    _onSelectionMade(value, data) {
        this.context.callback(value, data);
        if (this.context.closeOnSelect) {
            this.instrument.goBack();
        }
    }
}

/**
 * A context for WT_G3x5_TSCSelectionListWindow.
 * @typedef WT_G3x5_TSCSelectionListWindowContext
 * @property {String} homePageGroup
 * @property {String} homePageName
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
 * @property {String} title - the window title to use when this context is active.
 * @property {Boolean} closeOnSelect - indicates whether the window should automatically close when the user selects an item.
 */