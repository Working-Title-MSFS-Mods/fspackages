/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class TemplateElement extends UIElement {
    constructor() {
        super();
        this.created = false;
        this.instantciatePopupToolbar = () => {
            let localPopup = document.createElement('local-popup');
            this.appendChild(localPopup);
            this.classList.add('local-popup-container');
        };
        this.callbackCreated = () => {
            this.dispatchEvent(new Event("created"));
        };
    }

    get templateID() {
        return "";
    }
    ;

    Instanciate() {
        if (this.templateID == undefined || this.templateID == "")
            return null;
        var templateImport = InstanciateTemplate2(this.templateID, this);
        if (!templateImport) {
            console.warn("INSTANCIATE FAILED!!");
            return;
        }
        this.appendChild(templateImport);
        let tElement = document.getElementById(this.templateID);
        if (tElement) {
            for (let attribute of tElement.attributes) {
                if (attribute.name != "id" && attribute.name != "type") {
                    if (!this.hasAttribute(attribute.name))
                        this.setAttribute(attribute.name, attribute.value);
                }
            }
        }
        window.clearTimeout(g_checkComponentsTimeout);
        // Unresolved variables (probably meant to be inside an immediately invoked function expression)
        // g_checkComponentsTimeout = window.setTimeout(() => {
        //     g_ComponentMgr.checkAllComponents();
        // });
    }

    querySelectorH(str) {
        return this.querySelector(str);
    }

    appendContent(element) {
        let destination = this.querySelector('[content-slot]') ? this.querySelector('[content-slot]') : this;
        destination.appendChild(element);
    }

    onResourceLoaded(e) {
        if (this.convertPath(e.detail) == this.convertPath(this.getAttribute("href")))
            this.Instanciate();
    }

    convertPath(path) {
        return path.split("/").pop().replace(".html", "").replace(".js", "").toUpperCase();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    connectedCallback() {
        if (!this["Instanciate"]) {
            console.error("UI IS BROKEN, forcing a reload of the page");
            window.location.reload();
            return;
        }
        super.connectedCallback();
        if (this.created == true)
            return;
        if (!this["Instanciate"]) {
            debugger;
            console.error("STRANGE ERROR, the Template Element doesn't have the Instanciate function " + this.innerHTML, this);
        }
        this.Instanciate();
        this.setAttribute("created", "true");
        this.created = true;
        if (this.hasAttribute('has-popup-toolbar')) {
            Include.addImports(["/templates/localPopup/localPopup.html"], this.instantciatePopupToolbar);
        }
        setTimeout(this.callbackCreated);
    }
}