// DA40ECU.cpp

#include <stdio.h>
#include "DA40ECU.h"
#include <MSFS/MSFS.h>
#include <MSFS/Legacy/gauges.h>
#include <SimConnect.h>
#include "PidController.cpp"
#include "SimConnectDefs.h"

double globalAxis(0);

/// <summary>
/// The engine control unit for the Diamond DA40.
/// </summary>
class DA40ECU
{
private:

	/// <summary>
	/// The handle to the SimConnect instance.
	/// </summary>
	HANDLE hSimConnect;

	/// <summary>
	/// An instance of the throttle PID controller.
	/// </summary>
	PidController* throttleController;

	/// <summary>
	/// An instance of the propeller PID controller.
	/// </summary>
	PidController* propController;

	/// <summary>
	/// The current throttle control axis, from 0 to 16583.
	/// </summary>
	double currentAxis = 0;

	/// <summary>
	/// The SimVars to use with this ECU instance.
	/// </summary>
	SimVars* simVars;

	/// <summary>
	/// The units to use with this ECU instance.
	/// </summary>
	Units* units;

	/// <summary>
	/// Registers all the throttle SimConnect client events.
	/// </summary>
	void RegisterThrottleClientEvents()
	{
		printf("Registering throttle events...\r\n");

		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottleSet, "AXIS_THROTTLE_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottle1Set, "AXIS_THROTTLE1_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::DecreaseThrottle, "INCREASE_THROTTLE");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::IncreaseThrottle, "DECREASE_THROTTLE");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle10, "THROTTLE_10");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Cut, "THROTTLE1_CUT");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Decr, "THROTTLE1_DECR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1DecrSmall, "THROTTLE1_DECR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Full, "THROTTLE1_FULL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Incr, "THROTTLE1_INCR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Set, "THROTTLE1_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle20, "THROTTLE_20");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle30, "THROTTLE_30");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle40, "THROTTLE_40");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle50, "THROTTLE_50");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle60, "THROTTLE_60");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle70, "THROTTLE_70");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle80, "THROTTLE_80");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle90, "THROTTLE_90");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleDecr, "THROTTLE_DECR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleDecrSmall, "THROTTLE_DECR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleFull, "THROTTLE_FULL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleIncr, "THROTTLE_INCR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleIncrSmall, "THROTTLE_INCR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleSet, "THROTTLE_SET");
	}

	/// <summary>
	/// Registers the SimConnect throttle event group for capture.
	/// </summary>
	void RegisterThrottleEventGroup()
	{
		printf("Registering throttle event group...\r\n");

		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottleSet, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottle1Set, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::DecreaseThrottle, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::IncreaseThrottle, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle10, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Cut, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Decr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1DecrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Full, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Incr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Set, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle20, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle30, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle40, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle50, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle60, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle70, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle80, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle90, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleDecr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleDecrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleFull, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleIncr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleIncrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleSet, TRUE);

		SimConnect_SetNotificationGroupPriority(hSimConnect, EventGroups::Throttle, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
	}

	/// <summary>
	/// Registers all the SimConnect propeller events.
	/// </summary>
	void RegisterPropellerClientEvents()
	{
		printf("Registering prop events...\r\n");

		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::AxisPropellerSet, "AXIS_PROPELLER_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::AxisPropeller1Set, "AXIS_PROPELLER1_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1Decr, "PROP_PITCH1_DECR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1DecrSmall, "PROP_PITCH1_DECR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1Incr, "PROP_PITCH1_INCR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1IncrSmall, "PROP_PITCH1_INCR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1Lo, "PROP_PITCH1_LO");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitch1Set, "PROP_PITCH1_SET");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchDecr, "PROP_PITCH_DECR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchHi, "PROP_PITCH_HI");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchIncr, "PROP_PITCH_INCR");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchIncrSmall, "PROP_PITCH_INCR_SMALL");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchLo, "PROP_PITCH_LO");
		SimConnect_MapClientEventToSimEvent(hSimConnect, PropellerEventIDs::PropPitchSet, "PROP_PITCH_SET");
	}

	/// <summary>
	/// Registers the SimConnect propeller event group.
	/// </summary>
	void RegisterPropellerEventGroup()
	{
		printf("Registering prop group...\r\n");

		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::AxisPropellerSet, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::AxisPropeller1Set, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1Decr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1DecrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1Incr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1IncrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1Lo, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitch1Set, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchDecr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchHi, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchIncr, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchIncrSmall, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchLo, TRUE);
		SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Propeller, PropellerEventIDs::PropPitchSet, TRUE);

		SimConnect_SetNotificationGroupPriority(hSimConnect, EventGroups::Propeller, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
	}

	/// <summary>
	/// Initializes the ECU connection to SimConnect.
	/// </summary>
	/// <returns>True if successful, false otherwise.</returns>
	bool InitializeSimConnect()
	{
		printf("Connecting to SimConnect...\r\n");
		if (SUCCEEDED(SimConnect_Open(&hSimConnect, "DA40ECU", nullptr, 0, 0, 0)))
		{
			printf("SimConnect connected.\r\n");

			this->RegisterThrottleClientEvents();
			this->RegisterThrottleEventGroup();

			this->RegisterPropellerClientEvents();
			this->RegisterPropellerEventGroup();

			SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:1", "Percent");
			SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG PROPELLER LEVER POSITION:1", "Percent");

			printf("SimConnect registrations complete.\r\n");
			return true;
		}

		return false;
	}

	/// <summary>
	/// A callback used for handling SimConnect updates.
	/// </summary>
	/// <param name="pData">The update data sent by SimConnect.</param>
	/// <param name="cbData">The size of the SimConnect data structure.</param>
	/// <param name="pContext">A pointer specified by the client.</param>
	static void CALLBACK HandleAxisEvent(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
	{
		if (pData->dwID == SIMCONNECT_RECV_ID::SIMCONNECT_RECV_ID_EVENT)
		{
			SIMCONNECT_RECV_EVENT* evt = static_cast<SIMCONNECT_RECV_EVENT*>(pData);
			if (evt->uGroupID == EventGroups::Throttle)
			{
				DA40ECU* ecu = static_cast<DA40ECU*>(pContext);
				if (ecu == 0)
				{
					printf("ECU pointer was null processing SimConnect event.\r\n");
				}
				else
				{
					HandleThrottleAxis(evt);
				}	
			}
		}

		if (pData->dwID == SIMCONNECT_RECV_ID::SIMCONNECT_RECV_ID_EXCEPTION)
		{
			SIMCONNECT_RECV_EXCEPTION* ex = static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData);
			printf("SimConnect Exception: %d \r\n", ex->dwException);
		}
	}

	/// <summary>
	/// Handles throttle axis updates received from SimConnect.
	/// </summary>
	/// <param name="evt">A pointer to the SimConnect event structure.</param>
	static void HandleThrottleAxis(SIMCONNECT_RECV_EVENT* evt)
	{		
		switch (evt->uEventID)
		{
			case ThrottleEventIDs::AxisThrottleSet:
			case ThrottleEventIDs::AxisThrottle1Set:
			case ThrottleEventIDs::ThrottleSet:
				globalAxis = static_cast<double>(evt->dwData);
				break;
			case ThrottleEventIDs::IncreaseThrottle:
			case ThrottleEventIDs::Throttle1Incr:
			case ThrottleEventIDs::ThrottleIncr:
				globalAxis = min(16383, globalAxis + 163.83);
				break;
			case ThrottleEventIDs::DecreaseThrottle:
			case ThrottleEventIDs::Throttle1Decr:
			case ThrottleEventIDs::ThrottleDecr:
				globalAxis = max(0, globalAxis - 163.83);
				break;
			case ThrottleEventIDs::Throttle1IncrSmall:
			case ThrottleEventIDs::ThrottleIncrSmall:
				globalAxis = min(16383, globalAxis + 16.383);
				break;
			case ThrottleEventIDs::Throttle1DecrSmall:
			case ThrottleEventIDs::ThrottleDecrSmall:
				globalAxis = max(0, globalAxis - 16.383);
				break;
			case ThrottleEventIDs::Throttle1Full:
			case ThrottleEventIDs::ThrottleFull:
				globalAxis = 16383;
				break;
			case ThrottleEventIDs::Throttle1Cut:
			case ThrottleEventIDs::ThrottleCut:
				globalAxis = 0;
				break;
		}
	}

public:
	/// <summary>
	/// Initializes the ECU.
	/// </summary>
	/// <returns>True if successful, false otherwise.</returns>
	bool InitializeECU()
	{
		this->throttleController = new PidController(0.010, 0, 0.0000005, -2, 2);
		this->propController = new PidController(0.010, 0, 0.0000005, -2, 2);

		this->simVars = new SimVars();
		this->units = new Units();

		this->currentAxis = 0.0;
		globalAxis = 0.0;

		return this->InitializeSimConnect();
	}

	/// <summary>
	/// A callback used to update the ECU at each tick.
	/// </summary>
	/// <param name="deltaTime">The time since the previous update.</param>
	/// <returns>True if successful, false otherwise.</returns>
	bool OnUpdate(double deltaTime)
	{
		SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);
		this->currentAxis = globalAxis;

		double throttle = aircraft_varget(this->simVars->Throttle, this->units->Percent, 1);
		double propeller = aircraft_varget(this->simVars->Propeller, this->units->Percent, 1);

		double propRpm = aircraft_varget(this->simVars->PropRpm, this->units->RPM, 1);
		double torque = aircraft_varget(this->simVars->Torque, this->units->FootPounds, 1);

		double targetPower = this->currentAxis / 163.83;
		double targetRpm;
		if (targetPower >= 92)
		{
			targetRpm = 2100 + ((targetPower - 92) / 8) * 200;
		}
		else if (targetPower >= 20)
		{
			targetRpm = 1800 + ((targetPower - 20) / 72) * 300;
		}
		else
		{
			targetRpm = 2150 - (targetPower / 20) * 350;
		}

		double targetTorque = (168 * (targetPower / 100)) / ((targetRpm * 1.69) / 5252);
		double propOutput = this->propController->GetOutput(targetRpm - propRpm, deltaTime);
		double throttleOutput = this->throttleController->GetOutput(targetTorque - torque, deltaTime);

		EngineControlData controls;
		controls.throttle = max(0, min(100, throttle + throttleOutput));
		controls.propeller = max(0, min(100, propeller + propOutput));

		SimConnect_SetDataOnSimObject(this->hSimConnect, DataTypes::EngineControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(EngineControlData), &controls);

		//printf("G: %lf L: %lf \r\n", globalAxis, this->currentAxis);
		//printf("R: %lf|%lf T: %lf|%lf O: %lf|%lf P: %lf|%lf \r\n", propRpm, targetRpm, torque, targetTorque, throttleOutput, propOutput, throttle, propeller);

		return true;
	}

	/// <summary>
	/// Kills the ECU.
	/// </summary>
	/// <returns>True if succesful, false otherwise.</returns>
	bool KillECU()
	{
		return SUCCEEDED(SimConnect_Close(hSimConnect));
	}

	/// <summary>
	/// Gets the current throttle axis value.
	/// </summary>
	/// <returns>The current throttle axis value.</returns>
	double getAxis()
	{
		return currentAxis;
	}

	/// <summary>
	/// Sets the current throttle axis value.
	/// </summary>
	/// <param name="val">The value to set.</param>
	void setAxis(double val)
	{
		currentAxis = val;
	}
};

DA40ECU* ECUInstance;

extern "C"
{
	MSFS_CALLBACK bool DA40ECU_gauge_callback(FsContext ctx, const int service_id, void* pData)
	{
		switch (service_id)
		{
			case PANEL_SERVICE_PRE_INSTALL:
			{
				return true;
			}
			break;
			case PANEL_SERVICE_POST_INSTALL:
			{
				ECUInstance = new DA40ECU();
				return ECUInstance->InitializeECU();
			}
			break;
			case PANEL_SERVICE_PRE_DRAW:
			{
				sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
				return ECUInstance->OnUpdate(drawData->dt);
			}
			break;
			case PANEL_SERVICE_PRE_KILL:
			{
				return ECUInstance->KillECU();
			}
			break;
		}

		return false;
	}
}
