/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

const Simplane = {
    getDesignSpeeds() {
        var speeds = new DesignSpeeds();
        speeds.VS0 = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VS0", "knots");
        speeds.VS1 = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VS1", "knots");
        speeds.VFe = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VFE", "knots");
        speeds.VNe = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNE", "knots");
        speeds.VNo = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        speeds.VMin = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VMIN", "knots");
        speeds.VMax = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VMAX", "knots");
        speeds.Vr = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VR", "knots");
        speeds.Vx = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VX", "knots");
        speeds.Vy = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VY", "knots");
        speeds.Vapp = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VAPP", "knots");
        speeds.BestGlide = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED BEST GLIDE", "knots");
        return speeds;
    },
    getTrueSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        return Math.max(0, speed);
    },
    getIndicatedSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED INDICATED", "knots");
        return Math.max(0, speed);
    },
    getVerticalSpeed() {
        var speed = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        return speed;
    },
    getGroundSpeed() {
        var speed = SimVar.GetSimVarValue("GPS GROUND SPEED", "Knots");
        return speed;
    },
    getMachSpeed() {
        var speed = SimVar.GetSimVarValue("AIRSPEED MACH", "mach");
        return speed;
    },
    getV1Airspeed() {
        let phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_V1_SPEED", "Knots");
        }
        return -1;
    },
    getVRAirspeed() {
        let phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_VR_SPEED", "Knots");
        }
        return -1;
    },
    getV2Airspeed() {
        let phase = getCurrentFlightPhase();
        if (phase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            return SimVar.GetSimVarValue("L:AIRLINER_V2_SPEED", "Knots");
        }
        return -1;
    },
    getREFAirspeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_VREF_SPEED", "Knots");
    },
    getVXAirspeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_VX_SPEED", "Knots");
    },
    getFMCGreenDotSpeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_TO_GREEN_DOT_SPD", "Number");
    },
    getFMCApprGreenDotSpeed() {
        return SimVar.GetSimVarValue("L:AIRLINER_APPR_GREEN_DOT_SPD", "Number");
    },
    getGreenDotSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT GREEN DOT SPEED", "Knots");
    },
    getCrossoverSpeedFactor(_cas, _mach) {
        if (_mach > 0)
            return SimVar.GetGameVarValue("AIRCRAFT CROSSOVER SPEED FACTOR", "Number", _cas, _mach);
        return 1.0;
    },
    getFlapsLimitSpeed(_aircraft, _flapIndex) {
        let maxSpeed = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        if (_flapIndex > 0) {
            let limit = SimVar.GetGameVarValue("AIRCRAFT FLAPS SPEED LIMIT", "Knots", _flapIndex);
            if (limit > 0) {
                maxSpeed = limit;
            }
        }
        return maxSpeed;
    },
    getFlapsHandleIndex(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneFlapHandleIndex === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneFlapHandleIndexTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            // Unresolved variables (probably meant to be inside an immediately invoked function expression)
            // _simplaneFlapHandleIndex = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
            // _simplaneFlapHandleIndexTimeLastCall = t;
        }
        return _simplaneFlapHandleIndex;
    },
    getFlapsExtendSpeed(_aircraft, forceSimVarCall = false) {
        let flapsHandleIndex = Simplane.getFlapsHandleIndex(forceSimVarCall);
        return getFlapsLimitSpeed(_aircraft, flapsHandleIndex);
    },
    getNextFlapsExtendSpeed(_aircraft, forceSimVarCall = false) {
        let flapsHandleIndex = Simplane.getFlapsHandleIndex(forceSimVarCall) + 1;
        return getFlapsLimitSpeed(_aircraft, flapsHandleIndex);
    },
    getMaxSpeed(_aircraft) {
        let maxSpeed = SimVar.GetGameVarValue("AIRCRAFT DESIGN SPEED VNO", "knots");
        maxSpeed = Math.min(maxSpeed, getFlapsExtendSpeed(_aircraft));
        if (SimVar.GetSimVarValue("GEAR POSITION", "Number") > Number.EPSILON) {
            let gearSpeed = SimVar.GetGameVarValue("AIRCRAFT MAX GEAR EXTENDED", "knots");
            maxSpeed = Math.min(maxSpeed, gearSpeed);
        }
        return maxSpeed;
    },
    getLowestSelectableSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT LOWEST SELECTABLE SPEED", "knots");
    },
    getStallProtectionMinSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL PROTECTION SPEED MIN", "knots");
    },
    getStallProtectionMaxSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL PROTECTION SPEED MAX", "knots");
    },
    getStallSpeed() {
        return SimVar.GetGameVarValue("AIRCRAFT STALL SPEED", "knots");
    },
    getStallSpeedPredicted(_flapIndex) {
        return SimVar.GetGameVarValue("AIRCRAFT STALL SPEED PREDICTED", "knots", _flapIndex);
    },
    getWindDirection() {
        var angle = SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "Degrees");
        return angle;
    },
    getWindStrength() {
        var strength = SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "Knots");
        return strength;
    },
    getAutoPilotActive(_apIndex = 0) {
        if (_apIndex == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
        } else {
            return SimVar.GetSimVarValue("L:XMLVAR_Autopilot_" + _apIndex + "_Status", "Bool");
        }
    },
    getAutoPilotAirspeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 2;
    },
    getAutoPilotAirspeedSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 1;
    },
    getAutoPilotAirspeedHoldActive(isManaged = false) {
        return SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD:" + (isManaged ? "2" : "1"), "Bool");
    },
    getAutoPilotAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots");
        return speed;
    },
    getAutoPilotSelectedAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR:1", "knots");
        return speed;
    },
    getAutoPilotManagedAirspeedHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR:2", "knots");
        return speed;
    },
    getAutoPilotMachModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "bool") || SimVar.GetSimVarValue("AUTOPILOT MANAGED SPEED IN MACH", "bool");
    },
    getAutoPilotMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR", "number");
        return speed;
    },
    getAutoPilotSelectedMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR:1", "number");
        return speed;
    },
    getAutoPilotManagedMachHoldValue() {
        var speed = SimVar.GetSimVarValue("AUTOPILOT MACH HOLD VAR:2", "number");
        return speed;
    },
    getAutoPilotHeadingManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 2;
    },
    getAutoPilotHeadingSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 1;
    },
    getAutoPilotHeadingLockActive() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool");
    },
    getAutoPilotHeadingLockValue(_radians = true) {
        if (_radians) {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "radians");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degrees");
        }
    },
    getAutoPilotSelectedHeadingLockValue(_radians = true) {
        if (_radians) {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "radians");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR:1", "degrees");
        }
    },
    getAutoPilotAltitudeManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 2;
    },
    getAutoPilotAltitudeSelected() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 1;
    },
    getAutoPilotAltitudeArmed() {
        if (Simplane.getAutoPilotVerticalSpeedHoldActive()) {
            return true;
        }
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Bool");
    },
    getAutoPilotAltitudeLockActive() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool");
    },
    getAutoPilotFLCActive() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean") === 1;
    },
    getAutoPilotAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", _units);
        return altitude;
    },
    getAutoPilotSelectedAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:1", _units);
        return altitude;
    },
    getAutoPilotDisplayedAltitudeLockValue(_units = "feet") {
        var altitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:3", _units);
        return altitude;
    },
    getAutoPilotAltitudeLockUnits() {
        return "feet";
    },
    getAutoPilotVerticalSpeedHoldActive() {
        return SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool");
    },
    getAutoPilotVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        return vspeed;
    },
    getAutoPilotSelectedVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:2", "feet per minute");
        return vspeed;
    },
    getAutoPilotDisplayedVerticalSpeedHoldValue() {
        var vspeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR:3", "feet per minute");
        return vspeed;
    },
    getAutoPilotLateralModeActive() {
        return SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "bool");
    },
    getAutoPilotFlightDirectorActive(_fdIndex) {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR ACTIVE:" + _fdIndex, "bool");
    },
    getAutoPilotFlightDirectorBankValue() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK", "degree");
        return angle;
    },
    getAutoPilotFlightDirectorPitchValue() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree");
        return angle;
    },
    getAutopilotGPSDriven() {
        return SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
    },
    getAutopilotGPSActive() {
        return SimVar.GetSimVarValue("GPS IS ACTIVE WAY POINT", "Bool");
    },
    getAutoPilotTrackAngle() {
        var angle = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
        return angle;
    },
    getAutoPilotFlightPathAngle() {
        var angle = SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH", "degree");
        return angle;
    },
    getAutoPilotThrottleArmed(_index = 0) {
        if (_index == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM", "bool");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT THROTTLE ARM:" + _index, "bool");
        }
    },
    getAutoPilotThrottleLocked() {
        return SimVar.GetSimVarValue("FLY BY WIRE ALPHA PROTECTION", "bool");
    },
    getAutoPilotThrottleActive(_index = 0) {
        if (_index == 0) {
            return SimVar.GetSimVarValue("AUTOPILOT MANAGED THROTTLE ACTIVE", "bool");
        } else {
            return SimVar.GetSimVarValue("AUTOPILOT MANAGED THROTTLE ACTIVE:" + _index, "bool");
        }
    },
    getAutoPilotTOGAActive() {
        return SimVar.GetSimVarValue("AUTOPILOT TAKEOFF POWER ACTIVE", "bool");
    },
    getAutoPilotAPPRCaptured() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH CAPTURED", "bool");
    },
    getAutoPilotAPPRActive() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ACTIVE", "bool") && !getAutopilotGPSDriven() && getAutoPilotAPPRCaptured())
            return true;
        return false;
    },
    getAutoPilotAPPRArm() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ARM", "bool"))
            return true;
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH ACTIVE", "bool") && (getAutopilotGPSDriven() || !getAutoPilotAPPRCaptured()))
            return true;
        return false;
    },
    getAutoPilotAPPRHold() {
        return SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "bool");
    },
    getAutoPilotTRKFPAModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_TRK_FPA_MODE_ACTIVE", "Boolean");
    },
    getAutoPilotTRKModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_TRK_MODE_ACTIVE", "Boolean");
    },
    getAutoPilotFPAModeActive() {
        return SimVar.GetSimVarValue("L:XMLVAR_FPA_MODE_ACTIVE", "Boolean");
    },
    getAutoPilotGlideslopeActive() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "bool");
    },
    getAutoPilotGlideslopeArm() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "bool");
    },
    getAutoPilotGlideslopeHold() {
        return SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE HOLD", "bool");
    },
    getAutoPilotApproachType() {
        return SimVar.GetSimVarValue("GPS APPROACH APPROACH TYPE", "Enum");
    },
    getAutoPilotApproachLoaded() {
        return SimVar.GetSimVarValue("GPS IS APPROACH LOADED", "bool");
    },
    getAutoPilotNavAidState(_user, _switch) {
        var varName = "L:XMLVAR_NAV_AID_SWITCH_" + ((_user == 1) ? "L" : "R") + _switch + "_State";
        return SimVar.GetSimVarValue(varName, "number");
    },
    getAutoPilotIsHeadingAligned() {
        let heading = getHeadingMagnetic();
        let targetHeading = getAutoPilotHeadingLockValue(false);
        let delta = Math.abs(targetHeading - heading);
        while (delta >= 360) {
            delta -= 360;
        }
        return delta < 1;
    },
    getNextWaypointName() {
        return SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
    },
    getNextWaypointTrack() {
        var angle = SimVar.GetSimVarValue("GPS WP BEARING", "degree");
        return angle;
    },
    getNextWaypointDistance() {
        var distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles");
        return distance;
    },
    getNextWaypointETA() {
        var time = SimVar.GetSimVarValue("GPS WP ETA", "seconds");
        return time;
    },
    getFlightTime() {
        return SimVar.GetSimVarValue("GENERAL ENG ELAPSED TIME:1", "seconds");
    },
    getCurrentUTC() {
        return SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    },
    getEngineCount() {
        return SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
    },
    getEngineActive(_engineIndex) {
        return SimVar.GetSimVarValue("ENG COMBUSTION:" + (_engineIndex + 1), "bool");
    },
    getEngineThrottle(_engineIndex) {
        var name = "GENERAL ENG THROTTLE LEVER POSITION:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    },
    getEngineThrottleMode(_engineIndex) {
        var name = "GENERAL ENG THROTTLE MANAGED MODE:" + (_engineIndex + 1);
        var mode = SimVar.GetSimVarValue(name, "number");
        return mode;
    },
    getEngineCommandedN1(_engineIndex) {
        var name = "TURB ENG COMMANDED N1:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    },
    getEngineThrottleCommandedN1(_engineIndex) {
        var name = "TURB ENG THROTTLE COMMANDED N1:" + (_engineIndex + 1);
        var fThrottle = SimVar.GetSimVarValue(name, "percent");
        return fThrottle;
    },
    getEngineThrottleMaxThrust(_engineIndex) {
        return SimVar.GetSimVarValue("AUTOPILOT THROTTLE MAX THRUST", "number") * 100;
    },
    getEngineThrustTakeOffMode(_engineIndex) {
        return SimVar.GetSimVarValue("L:AIRLINER_THRUST_TAKEOFF_MODE", "number");
    },
    getEngineThrustClimbMode(_engineIndex) {
        return SimVar.GetSimVarValue("L:AIRLINER_THRUST_CLIMB_MODE", "number");
    },
    getAutopilotThrottle(_engineIndex) {
        return getEngineThrottle(_engineIndex);
    },
    getAutopilotCommandedN1(_engineIndex) {
        return getEngineCommandedN1(_engineIndex);
    },
    getEngineType() {
        var type = SimVar.GetSimVarValue("ENGINE TYPE", "Enum");
        return type;
    },
    getEngineRPM(_engineIndex) {
        var engineType = getEngineType();
        var usePropRpm = SimVar.GetGameVarValue("AIRCRAFT USE PROPELLER RPM", "bool");
        var name;
        if (engineType == EngineType.ENGINE_TYPE_JET) {
            name = "ENG N1 RPM:" + (_engineIndex + 1);
        } else if (engineType == EngineType.ENGINE_TYPE_TURBOPROP) {
            name = "PROP RPM:" + (_engineIndex + 1);
        } else if (engineType == EngineType.ENGINE_TYPE_PISTON) {
            if (usePropRpm) {
                name = "PROP RPM:" + (_engineIndex + 1);
            } else {
                name = "GENERAL ENG RPM:" + (_engineIndex + 1);
            }
        } else {
            name = "GENERAL ENG RPM:" + (_engineIndex + 1);
        }
        return SimVar.GetSimVarValue(name, "rpm");
    },
    getEnginePower(_engineIndex) {
        var percent = 0;
        var engineType = getEngineType();
        if (engineType == EngineType.ENGINE_TYPE_TURBOPROP) {
            var name = "TURB ENG MAX TORQUE PERCENT:" + (_engineIndex + 1);
            percent = SimVar.GetSimVarValue(name, "percent");
        } else if (engineType == EngineType.ENGINE_TYPE_JET) {
            var name = "ENG N1 RPM:" + (_engineIndex + 1);
            percent = SimVar.GetSimVarValue(name, "percent");
        } else if (engineType == EngineType.ENGINE_TYPE_PISTON) {
            var maxHP = SimVar.GetGameVarValue("AIRCRAFT MAX RATED HP", "ft lb per second") / 550;
            maxHP /= SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
            var currentHP = SimVar.GetSimVarValue("ENG TORQUE:" + (_engineIndex + 1), "Foot pounds") * SimVar.GetSimVarValue("GENERAL ENG RPM:" + (_engineIndex + 1), "rpm") / 5252;
            percent = (currentHP / maxHP) * 100;
        }
        return percent;
    },
    getMinCruiseRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MIN CRUISE RPM", "rpm");
    },
    getMaxCruiseRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX CRUISE RPM", "rpm");
    },
    getMaxIndicatedRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX INDICATED RPM", "rpm");
    },
    getMaxRatedRPM() {
        return SimVar.GetGameVarValue("AIRCRAFT MAX RATED RPM", "rpm");
    },
    getPropellerType() {
        var type = SimVar.GetGameVarValue("AIRCRAFT PROPELLER TYPE", "Enum");
        return type;
    },
    getNbPropellers() {
        var type = SimVar.GetGameVarValue("AIRCRAFT NB PROPELLERS", "Enum");
        return type;
    },
    getInclinometer() {
        return SimVar.GetSimVarValue("TURN COORDINATOR BALL", "position");
    },
    getAngleOfAttack() {
        return SimVar.GetGameVarValue("AIRCRAFT AOA ANGLE", "angl16");
    },
    getOrientationAxis() {
        return SimVar.GetGameVarValue("AIRCRAFT ORIENTATION AXIS", "XYZ");
    },
    getAltitude() {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
        return altitude;
    },
    getGroundReference() {
        var groundReference = SimVar.GetSimVarValue("GROUND ALTITUDE", "feet");
        return groundReference;
    },
    getTurnRate() {
        var turnRate = SimVar.GetSimVarValue("TURN INDICATOR RATE", "radians per second");
        return turnRate;
    },
    getHeadingMagnetic() {
        var angle = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        return angle;
    },
    getPitch() {
        return SimVar.GetSimVarValue("ATTITUDE INDICATOR PITCH DEGREES:1", "degree");
    },
    getBank() {
        return SimVar.GetSimVarValue("ATTITUDE INDICATOR BANK DEGREES:1", "degree");
    },
    getFlightDirectorPitch() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR PITCH EX1", "degree");
    },
    getFlightDirectorBank() {
        return SimVar.GetSimVarValue("AUTOPILOT FLIGHT DIRECTOR BANK EX1", "degree");
    },
    getIsGrounded() {
        return getAltitudeAboveGround() < 10;
    },
    getAltitudeAboveGround(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneAltitudeAboveGround === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneAltitudeAboveGroundTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            // Unresolved variables (probably meant to be inside an immediately invoked function expression)
            // _simplaneAltitudeAboveGround = Math.max(0, SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND MINUS CG", "Feet"));
            // _simplaneAltitudeAboveGroundTimeLastCall = t;
        }
        return _simplaneAltitudeAboveGround;
    },
    getCrossoverAltitude(_cas, _mach) {
        return SimVar.GetGameVarValue("AIRCRAFT CROSSOVER ALTITUDE", "feet", _cas, _mach);
    },
    getThrustReductionAltitude() {
        return SimVar.GetSimVarValue("L:AIRLINER_THR_RED_ALT", "number");
    },
    getFlapsNbHandles() {
        return SimVar.GetSimVarValue("FLAPS NUM HANDLE POSITIONS", "number");
    },
    getFlapsHandlePercent() {
        return SimVar.GetSimVarValue("FLAPS HANDLE PERCENT", "percent over 100");
    },
    getFlapsHandleAngle(_flapIndex) {
        return SimVar.GetGameVarValue("AIRCRAFT FLAPS HANDLE ANGLE", "Degree", _flapIndex);
    },
    getFlapsAngle() {
        return SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "radians");
    },
    getTrim() {
        return SimVar.GetSimVarValue("ELEVATOR TRIM PCT", "percent over 100");
    },
    getTrimIndicator() {
        return SimVar.GetSimVarValue("ELEVATOR TRIM INDICATOR", "number");
    },
    getTrimNeutral() {
        return SimVar.GetGameVarValue("AIRCRAFT ELEVATOR TRIM NEUTRAL", "percent over 100");
    },
    setTransponderToRegion() {
        var code = 0;
        let region = getWorldRegion();
        if (region == WorldRegion.NORTH_AMERICA || region == WorldRegion.AUSTRALIA)
            code = (1 * 4096) + (2 * 256) + (0 * 16) + 0;
        else
            code = (7 * 4096) + (0 * 256) + (0 * 16) + 0;
        SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", code);
    },
    setTransponderToZero() {
        SimVar.SetSimVarValue("K:XPNDR_SET", "Bco16", 0);
    },
    getTotalAirTemperature() {
        return SimVar.GetSimVarValue("TOTAL AIR TEMPERATURE", "celsius");
    },
    getAmbientTemperature() {
        return SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
    },
    getFlexTemperature() {
        return SimVar.GetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number");
    },
    getFuelPercent() {
        var fFuelCapacity = SimVar.GetSimVarValue("FUEL TOTAL CAPACITY", "gallons");
        if (fFuelCapacity > 0) {
            var fFuelQuantity = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
            var fPercent = (fFuelQuantity / fFuelCapacity) * 100;
            fPercent = Math.max(0, Math.min(100, fPercent));
            return fPercent;
        }
        return 0;
    },
    getFuelQuantity() {
        var fFuelCapacity = SimVar.GetSimVarValue("FUEL TOTAL CAPACITY", "gallons");
        if (fFuelCapacity > 0) {
            var fFuelQuantity = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
            return fFuelQuantity;
        }
        return 0;
    },
    getTotalFuel() {
        return SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "kg");
    },
    getFuelUsed(_engineIndex) {
        return SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:" + (_engineIndex + 1), "kg");
    },
    getCompassAngle() {
        return SimVar.GetSimVarValue("WISKEY COMPASS INDICATION DEGREES", "radians");
    },
    getPressureValue(_units = "inches of mercury") {
        var value = SimVar.GetSimVarValue("KOHLSMAN SETTING HG", _units);
        return value;
    },
    getPressureSelectedUnits() {
        if (SimVar.GetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "Bool"))
            return "millibar";
        return "inches of mercury";
    },
    getPressureSelectedMode(_aircraft) {
        if (_aircraft == Aircraft.A320_NEO) {
            let val = SimVar.GetSimVarValue("L:XMLVAR_Baro1_Mode", "number");
            if (val == 0)
                return "QFE";
            else if (val == 1)
                return "QNH";
            else
                return "STD";
        }
        let val = SimVar.GetSimVarValue("L:XMLVAR_Baro1_ForcedToSTD", "Bool");
        if (val)
            return "STD";
        return "";
    },
    getHasGlassCockpit() {
        return SimVar.GetGameVarValue("AIRCRAFT HAS GLASSCOCKPIT", "boolean");
    },
    getPressurisationCabinAltitude() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "Feet");
    },
    getPressurisationCabinAltitudeGoal() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE GOAL", "Feet");
    },
    getPressurisationCabinAltitudeRate() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "Feet");
    },
    getPressurisationDifferential() {
        return SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "psi");
    },
    getWeight() {
        return SimVar.GetSimVarValue("TOTAL WEIGHT", "kg");
    },
    getMaxWeight() {
        return SimVar.GetSimVarValue("MAX GROSS WEIGHT", "kg");
    },
    getGearPosition() {
        return SimVar.GetSimVarValue("GEAR POSITION", "percent");
    },
    getUnitIsMetric() {
        return SimVar.GetGameVarValue("GAME UNIT IS METRIC", "boolean");
    },
    getCurrentFlightPhase(forceSimVarCall = false) {
        let doSimVarCall = false;
        let t = 0;
        if (forceSimVarCall || _simplaneCurrentFlightPhase === undefined) {
            doSimVarCall = true;
        } else {
            t = performance.now();
            if (t - _simplaneCurrentFlightPhaseTimeLastCall > 1000) {
                doSimVarCall = true;
            }
        }
        if (doSimVarCall) {
            // Unresolved variables (probably meant to be inside an immediately invoked function expression)
            // _simplaneCurrentFlightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number");
            // _simplaneCurrentFlightPhaseTimeLastCall = t;
        }
        return _simplaneCurrentFlightPhase;
    },
    getWorldRegion() {
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        if (lat >= 20 && lat <= 50 && long <= -60 && long >= -130) {
            return WorldRegion.NORTH_AMERICA;
        } else if (lat <= -8 && lat >= -50 && long >= 23 && long <= 160) {
            return WorldRegion.AUSTRALIA;
        }
        return WorldRegion.OTHER;
    }
}
