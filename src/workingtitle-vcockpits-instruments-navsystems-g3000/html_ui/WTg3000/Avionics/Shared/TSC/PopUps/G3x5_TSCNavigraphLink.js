class WT_G3x5_TSCNavigraphLink extends WT_G3x5_TSCPopUpElement {
    /**
     * @param {WT_NavigraphAPI} navigraphAPI
     */
    constructor(navigraphAPI) {
        super();

        this._navigraphAPI = navigraphAPI;
        this._isReady = false;

        this._accountLinkData = null;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCNavigraphLinkHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCNavigraphLinkHTMLElement();
    }

    _initButtonListener() {
        this.htmlElement.addExecuteButtonListener(this._onExecuteButtonPressed.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized);
        this._initButtonListener();
        this._isReady = true;
        if (this.isActive) {
            this._prepareAccountLink();
        }
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    async _executeAccountLink() {
        this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.EXECUTE);
        let success = await this._navigraphAPI.executeAccountLink(this._accountLinkData.pkce, this._accountLinkData.deviceCode);
        if (success) {
            this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.EXECUTE_SUCCESS);
        } else {
            this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.EXECUTE_FAIL);
        }
    }

    _onExecuteButtonPressed(button) {
        if (!this._accountLinkData) {
            return;
        }

        this._executeAccountLink();
    }

    _openBrowser(url) {
        OpenBrowser(url);
    }

    async _prepareAccountLink() {
        this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.PREPARE);
        this._accountLinkData = await this._navigraphAPI.prepareAccountLink();
        if (this._accountLinkData) {
            this.htmlElement.setURI(this._accountLinkData.uri);
            this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.PREPARE_SUCCESS);
            this._openBrowser(this._accountLinkData.uri);
        } else {
            this.htmlElement.setURI("");
            this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.PREPARE_FAIL);
        }
    }

    onEnter() {
        super.onEnter();

        if (this._isReady) {
            this._prepareAccountLink();
        }
    }

    _reset() {
        this._accountLinkData = null;
        this.htmlElement.setURI("");
        this.htmlElement.setState(WT_G3x5_TSCNavigraphLink.State.NONE);
    }

    onExit() {
        super.onExit();

        this._reset();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCNavigraphLink.State = {
    NONE: 0,
    PREPARE: 1,
    PREPARE_FAIL: 2,
    PREPARE_SUCCESS: 3,
    EXECUTE: 4,
    EXECUTE_FAIL: 5,
    EXECUTE_SUCCESS: 6
};

class WT_G3x5_TSCNavigraphLinkHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
        this._isOpen = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCNavigraphLinkHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._uri = this.shadowRoot.querySelector(`#uri`);
        this._executeButton = await WT_CustomElementSelector.select(this.shadowRoot, `#execute`, WT_TSCLabeledButton);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    addExecuteButtonListener(listener) {
        this._executeButton.addButtonListener(listener);
    }

    removeExecuteButtonListener(listener) {
        this._executeButton.removeButtonListener(listener);
    }

    setURI(uri) {
        this._uri.innerHTML = uri.split("//").map(part => part.replace(/([/~,\-_?#%])/giu, "<wbr>$1")).join("//<wbr>");
    }

    setState(state) {
        this._wrapper.setAttribute("state", WT_G3x5_TSCNavigraphLinkHTMLElement.STATE_ATTRIBUTES[state]);
        switch (state) {
            case WT_G3x5_TSCNavigraphLink.State.PREPARE_SUCCESS:
            case WT_G3x5_TSCNavigraphLink.State.EXECUTE_FAIL:
                this._executeButton.enabled = "true";
                break;
            default:
                this._executeButton.enabled = "false";
        }
    }
}
WT_G3x5_TSCNavigraphLinkHTMLElement.STATE_ATTRIBUTES = [
    "none",
    "prepare",
    "preparefail",
    "preparesuccess",
    "execute",
    "executefail",
    "executesuccess"
];
WT_G3x5_TSCNavigraphLinkHTMLElement.NAME = "wt-tsc-navigraphlink";
WT_G3x5_TSCNavigraphLinkHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNavigraphLinkHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--navigraphlink-padding-left, 0.5em);
            top: var(--navigraphlink-padding-top, 0.5em);
            width: calc(100% - var(--navigraphlink-padding-left, 0.5em) - var(--navigraphlink-padding-right, 0.5em));
            height: calc(100% - var(--navigraphlink-padding-top, 0.5em) - var(--navigraphlink-padding-bottom, 0.5em));
            color: white;
        }
            .text {
                display: none;
                position: absolute;
                left: 0%;
                top: 50%;
                width: 100%;
                transform: translateY(-50%);
                text-align: center;
            }
            #linkpreparetext {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: calc((100% - var(--navigraphlink-executebutton-height, 2em)) / 2);
            }
                #wrapper[state="prepare"] #linkpreparewait {
                    display: block;
                }
                #wrapper[state="preparefail"] #linkpreparefail {
                    display: block;
                }
                #wrapper[state="preparesuccess"] #urimessage {
                    display: block;
                }
            #linkexecutetext {
                position: absolute;
                left: 0%;
                top: calc((100% - var(--navigraphlink-executebutton-height, 2em)) / 2);
                width: 100%;
                height: calc((100% - var(--navigraphlink-executebutton-height, 2em)) / 2);
            }
                #wrapper[state="preparesuccess"] #linkexecuteinstructions {
                    display: block;
                }
                #wrapper[state="execute"] #linkexecutewait,
                #wrapper[state="execute"] #urimessage {
                    display: block;
                }
                #wrapper[state="executefail"] #linkexecutefail,
                #wrapper[state="executefail"] #urimessage {
                    display: block;
                }
                #wrapper[state="executesuccess"] #linkexecutesuccess {
                    display: block;
                }
            #execute {
                position: absolute;
                left: 50%;
                bottom: 0%;
                width: var(--navigraphlink-executebutton-width, 50%);
                height: var(--navigraphlink-executebutton-height, 2em);
                transform: translateX(-50%);
                font-size: 1.25em;
            }
    </style>
    <div id="wrapper">
        <div id="linkpreparetext">
            <div id="linkpreparewait" class="text">Fetching pre-authorization data. Please wait...</div>
            <div id="linkpreparefail" class="text">An error has occurred.<br>Please close and re-open this window to try again.</div>
            <div id="urimessage" class="text">If a browser window doesn't automatically open in the next few seconds, please go to the following URL to login to Navigraph:<br><span id="uri"></span></div>
        </div>
        <div id="linkexecutetext">
            <div id="linkexecuteinstructions" class="text">After logging in to Navigraph and authorizing account access, click the button below to link your account.</div>
            <div id="linkexecutewait" class="text">Attempting to link account. Please wait...</div>
            <div id="linkexecutefail" class="text">The account linking process has timed out without success.</div>
            <div id="linkexecutesuccess" class="text">Account successfully linked.</div>
        </div>
        <wt-tsc-button-label id="execute" labeltext="Link Account" enabled="false"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCNavigraphLinkHTMLElement.NAME, WT_G3x5_TSCNavigraphLinkHTMLElement);