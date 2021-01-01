class WT_G3x5_TSCTabbedContent extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCTabbedContent.TEMPLATE.content.cloneNode(true));

        this._touchPad = document.createElement("div");
        this._touchPad.id = "touchpad";
    }
}
WT_G3x5_TSCTabbedContent.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTabbedContent.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #touchpad {
            display: block;
        }
    </style>
    <wrapper>
        <div id="vert">
            <div id="topbuttons"></div>
            <div id="horiz">
                <div id="leftbuttons"></div>
                <slot name="content" id="content"></slot>
                <div id="rightbuttons"></div>
            </div>
            <div id="bottombuttons"></div>
        </div>
    </wrapper>
`;

customElements.define("tsc-tabbedcontent", WT_G3x5_TSCTabbedContent);