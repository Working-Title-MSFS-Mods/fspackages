
class AS1000_Procedure_Page_Model extends AS1000_Model {
    constructor(gps, flightPlan) {
        super();

        this.gps = gps;
        this.flightPlan = flightPlan;

        this.icao = null;
        this.airport = new Subject();
        this.approaches = new Subject();
        this.transitions = new Subject();
        this.sequence = new Subject();
        this.loadedSequence = new Subject();
        this.primaryFrequency = new Subject();
        this.mapCoordinates = new Subject();

        this.selectedApproach = null;
        this.selectedTransition = null;

        this.airport.subscribe(this.updateAirport.bind(this));
    }
    updateAirport(airport) {
        if (airport) {
            let infos = airport.infos;
            this.approaches.value = infos.approaches;
            this.selectApproach(infos.approaches.length > 0 ? 0 : null);
        } else {
            this.approaches.value = null;
        }
    }
    updateSequence() {
        let waypoints = [];
        if (this.selectedApproach) {
            if (this.selectedTransition) {
                for (let waypoint of this.selectedTransition.waypoints) {
                    waypoints.push(waypoint);
                }
            }
            for (let waypoint of this.selectedApproach.wayPoints) {
                waypoints.push(waypoint);
            }
        }
        this.sequence.value = waypoints;

        if (!waypoints)
            return;

        let loaded = 0;
        let failed = 0;
        for (let waypoint of waypoints) {
            FacilityLoader.Instance.getFacilityDataCB(waypoint.icao, (data) => {
                if (data) {
                    waypoint.SetFromIFacility(data);
                    loaded++;
                } else {
                    failed++;
                }
            });
        }

        let frame = () => {
            let minLatLong = null;
            let maxLatLong = null;
            for (let waypoint of waypoints) {
                if (waypoint.infos.coordinates.lat) {
                    if (minLatLong == null) {
                        minLatLong = new LatLong(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                        maxLatLong = new LatLong(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                    } else {
                        minLatLong.lat = Math.min(minLatLong.lat, waypoint.infos.coordinates.lat);
                        minLatLong.long = Math.min(minLatLong.long, waypoint.infos.coordinates.long);
                        maxLatLong.lat = Math.max(maxLatLong.lat, waypoint.infos.coordinates.lat);
                        maxLatLong.long = Math.max(maxLatLong.long, waypoint.infos.coordinates.long);
                    }
                }
            }
            if ((loaded + failed) < waypoints.length) {
                requestAnimationFrame(frame);
            } else {
                console.log(`Loaded ${loaded} / ${waypoints.length}...`);
                this.mapCoordinates.value = {
                    min: minLatLong,
                    max: maxLatLong
                };
                this.loadedSequence.value = waypoints;
            }
        }
        requestAnimationFrame(frame);
    }
    selectApproach(approachIndex) {
        if (approachIndex !== null) {
            approachIndex = parseInt(approachIndex);
            this.selectedApproach = this.airport.value.infos.approaches[approachIndex];
            this.transitions.value = this.selectedApproach.transitions;

            let destination = this.airport.value;
            let approachName = this.selectedApproach.runway;
            if (destination) {
                if (destination.infos instanceof AirportInfo) {
                    let frequency = destination.infos.frequencies.find(f => {
                        return f.name.replace("RW0", "").replace("RW", "").indexOf(approachName) !== -1;
                    });
                    if (frequency) {
                        this.primaryFrequency.value = frequency;
                    } else {
                        this.primaryFrequency.value = null;
                    }
                }
            }
        } else {
            this.selectedApproach = null;
            this.transitions.value = null;
        }
        this.approachIndex = approachIndex;
        this.selectTransition(this.transitions.value.length > 0 ? 0 : null);
    }
    selectTransition(transitionIndex) {
        if (transitionIndex !== null) {
            transitionIndex = parseInt(transitionIndex);
            this.selectedTransition = this.selectedApproach.transitions[transitionIndex];
        } else {
            this.selectedTransition = null;
        }
        this.transitionIndex = transitionIndex;
        this.updateSequence();
    }
    selectFrequency() {
        if (this.primaryFrequency.value) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "number", 0);
            SimVar.SetSimVarValue("K:NAV1_RADIO_SET_HZ", "hertz", Math.floor(parseFloat(this.primaryFrequency.value.mhValue) * 1000000));
        }
    }
    setICAO(icao) {
        this.icao = icao;
        FacilityLoader.Instance.getFacilityCB(icao, (airport) => {
            if (airport) {
                this.airport.value = airport;
            } else {
                console.log(`Failed to load "${icao}"`);
            }
        });
    }
    loadApproach() {

    }
    activateApproach() {
        this.gps.showConfirmDialog("Are you sure you want to activate this approach?").then(() => {
            if (this.airport.value.infos.icao && this.approachIndex !== null) {
                this.flightPlan.setDestination(this.airport.value.infos.icao, () => {
                    console.log("Set destination");
                    this.flightPlan.setApproachIndex(this.approachIndex, () => {
                        console.log("Set approach index");
                        this.flightPlan.activateApproach();
                        console.log("Activated approach");
                    }, this.transitionIndex ? this.transitionIndex : 0);
                });
            }
        });
    }
}

class AS1000_Approach_Page_View extends AS1000_HTML_View {
    constructor() {
        super();

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this, "drop-down-selector, numeric-input, string-input, icao-input, toggle-switch, .sequence-entry, .selectable, selectable-button"));
        this.inputLayer.setExitHandler(this);
    }
    /**
     * @param {AS1000_Approach_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.approaches.subscribe(this.updateApproaches.bind(this));
        this.model.transitions.subscribe(this.updateTransitions.bind(this));
        this.model.loadedSequence.subscribe(this.updateSequence.bind(this));
        this.model.primaryFrequency.subscribe(this.updatePrimaryFrequency.bind(this));

        this.mapProperties = new CombinedSubject([this.model.mapCoordinates, this.model.loadedSequence], (coordinates, sequence) => {
            let min = coordinates.min;
            let max = coordinates.max;

            // Delta coordinates defining boundary of waypoints
            // This needs fixing for points on the date line
            let dlon = (max.long - min.long) * Avionics.Utils.DEG2RAD;
            let dlat = (max.lat - min.lat) * Avionics.Utils.DEG2RAD;

            // Radius of eath in NM
            let R = 3440.1;

            // Use haversine formula on each direction to find max radius needed
            let a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(min.lat) * Math.cos(max.lat) * Math.pow(Math.sin(dlon / 2), 2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let distanceLat = R * c;

            /*a = Math.cos(min.lat) * Math.cos(max.lat) * Math.pow(Math.sin(dlon / 2), 2);
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            let distanceLong = R * c;*/

            let maxDistance = distanceLat / 2;//Math.max(distanceLat, distanceLong);
            //console.log(distanceLong + " " + distanceLat);

            return {
                approach: this.model.selectedApproach,
                coordinates: new LatLong((min.lat + max.lat) / 2, (min.long + max.long) / 2),
                radius: maxDistance * 1.3,
                sequence: sequence.filter(waypoint => (waypoint.infos.lat != 0))
            };
        });
        this.mapProperties.subscribe(this.updateMap.bind(this));

        //this.elements.icaoInput.ident = this.model.icao;
    }
    buildMapColors() {
        let curve = new Avionics.Curve();
        curve.interpolationFunction = Avionics.CurveTool.StringColorRGBInterpolation;

        let svgConfig = new SvgMapConfig();
        curve.add(0, svgConfig.convertColor("#000000"));
        curve.add(16000, svgConfig.convertColor("#000000"));

        let colors = [SvgMapConfig.hexaToRGB(svgConfig.convertColor("#000080"))];

        for (let i = 0; i < 60; i++) {
            let color = curve.evaluate(i * 30000 / 60);
            colors[i + 1] = SvgMapConfig.hexaToRGB(color);
        }

        console.log(JSON.stringify(colors));
        return colors;
    }
    connectedCallback() {
        let template = document.getElementById('approach-page');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();

        let bingMap = this.elements.bingMap;
        bingMap.setMode(EBingMode.VFR);
        bingMap.setBingId("approachMap");
        bingMap.addConfig({ resolution: 1024, aspectRatio: 1, heightColors: this.buildMapColors() });
        bingMap.setConfig(0);
        bingMap.setReference(EBingReference.PLANE);
        bingMap.setVisible(true);

        this.elements.approachSelector.addEventListener("change", e => this.model.selectApproach(e.target.value));
        this.elements.transitionSelector.addEventListener("change", e => this.model.selectTransition(e.target.value));
        this.elements.primaryFrequencyHz.addEventListener("selected", e => this.model.selectFrequency());
    };
    updateIcao(icao) {
        this.model.setICAO(icao);
    }
    loadApproach() {
        this.model.loadApproach();
    }
    activateApproach() {
        this.model.activateApproach();
    }
    updateMap(properties) {
        let coordinates = properties.coordinates;
        if (coordinates) {
            this.elements.bingMap.setParams({ lla: coordinates, radius: properties.radius * 1852 }); // 1852 converts NM to Metres
        }
        this.renderSequence(properties);
    }
    updatePrimaryFrequency(frequency) {
        if (frequency) {
            this.elements.primaryFrequencyName.textContent = frequency.name;
            this.elements.primaryFrequencyHz.textContent = frequency.mhValue.toFixed(3);
        } else {
            this.elements.primaryFrequencyName.textContent = "____";
            this.elements.primaryFrequencyHz.textContent = "___.__";
        }
    }
    updateApproaches(approaches) {
        this.elements.approachSelector.clearOptions();
        if (approaches) {
            let i = 0;
            for (let approach of approaches) {
                this.elements.approachSelector.addOption(i++, approach.name);
            }
        }
    }
    updateTransitions(transitions) {
        this.elements.transitionSelector.clearOptions();
        if (transitions) {
            let i = 0;
            for (let transition of transitions) {
                this.elements.transitionSelector.addOption(i++, transition.name);
            }
        }
    }
    updateSequence(waypoints) {
        if (waypoints) {
            this.elements.sequenceList.innerHTML = waypoints.map((waypoint) => {
                return `
                    <div class="sequence-entry">
                        <span class="ident">${waypoint.ident ? waypoint.ident : "USR"}</span>
                        <span class="bearing">${waypoint.bearingInFP}°</span>
                        <span class="distance">${(waypoint.distanceInFP * 0.000539957).toFixed(1)}NM</span>
                    </div>`;
            }).join("");
        } else {
            this.elements.sequenceList.innerHTML = "";
        }
    }
    renderSequence(properties) {
        let waypoints = properties.sequence;

        let _NMWidth = properties.radius * 2;
        let centerCoordinates = properties.coordinates;
        let _angularWidth = _NMWidth / 60 / Math.cos(centerCoordinates.lat * Avionics.Utils.DEG2RAD);
        let _angularHeight = _NMWidth / 60;
        let _bottomLeftCoordinates = new LatLong(centerCoordinates.lat - _angularHeight * 0.5, centerCoordinates.long - _angularWidth * 0.5);
        let _topRightCoordinates = new LatLong(centerCoordinates.lat + _angularHeight * 0.5, centerCoordinates.long + _angularWidth * 0.5);
        let _angularWidthNorth = _NMWidth / 60 / Math.cos(_topRightCoordinates.lat * Avionics.Utils.DEG2RAD);
        let _angularWidthSouth = _NMWidth / 60 / Math.cos(_bottomLeftCoordinates.lat * Avionics.Utils.DEG2RAD);

        let coordinatesToXYToRef = (coordinates) => {
            let xNorth = (coordinates.long - properties.coordinates.long) / _angularWidthNorth * 1000;
            let xSouth = (coordinates.long - properties.coordinates.long) / _angularWidthSouth * 1000;
            let deltaLat = (coordinates.lat - properties.coordinates.lat) / _angularHeight;
            let y = -deltaLat * 1000;
            deltaLat += 0.5;
            let x = xNorth * deltaLat + xSouth * (1 - deltaLat);
            return {
                x: x + 500,
                y: y + 500,
            }
        }

        // All transitions
        let transitionsPath = "";
        for (let transition of properties.approach.transitions) {
            let i = 0;
            let pathElements = transition.waypoints.map(waypoint => {
                if (!waypoint.infos.coordinates)
                    return "";
                let mapPosition = coordinatesToXYToRef(waypoint.infos.coordinates);
                if (!isNaN(mapPosition.x)) {
                    return `${(i++ == 0) ? "M" : "L"}${mapPosition.x.toFixed()} ${mapPosition.y.toFixed()}`;
                } else {
                    return "";
                }
            });
            transitionsPath += pathElements.join(" ") + " ";
        }
        this.elements.allTransitionsPath.setAttribute("d", transitionsPath);

        // Selected transition
        let i = 0;
        let pathElements = waypoints.map(waypoint => {
            let mapPosition = coordinatesToXYToRef(waypoint.infos.coordinates);
            if (!isNaN(mapPosition.x)) {
                return `${(i++ == 0) ? "M" : "L"}${mapPosition.x.toFixed()} ${mapPosition.y.toFixed()}`;
            } else {
                return "";
            }
        });
        let path = pathElements.join(" ");
        console.log(path);
        this.elements.selectedApproachPath.setAttribute("d", path);

        // Waypoints
        let waypointMarkers = [];
        waypointMarkers = waypoints.map(waypoint => {
            let mapPosition = coordinatesToXYToRef(waypoint.infos.coordinates);
            if (!isNaN(mapPosition.x)) {
                return `<g transform="translate(${mapPosition.x.toFixed()},${mapPosition.y.toFixed() - 30})">
                    <rect x="-50" y="-20" width="100" height="40" fill="white" stroke-width="2" stroke="#444"></rect>                    
                    <text x="0" y="15" fill="#000" style="text-anchor: middle;" font-family="Roboto-Bold" font-size="30">${waypoint.infos.ident}</text>
                    <path fill="#00ffff" stroke-width="2" stroke="#000" d="M0 20 L-15 40 L15 40z"></path>
                </g>`;
            } else {
                return "";
            }
        });
        this.elements.selectedApproachWaypoints.innerHTML = waypointMarkers.join("");
    }
    enter(gps, inputStack) {
        this.gps = gps;
        this.inputStack = inputStack;

        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
        this.parentNode.removeChild(this);
    }
}
customElements.define("g1000-approach-page", AS1000_Approach_Page_View);