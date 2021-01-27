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
        let waypointsFiltered = [];

        for (let j = 0; j < waypoints.length; j++) {
            if (waypoints[j]) {
                if (waypoints[j].ident == ident) {
                    waypointsFiltered.push(waypoints[j]);
                }
            }
        }

        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        waypointsFiltered = waypointsFiltered.sort((a, b) => {
            let aLatLong = new LatLong(a.infos.coordinates.lat, a.infos.coordinates.long);
            let bLatLong = new LatLong(b.infos.coordinates.lat, b.infos.coordinates.long);
            let aDistance = new Number(Avionics.Utils.computeDistance(currPos, aLatLong));
            let bDistance = new Number(Avionics.Utils.computeDistance(currPos, bLatLong));
            return aDistance - bDistance;
        });

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
				let BHold = i;
				if (i != 0 ) { 
					BHold = i + i;
				}
                fmc.onLeftInput[BHold] = () => {
                    callback(w);
                };
                fmc.onRightInput[BHold] = () => {
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
                CJ4_FMC_SelectWptPage.ShowPage(fmc, waypoints, ident, callback, page - 1);
            }
        };
        fmc.onNextPage = () => {
              if (page < Math.floor(waypoints.length / 3)) {
				CJ4_FMC_SelectWptPage.ShowPage(fmc, waypoints, ident, callback, page + 1);
            }
        };
    }
}
