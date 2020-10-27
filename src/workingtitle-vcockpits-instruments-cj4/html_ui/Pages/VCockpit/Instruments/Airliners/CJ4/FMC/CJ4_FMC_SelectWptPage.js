class CJ4_FMC_SelectWptPage {
    static ShowPage(fmc, waypoints, ident, callback, page = 0) {
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
            [""]
        ];
        //console.log("search ident: " + ident);
        let waypointsFiltered = [];

        for (let j = 0; j < waypoints.length; j++) {
            //console.log("checking: " + waypoints[j].ident + " " + waypoints[j].icao);
            if (waypoints[j].ident == ident) {
                //console.log("match! adding: " + waypoints[j].icao);
                waypointsFiltered.push(waypoints[j]);
                //console.log("pushed: " + waypoints[j].icao);
            }
        }

        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        //console.log("before sort: " + waypoints[0].icao + ", " + waypoints[1].icao + ", " + waypoints[2].icao + ", " + waypoints[3].icao);
        waypointsFiltered = waypointsFiltered.sort((a, b) => {
            let aLatLong = new LatLong(a.infos.coordinates.lat, a.infos.coordinates.long);
            let bLatLong = new LatLong(b.infos.coordinates.lat, b.infos.coordinates.long);
            let aDistance = new Number(Avionics.Utils.computeDistance(currPos, aLatLong));
            let bDistance = new Number(Avionics.Utils.computeDistance(currPos, bLatLong));
            console.log(a.icao + " " + aDistance);
            console.log(b.icao + " " + bDistance);
            return aDistance - bDistance;
        });
        //console.log("after sort: " + waypoints[0].icao + ", " + waypoints[1].icao + ", " + waypoints[2].icao + ", " + waypoints[3].icao);

        for (let i = 0; i < 3; i++) {
            let w = waypointsFiltered[i + 3 * page];
            if (w) {
                let t = "";
                let freq = "      ";
                let region = "";
                if (w.icao[0] === "V") {
                    let vorType = w.infos.type;
                    t = vorType == 2 || vorType == 3 ? " VOR-DME " : vorType == 4 || vorType == 5 ? " VORTAC  " : " VOR     ";
                    freq = w.infos.frequencyMHz.toFixed(2);
                    region = w.infos.region;
                }
                else if (w.icao[0] === "N") {
                    t = " NDB     ";
                    freq = w.infos.frequencyMHz.toFixed(3);
                    region = w.infos.region;
                }
                else if (w.icao[0] === "A") {
                    t = " AIRPORT ";
                    region = w.infos.region;
                }
                rows[4 * i] = [w.ident.padEnd(5, " ") + t + freq + "[d-text]", region + "[d-text]"];
                rows[4 * i + 1] = ["  " + w.infos.coordinates.toDegreeString() + "[d-text]"];
                fmc.onLeftInput[i] = () => {
                    //fmc.setMsg("WORKING...");
                    callback(w);
                };
                fmc.onRightInput[i] = () => {
                    //fmc.setMsg("WORKING...");
                    callback(w);
                };
            }
        }
        fmc._templateRenderer.setTemplateRaw([
            ["       SELECT WPT[blue]", (page + 1).toFixed(0) + "/" + Math.ceil((waypointsFiltered.length / 3)).toFixed(0) + "[blue] "],
            [""],
            ...rows,
            [""]
        ]);
        fmc.setMsg();
        fmc.onPrevPage = () => {
            if (page > 0) {
                CJ4_FMC_SelectWptPage.ShowPage(fmc, waypointsFiltered, callback, page - 1);
            }
        };
        fmc.onNextPage = () => {
            if (page < Math.floor(waypoints.length / 5)) {
                CJ4_FMC_SelectWptPage.ShowPage(fmc, waypointsFiltered, callback, page + 1);
            }
        };
    }
}
//# sourceMappingURL=CJ4_FMC_SelectWptPage.js.map