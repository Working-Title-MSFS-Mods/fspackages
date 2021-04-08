class WT_Debug_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Debug_Console_Menu} consoleMenu 
     * @param {WT_Debug_Data_Store_Menu} dataStoreMenu 
     */
    constructor(menus, consoleMenu, dataStoreMenu) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("Reload", () => {
            window.document.location.reload(true);
        }));
        this.addSoftKey(2, new WT_Soft_Key("Reload CSS", () => {
            for (let cssElement of document.querySelectorAll(`link[rel=stylesheet]`)) {
                let url = cssElement.getAttribute("href");
                url = url.split("?")[0];
                console.log(`Reloaded css: "${url.split("/").pop()}"`);
                url = url + "?" + (new Date().getTime());
                cssElement.setAttribute("href", url);
            }
        }));
        this.addSoftKey(3, new WT_Soft_Key("Console", () => { menus.goToMenu(consoleMenu); }));
        this.addSoftKey(4, new WT_Soft_Key("Data Store", () => { menus.goToMenu(dataStoreMenu); }));

        this.addSoftKey(11, menus.backKey);
    }
}

class WT_Debug_Data_Store_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     */
    constructor(menus) {
        super(false);

        this.addSoftKey(1, new WT_Soft_Key("Print", () => {
            const data = WTDataStore.getAll();
            let log = [];
            if (data) {
                const longestKey = Object.keys(data).reduce((value, current) => Math.max(value, current.length), 0);
                log.push(`${"Key".padEnd(longestKey, " ")} | Type    | Value (${Object.keys(data).length} total)`);
                log.push(`-------------------------------------------`);
                for (const key in data) {
                    const value = data[key];
                    log.push(`${key.padEnd(longestKey, " ")} | ${(typeof value).padEnd(7, " ")} | ${value}`);
                }
            }
            console.log(log.join("\n"));
        }));
        this.addSoftKey(2, new WT_Soft_Key("Empty", () => {
            WTDataStore.removeAll();
            console.log(`Deleted all data storage entries`);
        }));

        this.addSoftKey(11, menus.backKey);
    }
}

class WT_Debug_Console_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Debug_Console} debugConsole 
     */
    constructor(menus, debugConsole) {
        super(false);

        this.debugConsole = debugConsole;
        this.subscriptions = new Subscriptions();

        this.buttons = {
            notices: new WT_Soft_Key("Notices", () => debugConsole.toggleNotices()),
            warnings: new WT_Soft_Key("Warnings", () => debugConsole.toggleWarnings()),
            errors: new WT_Soft_Key("Errors", () => debugConsole.toggleErrors()),
        }

        this.addSoftKey(1, new WT_Soft_Key("Off", () => {
            debugConsole.toggleEnabled(false);
            menus.back();
        }));
        this.addSoftKey(2, new WT_Soft_Key("Clear", () => debugConsole.clear()));
        this.addSoftKey(3, this.buttons.notices);
        this.addSoftKey(4, this.buttons.warnings);
        this.addSoftKey(5, this.buttons.errors);
        this.addSoftKey(11, menus.backKey);
    }
    activate() {
        this.debugConsole.toggleEnabled(true);

        const types = this.debugConsole.types;
        const buttons = this.buttons;

        this.subscriptions.add(
            types.errors.subscribe(enabled => buttons.errors.selected = enabled),
            types.warnings.subscribe(enabled => buttons.warnings.selected = enabled),
            types.notices.subscribe(enabled => buttons.notices.selected = enabled)
        );
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}