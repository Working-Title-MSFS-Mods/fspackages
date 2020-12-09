#pragma once


#ifndef FDGAUGE
#define FDGAUGE

#ifndef __INTELLISENSE__
#	define MODULE_EXPORT __attribute__( ( visibility( "default" ) ) )
#	define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#	define MODULE_EXPORT
#	define MODULE_WASM_MODNAME(mod)
#	define __attribute__(x)
#	define __restrict__
#endif

#include "common.h"
#include "FdController.h"
#include <sys/time.h>
#include <chrono>

const int MIN_THR = -16384;
const int MAX_THR = 16384;
const int THR_STEP = 256;

int globalThrottleAxis[2]{ MIN_THR, MIN_THR };

class FdGauge
{
private:

    uint64_t prevTime_ms = 0;
    bool isConnected = false;

    /// <summary>
    /// Registers all the throttle SimConnect client events.
    /// </summary>
    void RegisterThrottleClientEvents()
    {
        printf("Registering throttle events...\r\n");

        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottleSet, "THROTTLE_AXIS_SET_EX1");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottle1SetEx, "THROTTLE1_AXIS_SET_EX1");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottle2SetEx, "THROTTLE2_AXIS_SET_EX1");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleSet, "THROTTLE_SET");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Set, "THROTTLE1_SET");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle2Set, "THROTTLE2_SET");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleFull, "THROTTLE_FULL");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleIncr, "THROTTLE_INCR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleDecr, "THROTTLE_DECR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::ThrottleCut, "THROTTLE_CUT");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::IncreaseThrottle, "INCREASE_THROTTLE");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::DecreaseThrottle, "DECREASE_THROTTLE");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Full, "THROTTLE1_FULL");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Incr, "THROTTLE1_INCR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Decr, "THROTTLE1_DECR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle1Cut, "THROTTLE1_CUT");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle2Full, "THROTTLE2_FULL");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle2Incr, "THROTTLE2_INCR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle2Decr, "THROTTLE2_DECR");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::Throttle2Cut, "THROTTLE2_CUT");
    }

    /// <summary>
    /// Registers the SimConnect throttle event group for capture.
    /// </summary>
    void RegisterThrottleEventGroup()
    {
        printf("Registering throttle event group...\r\n");

        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottleSet, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottle1SetEx, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottle2SetEx, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleSet, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Set, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle2Set, TRUE);

        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleFull, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleIncr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleDecr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::ThrottleCut, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::IncreaseThrottle, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::DecreaseThrottle, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Full, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Incr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Decr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle1Cut, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle2Full, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle2Incr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle2Decr, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::Throttle2Cut, TRUE);

        SimConnect_SetNotificationGroupPriority(hSimConnect, EventGroups::Throttle, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
    }

    /// <summary>
    /// Initializes the connection to SimConnect.
    /// </summary>
    /// <returns>True if successful, false otherwise.</returns>
    bool InitializeSimConnect()
    {
        printf("Connecting to SimConnect...\r\n");
        if (SUCCEEDED(SimConnect_Open(&hSimConnect, "FdGauge", nullptr, 0, 0, 0)))
        {
            printf("SimConnect connected.\r\n");

            this->RegisterThrottleClientEvents();
            this->RegisterThrottleEventGroup();

            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:1", "Percent");
            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:2", "Percent");

            printf("SimConnect registrations complete.\r\n");
            return true;
        }

        printf("SimConnect failed.\r\n");

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
                FdGauge* fd = static_cast<FdGauge*>(pContext);
                if (fd == 0)
                {
                    printf("FD pointer was null processing SimConnect event.\r\n");
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
            globalThrottleAxis[0] = static_cast<int>(evt->dwData);
            globalThrottleAxis[1] = static_cast<int>(evt->dwData);
            break;
        case ThrottleEventIDs::AxisThrottle1SetEx:
            globalThrottleAxis[0] = static_cast<int>(evt->dwData);
            break;
        case ThrottleEventIDs::AxisThrottle2SetEx:
            globalThrottleAxis[1] = static_cast<int>(evt->dwData);
            break;
        case ThrottleEventIDs::ThrottleSet:
            globalThrottleAxis[0] = (static_cast<int>(evt->dwData) * 2) - MAX_THR;
            globalThrottleAxis[1] = (static_cast<int>(evt->dwData) * 2) - MAX_THR;
            break;
        case ThrottleEventIDs::Throttle1Set:
            globalThrottleAxis[0] = (static_cast<int>(evt->dwData) * 2) - MAX_THR;
            break;
        case ThrottleEventIDs::Throttle2Set:
            globalThrottleAxis[1] = (static_cast<int>(evt->dwData) * 2) - MAX_THR;
            break;
        case ThrottleEventIDs::ThrottleFull:
            globalThrottleAxis[0] = MAX_THR;
            globalThrottleAxis[1] = MAX_THR;
            break;
        case ThrottleEventIDs::Throttle1Full:
            globalThrottleAxis[0] = MAX_THR;
            break;
        case ThrottleEventIDs::Throttle2Full:
            globalThrottleAxis[1] = MAX_THR;
            break;
        case ThrottleEventIDs::ThrottleCut:
            globalThrottleAxis[0] = MIN_THR;
            globalThrottleAxis[1] = MIN_THR;
            break;
        case ThrottleEventIDs::Throttle1Cut:
            globalThrottleAxis[0] = MIN_THR;
            break;
        case ThrottleEventIDs::Throttle2Cut:
            globalThrottleAxis[1] = MIN_THR;
            break;
        case ThrottleEventIDs::IncreaseThrottle:
        case ThrottleEventIDs::ThrottleIncr:
            globalThrottleAxis[0] += THR_STEP; // TODO: CLAMP ALL INCR/DECR EVENTS
            globalThrottleAxis[1] += THR_STEP;
            break;
        case ThrottleEventIDs::Throttle1Incr:
            globalThrottleAxis[0] += THR_STEP;
            break;
        case ThrottleEventIDs::Throttle2Incr:
            globalThrottleAxis[1] += THR_STEP;
            break;
        case ThrottleEventIDs::DecreaseThrottle:
        case ThrottleEventIDs::ThrottleDecr:
            globalThrottleAxis[0] -= THR_STEP;
            globalThrottleAxis[1] -= THR_STEP;
            break;
        case ThrottleEventIDs::Throttle1Decr:
            globalThrottleAxis[0] -= THR_STEP;
            break;
        case ThrottleEventIDs::Throttle2Decr:
            globalThrottleAxis[1] -= THR_STEP;
            break;
        }

        globalThrottleAxis[0] = clamp(globalThrottleAxis[0], MIN_THR, MAX_THR);
        globalThrottleAxis[1] = clamp(globalThrottleAxis[1], MIN_THR, MAX_THR);
    }

public:

    /// <summary>
    /// Initializes the FD.
    /// </summary>
    /// <returns>True if successful, false otherwise.</returns>
    bool InitializeFD()
    {
        if (!this->InitializeSimConnect()) {
            printf("Init SimConnect failed");
            return false;
        }

        FdCtrlInstance.init();
        isConnected = true;

        return true;
    }

    /// <summary>
    /// A callback used to update the FD at each tick.
    /// </summary>
    /// <param name="deltaTime">The time since the previous update.</param>
    /// <returns>True if successful, false otherwise.</returns>
    bool OnUpdate(double deltaTime)
    {
        uint64_t currTime_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
        uint64_t timeDiff_ms = currTime_ms - this->prevTime_ms;

        if (isConnected == true) {
            SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);


            if (timeDiff_ms > 50) {
                FdCtrlInstance.update(globalThrottleAxis, deltaTime);
                this->prevTime_ms = currTime_ms;
            }
        }

        return true;
    }

    /// <summary>
    /// Kill.
    /// </summary>
    /// <returns>True if succesful, false otherwise.</returns>
    bool KillFD()
    {
        isConnected = false;
        unregister_all_named_vars();
        return SUCCEEDED(SimConnect_Close(hSimConnect));
    }
};

#endif // !FDGAUGE
