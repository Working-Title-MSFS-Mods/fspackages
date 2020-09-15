#pragma once

/// <summary>
/// SimConnect client event IDs for the throttle group.
/// </summary>
static enum ThrottleEventIDs
{
	AxisThrottleSet = 0,
	ThrottleFull = 1,
	ThrottleIncr = 2,
	ThrottleIncrSmall = 3,
	ThrottleDecr = 4,
	ThrottleDecrSmall = 5,
	IncreaseThrottle = 6,
	DecreaseThrottle = 7,
	ThrottleSet = 8,
	Throttle1Set = 9,
	Throttle1Incr = 10,
	Throttle1IncrSmall = 11,
	Throttle1Decr = 12,
	Throttle1DecrSmall = 13,
	Throttle1Full = 14,
	Throttle1Cut = 15,
	Throttle10 = 16,
	Throttle20 = 17,
	Throttle30 = 18,
	Throttle40 = 19,
	Throttle50 = 20,
	Throttle60 = 21,
	Throttle70 = 22,
	Throttle80 = 23,
	Throttle90 = 24,
	AxisThrottle1Set = 25,
	ThrottleCut = 26
};

/// <summary>
/// SimConnect client event IDs for the prop group.
/// </summary>
static enum PropellerEventIDs
{
	PropPitchSet = 27,
	PropPitchLo = 28,
	PropPitchIncr = 29,
	PropPitchIncrSmall = 30,
	PropPitchDecr = 31,
	PropPitchDecrSmall = 32,
	PropPitchHi = 33,
	PropPitch1Set = 34,
	PropPitch1Lo = 35,
	PropPitch1Incr = 36,
	PropPitch1IncrSmall = 37,
	PropPitch1Decr = 38,
	PropPitch1DecrSmall = 39,
	AxisPropellerSet = 40,
	AxisPropeller1Set = 41
};

/// <summary>
/// SimConnect event groups.
/// </summary>
static enum EventGroups
{
	/// <summary>
	/// The client event group ID to use when any events from the throttle axis group
	/// are received.
	/// </summary>
	Throttle = 0,

	/// <summary>
	/// The client event group ID to use when any events from the prop axis group
	/// are received.
	/// </summary>
	Propeller = 1
};

/// <summary>
/// SimConnect data types for sending the sim updates.
/// </summary>
static enum DataTypes
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
	double throttle;

	/// <summary>
	/// The propeller setting of the engine, expressed in a 100s base percent.
	/// </summary>
	double propeller;
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
	/// The RPM SimVar unit.
	/// </summary>
	ENUM RPM = get_units_enum("RPM");

	/// <summary>
	/// The Foot pounds SimVar unit.
	/// </summary>
	ENUM FootPounds = get_units_enum("Foot pounds");
};

/// <summary>
/// A collection of SimVar enums.
/// </summary>
class SimVars
{
public:
	/// <summary>
	/// The GENERAL ENGINE THROTTLE LEVER POSITION:1 SimVar.
	/// </summary>
	ENUM Throttle = get_aircraft_var_enum("GENERAL ENG THROTTLE LEVER POSITION");

	/// <summary>
	/// The GENERAL ENGINE PROPELLER LEVER POSITION:1 SimVar.
	/// </summary>
	ENUM Propeller = get_aircraft_var_enum("GENERAL ENG PROPELLER LEVER POSITION");

	/// <summary>
	/// The PROP RPM:1 SimVar.
	/// </summary>
	ENUM PropRpm = get_aircraft_var_enum("PROP RPM");

	/// <summary>
	/// The GENERAL ENG RPM:1 SimVar.
	/// </summary>
	ENUM EngineRpm = get_aircraft_var_enum("GENERAL ENG RPM");

	/// <summary>
	/// The ENG TORQUE:1 SimVar.
	/// </summary>
	ENUM Torque = get_aircraft_var_enum("ENG TORQUE");
};
