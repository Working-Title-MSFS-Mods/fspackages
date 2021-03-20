MediaIDCheck.exe mediaIDs.txt FlightSim.mediaid
"%WWISEROOT%\Authoring\x64\Release\bin\WwiseConsole.exe" generate-soundbank "D:\Development\GitHub\fspackages\src\sound\FlightSim.wproj" --platform "Windows" 

xcopy "D:\Development\GitHub\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WT.PC.PCK" "D:\Development\GitHub\fspackages\src\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WT.PC.PCK" /y

:CopyFile
xcopy "D:\Development\GitHub\fspackages\src\sound\GeneratedSoundBanks\Asobo_CJ4_WT.PC.PCK" "I:\MSFS_PACKAGES\Community\workingtitle-aircraft-cj4\SimObjects\Airplanes\Asobo_CJ4\sound\Asobo_CJ4_WT.PC.PCK" /y
echo Exit code is: %ERRORLEVEL%
IF "%ErrorLevel%"=="4" (
    Goto :CopyFile
)
