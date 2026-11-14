HISTORICAL PLACES AND CULTURAL HERITAGE
Group 6 - Siargao Island, Surigao del Norte

SETUP
1. Place this project folder inside C:\xampp\htdocs\.
2. Start Apache and MySQL in XAMPP.
3. Import database\historical_heritage.sql using phpMyAdmin.
4. Check api\config.php for the MySQL username and password.
5. Open the separate API-consuming website at:
   http://localhost/History/website/
6. Open the independent, read-only sample API client at:
   http://localhost/History/api-demo/

PROJECT FOLDERS
api\       PHP REST API endpoints and database connection
website\   Separate frontend site, JavaScript, styles, and images
api-demo\  Independent read-only sample client for testing API reuse
database\  MySQL schema and seed records

The root index.html redirects to website\index.html. The website uses
JavaScript Fetch API for listing, searching, viewing, adding, updating, and
deleting records through the REST API. The website does not query MySQL
directly. Run through Apache so the website and API share the same origin.

API ENDPOINTS
Historical places:
GET    /api/historical_places.php
GET    /api/historical_places.php?id=1
POST   /api/historical_places.php
PUT    /api/historical_places.php?id=1
DELETE /api/historical_places.php?id=1

Cultural heritage:
GET    /api/cultural_heritage.php
GET    /api/cultural_heritage.php?id=1
POST   /api/cultural_heritage.php
PUT    /api/cultural_heritage.php?id=1
DELETE /api/cultural_heritage.php?id=1

POST and PUT require a JSON request body and Content-Type: application/json.
The API returns JSON. Website changes are sent through these API endpoints.
See api\bootstrap.php for accepted fields and validation.

API REUSE SAMPLE
The api-demo\ folder is a separate, read-only Fetch API client. It requests
the same historical_places.php and cultural_heritage.php endpoints as the
main website, and requests an individual record when its details are opened.
Use it to check that another frontend can consume the API without connecting
directly to MySQL. Open http://localhost/History/api-demo/ through Apache.

DATA AND IMAGES
The SQL seed file inserts 10 historical places and 10 cultural heritage
records, all marked online_source_based. Verify online-source information
with local research as required by the project. The supplied photos are in
website\assets\images\. The website accepts an image URL; it does not upload
image files.
