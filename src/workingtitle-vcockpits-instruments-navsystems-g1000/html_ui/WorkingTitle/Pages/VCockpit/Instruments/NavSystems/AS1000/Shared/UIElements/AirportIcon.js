class AS1000_Airport_Icon extends HTMLElement {
    constructor() {
        super();

        this._angle = 0;

        let template = document.getElementById('airport-icon');
        let shadowRoot = this.attachShadow({ mode: 'closed' });
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.elements = {
            runway: shadowRoot.querySelector(".runway"),
            color: shadowRoot.querySelector(".color"),
        };
    }
    static get observedAttributes() {
        return ['angle', 'designation'];
    }
    set color(color) {
        this.style.color = color;
    }
    get angle() {
        return this._angle;
    }
    set angle(angle) {
        this._angle = angle;
        this.elements.runway.setAttribute("transform", `rotate(${this.angle} 50 50)`);
        this.setAttribute("angle", this.angle);
    }
    applyInfo(info) {
        let toweredColor = "#3080FF";
        let untoweredColor = "#A03080";

        let towered = info.towered;
        this.setAttribute("towered", towered ? "true" : "false");
        this.setAttribute("serviced", (info.fuel !== "") ? "true" : "false");

        switch (info.airportClass) {
            case 0:
                break;
            case 1: {
                this.setAttribute("type", "hard");
                this.color = towered ? toweredColor : untoweredColor;
                break;
            }
            case 2: {
                this.setAttribute("type", "soft");
                this.color = towered ? toweredColor : untoweredColor;
                //type = "soft";
                break;
            }
            case 3: {
                //type = "sea";
                break;
            }
            case 4: {
                //type = "heliport";
                break;
            }
            case 5: {
                //type = "private";
                break;
            }
        }

    }
}
customElements.define("airport-icon", AS1000_Airport_Icon);