class WT_Waypoint_Quick_Select {
    constructor(gps, flightPlanManager) {
        this.nearestAirportList = new NearestAirportList(gps);
        this.nearestNdbsList = new NearestNDBList(gps);
        this.nearestVorsList = new NearestVORList(gps);

        this.flightPlanManager = flightPlanManager;
        this.gps = gps;

        this.recentWaypoints = JSON.parse(WTDataStore.get(this.RECENT_DATA_STORE_KEY, "[]"));
    }
    addRecentWaypoint(icao) {
        if (this.recentWaypoints.indexOf(icao) == -1) {
            this.recentWaypoints.push(icao);
        } else {
            this.recentWaypoints = this.recentWaypoints.filter(wp => wp !== icao);
            this.recentWaypoints.unshift(icao);
        }
        this.recentWaypoints.splice(50);
        WTDataStore.set(this.RECENT_DATA_STORE_KEY, JSON.stringify(this.recentWaypoints));
    }
    async loadWaypoints(icaos) {
        let wps = [];
        for (let icao of icaos) {
            let waypoint = new WayPoint(this.gps);
            await new Promise(resolve => waypoint.SetICAO(icao, resolve)).then(() => {
                wps.push(waypoint);
            });
        }
        return wps;
    }
    getFlightPlanWaypoints(type) {
        return this.flightPlanManager.getWaypoints().filter(wp => {
            return type.includes(wp.icao[0]);
        });
    }
    async getNearestList(list) {
        let i = 0;
        await new Promise(resolve => {
            let frame = () => {
                if (i++ < 10) {
                    list.Update(30, 100); // This is so mind bogglingly stupid it hurts
                    requestAnimationFrame(frame);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(frame);
        });
    }
    async getNearestWaypoints(type) {
        let wps = [];
        if (type.includes("A")) {
            await this.getNearestList(this.nearestAirportList);
            wps.push(...this.nearestAirportList.airports);
        }
        if (type.includes("N")) {
            await this.getNearestList(this.nearestNdbsList);
            wps.push(...this.nearestNdbsList.ndbs);
        }
        if (type.includes("V")) {
            await this.getNearestList(this.nearestVorsList);
            wps.push(...this.nearestVorsList.vors);
        }
        wps.sort((a, b) => {
            return a.distance - b.distance;
        });
        return wps;
    }
    /**
     * @param {String} type 
     */
    async getWaypoints(type) {
        let filter = waypoint => {
            /*if (type)
                return waypoint.type == type;*/
            return true;
        };
        return {
            nearest: (await this.getNearestWaypoints(type)).filter(filter),
            flightPlan: this.getFlightPlanWaypoints(type).filter(filter),
            recent: (await this.loadWaypoints(this.recentWaypoints.filter(wp => {
                return type.includes(wp[0]);
            }))).filter(filter),
        }
    }
}
WT_Waypoint_Quick_Select.RECENT_DATA_STORE_KEY = "MFD.WaypointQuickSelect";