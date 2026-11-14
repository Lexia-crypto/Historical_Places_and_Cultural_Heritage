HISTORICAL PLACES AND CULTURAL HERITAGE
Group 6 - Siargao Island, Surigao del Norte

SETUP
1. Extract this folder into C:\xampp\htdocs\
2. Start Apache and MySQL in XAMPP.
3. Open http://localhost/phpmyadmin
4. Import database/historical_heritage.sql
5. Check api/config.php for your MySQL username/password.
6. Open http://localhost/Historical_Places_Cultural_Heritage/

API ENDPOINTS
GET    api/records.php
GET    api/record.php?id=1
POST   api/create.php
PUT    api/update.php?id=1
DELETE api/delete.php?id=1

POST and PUT require JSON with Content-Type: application/json.
Add only locally researched and verified information. The database has no invented historical records.
Copy photos into assets/ and save their relative path in image_path.
