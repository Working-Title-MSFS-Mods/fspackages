class Jet_MFD_NDInfo extends HTMLElement {
    constructor() {
        super(...arguments);
        this._navMode = Jet_NDCompass_Navigation.NAV;
        this._navSource = 0;
        this._showILS = false;
        this._showET = false;
        this._dTime = 0;
        this._chronoValue = 0;
        this._chronoStarted = false;
        this._aircraft = Aircraft.A320_NEO;
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
        }
    }
    connectedCallback() {
        this.groundSpeed = this.querySelector("#GS_Value");
        this.trueAirSpeed = this.querySelector("#TAS_Value");
        this.windDirection = this.querySelector("#Wind_Direction");
        this.windStrength = this.querySelector("#Wind_Strength");
        this.windArrow = this.querySelector("#Wind_Arrow");
        this.topTitle = this.querySelector("#Title_Text");
        this.approach = this.querySelector("#Approach");
        this.approachType = this.querySelector("#APP_Type");
        this.approachFreq = this.querySelector("#APP_Freq");
        this.approachCourse = this.querySelector("#APP_Course_Value");
        this.approachInfo = this.querySelector("#APP_Info");
        this.approachDistance = this.querySelector("#APP_Distance_Value");
        this.waypoint = this.querySelector("#Waypoint");
        this.waypointName = this.querySelector("#WP_Name");
        this.waypointTrack = this.querySelector("#WP_Track_Value");
        this.waypointDistance = this.querySelector("#WP_Distance_Value");
        this.VORLeft = new VORDMENavAid(this.querySelector("#VORDMENavaid_Left"), 1);
        this.VORRight = new VORDMENavAid(this.querySelector("#VORDMENavaid_Right"), 2);
        this.elapsedTime = this.querySelector("#ElapsedTime");
        this.elapsedTimeValue = this.querySelector("#ET_Value");
        this.minimums = this.querySelector("#MinimumsValue");
        this.pfdMessage = this.querySelector('#PFDMessage');
        this.setGroundSpeed(0, true);
        this.setTrueAirSpeed(0, true);
        this.setWind(0, 0, 0, true);
        this.setWaypoint("", 0, 0, 0, true);
        this.setMode(this._navMode, this._navSource, true);
    }
    update(_dTime) {
        this._dTime = _dTime / 1000;

        this.updateTitle();
        this.updateSpeeds();
        this.updateWaypoint();
        this.updateVOR();
        this.updateApproach();
        this.updateElapsedTime();
        this.updateMinimums();
        this.updateWaypointAlert(_dTime);
        this.updatePFDMessage();
    }
    onEvent(_event) {
        if (_event == "Push_ET") {
            if (!this._showET) {
                this._showET = true;
                this._chronoValue = 0;
                this._chronoStarted = true;
            }
            else if (this._chronoStarted) {
                this._chronoStarted = false;
            }
            else {
                this._showET = false;
            }
        }
    }

    /**
     * Updates the waypoint alert flash for the FMS data block.
     * @param {number} deltaTime The delta time since the last frame.
     */
    updateWaypointAlert(deltaTime) {
        const isAlertSet = SimVar.GetSimVarValue('L:WT_CJ4_WPT_ALERT', 'number') === 1;
        if (this._isWaypointAlerting !== isAlertSet) {
            this._alertAnimationNextTime = 0;
            this._alertAnimationElapsed = 0;
            this._isWaypointAlerting = isAlertSet;

            if (!isAlertSet) {
                this._displayWaypointInfo = true;
                this.waypointName.style.visibility = 'visible';
                this.waypointDistance.parentElement.style.visibility = 'visible';
            }
        }

        if (this._isWaypointAlerting) {
            this._alertAnimationElapsed += deltaTime;
            while (this._alertAnimationElapsed >= this._alertAnimationNextTime) {
                this._displayWaypointInfo = this._displayWaypointInfo ? false : true;
                this._alertAnimationNextTime += 500;
            }

            this.waypointName.style.visibility = this._displayWaypointInfo ? 'visible' : 'hidden';
            this.waypointDistance.parentElement.style.visibility = this._displayWaypointInfo ? 'visible' : 'hidden';
        }      
    }

    /**
     * Updates the PFD message line as necessary.
     */
    updatePFDMessage() {
        if (this.pfdMessage) {
            const navSensitivity = SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number');
            if (navSensitivity !== this._currentNavSensitivity) {
                this._currentNavSensitivity = navSensitivity;

                switch (navSensitivity) {
                    case 0:
                        this.pfdMessage.textContent = '';
                        this.pfdMessage.style.color = 'white';
                        break;
                    case 1:
                        this.pfdMessage.textContent = 'TERM';
                        this.pfdMessage.style.color = 'white';
                        break;
                    case 2:
                        this.pfdMessage.textContent = 'LPV TERM';
                        this.pfdMessage.style.color = 'white';
                        break;
                    case 3:
                        this.pfdMessage.textContent = 'APPR';
                        this.pfdMessage.style.color = 'white';
                        break;
                    case 4:
                        this.pfdMessage.textContent = 'LPV APPR';
                        this.pfdMessage.style.color = 'white';
                        break;
                }
            }
        }  
    }

    showILS(_val) {
        this._showILS = _val;
    }
    setMode(_navMode, _navSource, _force = false) {
        if (this._navMode != _navMode || this._navSource != _navSource || _force) {
            this._navMode = _navMode;
            this._navSource = _navSource;
            if (this._navMode == Jet_NDCompass_Navigation.NAV) {
                if (this.waypoint)
                    this.waypoint.style.display = "block";
                    this.waypointName.textContent = this._name;
                    this.waypointTrack.textContent = this._track;
                    this.waypointDistance.textContent = this._distance;
                if (this.approach) {
                    this.approachType.textContent = "";
                    this.approachFreq.textContent = "";
                    this.approachCourse.textContent = "";
                    this.approachInfo.textContent = "";
                    this.approach.style.display = "none";
                }
            }
            else if (this._navMode == Jet_NDCompass_Navigation.ILS || this._navMode == Jet_NDCompass_Navigation.VOR) {
                if (this.waypoint) {
                    this.waypointName.textContent = "";
                    this.waypointTrack.textContent = "";
                    this.waypointDistance.textContent = "";
                    this.waypoint.style.display = "none";
                }
                if (this.approach)
                    this.approach.style.display = "block";
            }
        }
    }

    /**
     * Handles when the map display style is changed.
     * @param {Jet_NDCompass_Display} style The map compass display style. 
     */
    onDisplayChange(style) {
        this.VORLeft.onDisplayChange(style);
        this.VORRight.onDisplayChange(style);
    }
    
    updateSpeeds() {
        this.setGroundSpeed(Math.round(Simplane.getGroundSpeed()));
        this.setTrueAirSpeed(Math.round(Simplane.getTrueSpeed()));
        this.setWind(Math.round(Simplane.getWindDirection()), Math.round(Simplane.getWindStrength()), Simplane.getHeadingMagnetic());
    }
    updateWaypoint() {
        let forceUpdate = false;
        if (this._previousNavMode && (this._previousNavMode !== this._navMode)) {
            forceUpdate = true;
        }

        this.setWaypoint(Simplane.getNextWaypointName(), Math.round(Simplane.getNextWaypointTrack()), Simplane.getNextWaypointDistance(), Simplane.getNextWaypointETA(), forceUpdate);
        this._previousNavMode = this._navMode;
    }
    setGroundSpeed(_speed, _force = false) {
        if ((_speed != this.currentGroundSpeed) || _force) {
            this.currentGroundSpeed = _speed;
            if (this.groundSpeed != null) {
                this.groundSpeed.textContent = this.currentGroundSpeed.toString().padStart(3, "0");
            }
        }
    }
    setTrueAirSpeed(_speed, _force = false) {
        if ((_speed != this.currentTrueAirSpeed) || _force) {
            this.currentTrueAirSpeed = _speed;
            if (this.trueAirSpeed != null) {
                this.trueAirSpeed.textContent = this.currentTrueAirSpeed.toString().padStart(3, "0");
            }
        }
    }
    setWind(_windAngle, _windStrength, _planeAngle, _force = false) {
        var refreshWindAngle = ((_windAngle != this.currentWindAngle) || _force);
        var refreshWindStrength = ((_windStrength != this.currentWindStrength) || _force);
        var refreshWindArrow = (refreshWindAngle || refreshWindStrength || (_planeAngle != this.currentPlaneAngle) || _force);
        let windStrongEnough = (this.currentWindStrength >= Jet_MFD_NDInfo.MIN_WIND_STRENGTH_FOR_ARROW_DISPLAY) ? true : false;
        if (refreshWindAngle) {
            let startAngle = this.currentWindAngle;
            let endAngle = _windAngle;
            let delta = endAngle - startAngle;
            if (delta > 180) {
                startAngle += 360;
            }
            else if (delta < -180) {
                endAngle += 360;
            }
            let smoothedAngle = Utils.SmoothSin(startAngle, endAngle, 0.25, this._dTime);
            this.currentWindAngle = smoothedAngle % 360;
            if (this.windDirection != null) {
                if (windStrongEnough)
                    this.windDirection.textContent = this.currentWindAngle.toFixed(0).padStart(3, "0");
                else
                    this.windDirection.textContent = "---";
            }
        }
        if (refreshWindStrength) {
            this.currentWindStrength = _windStrength;
            if (this.windStrength != null) {
                this.windStrength.textContent = this.currentWindStrength.toString().padStart(2, "0");
            }
        }
        if (refreshWindArrow) {
            this.currentPlaneAngle = _planeAngle;
            if (this.windArrow != null) {
                {
                    var arrowAngle = this.currentWindAngle - this.currentPlaneAngle;
                    arrowAngle += 180;
                    var transformStr = this.windArrow.getAttribute("transform");
                    var split = transformStr.split("rotate");
                    if ((split != null) && (split.length > 0)) {
                        this.windArrow.setAttribute("transform", split[0] + " rotate(" + arrowAngle + ")");
                    }
                    this.windArrow.style.display = "block";
                }
            }
        }
    }
    setWaypoint(_name, _track, _distance, _eta, _force = false) {
        if (this.waypoint) {
            if (this._navMode == Jet_NDCompass_Navigation.NAV) {
                if (_name && _name != "") {
                    if (this.waypointName != null) {
                        this.waypointName.textContent = _name;
                    }
                    if ((_track != this.currentWaypointTrack) || _force) {
                        this.currentWaypointTrack = _track;
                        if (this.waypointTrack) {
                            this.waypointTrack.textContent = this.currentWaypointTrack.toString().padStart(3, "0");
                        }
                    }
                    if ((_distance != this.currentWaypointDistance) || _force) {
                        this.currentWaypointDistance = _distance;
                        if (this.waypointDistance != null) {
                            if (this.currentWaypointDistance < 100)
                                this.waypointDistance.textContent = this.currentWaypointDistance.toFixed(1);
                            else
                                this.waypointDistance.textContent = this.currentWaypointDistance.toFixed(0);
                        }
                    }
                }
                else {
                    if (this.waypointName != null) {
                        this.waypointName.textContent = "";
                    }
                    if (this.waypointTrack != null) {
                        this.waypointTrack.textContent = "---";
                    }
                    if (this.waypointDistance != null) {
                        this.waypointDistance.textContent = "-.-";
                    }
                }
            }
        }
    }
    updateTitle() {
        if (this.topTitle != null) {
            switch (this._navMode) {
                case Jet_NDCompass_Navigation.NAV:
                    {
                        let ilsText = null;
                        if (this._showILS)
                            ilsText = this.getILSIdent();
                        if (ilsText) {
                            this.topTitle.textContent = ilsText;
                            this.topTitle.setAttribute("state", "ils");
                        }
                        else {
                            this.topTitle.textContent = "";
                            this.topTitle.removeAttribute("state");
                        }
                        break;
                    }
                case Jet_NDCompass_Navigation.VOR:
                    {
                        this.topTitle.textContent = "VOR";
                        this.topTitle.removeAttribute("state");
                        break;
                    }
                case Jet_NDCompass_Navigation.ILS:
                    {
                        this.topTitle.textContent = "ILS";
                        this.topTitle.removeAttribute("state");
                        break;
                    }
                default:
                    {
                        this.topTitle.textContent = "";
                        break;
                    }
            }
        }
    }
    updateVOR() {
        if (this.VORLeft != null) {
            this.VORLeft.update(this.gps, this.aircraft, this._navMode, this._navSource);
        }
        if (this.VORRight != null) {
            this.VORRight.update(this.gps, this.aircraft, this._navMode, this._navSource);
        }
    }
    updateApproach() {
        if (this.approach != null) {

            //CJ4 - No PFD switch for ILS display mode, so auto-detect
            if (this._navMode === Jet_NDCompass_Navigation.VOR) {
                const radioFix = this.gps.radioNav.getVORBeacon(this._navSource);
                if (radioFix.name && radioFix.name.indexOf("ILS") !== -1) {
                    this._navMode = Jet_NDCompass_Navigation.ILS;
                }       
            }

            switch (this._navMode) {
                case Jet_NDCompass_Navigation.VOR:
                    {
                        let vor;
                        if (this._navSource == 0)
                            vor = this.gps.radioNav.getBestVORBeacon();
                        else {
                            vor = this.gps.radioNav.getVORBeacon(this._navSource);
                            vor.distance = this.getDMEDistance(this._navSource);
                        }

                        let suffix = "";
                        if (vor.id == 1 || this._navSource == 1) {
                            if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4)
                                suffix = "1";
                            else
                                suffix = " L";
                        }
                        else if (vor.id == 2 || this._navSource == 2) {
                            if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4)
                                suffix = "2";
                            else
                                suffix = " R";
                        }
                        let type = "VOR";
                        let freq = "----";
                        let course = "---";
                        let ident = "";
                        let distance = "----";

                        if (vor.id > 0) {
                            freq = vor.freq.toFixed(2);
                            course = Utils.leadingZeros(Math.round(vor.course), 3);
                            ident = vor.ident;
                            if (this.aircraft == Aircraft.CJ4) {
                                let hasLocalizer = SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + vor.id, "Bool");
                                if (hasLocalizer)
                                    type = "LOC";
                            }
                            
                            if (vor.distance) {
                                if (vor.distance < 100)
                                    vor.distance = vor.distance.toFixed(1);
                                else
                                    vor.distance = vor.distance.toFixed(0);
                                distance = vor.distance;
                            }
                        }
                        this.approachType.textContent = type + suffix;
                        this.approachFreq.textContent = freq;
                        this.approachCourse.textContent = course;
                        this.approachInfo.textContent = ident;
                        this.approachDistance.textContent = distance;

                        if (this.aircraft != Aircraft.CJ4) {
                            this.approachFreq.setAttribute("class", "ValueVor");
                            this.approachCourse.setAttribute("class", "ValueVor");
                            this.approachInfo.setAttribute("class", "ValueVor");
                        }
                        break;
                    }
                case Jet_NDCompass_Navigation.ILS:
                    {
                        let ils;
                        if (this._navSource == 0)
                            ils = this.gps.radioNav.getBestILSBeacon();
                        else {
                            ils = this.gps.radioNav.getILSBeacon(this._navSource);
                            ils.distance = this.getDMEDistance(this._navSource);
                        }

                        let suffix = "";
                        if (ils.id == 1 || ils.id == 2 || this._navSource == 1) {
                            if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4)
                                suffix = "1";
                            else
                                suffix = " L";
                        }
                        else if (ils.id == 2 || ils.id == 4 || this._navSource == 2) {
                            if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4)
                                suffix = "2";
                            else
                                suffix = " R";
                        }
                        let type = "ILS";
                        let freq = "--.--";
                        let course = "---";
                        let ident = "";
                        let distance = "----";

                        if (ils.id > 0) {
                            freq = ils.freq.toFixed(2);
                            course = Utils.leadingZeros(Math.round(ils.course), 3);
                            ident = ils.name;

                            if (ils.distance) {
                                if (ils.distance < 100)
                                    ils.distance = ils.distance.toFixed(1);
                                else
                                    ils.distance = ils.distance.toFixed(0);
                                distance = ils.distance;
                            }
                        }

                        this.approachType.textContent = type + suffix;
                        this.approachFreq.textContent = freq;
                        this.approachCourse.textContent = course;
                        this.approachInfo.textContent = ident;
                        this.approachDistance.textContent = distance;

                        if (this.aircraft != Aircraft.CJ4) {
                            this.approachFreq.setAttribute("class", "ValueIls");
                            this.approachCourse.setAttribute("class", "ValueIls");
                            this.approachInfo.setAttribute("class", "ValueIls");
                        }
                        break;
                    }
            }
        }
    }
    updateElapsedTime() {
        if (this.elapsedTime) {
            if (this._showET) {
                if (this._chronoStarted) {
                    this._chronoValue += this._dTime;
                }
                var hours = Math.floor(this._chronoValue / 3600);
                var minutes = Math.floor((this._chronoValue - (hours * 3600)) / 60);
                var seconds = Math.floor(this._chronoValue - (minutes * 60) - (hours * 3600));
                let val = "";
                if (hours > 0) {
                    if (hours < 10)
                        val += "0";
                    val += hours;
                    val += ":";
                    if (minutes < 10)
                        val += "0";
                    val += minutes;
                }
                else {
                    if (minutes < 10)
                        val += "0";
                    val += minutes;
                    val += ":";
                    if (seconds < 10)
                        val += "0";
                    val += seconds;
                }
                this.elapsedTimeValue.textContent = val;
                this.elapsedTime.style.display = "block";
            }
            else {
                this.elapsedTime.style.display = "none";
            }
        }
    }
    updateMinimums() {
        if (this.minimums) {
            let baroSet = SimVar.GetSimVarValue("L:WT_CJ4_BARO_SET", "Number");
            this.minimums.textContent = baroSet;
            this.minimums.parentElement.style.display = (baroSet==0) ? 'none' : '';
        }
    }
    getILSIdent() {
        let localizer = this.gps.radioNav.getBestILSBeacon();
        if (localizer.id > 0) {
            return localizer.name;
        }
        return null;
    }

    /**
     * Gets the current VOR beacon for a given nav radio index.
     * @param {*} navRadioIndex The current nav radio index to look up.
     * @returns {*} The current nav beacon, if tuned.
     */
    getVORBeacon(navRadioIndex) {
        this.gps.radioNav.navBeacon.reset();
        let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:" + navRadioIndex, "Bool");

        if (hasNav) {
            this.gps.radioNav.navBeacon.id = navRadioIndex;
            this.gps.radioNav.navBeacon.freq = SimVar.GetSimVarValue("NAV FREQUENCY:" + navRadioIndex, "MHz");
            this.gps.radioNav.navBeacon.course = SimVar.GetSimVarValue("NAV OBS:" + navRadioIndex, "degree");
            this.gps.radioNav.navBeacon.name = SimVar.GetSimVarValue("NAV NAME:" + navRadioIndex, "string");
            this.gps.radioNav.navBeacon.ident = SimVar.GetSimVarValue("NAV IDENT:" + navRadioIndex, "string");
            if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "bool"))
                this.gps.radioNav.navBeacon.course += 180;
        }

        return this.gps.radioNav.navBeacon;
    }

    /**
     * Gets the DME distance for a given tuned nav radio index.
     * @param {Number} navRadioIndex The current nav radio index to use.
     */
    getDMEDistance(navRadioIndex) {
        let distance = undefined;

        const hasDME = SimVar.GetSimVarValue("NAV HAS DME:" + navRadioIndex, "bool");
        if (hasDME) {
            distance = Math.abs(parseFloat(SimVar.GetSimVarValue("NAV DME:" + navRadioIndex, "Nautical miles")));
        }

        const hasCloseDME = SimVar.GetSimVarValue("NAV HAS CLOSE DME:" + navRadioIndex, "bool");
        if (hasCloseDME) {
            distance = Math.abs(parseFloat(SimVar.GetSimVarValue("NAV CLOSE DME:" + navRadioIndex, "Nautical miles")));
        }

        return distance;
    }
}
Jet_MFD_NDInfo.MIN_WIND_STRENGTH_FOR_ARROW_DISPLAY = 2;
class VORDMENavAid {

    constructor(_parent, _index) {
        this.parent = _parent;
        this.index = _index;

        if (this.parent != null) {
            this.navTypeText = _parent.querySelector("#State");
            this.idText = _parent.querySelector("#ID");
            this.distanceText = _parent.querySelector("#Distance");
            this.distanceUnits = _parent.querySelector("#Unit");
            this.pointer = _parent.querySelector('.bearing-pointer');
            this.pointerNeedle = _parent.querySelector('.bearing-pointer .bearing-pointer-needle');
        }

        this.setMode(BearingPointerMode.Off, true);
        this.setIDValue(0, true);
        this.setDistanceValue(0, true);
        this.hasNav = undefined;
    }

    update(_gps, _aircraft, _parentMode, _parentSource) {
        this.gps = _gps;
        this.aircraft = _aircraft;
        let mode = SimVar.GetSimVarValue(`L:WT.CJ4.BearingPointerMode_${this.index}`, 'number');

        this.setMode(mode);
        switch (this.currentMode) {
            case BearingPointerMode.VOR: {              
                this.handleVORModeUpdate(_parentMode, _parentSource);
                break;
            }
            case BearingPointerMode.ADF: {
                this.handleADFModeUpdate();
                break;
            }
            case BearingPointerMode.FMS: {
                this.handleFMSModeUpdate(_parentMode);
                break;
            }
        }    
    }

    /**
     * Handles the update of bearing pointer needle and info block
     * for VOR mode.
     * @param {Jet_NDCompass_Navigation} parentNavMode The navigation mode of the parent PFD/MFD map.
     * @param {Number} parentRadioIndex The radio index of the parent radio system selection.
     */
    handleVORModeUpdate(parentNavMode, parentRadioIndex) {
        const ident = SimVar.GetSimVarValue("NAV IDENT:" + this.index, "string");
        const hasNav = SimVar.GetSimVarValue("NAV HAS NAV:" + this.index, "Bool");

        if (this.hasNav !== hasNav) {
            this.pointer.style = hasNav ? '' : 'display: none';
            this.hasNav = hasNav;
        }

        let hideDistance = (parentNavMode === Jet_NDCompass_Navigation.VOR || parentNavMode === Jet_NDCompass_Navigation.ILS) && parentRadioIndex === this.index;
        this.setDistanceValue(hideDistance ? 0 : this.getDMEDistance(this.index));

        if (hasNav) {
            const navRadial = (SimVar.GetSimVarValue("NAV RADIAL:" + this.index, "degrees") + 180) % 360;
            const planeHeading = Simplane.getHeadingMagnetic() % 360;
            let rotation = (navRadial - planeHeading) % 360;
            if (rotation < 0) {
                rotation += 360;
            }

            this.pointerNeedle.style = `transform: rotate(${rotation}deg);`;
            this.setIDValue(ident);
        }
        else {
            this.setDistanceValue(0);
            this.setIDValue(0);
        }
    }

    /**
     * Handles the update of the bearing pointer needle and info block
     * for ADF mode.
     */
    handleADFModeUpdate() {
        const hasNav = SimVar.GetSimVarValue("ADF SIGNAL:" + this.index, "number");
        this.setIDValue(this.gps.radioNav.getADFActiveFrequency(this.index).toFixed(0));

        if (this.hasNav !== hasNav) {
            this.pointer.style = hasNav ? '' : 'display: none';
            this.hasNav = hasNav;
        }

        if (hasNav) {
            const adfDiff = SimVar.GetSimVarValue("ADF RADIAL:" + this.index, "degrees") % 360;
            this.pointerNeedle.style = `transform: rotate(${adfDiff}deg);`;
        }

        this.setDistanceValue(0);
    }

    /**
     * Handles the update of the bearing pointer needle and info block
     * for FMS mode.
     * @param {Jet_NDCompass_Navigation} parentNavMode The navigation mode of the parent PFD/MFD map.
     */
    handleFMSModeUpdate(parentNavMode) {
        const waypointName = Simplane.getNextWaypointName();
        const hasNav = waypointName !== null && waypointName !== undefined && waypointName !== '';

        if (this.hasNav !== hasNav) {
            this.pointer.style = hasNav ? '' : 'display: none';
            this.hasNav = hasNav;
        }

        let hideDistance = parentNavMode === Jet_NDCompass_Navigation.NAV;
        this.setDistanceValue(hideDistance ? 0 : Simplane.getNextWaypointDistance());

        if (hasNav) {
            const waypointBearing = Simplane.getNextWaypointTrack();
            const planeHeading = Simplane.getHeadingMagnetic();
            let rotation = (waypointBearing - planeHeading) % 360;
            if (rotation < 0) {
                rotation += 360;
            }

            this.pointerNeedle.style = `transform: rotate(${rotation}deg);`;
            this.setIDValue(waypointName);
        }
        else {
            this.setIDValue(0);
            this.setDistanceValue(0);
        }
    }

    /**
     * Handles when the map display style is changed.
     * @param {Jet_NDCompass_Display} style The map compass display style. 
     */
    onDisplayChange(style) {
        if (this.currentStyle !== style) {
            this.currentStyle = style;
            switch (this.currentStyle) {
                case Jet_NDCompass_Display.ARC: {
                    const clipSection = this.pointer && this.pointer.querySelector('.bearing-pointer-clip');
                    if (clipSection) {
                        clipSection.setAttribute('clip-path', 'url(#arc)');
                        this.pointer.className = 'bearing-pointer arc';
                    }
                    break;
                }
                case Jet_NDCompass_Display.ROSE: {
                    const clipSection = this.pointer && this.pointer.querySelector('.bearing-pointer-clip');
                    if (clipSection) {
                        clipSection.setAttribute('clip-path', 'url(#rose)');
                        this.pointer.className = 'bearing-pointer rose';
                    }
                    break;
                }
            }
        }
    }

    setMode(_mode, _force = false) {
        if ((_mode != this.currentMode) || _force) {

            this.currentMode = _mode;
            var show = false;
            var type = "";

            switch (this.currentMode) {
                case BearingPointerMode.ADF:
                    type = "ADF";
                    show = true;
                    break;
                case BearingPointerMode.VOR:
                    type = "VOR";
                    show = true;
                    break;
                case BearingPointerMode.FMS:
                    type = "FMS";
                    show = true;
                    break;
                default:
                    show = false;
                    break;
            }

            if (this.parent != null) {
                this.parent.style.display = show ? "block" : "none";
            }

            if (this.navTypeText != null) {
                this.navTypeText.textContent = type;
            }
        }
    }

    setIDValue(_value, _force = false) {
        if ((_value != this.idValue) || _force) {

            this.idValue = _value;

            if (this.idText != null) {
                if (this.idValue == 0)
                    this.idText.textContent = "---";
                else
                    this.idText.textContent = this.idValue;
            }
        }
    }

    setDistanceValue(_value, _force = false) {
        if ((_value != this.distanceValue) || _force) {

            this.distanceValue = _value;
            var showDistance = (this.distanceValue > 0);

            if (this.distanceText != null) {
                if (showDistance) {
                    this.distanceText.style = '';
                    this.distanceUnits.style = '';

                    this.distanceText.textContent = fastToFixed(this.distanceValue, this.distanceValue < 100 ? 1 : 0);
                }
                else {
                    this.distanceText.style = 'visibility: hidden;';
                    this.distanceUnits.style = 'visibility: hidden;';
                }
            }
        }
    }

    /**
     * Gets the DME distance for a given tuned nav radio index.
     * @param {Number} navRadioIndex The current nav radio index to use.
     */
    getDMEDistance(navRadioIndex) {
        let distance = undefined;

        const hasDME = SimVar.GetSimVarValue("NAV HAS DME:" + navRadioIndex, "bool");
        if (hasDME) {
            distance = Math.abs(parseFloat(SimVar.GetSimVarValue("NAV DME:" + navRadioIndex, "Nautical miles")));
        }

        const hasCloseDME = SimVar.GetSimVarValue("NAV HAS CLOSE DME:" + navRadioIndex, "bool");
        if (hasCloseDME) {
            distance = Math.abs(parseFloat(SimVar.GetSimVarValue("NAV CLOSE DME:" + navRadioIndex, "Nautical miles")));
        }

        return distance;
    }
}

/**
 * A mode that the bearing pointer is set to.
 */
var BearingPointerMode = {
    Off: 0,
    FMS: 1,
    VOR: 2,
    ADF: 3
};

customElements.define("jet-mfd-nd-info", Jet_MFD_NDInfo);
//# sourceMappingURL=NDInfo.js.map