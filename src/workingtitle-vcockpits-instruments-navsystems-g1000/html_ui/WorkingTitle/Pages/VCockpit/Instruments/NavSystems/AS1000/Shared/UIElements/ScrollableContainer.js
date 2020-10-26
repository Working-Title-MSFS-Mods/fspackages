class WT_Scrollable_Container extends HTMLElement {
    constructor() {
        super();
        this.addEventListener("increment", () => this.incDesiredScroll(document.documentElement.clientHeight / 10));
        this.addEventListener("decrement", () => this.incDesiredScroll(-document.documentElement.clientHeight / 10));
        this.desiredScroll = 0;
        this.isAnimating = false;
    }
    incDesiredScroll(scroll) {
        this.desiredScroll += scroll;
        if (!this.isAnimating) {
            this.beginAnimation();
        }
    }
    beginAnimation() {
        this.isAnimating = true;
        let frame = () => {
            this.scrollTop += (this.desiredScroll - this.scrollTop) / 5;
            if (Math.abs(this.desiredScroll - this.scrollTop) > 1)
                requestAnimationFrame(frame);
            else
                this.isAnimating = false;
        }
        requestAnimationFrame(frame);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "state") {
            if (newValue == "Selected") {
                this.dispatchEvent(new Event("focus"));
            }
            if (oldValue == "Selected") {
                this.dispatchEvent(new Event("blur"));
            }
        }
    }
    static get observedAttributes() {
        return ["state"];
    }
}
customElements.define("scrollable-container", WT_Scrollable_Container);