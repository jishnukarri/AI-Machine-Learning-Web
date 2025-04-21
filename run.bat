@echo off
title AI Project Server - Python + Node with Firewall Rules and UPnP

REM === Add Windows Firewall Rules for TCP and UDP ===
echo Adding firewall rules for ports 5000 and 5001 (TCP + UDP)...
netsh advfirewall firewall add rule name="AI Server 5000 TCP" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
netsh advfirewall firewall add rule name="AI Server 5000 UDP" dir=in action=allow protocol=UDP localport=5000 >nul 2>&1
netsh advfirewall firewall add rule name="AI Server 8081 TCP" dir=in action=allow protocol=TCP localport=8081 >nul 2>&1
netsh advfirewall firewall add rule name="AI Server 8081 UDP" dir=in action=allow protocol=UDP localport=8081 >nul 2>&1

REM === Open Ports via UPnP ===
echo Opening TCP and UDP ports 5000 and 5001 using UPnP...
set "UPNPWIZARD=C:\Program Files (x86)\UPnP Wizard\UPnPWizardC.exe"
"%UPNPWIZARD%" -add "UPnP Python HTTP Server Port" -ip default -intport 5000 -extport 5000 -protocol TCP -lease 0
"%UPNPWIZARD%" -add "UPnP Python HTTP Server Port" -ip default -intport 5000 -extport 5000 -protocol UDP -lease 0
"%UPNPWIZARD%" -add "UPnP Node.js Server Port" -ip default -intport 8081 -extport 8081 -protocol TCP -lease 0
"%UPNPWIZARD%" -add "UPnP Node.js Server Port" -ip default -intport 8081 -extport 8081 -protocol UDP -lease 0

REM === Start Python HTTP Server ===
echo.
echo Starting Python HTTP server on port 5000...
start /MIN python -m http.server 5000 --bind 0.0.0.0

REM === Start Node.js backend ===
echo.
echo Starting Node.js backend on port 8081...
cd cors-server
start /MIN node index.js --public-host=0.0.0.0

exit
