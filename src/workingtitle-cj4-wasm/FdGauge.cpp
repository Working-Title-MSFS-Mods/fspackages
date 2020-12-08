
#ifdef _MSC_VER
#define snprintf _snprintf_s
#elif !defined(__MINGW32__)
#include <iconv.h>
#endif

#include "FdGauge.h"

FdGauge FD_GAUGE;


// ------------------------
// Callbacks
extern "C" {

	MSFS_CALLBACK bool FdGauge_gauge_callback(FsContext ctx, int service_id, void* pData)
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
			return FD_GAUGE.InitializeFD();
		}
		break;
		case PANEL_SERVICE_PRE_DRAW:
		{
            sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
            return FD_GAUGE.OnUpdate(drawData->dt);
		}
		break;
		case PANEL_SERVICE_PRE_KILL:
		{
            FD_GAUGE.KillFD();
			return true;
		}
		break;
		}
		return false;
	}

}
