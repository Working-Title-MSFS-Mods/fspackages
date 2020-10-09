class CJ4_FMC_SelectWptPage {
    static ShowPage(fmc, waypoints, callback, page = 0) {
        fmc.clearDisplay();
        let rows = [
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ];
        for (let i = 0; i < 5; i++) {
            let w = waypoints[i + 5 * page];
            if (w) {
                let t = "";
                if (w.icao[0] === "V") {
                    t = " VOR";
                }
                else if (w.icao[0] === "N") {
                    t = " NDB";
                }
                else if (w.icao[0] === "A") {
                    t = " AIRPORT";
                }
                rows[2 * i] = [w.ident + t];
                rows[2 * i + 1] = [w.infos.coordinates.toDegreeString()];
                fmc.onLeftInput[i] = () => {
                    fmc.setMsg("WORKING...");
                    callback(w);
                };
                fmc.onRightInput[i] = () => {
                    fmc.setMsg("WORKING...");
                    callback(w);
                };
            }
        }
        fmc._templateRenderer.setTemplateRaw([
            [" WPT SELECT[blue]", (page + 1).toFixed(0) + "/" + Math.ceil((waypoints.length / 5)).toFixed(0) + "[blue] "],
            ...rows,
            [""]
        ]);
        fmc.setMsg();
        fmc.onPrevPage = () => {
            if (page > 0) {
                CJ4_FMC_SelectWptPage.ShowPage(fmc, waypoints, callback, page - 1);
            }
        };
        fmc.onNextPage = () => {
            if (page < Math.floor(waypoints.length / 5)) {
                CJ4_FMC_SelectWptPage.ShowPage(fmc, waypoints, callback, page + 1);
            }
        };
    }
}
//# sourceMappingURL=CJ4_FMC_SelectWptPage.js.map