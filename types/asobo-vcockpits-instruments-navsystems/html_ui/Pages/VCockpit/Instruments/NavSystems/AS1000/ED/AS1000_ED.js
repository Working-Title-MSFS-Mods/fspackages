/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class AS1000_ED extends BaseAS1000 {
    constructor() {
        super();
    }
    get templateID() { return "AS1000_ED"; }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new Engine("Engine", "Engines"));
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
    }
}
registerInstrument("as1000-ed-element", AS1000_ED);
//# sourceMappingURL=AS1000_ED.js.map