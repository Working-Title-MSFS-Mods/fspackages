class WT_TSCScrollList extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_TSCScrollList.TEMPLATE.content.cloneNode(true));
    }
}
WT_TSCScrollList.TEMPLATE = document.createElement("template");
WT_TSCScrollList.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: scroll;
        }
            #wrapper::-webkit-scrollbar {
                width: var(--scrolllist-scrollbar-width, 1vw);
            }
            #wrapper::-webkit-scrollbar-track {
                background: none;
            }
            #wrapper::-webkit-scrollbar-thumb {
                background: var(--scrolllist-scrollbar-thumb-background, white);
            }

            #content {
                position: relative;
                left: var(--scrolllist-padding-left, 2%);
                width: calc(100% - var(--scrolllist-padding-left, 2%) - var(--scrolllist-padding-right, 2%));
                padding-top: var(--scrolllist-padding-top, 2%);
                padding-bottom: var(--scrolllist-padding-bottom, 2%);
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
            }

    </style>
    <div id="wrapper">
        <slot name="content" id="content"></slot>
    </div>
`;

customElements.define("tsc-scrolllist", WT_TSCScrollList);