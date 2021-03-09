class WT_G3x5_TSCGradientDiv extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCGradientDiv.TEMPLATE.content.cloneNode(true));
    }
}
WT_G3x5_TSCGradientDiv.TEMPLATE = document.createElement("template");
WT_G3x5_TSCGradientDiv.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background: linear-gradient(#1f3445, black 10%);
            background-color: var(--gradientdiv-background-color, black);
            border: var(--gradientdiv-border-width, 0.4vh) solid var(--gradientdiv-border-color, #454b4e);
            border-radius: var(--gradientdiv-border-radius, 5px);
        }

        #content {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
    <slot name="content" id="content"></slot>
`;

customElements.define("tsc-gradientdiv", WT_G3x5_TSCGradientDiv);