MediaIDCheck.exe mediaIDs.txt FlightSim.mediaid
"%WWISEROOT%\Authoring\x64\Release\bin\WwiseConsole.exe" generate-soundbank "C:\MSFSDevelopment\fspackages\src\sound\FlightSim.wproj" --platform "Windows" 

xcopy "C:\MSFSDevelopment\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WT.PC.PCK" "C:\MSFSDevelopment\fspackages\src\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WT.PC.PCK" /y

:CopyFile
xcopy "C:\MSFSDevelopment\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WT.PC.PCK" "C:\Users\K2\AppData\Roaming\Microsoft Flight Simulator\Packages\Community\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WT.PC.PCK" /y
echo Exit code is: %ERRORLEVEL%
IF "%ErrorLevel%"=="4" (
    Goto :CopyFile
)
