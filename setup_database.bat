@echo off
echo Setting up Database...
cd server
call npm install
call npx prisma migrate dev --name init
call npm run seed
echo Setup Complete!
pause
