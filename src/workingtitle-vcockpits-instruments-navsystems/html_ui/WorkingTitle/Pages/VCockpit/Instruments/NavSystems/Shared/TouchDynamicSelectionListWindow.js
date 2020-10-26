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
        this.root.classList.add(this.context.subClass);
        this.title.textContent = this.context.title;
        this.root.setAttribute("state", "Active");
        this.setElements();
        this.scrollToHighlightedButton();
    }

    onUpdate(_deltaTime) {
        let currentIndex = this.context.currentIndexGetter.getCurrentIndex();
        for (let i = 0; i < this._elementList.length; i++) {
            this.context.elementUpdater.update(this._elementList[i]);
            Avionics.Utils.diffAndSetAttribute(this._elementList[i].button, "state", (currentIndex == i) ? "Highlight" : "Active");
        }
    }

    onExit() {
        this.root.setAttribute("state", "Inactive");
        this.removeElements();
        this.root.classList.remove(this.context.subClass);
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

class WT_TouchDynamicSelectionStandardElementHandler {
    constructor(values) {
        this.values = values;
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

    update(elem) {
    }
}