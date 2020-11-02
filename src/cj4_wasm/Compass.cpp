// Copyright (c) Asobo Studio, All rights reserved. www.asobostudio.com

#include <MSFS\MSFS.h>
#include "MSFS\MSFS_Render.h"
#include "MSFS\Render\nanovg.h"
#include <MSFS\Legacy\gauges.h>

#include <stdio.h>
#include <string.h>
#include <math.h>
#include <map>

#ifdef _MSC_VER
#define snprintf _snprintf_s
#elif !defined(__MINGW32__)
#include <iconv.h>
#endif

struct sCompassVars
{
	ENUM m_eDegrees;
	ENUM m_ePlaneHeadingDegreesTrue;
	int m_iFont;
};

sCompassVars g_CompassVars;
std::map < FsContext, NVGcontext*> g_CompassNVGcontext;

// ------------------------
// Callbacks
extern "C" {

	MSFS_CALLBACK bool Compass_gauge_callback(FsContext ctx, int service_id, void* pData)
	{
		switch (service_id)
		{
		case PANEL_SERVICE_PRE_INSTALL:
		{
			sGaugeInstallData* p_install_data = (sGaugeInstallData*)pData;
			// Width given in p_install_data->iSizeX
			// Height given in p_install_data->iSizeY
			g_CompassVars.m_eDegrees = get_units_enum("DEGREES");
			g_CompassVars.m_ePlaneHeadingDegreesTrue = get_aircraft_var_enum("PLANE HEADING DEGREES TRUE");
			return true;
		}
		break;
		case PANEL_SERVICE_POST_INSTALL:
		{
			NVGparams params;
			params.userPtr = ctx;
			params.edgeAntiAlias = true;
			g_CompassNVGcontext[ctx] = nvgCreateInternal(&params);
			NVGcontext* nvgctx = g_CompassNVGcontext[ctx];
			g_CompassVars.m_iFont = nvgCreateFont(nvgctx, "sans", "./data/Roboto-Regular.ttf");
			return true;
		}
		break;
		case PANEL_SERVICE_PRE_DRAW:
		{
			sGaugeDrawData* p_draw_data = (sGaugeDrawData*)pData;
			FLOAT64 fHeading = aircraft_varget(g_CompassVars.m_ePlaneHeadingDegreesTrue, g_CompassVars.m_eDegrees, 0);
			float fSize = (float)min(p_draw_data->winWidth, p_draw_data->winHeight);
			float fR = fSize * 0.5f;
			float pxRatio = (float)p_draw_data->fbWidth / (float)p_draw_data->winWidth;
			NVGcontext* nvgctx = g_CompassNVGcontext[ctx];
			nvgBeginFrame(nvgctx, p_draw_data->winWidth, p_draw_data->winHeight, pxRatio);
			{
				// Black background
				nvgFillColor(nvgctx, nvgRGB(0, 0, 0));
				nvgBeginPath(nvgctx);
				nvgRect(nvgctx, 0, 0, p_draw_data->winWidth, p_draw_data->winHeight);
				nvgFill(nvgctx);

				// Center
				nvgTranslate(nvgctx, p_draw_data->winWidth * 0.5f, p_draw_data->winHeight * 0.5f);

				// 8 fixed Ticks
				nvgStrokeWidth(nvgctx, 2.0f);
				nvgStrokeColor(nvgctx, nvgRGB(255, 255, 255));
				nvgBeginPath(nvgctx);
				float fR1 = fR * 0.95f;
				float fR2 = fR * 0.99f;
				for (int i = 0; i < 360; i += 45)
				{
					float fRads = i * M_PI / 180;
					nvgMoveTo(nvgctx, fR1 * cos(fRads), fR1 * sin(fRads));
					nvgLineTo(nvgctx, fR2 * cos(fRads), fR2 * sin(fRads));
				}
				nvgStroke(nvgctx);

				// Plane
				nvgFillColor(nvgctx, nvgRGB(255, 255, 255));
				nvgBeginPath(nvgctx);
				nvgMoveTo(nvgctx, 0, fR * -0.5f);
				nvgLineTo(nvgctx, fR * 0.05f, fR * -0.4f);
				nvgLineTo(nvgctx, fR * 0.05f, fR * -0.2f);
				nvgLineTo(nvgctx, fR * 0.4f, fR * -0.05f);
				nvgLineTo(nvgctx, fR * 0.4f, fR * 0.05f);
				nvgLineTo(nvgctx, fR * 0.05f, fR * 0.05f);
				nvgLineTo(nvgctx, fR * 0.05f, fR * 0.3f);
				nvgLineTo(nvgctx, fR * 0.2f, fR * 0.4f);
				nvgLineTo(nvgctx, fR * -0.2f, fR * 0.4f);
				nvgLineTo(nvgctx, fR * -0.05f, fR * 0.3f);
				nvgLineTo(nvgctx, fR * -0.05f, fR * 0.05f);
				nvgLineTo(nvgctx, fR * -0.4f, fR * 0.05f);
				nvgLineTo(nvgctx, fR * -0.4f, fR * -0.05f);
				nvgLineTo(nvgctx, fR * -0.05f, fR * -0.2f);
				nvgLineTo(nvgctx, fR * -0.05f, fR * -0.4f);
				nvgClosePath(nvgctx);
				nvgFill(nvgctx);


				// 72 rotating Ticks
				nvgRotate(nvgctx, -fHeading * M_PI / 180);
				nvgBeginPath(nvgctx);
				float fRS1 = fR * 0.90f;
				float fRS2 = fR * 0.95f;
				float fRB1 = fR * 0.85f;
				float fRB2 = fR * 0.95f;
				for (int i = 0; i < 360; i += 5)
				{
					float fRads = i * M_PI / 180;
					if (i%10 == 0)
					{
						nvgMoveTo(nvgctx, fRB1 * cos(fRads), fRB1 * sin(fRads));
						nvgLineTo(nvgctx, fRB2 * cos(fRads), fRB2 * sin(fRads));
					}
					else
					{
						nvgMoveTo(nvgctx, fRS1 * cos(fRads), fRS1 * sin(fRads));
						nvgLineTo(nvgctx, fRS2 * cos(fRads), fRS2 * sin(fRads));
					}
				}
				nvgStroke(nvgctx);

				// Text
				float fRT = fR * 0.7f;
				float xform[6];
				nvgFillColor(nvgctx, nvgRGB(255, 255, 255));
				nvgFontFaceId(nvgctx, g_CompassVars.m_iFont);
				nvgTextAlign(nvgctx, NVG_ALIGN_CENTER | NVG_ALIGN_MIDDLE);
				nvgCurrentTransform(nvgctx, xform);
				for (int i = 0; i < 360; i += 30)
				{
					nvgResetTransform(nvgctx);
					nvgTransform(nvgctx, xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
					if (i%90 ==0)
						nvgFontSize(nvgctx, fR * 0.35f);
					else
						nvgFontSize(nvgctx, fR * 0.2f);
					float fRads = (i - 90) * M_PI / 180;
					char cNumber[5];
					switch (i)
					{
					case 0:
						strcpy(cNumber, "N");
						break;
					case 90:
						strcpy(cNumber, "E");
						break;
					case 180:
						strcpy(cNumber, "S");
						break;
					case 270:
						strcpy(cNumber, "W");
						break;
					default:
						sprintf(cNumber, "%i", i / 10);
						break;
					}
					nvgTranslate(nvgctx, fRT * cos(fRads), fRT * sin(fRads));
					nvgRotate(nvgctx, fRads + M_PI / 2);
					nvgText(nvgctx, 0, 0, cNumber, nullptr);
				}

				// White circle
				/*nvgStrokeColor(nvgctx, nvgRGB(255, 255, 255));
				nvgBeginPath(nvgctx);
				nvgEllipse(nvgctx, 0, 0, fSize * 0.5f, fSize * 0.5f);
				nvgStroke(nvgctx);*/
			}
			nvgEndFrame(nvgctx);
			return true;
		}
		break;
		case PANEL_SERVICE_PRE_KILL:
		{
			NVGcontext* nvgctx = g_CompassNVGcontext[ctx];
			nvgDeleteInternal(nvgctx);
			g_CompassNVGcontext.erase(ctx);
			return true;
		}
		break;
		}
		return false;
	}

}
