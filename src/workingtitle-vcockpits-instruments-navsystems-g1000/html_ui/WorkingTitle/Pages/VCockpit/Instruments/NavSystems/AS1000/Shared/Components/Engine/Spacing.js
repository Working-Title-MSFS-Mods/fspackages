class XMLSpacing extends HTMLElement {
    constructor() {
        super(...arguments);
    }
    setSpacing(_value) {
        this.style.height = `${_value}vh`;
    }
    update(_context) {
    }
}
customElements.define('glasscockpit-xmlspacing', XMLSpacing);