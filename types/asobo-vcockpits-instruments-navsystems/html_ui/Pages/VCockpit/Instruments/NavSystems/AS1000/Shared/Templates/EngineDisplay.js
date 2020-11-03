/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class PistonEngine extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() { return "PistonEngineTemplate"; }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("piston-engine", PistonEngine);
class TurboEngine extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() { return "TurboEngineTemplate"; }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("turbo-engine", TurboEngine);
class EngineDisplay extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() { return "EngineDisplayTemplate"; }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("engine-display", EngineDisplay);
//# sourceMappingURL=EngineDisplay.js.map