class WT_Waypoint_Quick_Select {
    constructor(gps, flightPlanManager) {
        this.nearestAirportList = new NearestAirportList(gps);
        this.nearestNdbsList = new NearestNDBList(gps);
        this.nearestVorsList = new NearestVORList(gps);

        this.flightPlanManager = flightPlanManager;
        this.gps = gps;

        this.recentWaypoints = WTDataStore.get(WT_Waypoint_Quick_Select.RECENT_DATA_STORE_KEY, []);
    }
    addRecentWaypoint(icao) {
        if (this.recentWaypoints.indexOf(icao) == -1) {
            this.recentWaypoints.push(icao);
        } else {
            this.recentWaypoints = this.recentWaypoints.filter(wp => wp !== icao);
            this.recentWaypoints.unshift(icao);
        }
        this.recentWaypoints.splice(50);
        WTDataStore.set(WT_Waypoint_Quick_Select.RECENT_DATA_STORE_KEY, this.recentWaypoints);
    }
    async loadWaypoints(icaos) {
        const promises = [];
        for (let icao of icaos) {
            const waypoint = new WayPoint(this.gps);
            promises.push(new Promise(resolve => waypoint.SetICAO(icao, () => resolve(waypoint))));
        }
        return await Promise.all(promises);
    }
    getFlightPlanWaypoints(type) {
        return this.flightPlanManager.getWaypoints().filter(wp => {
            return type.includes(wp.icao[0]);
        });
    }
    getNearestList(list) {
        let i = 0;
        return new Promise(resolve => {
            const frame = () => {
                if (i++ < 10) {
                    list.Update(20, 100); // This is so mind bogglingly stupid it hurts
                    requestAnimationFrame(frame);
                } else {
                    resolve(list);
                }
            };
            requestAnimationFrame(frame);
        });
    }
    async getNearestWaypoints(type) {
        const promises = [];
        if (type.includes("A")) {
            promises.push(this.getNearestList(this.nearestAirportList).then(list => list.airports));
        }
        if (type.includes("N")) {
            promises.push(this.getNearestList(this.nearestNdbsList).then(list => list.ndbs));
        }
        if (type.includes("V")) {
            promises.push(this.getNearestList(this.nearestVorsList).then(list => list.vors));
        }
        return (await Promise.all(promises))
            .reduce((previous, current) => {
                previous.push(...current);
                return previous;
            }, [])
            .sort((a, b) => a.distance - b.distance);
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
WT_Waypoint_Quick_Select.RECENT_DATA_STORE_KEY = "WaypointQuickSelect";