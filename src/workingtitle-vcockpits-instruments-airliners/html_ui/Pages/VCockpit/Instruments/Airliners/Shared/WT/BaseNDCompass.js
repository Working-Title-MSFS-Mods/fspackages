let Jet_NDCompass_Display;
(function (Jet_NDCompass_Display) {
    Jet_NDCompass_Display[Jet_NDCompass_Display["NONE"] = 0] = "NONE";
    Jet_NDCompass_Display[Jet_NDCompass_Display["ROSE"] = 1] = "ROSE";
    Jet_NDCompass_Display[Jet_NDCompass_Display["ARC"] = 2] = "ARC";
    Jet_NDCompass_Display[Jet_NDCompass_Display["PLAN"] = 3] = "PLAN";
    Jet_NDCompass_Display[Jet_NDCompass_Display["PPOS"] = 4] = "PPOS";
})(Jet_NDCompass_Display || (Jet_NDCompass_Display = {}));
let Jet_NDCompass_Navigation;
(function (Jet_NDCompass_Navigation) {
    Jet_NDCompass_Navigation[Jet_NDCompass_Navigation["NONE"] = 0] = "NONE";
    Jet_NDCompass_Navigation[Jet_NDCompass_Navigation["VOR"] = 1] = "VOR";
    Jet_NDCompass_Navigation[Jet_NDCompass_Navigation["NAV"] = 2] = "NAV";
    Jet_NDCompass_Navigation[Jet_NDCompass_Navigation["ILS"] = 3] = "ILS";
})(Jet_NDCompass_Navigation || (Jet_NDCompass_Navigation = {}));
let Jet_NDCompass_Reference;
(function (Jet_NDCompass_Reference) {
    Jet_NDCompass_Reference[Jet_NDCompass_Reference["NONE"] = 0] = "NONE";
    Jet_NDCompass_Reference[Jet_NDCompass_Reference["HEADING"] = 1] = "HEADING";
    Jet_NDCompass_Reference[Jet_NDCompass_Reference["TRACK"] = 2] = "TRACK";
})(Jet_NDCompass_Reference || (Jet_NDCompass_Reference = {}));
class Jet_NDCompass_Range {
}
class Jet_NDCompass extends HTMLElement {
    constructor() {
        super(...arguments);
        this.lastSelectedHeading = -1;
        this.showSelectedHeadingTimer = 0;
        this.mapRanges = [];
        this.isBearing1Displayed = false;
        this.isBearing2Displayed = false;
        this._showILS = false;
        this._fullscreen = true;
        this.isHud = false;
        this.logic_brg1Source = 0;
        this.logic_brg2Source = 0;
        this._displayMode = Jet_NDCompass_Display.NONE;
        this._navigationMode = Jet_NDCompass_Navigation.NONE;
        this._referenceMode = Jet_NDCompass_Reference.NONE;
        this._aircraft = Aircraft.A320_NEO;
        this._mapRange = 0;
        this._itIsAlreadyTuned = 0;
    }
    static get dynamicAttributes() {
        return [
            "rotation",
            "tracking_bug_rotation",
            "heading_bug_rotation",
            "selected_heading_bug_rotation",
            "selected_tracking_bug_rotation",
            "ils_bug_rotation",
            "course",
            "course_deviation",
            "show_bearing1",
            "show_bearing2",
            "toggle_bearing1",
            "toggle_bearing2",
            "bearing1_bearing",
            "bearing2_bearing",
            "display_course_deviation",
            "vertical_deviation",
            "display_vertical_deviation",
            "ghost_needle_course",
            "ghost_needle_deviation"
        ];
    }
    static get observedAttributes() {
        return this.dynamicAttributes.concat([
            "hud"
        ]);
    }
    get displayMode() {
        return this._displayMode;
    }
    get navigationMode() {
        return this._navigationMode;
    }
    get referenceMode() {
        return this._referenceMode;
    }
    setMode(d, n) {
        if (this.displayMode !== d || this.navigationMode != n) {
            this._displayMode = d;
            this._navigationMode = n;
            this.construct();
        }
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
            this.construct();
        }
    }
    get mapRange() {
        return this._mapRange;
    }
    set mapRange(_val) {
        this._mapRange = _val;
    }
    showArcRange(_show) {
        if (this.arcRangeGroup)
            this.arcRangeGroup.setAttribute("visibility", (_show) ? "visible" : "hidden");
    }
    showArcMask(_val) {
        if (this.arcMaskGroup)
            this.arcMaskGroup.setAttribute("visibility", (_val) ? "visible" : "hidden");
    }
    setFullscreen(_val) {
        if (this._fullscreen != _val) {
            this._fullscreen = _val;
            this.construct();
        }
    }
    connectedCallback() {
        if (this.hasAttribute("display-mode")) {
            let modeValue = this.getAttribute("display-mode").toLocaleLowerCase();
            if (modeValue === "rose") {
                this._displayMode = Jet_NDCompass_Display.ROSE;
            }
            else if (modeValue === "arc") {
                this._displayMode = Jet_NDCompass_Display.ARC;
            }
            else if (modeValue === "plan") {
                this._displayMode = Jet_NDCompass_Display.PLAN;
            }
            else if (modeValue === "ppos") {
                this._displayMode = Jet_NDCompass_Display.PPOS;
            }
            else {
                this._displayMode = Jet_NDCompass_Display.NONE;
            }
        }
        if (this.hasAttribute("navigation-mode")) {
            let modeValue = this.getAttribute("navigation-mode").toLocaleLowerCase();
            if (modeValue === "ils") {
                this._navigationMode = Jet_NDCompass_Navigation.ILS;
            }
            else if (modeValue === "vor") {
                this._navigationMode = Jet_NDCompass_Navigation.VOR;
            }
            else if (modeValue === "nav") {
                this._navigationMode = Jet_NDCompass_Navigation.NAV;
            }
            else {
                this._navigationMode = Jet_NDCompass_Navigation.NONE;
            }
        }

        try {
            this.navPreset = new NavPresetElement(document.querySelector('#NavPreset .preset-info'));
            this.navTransferTuning = new NavTransferTuningElement(document.querySelector('#NavPreset .preset-tuning'));
        }
        catch (err) { }

        this.construct();
    }
    init() {
    }
    construct() {
        this.destroyLayout();
        switch (this.displayMode) {
            case Jet_NDCompass_Display.ROSE:
                {
                    this.constructRose();
                    break;
                }
            case Jet_NDCompass_Display.PPOS:
            case Jet_NDCompass_Display.ARC:
                {
                    this.constructArc();
                    break;
                }
            case Jet_NDCompass_Display.PLAN:
                {
                    this.constructPlan();
                    break;
                }
        }
    }
    constructArc() {
    }
    constructRose() {
    }
    constructPlan() {
    }
    destroyLayout() {
        if (this.root) {
            this.root.remove();
        }
        for (let i = 0; i < Jet_NDCompass.dynamicAttributes.length; i++) {
            this.removeAttribute(Jet_NDCompass.dynamicAttributes[i]);
        }
        this.rotatingCircle = null;
        this.rotatingCircleTrs = "";
        this.graduations = null;
        this.mapRanges = [];
        this.courseTOLine = null;
        this.courseFROMLine = null;
    }
    update(_deltaTime) {
        this.updateCompass(_deltaTime);
        this.updateNavigationInfo();
        this.updateCourseNeedleAnimation(_deltaTime);
        this.updateMapRange();
    }
    updateCompass(_deltaTime) {

        let onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
        if (this.trackingBug) {
            this.trackingBug.setAttribute("style", (onGround === 1) ? "display:none" : "");
        }

        let simHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        let simSelectedHeading = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "degree");
        let simTrack = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree");
        let simSelectedTrack = Simplane.getNextWaypointTrack();
        let simGroundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        if (Simplane.getAutoPilotTRKModeActive() || Simplane.getAutoPilotTRKFPAModeActive())
            this._referenceMode = Jet_NDCompass_Reference.TRACK;
        else
            this._referenceMode = Jet_NDCompass_Reference.HEADING;
        let headingChanged = false;
        if (Math.round(simSelectedHeading) != this.lastSelectedHeading) {
            if (this.lastSelectedHeading >= 0)
                headingChanged = true;
            this.lastSelectedHeading = Math.round(simSelectedHeading);
        }
        let compass = 0;
        if (this.displayMode !== Jet_NDCompass_Display.PLAN) {
            if (this.referenceMode == Jet_NDCompass_Reference.TRACK) {
                compass = simTrack;
                if (this.currentRefMode) {
                    this.currentRefMode.textContent = "TRK";
                }
            }
            else {
                compass = simHeading;
                if (this.currentRefMode) {
                    this.currentRefMode.textContent = "HDG";
                }
            }
            let roundedCompass = fastToFixed(compass, 2);
            this.setAttribute("rotation", roundedCompass);
            if (this.currentRefGroup)
                this.currentRefGroup.classList.toggle('hide', false);
            if (this.currentRefValue)
                this.currentRefValue.textContent = Utils.leadingZeros(compass % 360, 3, 0);
        }
        else {
            this.setAttribute("rotation", "0");
            if (this.currentRefGroup)
                this.currentRefGroup.classList.toggle('hide', true);
        }
        if (this.referenceMode == Jet_NDCompass_Reference.HEADING) {
            if (this.aircraft == Aircraft.A320_NEO) {
                let selectedHeading = simSelectedHeading;
                let showSelectedHeading = Simplane.getAutoPilotHeadingSelected();
                let showTrackLine = showSelectedHeading;
                if (!showSelectedHeading) {
                    showSelectedHeading = SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 1;
                    if (showSelectedHeading)
                        selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false);
                }
                let roundedSelectedHeading = fastToFixed(selectedHeading, 3);
                this.setAttribute("selected_heading_bug_rotation", roundedSelectedHeading);
                if (this.trackingLine)
                    this.trackingLine.classList.toggle('hide', !showTrackLine);
                if (this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                    if (this.selectedHeadingGroup)
                        this.selectedHeadingGroup.classList.toggle('hide', !showSelectedHeading);
                }
                else {
                    if (this.selectedHeadingGroup)
                        this.selectedHeadingGroup.classList.toggle('hide', true);
                }
                if (this.selectedTrackGroup)
                    this.selectedTrackGroup.classList.toggle('hide', true);
                if (this.selectedRefGroup) {
                    if (this.selectedRefValue)
                        this.selectedRefValue.textContent = selectedHeading.toString();
                    this.selectedRefGroup.classList.toggle('hide', false);
                }
                if (this.headingGroup)
                    this.headingGroup.classList.toggle('hide', true);
            }
            else if (this.aircraft == Aircraft.B747_8 || this.aircraft == Aircraft.AS01B) {
                let selectedHeading = simSelectedHeading;
                let showSelectedLine = Simplane.getAutoPilotHeadingLockActive();
                if (!showSelectedLine) {
                    if (headingChanged) {
                        showSelectedLine = true;
                        this.showSelectedHeadingTimer = 5;
                    }
                    else if (this.showSelectedHeadingTimer > 0) {
                        this.showSelectedHeadingTimer -= _deltaTime / 1000;
                        if (this.showSelectedHeadingTimer <= 0)
                            this.showSelectedHeadingTimer = 0;
                        else
                            showSelectedLine = true;
                    }
                }
                else {
                    this.showSelectedHeadingTimer = 0;
                }
                let roundedSelectedHeading = fastToFixed(selectedHeading, 3);
                this.setAttribute("selected_heading_bug_rotation", roundedSelectedHeading);
                if (this.navigationMode !== Jet_NDCompass_Navigation.PLAN) {
                    if (this.selectedHeadingGroup)
                        this.selectedHeadingGroup.classList.toggle('hide', false);
                    if (this.selectedHeadingLine)
                        this.selectedHeadingLine.classList.toggle('hide', !showSelectedLine);
                }
                else {
                    if (this.selectedHeadingGroup)
                        this.selectedHeadingGroup.classList.toggle('hide', true);
                }
                if (this.selectedTrackGroup)
                    this.selectedTrackGroup.classList.toggle('hide', true);
                if (this.selectedRefGroup) {
                    if (this.selectedRefValue)
                        this.selectedRefValue.textContent = selectedHeading.toString();
                    this.selectedRefGroup.classList.toggle('hide', false);
                }
            }
            else {
                let showSelectedHeading = false; //Simplane.getAutoPilotHeadingLockActive();
                if (!showSelectedHeading) {
                    if (headingChanged) {
                        showSelectedHeading = true;
                        this.showSelectedHeadingTimer = 3;
                    }
                    else if (this.showSelectedHeadingTimer > 0) {
                        this.showSelectedHeadingTimer -= _deltaTime / 1000;
                        if (this.showSelectedHeadingTimer <= 0)
                            this.showSelectedHeadingTimer = 0;
                        else
                            showSelectedHeading = true;
                    }
                }
                else {
                    this.showSelectedHeadingTimer = 0;
                }

                let selectedHeading = Math.round(simSelectedHeading).toString().padStart(3, "0");
                let roundedSelectedHeading = fastToFixed(selectedHeading, 3);
                this.setAttribute("selected_heading_bug_rotation", roundedSelectedHeading);
                if (this.selectedHeadingGroup)
                    this.selectedHeadingGroup.classList.toggle('hide', false);
                if (this.selectedHeadingLine) {
                    if (this.aircraft == Aircraft.CJ4) {
                        let CompassAngle = this.degreeToArc(compass);
                        let selectedAngle = this.degreeToArc(simSelectedHeading);
                        let delta = Math.abs(Avionics.Utils.angleDiff(CompassAngle, selectedAngle));
                        this.selectedHeadingLine.classList.toggle('hide', (delta > 65 && this._displayMode !== Jet_NDCompass_Display.ROSE && (SimVar.GetSimVarValue("L:WT_CJ4_HDG_ON", "number") === 1)) ? false : true);
                        this.selectedHeadingBug.classList.toggle('hide', (delta > 90 && this._displayMode === Jet_NDCompass_Display.ARC) ? true : false);

                        if (showSelectedHeading) {
                            this.selectedHeadingLine.classList.toggle('hide', false);
                        }
                    }
                    else
                        this.selectedHeadingLine.classList.toggle('hide', false);
                }

                if (this.selectedTrackGroup)
                    this.selectedTrackGroup.classList.toggle('hide', true);
                if (this.selectedRefGroup) {
                    if (this.selectedRefValue)
                        this.selectedRefValue.textContent = selectedHeading.toString();
                    this.selectedRefGroup.classList.toggle('hide', false);
                }
            }
        }
        else {
            let selectedTrack = simSelectedTrack;
            let roundedSelectedTrack = fastToFixed(selectedTrack, 3);
            this.setAttribute("selected_tracking_bug_rotation", roundedSelectedTrack);
            if (this.trackingLine)
                this.trackingLine.classList.toggle('hide', false);
            if (this.selectedHeadingGroup)
                this.selectedHeadingGroup.classList.toggle('hide', true);
            if (this.selectedTrackGroup)
                this.selectedTrackGroup.classList.toggle('hide', false);
            if (this.selectedRefGroup) {
                if (this.selectedRefValue)
                    this.selectedRefValue.textContent = selectedTrack.toString();
                this.selectedRefGroup.classList.toggle('hide', false);
            }
            if (this.headingGroup)
                this.headingGroup.classList.toggle('hide', false);
        }
        let heading = simHeading;
        let roundedHeading = fastToFixed(heading, 3);
        this.setAttribute("heading_bug_rotation", roundedHeading);
        if (simGroundSpeed <= 10)
            simTrack = simHeading;
        let roundedTracking = fastToFixed(simTrack, 3);
        this.setAttribute("tracking_bug_rotation", roundedTracking);
        if (this.ilsGroup) {
            if (this._showILS || this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                let localizer = this.gps.radioNav.getBestILSBeacon();
                if (localizer.id > 0) {
                    let roundedCourse = fastToFixed(localizer.course, 3);
                    this.setAttribute("ils_bug_rotation", roundedCourse);
                    this.ilsGroup.classList.toggle('hide', false);
                }
                else
                    this.ilsGroup.classList.toggle('hide', true);
            }
            else
                this.ilsGroup.classList.toggle('hide', true);
        }
        this.applyRotation();
    }
    updateMapRange() {
        if (this.mapRanges) {
            for (let i = 0; i < this.mapRanges.length; i++) {
                let range = this.mapRange * this.mapRanges[i].factor;
                if (range < 1.0 && this.mapRanges[i].removeInteger) {
                    let rangeText = (Math.floor(range * 100) / 100).toFixed(2);
                    let radixPos = rangeText.indexOf('.');
                    this.mapRanges[i].text.textContent = rangeText.slice(radixPos);
                }
                else {
                    this.mapRanges[i].text.textContent = range.toString();
                }
            }
        }
    }
    updateNavigationInfo() {
        if (this.navPreset) {
            this.navPreset.update();
        }
        
        if (this.courseGroup && this.displayMode !== Jet_NDCompass_Display.PLAN) {
            if (this.navigationMode == Jet_NDCompass_Navigation.ILS || this.navigationMode == Jet_NDCompass_Navigation.VOR || this.navigationMode == Jet_NDCompass_Navigation.NAV) {
                const waypointName = Simplane.getNextWaypointName();
                const hasNav = waypointName !== null && waypointName !== undefined && waypointName !== '';
                const waypointBearing = Simplane.getNextWaypointTrack();
                const planeHeading = Simplane.getHeadingMagnetic();
                let bearingDiff = Math.abs((waypointBearing - planeHeading) % 360);
                let navFlag = SimVar.GetSimVarValue("NAV TOFROM:1", "Enum");

                if (this.navigationMode == Jet_NDCompass_Navigation.NAV && (this.displayMode === Jet_NDCompass_Display.ARC || this.displayMode === Jet_NDCompass_Display.ROSE) && hasNav == false) {
                    this.courseDeviation.setAttribute("visibility", "hidden");
                    this.courseTO.setAttribute("visibility", "hidden");
                    this.courseTOLine.setAttribute("visibility", "hidden");
                    this.courseFROM.setAttribute("visibility", "hidden");
                    this.courseFROMBorder.setAttribute("visibility", "hidden");
                    this.courseFROMLine.setAttribute("visibility", "hidden");
                    this.courseTOBorder.setAttribute("visibility", "hidden");
                    this.courseGroup.setAttribute("visibility", "hidden");
                    this.noFplnGroup.setAttribute("visibility", "visible");
                } else {
                    this.courseDeviation.setAttribute("visibility", "visible");
                    this.courseTO.setAttribute("visibility", "visible");
                    this.courseTOLine.setAttribute("visibility", "visible");
                    this.courseFROM.setAttribute("visibility", "visible");
                    this.courseFROMBorder.setAttribute("visibility", "visible");
                    this.courseFROMLine.setAttribute("visibility", "visible");
                    this.courseTOBorder.setAttribute("visibility", "visible");
                    this.courseGroup.setAttribute("visibility", "visible");
                    this.noFplnGroup.setAttribute("visibility", "hidden");

                    if (bearingDiff > 90 && bearingDiff < 270) {
                        this.courseTO.setAttribute("visibility", "hidden");
                        this.courseTOBorder.setAttribute("visibility", "hidden");
                        this.courseFROM.setAttribute("visibility", "visible");
                        this.courseFROMBorder.setAttribute("visibility", "visible");
                    } else {
                        this.courseTO.setAttribute("visibility", "visible");
                        this.courseTOBorder.setAttribute("visibility", "visible");
                        this.courseFROM.setAttribute("visibility", "hidden");
                        this.courseFROMBorder.setAttribute("visibility", "hidden");
                    }
                }

                if (this.navigationMode == Jet_NDCompass_Navigation.VOR) {
                    if (navFlag == 1) {
                        this.courseTO.setAttribute("visibility", "visible");
                        this.courseTOBorder.setAttribute("visibility", "visible");
                        this.courseFROM.setAttribute("visibility", "hidden");
                        this.courseFROMBorder.setAttribute("visibility", "hidden");
                    } else if (navFlag ==2) {
                        this.courseTO.setAttribute("visibility", "hidden");
                        this.courseTOBorder.setAttribute("visibility", "hidden");
                        this.courseFROM.setAttribute("visibility", "visible");
                        this.courseFROMBorder.setAttribute("visibility", "visible");
                        this.courseFROM.setAttribute("transform", "translate(0 220)", "rotate(0 50 50)");
                        this.courseFROMBorder.setAttribute("transform", "translate(0 220)", "rotate(0 50 50)");
                    }
                }

                this.courseGroup.classList.toggle('hide', false);
                let compass = Number(this.getAttribute('rotation'));
                let displayCourseDeviation = false;
                let displayVerticalDeviation = false;
                if (this.navigationMode == Jet_NDCompass_Navigation.ILS || this.navigationMode === Jet_NDCompass_Navigation.VOR) {
                    let beacon;
                    this.ghostNeedleGroup.setAttribute("visibility", "hidden");

                    if (this.navTransferTuning && this.navPreset) {
                        this.navTransferTuning.setDisplayed(false);
                        this.navPreset.setDisplayed(true);
                    }

                    if (this.navigationMode == Jet_NDCompass_Navigation.ILS) {
                        beacon = this.gps.radioNav.getBestILSBeacon();
                    }
                    else if (this.navigationMode === Jet_NDCompass_Navigation.VOR) {
                        beacon = this.gps.radioNav.getBestVORBeacon();
                    }
                    if (beacon.id > 0) {
                        displayCourseDeviation = true;
                        let deviation = (SimVar.GetSimVarValue("NAV CDI:" + beacon.id, "number") / 127);
                        let backCourse = SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "bool");
                        if (backCourse)
                            deviation = -deviation;

                        let didFreqJustTune = SimVar.GetSimVarValue('L:WT_NAV_TO_NAV_TRANSFER_STATE', 'number');
                        let source = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "Number");
                        let courseKnob = SimVar.GetSimVarValue(`NAV OBS:${source}`, "degree").toString();
                        if (didFreqJustTune === 4) {
                            if (courseKnob != beacon.course && this._itIsAlreadyTuned == 0) {
                            SimVar.SetSimVarValue(`K:VOR${source}_SET`, "number", beacon.course);
                            this.setAttribute("course", beacon.course.toString());
                            this._itIsAlreadyTuned = 1;
                            }
                        }
                        this.setAttribute("course", SimVar.GetSimVarValue(`NAV OBS:${source}`, "degree").toString());
                        this.setAttribute("course_deviation", deviation.toString());
                        if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:" + beacon.id, "Bool")) {
                            displayVerticalDeviation = true;
                            this.setAttribute("vertical_deviation", (SimVar.GetSimVarValue("NAV GSI:" + beacon.id, "number") / 127.0).toString());
                        }
                    }
                    else {
                        let source = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "Number");
                        this.setAttribute("course", SimVar.GetSimVarValue(`NAV OBS:${source}`, "degree").toString());
                        //this.setAttribute("course", compass.toString());
                        this.setAttribute("course_deviation", "0");
                        this.courseTO.setAttribute("visibility", "hidden");
                        this.courseTOBorder.setAttribute("visibility", "hidden");
                        this.courseFROM.setAttribute("visibility", "hidden");
                        this.courseDeviation.setAttribute("visibility", "hidden");
                        this.courseDeviation.setAttribute("visibility", "hidden");
                        }
                }
                else if (this.navigationMode === Jet_NDCompass_Navigation.NAV) {

                    displayCourseDeviation = true;
                    let crossTrack = SimVar.GetSimVarValue("L:WT_CJ4_XTK", "number");
                    const sensitivity = SimVar.GetSimVarValue("L:WT_NAV_SENSITIVITY", "number");
                    let deviation = -(crossTrack);

                    if (sensitivity === 0) {
                        deviation = deviation / 2;
                    }
                    else if (sensitivity > 2) {
                        deviation = deviation / 0.3;
                        if (sensitivity === 4) {
                            deviation /= SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY_SCALAR', 'number');
                        }
                    }

                    //let simSelectedTrack = Simplane.getNextWaypointTrack();
                    let simSelectedTrack = SimVar.GetSimVarValue("L:WT_CJ4_DTK", "number");

                    this.setAttribute("course", simSelectedTrack.toString());
                    this.setAttribute("course_deviation", deviation.toString());

                    let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool");
                    let hasLoc = SimVar.GetSimVarValue("NAV HAS LOCALIZER:1", "Bool");
                    let onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");

                    if (hasNav && hasLoc && !onGround) {
                        displayCourseDeviation = true;

                        let course = SimVar.GetSimVarValue("NAV LOCALIZER:1", "degree");

                        let frequency = SimVar.GetSimVarValue('NAV ACTIVE FREQUENCY:1', 'MHz');
                        if (this.navTransferTuning) {
                            this.navTransferTuning.setFrequency(frequency);
                        }

                        let deviation = (SimVar.GetSimVarValue("NAV CDI:1", "number") / 127);
                        let backCourse = SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "bool");
                        if (backCourse)
                            deviation = -deviation;
                        this.setAttribute("ghost_needle_course", course.toString());
                        this.setAttribute("ghost_needle_deviation", deviation.toString());
                        
                        const navToNavTransferState = SimVar.GetSimVarValue('L:WT_NAV_TO_NAV_TRANSFER_STATE', 'number');
                        if (navToNavTransferState === 3 || navToNavTransferState === 4) {
                            this.ghostNeedleGroup.setAttribute("visibility", "visible");

                            if (this.navTransferTuning && this.navPreset) {
                                this.navTransferTuning.setDisplayed(true);
                                this.navPreset.setDisplayed(false);
                            }
                        } else {
                            this.ghostNeedleGroup.setAttribute("visibility", "hidden");

                            if (this.navTransferTuning && this.navPreset) {
                                this.navTransferTuning.setDisplayed(false);
                                this.navPreset.setDisplayed(true);
                            }
                        }
                    }
                    else {
                        this.setAttribute("ghost_needle_course", compass.toString());
                        this.setAttribute("ghost_needle_deviation", "0");
                        this.ghostNeedleGroup.setAttribute("visibility", "hidden");

                        if (this.navTransferTuning && this.navPreset) {
                            this.navTransferTuning.setDisplayed(false);
                            this.navPreset.setDisplayed(true);
                        }
                    }
                } 
                this.setAttribute("display_course_deviation", displayCourseDeviation ? "True" : "False");
                this.setAttribute("display_vertical_deviation", displayVerticalDeviation ? "True" : "False");
                switch (this.logic_brg1Source) {
                    case 1:
                        {
                            let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:1", "boolean");
                            if (hasNav) {
                                this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing1_bearing", "");
                            }
                            break;
                        }
                    case 2:
                        {
                            let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:2", "boolean");
                            if (hasNav) {
                                this.setAttribute("bearing1_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing1_bearing", "");
                            }
                            break;
                        }
                    case 3:
                        {
                            this.setAttribute("bearing1_bearing", Simplane.getNextWaypointTrack());
                            break;
                        }
                    case 4:
                        {
                            if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                                this.setAttribute("bearing1_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing1_bearing", "");
                            }
                            break;
                        }
                }
                switch (this.logic_brg2Source) {
                    case 1:
                        {
                            let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:1", "boolean");
                            if (hasNav) {
                                this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing2_bearing", "");
                            }
                            break;
                        }
                    case 2:
                        {
                            let hasNav = SimVar.GetSimVarValue("NAV HAS NAV:2", "boolean");
                            if (hasNav) {
                                this.setAttribute("bearing2_bearing", ((180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing2_bearing", "");
                            }
                            break;
                        }
                    case 3:
                        {
                            this.setAttribute("bearing2_bearing", Simplane.getNextWaypointTrack());
                            break;
                        }
                    case 4:
                        {
                            if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                                this.setAttribute("bearing2_bearing", ((SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + compass) % 360).toString());
                            }
                            else {
                                this.setAttribute("bearing2_bearing", "");
                            }
                            break;
                        }
                }
            }
            else {
                this.courseGroup.classList.toggle('hide', true);
            }
        }
    }

    /**
     * Updates the course needle animation.
     * @param {number} deltaTime The deltatime, in milliseconds, since the last frame.
     */
    updateCourseNeedleAnimation(deltaTime) {

        if (!this._courseTarget) {
            this._courseTarget = 0;
        }

        if (!this._currentCourse) {
            this._currentCourse = 0;
        }

        if (!this._previousDisplayMode) {
            this._previousDisplayMode = this.displayMode;
        }

        if (this._currentCourse !== this._courseTarget) {
            const angleDiff = Avionics.Utils.angleDiff(this._currentCourse, this._courseTarget);
            const absAngleDiff = Math.abs(angleDiff);

            const currentAnimationPosition = Math.pow((absAngleDiff / 180), .25);
            let nextAnimationPosition = Math.pow(Math.max(currentAnimationPosition - (deltaTime / 2000), 0), 4);
            
            this._currentCourse = this._courseTarget - (nextAnimationPosition * 180 * Math.sign(angleDiff));      
            let factor = (this.displayMode === Jet_NDCompass_Display.ARC || this.displayMode === Jet_NDCompass_Display.PPOS) ? 1 : 10;

            if (this.course) {
                this.course.setAttribute("transform", "rotate(" + (this._currentCourse) + " " + (50 * factor) + " " + (50 * factor) + ")");
            }
        }
        else if (this._currentCourse === this._courseTarget && this._previousDisplayMode !== this.displayMode) {
            let factor = (this.displayMode === Jet_NDCompass_Display.ARC || this.displayMode === Jet_NDCompass_Display.PPOS) ? 1 : 10;
            if (this.course) {
                this.course.setAttribute("transform", "rotate(" + (this._currentCourse) + " " + (50 * factor) + " " + (50 * factor) + ")");
            }
        }

        this._previousDisplayMode = this.displayMode;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "toggle_bearing1":
                this.isBearing1Displayed = !this.isBearing1Displayed;
                if (this.bearingCircle) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.bearingCircle.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearingCircle.setAttribute("visibility", "hidden");
                    }
                }
                if (this.isBearing1Displayed) {
                    this.bearing1.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing1.setAttribute("visibility", "hidden");
                }
                break;
            case "toggle_bearing2":
                this.isBearing2Displayed = !this.isBearing2Displayed;
                if (this.bearingCircle) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.bearingCircle.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearingCircle.setAttribute("visibility", "hidden");
                    }
                }
                if (this.isBearing2Displayed) {
                    this.bearing2.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing2.setAttribute("visibility", "hidden");
                }
                break;
        }
        if (oldValue == newValue)
            return;
        let factor = (this.displayMode === Jet_NDCompass_Display.ARC || this.displayMode === Jet_NDCompass_Display.PPOS) ? 1 : 10;
        switch (name) {
            case "vertical_deviation":
                if (this.glideSlopeCursor) {
                    let y = (parseFloat(newValue) * 25 * factor) + (50 * factor);
                    this.glideSlopeCursor.setAttribute("transform", "translate(" + (95 * factor) + " " + y.toFixed(0) + ")");
                }
                break;
            case "display_vertical_deviation":
                if (newValue == "True") {
                    if (this.glideSlopeCursor)
                        this.glideSlopeCursor.setAttribute("visibility", "visible");
                }
                else {
                    if (this.glideSlopeCursor) {
                        this.glideSlopeCursor.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "display_course_deviation":
                if (newValue == "True") {
                    this.courseDeviation.setAttribute("visibility", "visible");
                    if (this.courseTOLine)
                        this.courseTOLine.setAttribute("visibility", "visible");
                    if (this.courseFROMLine)
                        this.courseFROMLine.setAttribute("visibility", "visible");
                }
                else {
                    this.courseDeviation.setAttribute("visibility", "hidden");
                    if (this.courseTOLine)
                        this.courseTOLine.setAttribute("visibility", "hidden");
                    if (this.courseFROMLine)
                        this.courseFROMLine.setAttribute("visibility", "hidden");
                }
                break;
            case "course":
                if (this.course) {
                    this._courseTarget = parseFloat(newValue);
                }
                break;
            case "course_deviation":
                if (this.courseDeviation) {
                    if (this.displayMode == Jet_NDCompass_Display.ARC)
                        this.courseDeviation.setAttribute("transform", "translate(" + (Math.min(Math.max(parseFloat(newValue), -1), 1) * 100 * factor) + ")");
                    else
                        this.courseDeviation.setAttribute("transform", "translate(" + (Math.min(Math.max(parseFloat(newValue), -1), 1) * 20 * factor) + ")");
                }
                break;
            case "ghost_needle_course":
                if (this.ghostNeedleGroup) {
                    this.ghostNeedleGroup.setAttribute("transform", "rotate(" + (newValue) + " " + (50 * factor) + " " + (50 * factor) + ")");
                }
                break;
            case "ghost_needle_deviation":
                if (this.courseDeviationGhost) {
                    if (this.displayMode == Jet_NDCompass_Display.ARC)
                        this.courseDeviationGhost.setAttribute("transform", "translate(" + (Math.min(Math.max(parseFloat(newValue), -1), 1) * 100 * factor) + ")");
                    else
                        this.courseDeviationGhost.setAttribute("transform", "translate(" + (Math.min(Math.max(parseFloat(newValue), -1), 1) * 20 * factor) + ")");
                }
                break;
            case "show_bearing1":
                this.isBearing1Displayed = newValue == "true";
                if (this.bearingCircle) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.bearingCircle.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearingCircle.setAttribute("visibility", "hidden");
                    }
                }
                if (this.isBearing1Displayed) {
                    this.bearing1.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing1.setAttribute("visibility", "hidden");
                }
                break;
            case "show_bearing2":
                this.isBearing2Displayed = newValue == "true";
                if (this.bearingCircle) {
                    if (this.isBearing1Displayed || this.isBearing2Displayed) {
                        this.bearingCircle.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearingCircle.setAttribute("visibility", "hidden");
                    }
                }
                if (this.isBearing2Displayed) {
                    this.bearing2.setAttribute("visibility", "visible");
                }
                else {
                    this.bearing2.setAttribute("visibility", "hidden");
                }
                break;
            case "bearing1_bearing":
                if (this.bearing1) {
                    if (newValue != "") {
                        this.bearing1.setAttribute("transform", "rotate(" + newValue + " " + (50 * factor) + " " + (50 * factor) + ")");
                        this.bearing1.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearing1.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "bearing2_bearing":
                if (this.bearing2) {
                    if (newValue != "") {
                        this.bearing2.setAttribute("transform", "rotate(" + newValue + " " + (50 * factor) + " " + (50 * factor) + ")");
                        this.bearing2.setAttribute("visibility", "visible");
                    }
                    else {
                        this.bearing2.setAttribute("visibility", "hidden");
                    }
                }
                break;
            case "hud":
                this.isHud = newValue == "true";
                break;
        }
    }
    applyRotation() {

        let course = Number(this.getAttribute('rotation'));
        let trackingBug = Number(this.getAttribute('tracking_bug_rotation'));
        let headingBug = Number(this.getAttribute('heading_bug_rotation'));
        let selectedHeadingBug = Number(this.getAttribute('selected_heading_bug_rotation'));
        let selectedTrackingBug = Number(this.getAttribute('selected_tracking_bug_rotation'));
        let ilsBug = Number(this.getAttribute('ils_bug_rotation'));
        let factor = 500;
        if (this.displayMode === Jet_NDCompass_Display.ARC || this.displayMode === Jet_NDCompass_Display.PPOS) {
            factor = 50;
            trackingBug = this.degreeToArc(trackingBug);
            headingBug = this.degreeToArc(headingBug);
            selectedHeadingBug = this.degreeToArc(selectedHeadingBug);
            selectedTrackingBug = this.degreeToArc(selectedTrackingBug);
            ilsBug = this.degreeToArc(ilsBug);
        }
        if (this.rotatingCircle)
            this.rotatingCircle.setAttribute("transform", this.rotatingCircleTrs + " rotate(" + (-course) + " " + factor + " " + factor + ")");
        if (this.graduations)
            this.graduations.setAttribute("transform", "rotate(" + (-course) + " " + factor + " " + factor + ")");
        if (this.trackingGroup)
            this.trackingGroup.setAttribute("transform", "rotate(" + trackingBug + " " + factor + " " + factor + ")");
        if (this.headingGroup)
            this.headingGroup.setAttribute("transform", "rotate(" + headingBug + " " + factor + " " + factor + ")");
        if (this.selectedHeadingGroup)
            this.selectedHeadingGroup.setAttribute("transform", "rotate(" + selectedHeadingBug + " " + factor + " " + factor + ")");
        if (this.selectedTrackGroup)
            this.selectedTrackGroup.setAttribute("transform", "rotate(" + selectedTrackingBug + " " + factor + " " + factor + ")");
        if (this.ilsGroup)
            this.ilsGroup.setAttribute("transform", "rotate(" + ilsBug + " " + factor + " " + factor + ")");
    }
    degreeToArc(_wantedAngle) {
        let tracking = _wantedAngle;
        let angle = (tracking + 180) % 360;
        return angle;
    }
    getExternalTextZonePath(radius, beginAngle, endAngle, xEnd, reverse = false) {
        let beginX = 50 - (radius * Math.cos(beginAngle));
        let beginY = 50 - (radius * Math.sin(beginAngle));
        let endX = 50 - (radius * Math.cos(endAngle));
        let endY = 50 - (radius * Math.sin(endAngle));
        let path = "M" + beginX + " " + beginY + "L" + xEnd + " " + beginY + "L" + xEnd + " " + endY + "L" + endX + " " + endY;
        path += "A " + radius + " " + radius + " 0 0 " + (reverse ? 0 : 1) + " " + beginX + " " + beginY;
        return path;
    }
    addMapRange(_parent, _x, _y, _color, _size, _withBg, _rangeFactor, _removeInteger, textAnchor = "left") {
        let range = new Jet_NDCompass_Range();
        {
            range.text = document.createElementNS(Avionics.SVG.NS, "text");
            range.text.textContent = "";
            range.text.setAttribute("x", _x.toString());
            range.text.setAttribute("y", _y.toString());
            range.text.setAttribute("fill", _color);
            range.text.setAttribute("font-size", _size.toString());
            range.text.setAttribute("font-family", "Roboto-Light");
            range.text.setAttribute("text-anchor", textAnchor);
            range.text.setAttribute("alignment-baseline", "central");
            range.factor = _rangeFactor;
            range.removeInteger = _removeInteger;
            this.mapRanges.push(range);
        }
        if (_withBg) {
            let w = 80;
            let h = 40;
            let bg = document.createElementNS(Avionics.SVG.NS, "rect");
            bg.setAttribute("x", (_x - w * 0.5).toString());
            bg.setAttribute("y", (_y - h * 0.5).toString());
            bg.setAttribute("width", w.toString());
            bg.setAttribute("height", h.toString());
            bg.setAttribute("fill", "black");
            _parent.appendChild(bg);
        }
        _parent.appendChild(range.text);
        return range.text;
    }
    onEvent(_event) {
    }
    onExit() {
    }
    showILS(_val) {
        this._showILS = _val;
    }
}
