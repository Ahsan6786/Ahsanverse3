@echo off
echo Running MySQL setup script...
mysql -u root -p"ahsan" < setup-db.sql
echo Setup completed!
pause
