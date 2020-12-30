class WT_G3x5_TSCMapPointerControl extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName, instrumentID, halfPaneID);

        this._instrumentID = instrumentID;
        this._halfPaneID = halfPaneID;
        this._controllerID = `${instrumentID}-${halfPaneID}`;

        this._tempVector = new WT_GVector2(0, 0);
        this._lastMousePos = new WT_GVector2(0, 0);
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCMapPointerControlHTMLElement} htmlElement
     * @type {WT_G3x5_TSCMapPointerControlHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    init(root) {
        this.container.title = "Map Pointer Control";

        this._htmlElement = root.querySelector(`tsc-mappointercontrol`);
        let touchPad = this.htmlElement.touchPad;
        touchPad.addEventListener("mousemove", this._onMouseMove.bind(this));
        touchPad.addEventListener("mousedown", this._onClickBegin.bind(this));
        touchPad.addEventListener("mouseup", this._onClickEnd.bind(this));
        touchPad.addEventListener("mouseleave", this._onClickEnd.bind(this));
    }

    onEnter() {
        this.gps.activateNavButton(1, "Back", this.gps.goBack.bind(this.gps), false, "ICON_TSC_BUTTONBAR_BACK.png");
        this.gps.activateNavButton(2, "Home", this._onHomePressed.bind(this), false, "ICON_TSC_BUTTONBAR_HOME.png");
        this.gps.setTopKnobText("Pan/Point Push: Pan Off");
        this.gps.setBottomKnobText("-Range+ Push: Pan Off");

        WT_MapController.setSettingValue(this._controllerID, WT_MapPointerSettingGroup.SHOW_KEY, true);
    }

    onExit() {
        this._isMouseDown = false;

        this.gps.deactivateNavButton(1);
        this.gps.deactivateNavButton(2);
        this.gps.setTopKnobText("");
        this.gps.setBottomKnobText("-Range+ Push: Pan");

        WT_MapController.setSettingValue(this._controllerID, WT_MapPointerSettingGroup.SHOW_KEY, false);
    }

    onEvent(event) {
        switch (event) {
            case "TopKnob_Small_INC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanUp");
                break;
            case "TopKnob_Small_DEC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanDown");
                break;
            case "TopKnob_Large_INC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanRight");
                break;
            case "TopKnob_Large_DEC":
                LaunchFlowEvent("ON_MOUSERECT_HTMLEVENT", "AS3000_MFD_PanLeft");
                break;
            case "TopKnob_Push":
                this.gps.goBack();
                break;
            case "BottomKnob_Push":
                this.gps.goBack();
                break;
        }
    }

    _onHomePressed() {
        this.gps.SwitchToPageName(this.homePageGroup, this.homePageName);
    }

    _onMouseMove(event) {
        if (this._isMouseDown) {
            let delta = this._tempVector.set(event.clientX, event.clientY).subtract(this._lastMousePos);
            if (delta.length > 5) {
                let deltaX = WT_MapController.getSettingValue(this._controllerID, WT_MapPointerSettingGroup.DELTA_X_KEY, 0) + delta.x;
                let deltaY = WT_MapController.getSettingValue(this._controllerID, WT_MapPointerSettingGroup.DELTA_Y_KEY, 0) + delta.y;
                WT_MapController.setSettingValue(this._controllerID, WT_MapPointerSettingGroup.DELTA_X_KEY, deltaX);
                WT_MapController.setSettingValue(this._controllerID, WT_MapPointerSettingGroup.DELTA_Y_KEY, deltaY);
                this._lastMousePos.set(event.clientX, event.clientY);
            }
        }
    }

    _onClickBegin(event) {
        this._isMouseDown = true;
        this._lastMousePos.set(event.clientX, event.clientY);
    }

    _onClickEnd() {
        this._isMouseDown = false;
    }
}

class WT_G3x5_TSCMapPointerControlHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE.content.cloneNode(true));

        this._touchPad = document.createElement("div");
        this._touchPad.id = "touchpad";
    }

    /**
     * @readonly
     * @property {HTMLDivElement} touchPad
     * @type {HTMLDivElement}
     */
    get touchPad() {
        return this._touchPad;
    }

    connectedCallback() {
        this._touchPad.slot = "touchpad";
        this.appendChild(this._touchPad);
    }
}
WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            border: 5px solid #454b4e;
            border-radius: 3px;
        }

        #touchpad {
            display: block;
        }
    </style>
    <wrapper>
        <slot name="touchpad" id="touchpad"></div>
    </wrapper>
`;

customElements.define("tsc-mappointercontrol", WT_G3x5_TSCMapPointerControlHTMLElement);