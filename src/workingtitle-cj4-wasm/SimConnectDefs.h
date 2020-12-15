#pragma once

#ifndef SCDEFS
#define SCDEFS

#include "common.h"

/// <summary>
/// SimConnect client event IDs for the throttle group.
/// </summary>
enum ThrottleEventIDs
{
    AxisThrottleSet,
    AxisThrottle1Set,
    AxisThrottle2Set,
    AxisThrottleSetEx,
    AxisThrottle1SetEx,
    AxisThrottle2SetEx,
    ThrottleSet,
    Throttle1Set,
    Throttle2Set,
    ThrottleFull,
    Throttle1Full,
    Throttle2Full,
    ThrottleCut,
    Throttle1Cut,
    Throttle2Cut,
    ThrottleIncr,
    Throttle1Incr,
    Throttle2Incr,
    ThrottleDecr,
    Throttle1Decr,
    Throttle2Decr,
    IncreaseThrottle,
    DecreaseThrottle
};

/// <summary>
/// SimConnect event groups.
/// </summary>
enum EventGroups
{
    /// <summary>
    /// The client event group ID to use when any events from the throttle axis group
    /// are received.
    /// </summary>
    Throttle = 0,
};

/// <summary>
/// SimConnect data types for sending the sim updates.
/// </summary>
enum DataTypes
{
    /// <summary>
    /// The data type ID to use when sending engine controls data.
    /// </summary>
    EngineControls = 0
};

/// <summary>
/// Engine controls.
/// </summary>
struct EngineControlData
{
    /// <summary>
    /// The throttle of the engine, expressed in a 100s base percent.
    /// </summary>
    double throttleLeft;

    /// <summary>
    /// The throttle of the engine, expressed in a 100s base percent.
    /// </summary>
    double throttleRight;
};

/// <summary>
/// A collection of SimVar unit enums.
/// </summary>
class Units
{
public:
    /// <summary>
    /// The Percent SimVar unit.
    /// </summary>
    ENUM Percent = get_units_enum("Percent");

    /// <summary>
    /// The Pounds SimVar unit.
    /// </summary>
    ENUM Pounds = get_units_enum("Pounds");

    ENUM Feet = get_units_enum("Feet");

    /// <summary>
    /// The Foot pounds SimVar unit.
    /// </summary>
    ENUM FootPounds = get_units_enum("Foot pounds");

    ENUM Number = get_units_enum("Number");

    ENUM Mach = get_units_enum("Mach");

    ENUM SluggerSlugs = get_units_enum("Slug per cubic feet");
};


/// <summary>
/// A collection of SimVar enums.
/// </summary>
class SimVars
{
public:
    Units* m_Units;

    /// <summary>
    /// The GENERAL ENGINE THROTTLE LEVER POSITION SimVar.
    /// </summary>
    ENUM Throttle = get_aircraft_var_enum("GENERAL ENG THROTTLE LEVER POSITION");

    /// <summary>
    /// The TURB ENG JET THRUST:1 SimVar.
    /// </summary>
    ENUM ThrustEng = get_aircraft_var_enum("TURB ENG JET THRUST");

    ENUM AirSpeedMach = get_aircraft_var_enum("AIRSPEED MACH");

    ENUM PlaneAltitude = get_aircraft_var_enum("PLANE ALTITUDE");

    ENUM AmbientDensity = get_aircraft_var_enum("AMBIENT DENSITY");

    ENUM SimOnGround = get_aircraft_var_enum("SIM ON GROUND");

    /// <summary>
    /// The local variable for the current throttle mode to be ready by MFD.
    /// </summary>
    ID Throttle1Mode;
    ID Throttle2Mode;

    /// <summary>
    /// The local variable for the visible throttle position 1
    /// </summary>
    ID ThrottlePos1;
    ID ThrottlePos2;

    SimVars()
    {
        this->initializeVars();
    }

    void initializeVars() {
        Throttle1Mode = register_named_variable("THROTTLE1_MODE");
        Throttle2Mode = register_named_variable("THROTTLE2_MODE");
        this->setThrottle1Mode(0);
        this->setThrottle2Mode(0);
        ThrottlePos1 = register_named_variable("Throttle1_Pos");
        ThrottlePos2 = register_named_variable("Throttle2_Pos");
        m_Units = new Units();
    }

    void setThrottle1Mode(FLOAT64 value) {
        set_named_variable_value(Throttle1Mode, value);
    }

    void setThrottle2Mode(FLOAT64 value) {
        set_named_variable_value(Throttle2Mode, value);
    }

    void setThrottle1Pos(double value) {
        set_named_variable_value(ThrottlePos1, value);
    }

    void setThrottle2Pos(double value) {
        set_named_variable_value(ThrottlePos2, value);
    }

    FLOAT64 getThrust(int index) {
        return aircraft_varget(ThrustEng, m_Units->Pounds, index);
    }

    FLOAT64 getThrottleLeverPosition(int index) {
        return aircraft_varget(Throttle, m_Units->Percent, index);
    }

    FLOAT64 getMach() {
        return aircraft_varget(AirSpeedMach, m_Units->Mach, 0);
    }

    FLOAT64 getPlaneAltitude() {
        return aircraft_varget(PlaneAltitude, m_Units->Feet, 0);
    }

    FLOAT64 getAmbientDensity() {
        return aircraft_varget(AmbientDensity, m_Units->SluggerSlugs, 0);
    }

    FLOAT64 getSimOnGround() {
        return aircraft_varget(SimOnGround, m_Units->Number, 0);
    }
};

#endif