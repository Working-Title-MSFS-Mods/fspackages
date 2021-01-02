class WT_G3x5_TSCTabbedView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCTabbedView.TEMPLATE.content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCTabEntry[]}
         */
        this._tabs = [];
        this._activeTabEntry = null;
        this._oldActiveTabEntry = null;
        this._isInit = false;
    }

    _defineChildren() {
        this._buttonContainers = [
            this.shadowRoot.querySelector(`#leftbuttons`),
            this.shadowRoot.querySelector(`#topbuttons`),
            this.shadowRoot.querySelector(`#rightbuttons`),
            this.shadowRoot.querySelector(`#bottombuttons`)
        ]
        this._content = this.shadowRoot.querySelector(`content`);
    }

    _initTabs() {
        for (let entry of this._tabs) {
            this._attachTab(entry);
        }
    }

    connectedCallback() {
        this._defineChildren();
        this._initTabs();
        this._isInit = true;
        this._updateActiveTab();
    }

    /**
     *
     * @param {WT_G3x5_TSCTabEntry} entry
     */
    _attachTab(entry) {
        let buttonContainer = this._buttonContainers[entry.buttonPosition];
        entry.button.slot = buttonContainer.id;
        entry.button.classList.add(WT_G3x5_TSCTabbedView.TAB_BUTTON_CLASS[entry.buttonPosition]);
        entry.button.labelText = entry.tab.title;
        entry.button.setPosition(entry.buttonPosition);
        entry.button.setSelected(false);
        entry.button.addButtonListener(this._onTabButtonPressed.bind(this, entry));
        entry.tab.htmlElement.style.display = "none";
        this.appendChild(entry.button);

        entry.tab.htmlElement.slot = "content";
        this.appendChild(entry.tab.htmlElement);
        entry.tab.onAttached();
    }

    _onTabButtonPressed(entry, button) {
        this.setActiveTab(entry.tab);
    }

    /**
     *
     * @param {WT_G3x5_TSCTabEntry} entry
     */
    _activateTab(entry) {
        if (!entry) {
            return;
        }

        entry.tab.htmlElement.style.display = "block";
        entry.button.setSelected(true);
        entry.tab.onActivated();
    }

    /**
     *
     * @param {WT_G3x5_TSCTabEntry} entry
     */
    _deactivateTab(entry) {
        if (!entry) {
            return;
        }

        entry.tab.htmlElement.style.display = "none";
        entry.button.setSelected(false);
        entry.tab.onDeactivated();
    }

    _updateActiveTab() {
        if (!this._activeTabEntry) {
            return;
        }

        this._deactivateTab(this._oldActiveTabEntry);
        this._activateTab(this._activeTabEntry);
    }

    /**
     *
     * @param {WT_G3x5_TSCTabContent} tab
     * @param {WT_G3x5_TSCTabbedView.TabButtonPosition} [buttonPosition]
     * @param {Boolean} [enabled]
     */
    addTab(tab, buttonPosition = WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, enabled = true) {
        let button = new WT_G3x5_TSCTabButton();
        button.enabled = enabled ? "true" : "false";

        let entry = {
            tab: tab,
            buttonPosition: buttonPosition,
            button: button
        };

        this._tabs.push(entry);

        if (this._isInit) {
            this._attachTab(entry);
        }
        return this._tabs.length - 1;
    }

    /**
     *
     * @returns {WT_G3x5_TSCTabContent}
     */
    getActiveTab() {
        return this._activeTabEntry ? this._activeTabEntry.tab : null;
    }

    setActiveTab(tab) {
        let index = this._tabs.findIndex(entry => entry.tab === tab);
        if (index >= 0) {
            this.setActiveTabIndex(index);
        }
    }

    setActiveTabIndex(index) {
        this._oldActiveTabEntry = this._activeTabEntry;
        this._activeTabEntry = this._tabs[index];
        if (this._isInit) {
            this._updateActiveTab();
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCTabbedView.TabButtonPosition = {
    LEFT: 0,
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3
}
WT_G3x5_TSCTabbedView.TAB_BUTTON_CLASS = [
    "leftTabButton",
    "topTabButton",
    "rightTabButton",
    "bottomTabButton"
];
WT_G3x5_TSCTabbedView.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTabbedView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        slot {
            display: block;
        }

        #vert {
            position: relative;
            display: flex;
            flex-flow: column nowrap;
        }

        #horiz {
            position: relative;
            display: flex;
            flex-flow: row nowrap;
        }

        #content {
            position: relative;
            width: var(--tab-content-width, 50vh);
            height: var(--tab-content-height, 50vh);
            background-color: var(--tab-content-background-color, black);
            border: 3px solid #d3eaf9;
            border-radius: 10px;
            overflow: hidden;
        }
    </style>
    <div id="wrapper">
        <div id="vert">
            <slot name="topbuttons" id="topbuttons"></slot>
            <div id="horiz">
                <slot name="leftbuttons" id="leftbuttons"></slot>
                <slot name="content" id="content"></slot>
                <slot name="rightbuttons" id="rightbuttons"></slot>
            </div>
            <slot name="bottombuttons" id="bottombuttons"></slot>
        </div>
    </div>
`;

customElements.define("tsc-tabbedview", WT_G3x5_TSCTabbedView);

/**
 * @typedef WT_G3x5_TSCTabEntry
 * @property {WT_G3x5_TSCTabContent} tab
 * @property {WT_G3x5_TSCTabButton} button
 * @property {WT_G3x5_TSCTabbedView.TabButtonPosition} buttonPosition
 */

class WT_G3x5_TSCTabButton extends WT_TSCLabeledButton {
    _initHostStyle() {
        return `
            :host {
                display: block;
                font-weight: bold;
                position: relative;
                margin: 0.5vh;
                text-align: center;
                color: black;
                overflow: hidden;
            }
            :host([selected=true]) {
                background-color: #d3eaf9;
            }
            :host([enabled=false]) {
                color: gray;
            }

            :host([position="${WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT}"]) {
                border-radius: 4px 0 0 4px;
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT}"]) {
                background: linear-gradient(to right, #7fa5c9 90%, #277199);
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT}"][enabled=false]) {
                background: linear-gradient(to right, #485c6d 90%, #0d2733);
            }

            :host([position="${WT_G3x5_TSCTabbedView.TabButtonPosition.TOP}"]) {
                border-radius: 4px 4px 0 0;
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.TOP}"]) {
                background: linear-gradient(to bottom, #7fa5c9 90%, #277199);
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.TOP}"][enabled=false]) {
                background: linear-gradient(to bottom, #485c6d 90%, #0d2733);
            }

            :host([position="${WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT}"]) {
                border-radius: 0 4px 4px 0;
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT}"]) {
                background: linear-gradient(to left, #7fa5c9 90%, #277199);
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.RIGHT}"][enabled=false]) {
                background: linear-gradient(to left, #485c6d 90%, #0d2733);
            }

            :host([position="${WT_G3x5_TSCTabbedView.TabButtonPosition.BOTTOM}"]) {
                border-radius: 0 0 4px 4px;
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.BOTTOM}"]) {
                background: linear-gradient(to top, #7fa5c9 90%, #277199);
            }
            :host(:not([selected=true])[position="${WT_G3x5_TSCTabbedView.TabButtonPosition.BOTTOM}"][enabled=false]) {
                background: linear-gradient(to top, #485c6d 90%, #0d2733);
            }
        `;
    }

    setPosition(position) {
        this.setAttribute("position", position);
    }

    setSelected(value) {
        this.setAttribute("selected", value ? "true" : "false");
    }
}

customElements.define("tsc-button-tab", WT_G3x5_TSCTabButton);

class WT_G3x5_TSCTabContent {
    constructor(title) {
        this._title = title;
    }

    /**
     * @readonly
     * @property {String} title
     * @type {String}
     */
    get title() {
        return this._title;
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return undefined;
    }

    onAttached() {
        this.htmlElement.classList.add(WT_G3x5_TSCTabContent.CLASS);
    }

    onActivated() {
    }

    onDeactivated() {
    }
}
WT_G3x5_TSCTabContent.CLASS = "tab";