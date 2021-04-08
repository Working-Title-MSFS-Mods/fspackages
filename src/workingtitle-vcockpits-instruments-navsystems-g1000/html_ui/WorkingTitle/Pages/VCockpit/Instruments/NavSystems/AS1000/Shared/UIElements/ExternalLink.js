class WT_External_Link extends HTMLElement {
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        this.addEventListener("selected", () => {
            OpenBrowser(this.getAttribute("href"));
        });
    }
}
customElements.define("g1000-external-link", WT_External_Link);