# 🎓 ScholarBase
### Student Record Management System

**A Centralized, Java-Based Academic Management Web Application**

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://www.java.com/)
[![Jakarta Servlet](https://img.shields.io/badge/Jakarta_Servlets-6.0-blue)](https://jakarta.ee/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-blue?logo=mysql)](https://www.mysql.com/)
[![Apache Tomcat](https://img.shields.io/badge/Server-Tomcat_10.1-yellow?logo=apachetomcat)](https://tomcat.apache.org/)
[![Maven](https://img.shields.io/badge/Build-Maven-red?logo=apachemaven)](https://maven.apache.org/)

---

## 📌 Project Overview

ScholarBase is a web-based Student Record Management System developed to simplify and organize academic administration through a centralized digital platform.

Educational institutions manage large amounts of student information, including personal profiles, course details, attendance records, examination marks, and academic results. Managing these records manually can become time-consuming, difficult to maintain, and prone to inconsistencies.

ScholarBase addresses these challenges by providing an integrated application for managing essential academic information efficiently. It combines a Java-based backend, relational database connectivity, and a web-based user interface to support structured academic record management.

The application is developed using **Java 21, Jakarta Servlets, JDBC, MySQL, Apache Tomcat, and Maven**, demonstrating practical implementation of backend development, database integration, server-side programming, and web application deployment.

## 🎯 Problem Statement

Traditional academic record management often involves maintaining student information across multiple documents or disconnected systems. This can create difficulties in:

- Maintaining accurate and organized student records.
- Updating academic and personal information.
- Tracking attendance and examination performance.
- Calculating academic results consistently.
- Retrieving student-wise and course-wise information.
- Generating meaningful academic reports.

## 💡 Proposed Solution

ScholarBase provides a centralized system that brings important academic records together in one application.

The system supports structured student and course information management, attendance and marks tracking, result calculation, and academic reporting. Database integration enables records to be stored and retrieved through a consistent data-management process.

The objective is to make academic administration more organized, accessible, and efficient.

## ✨ Core Features

### 1. Student Management
- Maintain student profiles and academic information.
- Add new student records.
- Update existing student details.
- Delete records when required.
- Search and retrieve student information.

### 2. Course Management
- Maintain course-related information.
- Organize academic course records.
- Retrieve course details for academic operations.

### 3. Marks and Result Management
- Record and manage examination marks.
- Calculate academic results using grading configurations.
- Maintain student performance information.
- Support structured result management.

### 4. Attendance Management
- Maintain student attendance records.
- Track attendance information.
- Retrieve attendance-related academic data.

### 5. Academic Reporting
- Access student-wise academic information.
- View course-wise records.
- Organize academic performance data for reporting.

### 6. Administration and Access
- Administrator login functionality.
- Centralized access to management features.
- Password management through the application settings.

## 🛠️ Technology Stack

| Technology | Implementation |
|---|---|
| Java 21 | Core backend programming |
| Jakarta Servlets 6.0 | HTTP request and response handling |
| JDBC | Java-to-MySQL connectivity |
| MySQL | Relational database management |
| Apache Tomcat 10.1 | Servlet container and application server |
| Maven | Dependency management and project build |
| HTML5 | Web page structure |
| CSS3 | Styling and responsive presentation |
| JavaScript | Client-side interactions |
| Git and GitHub | Version control and source code management |

## 🏗️ System Architecture

ScholarBase follows a layered web application approach:

```text
          USER / ADMINISTRATOR
                   |
                   v
          WEB USER INTERFACE
          HTML / CSS / JavaScript
                   |
                   v
          APACHE TOMCAT SERVER
                   |
                   v
          JAKARTA SERVLETS
          Request Processing
                   |
                   v
             JDBC LAYER
          Database Connectivity
                   |
                   v
             MYSQL DATABASE
          Academic Records
```

### Application Workflow

1. The user interacts with the web interface.
2. HTTP requests are sent to the application server.
3. Jakarta Servlets process incoming requests.
4. JDBC communicates with the MySQL database.
5. The database performs the required operations.
6. The application returns the appropriate response to the user.

## 📂 Project Structure

```text
ScholarBase/
│
├── database/
│   └── scholarbase.sql
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── scholarbase/
│       │
│       ├── resources/
│       │   ├── db.properties
│       │   └── grading.properties
│       │
│       └── webapp/
│           ├── WEB-INF/
│           └── application frontend files
│
├── .gitignore
├── .dockerignore
├── Dockerfile
├── pom.xml
└── README.md
```

## ⚙️ Installation and Setup

Follow these steps to run ScholarBase locally.

### Prerequisites

Install the following software:

- Java Development Kit (JDK) 21
- Apache Maven
- MySQL Server and MySQL Workbench
- Apache Tomcat 10.1
- Visual Studio Code or another Java IDE
- Git

### Step 1: Clone the Repository

Open your terminal and execute:

```bash
git clone https://github.com/harshalisharma-806/ScholarBase.git
```

Navigate into the project directory:

```bash
cd ScholarBase
```

### Step 2: Configure the Database

1. Start your MySQL Server.
2. Open MySQL Workbench.
3. Locate the SQL file:

```text
database/scholarbase.sql
```

4. Execute the script to create the required database schema, tables, indexes, and sample data.

**Note:** Re-executing the supplied SQL script resets the database data.

### Step 3: Configure Database Connectivity

Open:

```text
src/main/resources/db.properties
```

Configure the database URL, username, and password for your local MySQL installation.

Example:

```properties
db.url=jdbc:mysql://localhost:3306/scholarbase?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8
db.user=root
db.password=YOUR_MYSQL_PASSWORD
```

Replace the example password with your own local MySQL password.

**Security:** Never commit actual database credentials to a public GitHub repository.

### Step 4: Build the Application

Run the Maven build command:

```bash
mvn clean package
```

After a successful build, Maven generates the WAR file:

```text
target/scholarbase.war
```

### Step 5: Deploy Using Apache Tomcat

1. Copy `scholarbase.war` into the Tomcat `webapps` directory.
2. Start the Tomcat server using:

```text
bin/startup.bat
```

3. Wait for the application to deploy.

### Step 6: Access the Application

Open your browser and visit:

```text
http://localhost:8080/scholarbase/
```

ScholarBase should now be accessible locally.

## 🔐 Default Administrator Credentials

The application provides the following default administrator login:

| Credential | Default Value |
|---|---|
| Username | admin |
| Password | Admin@123 |

**Important:** Change the default password after the first successful login.

Do not use default credentials for a publicly exposed production deployment.

## 🗄️ Database Management

ScholarBase uses MySQL as its relational database management system.

The database script is included in the repository:

```text
database/scholarbase.sql
```

Database connectivity is handled through JDBC, while connection settings are maintained in the application's configuration.

The project also includes a grading configuration file:

```text
src/main/resources/grading.properties
```

## 🧠 Key Technical Concepts Demonstrated

This project demonstrates the practical application of several software development concepts:

- **Object-Oriented Programming:** Organizing application functionality through Java classes and components.
- **Server-Side Programming:** Processing web requests using Jakarta Servlets.
- **Database Connectivity:** Integrating Java applications with MySQL through JDBC.
- **CRUD Operations:** Creating, reading, updating, and deleting records.
- **Relational Database Management:** Working with structured academic information.
- **Dependency Management:** Managing project dependencies using Maven.
- **Web Application Deployment:** Packaging and running a WAR application on Apache Tomcat.
- **Version Control:** Managing source code and project changes using Git and GitHub.

## 🚀 Future Enhancements

ScholarBase can be extended with additional capabilities, including:

- Role-based access for administrators, faculty, and students.
- Student and faculty dashboards.
- Advanced academic analytics and visualizations.
- Exportable PDF and Excel reports.
- Email notifications and academic alerts.
- Enhanced search, filtering, and pagination.
- Automated testing and improved deployment workflows.
- Secure production-grade authentication and authorization.

## 🎓 Project Information

| Detail | Information |
|---|---|
| Project Name | ScholarBase |
| Project Type | Web-Based Application |
| Domain | Academic Management |
| Programming Language | Java |
| Database | MySQL |
| Application Server | Apache Tomcat |
| Build Tool | Maven |
| Developer | Harshali Sharma |
| Institution | Chitkara University |
| Academic Program | B.Tech – Artificial Intelligence and Machine Learning |

## 👩‍💻 Developer

**Harshali Sharma**

B.Tech – Artificial Intelligence and Machine Learning  
Chitkara University

GitHub: [harshalisharma-806](https://github.com/harshalisharma-806)

Project Repository: [ScholarBase](https://github.com/harshalisharma-806/ScholarBase)

---

## ⭐ Acknowledgement

ScholarBase was developed as an academic software development project to apply programming, database management, backend development, and web application deployment concepts in a practical environment.

Thank you for exploring ScholarBase!

**ScholarBase — Bringing Academic Records Together.**
