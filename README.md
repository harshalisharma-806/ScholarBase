# ScholarBase – Student Record Management System

Java Servlets (Jakarta Servlet 6.0) + JDBC + MySQL on Tomcat 10.1, with a vanilla HTML/CSS/JS front end.
Tagline: *Smarter Student Management, Better Academic Insights.*

## Run it
1. **Database** – `mysql -u root -p < database/scholarbase.sql` (creates `scholarbase` with schema, indexes and sample data; re-running resets it).
2. **Connection** – edit `src/main/resources/db.properties` (or set `SCHOLARBASE_DB_URL`, `SCHOLARBASE_DB_USER`, `SCHOLARBASE_DB_PASSWORD`).
3. **Build** – `mvn clean package` → `target/scholarbase.war` (Java 21 release; works on JDK 26).
4. **Deploy** – copy the WAR to Tomcat 10.1 `webapps/` (or deploy from VS Code's Tomcat extension), open `http://localhost:8080/scholarbase/`.
5. **Login** – `admin` / `Admin@123`, then change it under Settings → Change password.

## Structure
- `model` entities · `dao` JDBC (PreparedStatement only) · `service` validation and business rules · `controller` servlets + `AuthFilter` · `util` DB, PBKDF2 hashing, JSON.
- Grade scale, pass mark and attendance minimum live in `src/main/resources/grading.properties`.
- Security: PBKDF2 password hashes, HttpSession login, session-id rotation, CSRF token on POSTs, login throttling, `/app/*` and `/api/*` guarded by `AuthFilter`.

## Notes
- Attendance % = Present ÷ classes marked (Leave counts as not present).
- One result row per student and course; student totals, GPA and pass/fail are computed from those rows.
