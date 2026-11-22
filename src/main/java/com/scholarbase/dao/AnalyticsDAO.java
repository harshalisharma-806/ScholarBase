package com.scholarbase.dao;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Read-only aggregate queries behind the dashboard and the reports module. */
public class AnalyticsDAO extends BaseDAO {

    public List<Map<String, Object>> recentActivity(int limit) {
        return list("(SELECT 'STUDENT' AS type, CONCAT('New student registered: ', full_name) AS text, created_at AS ts FROM students) "
                + "UNION ALL (SELECT 'COURSE', CONCAT('Course added: ', course_code, ' - ', course_name), created_at FROM courses) "
                + "UNION ALL (SELECT 'RESULT', CONCAT('Marks entered for ', s.full_name, ' in ', c.course_code), r.created_at "
                + "FROM results r JOIN students s ON s.id = r.student_id JOIN courses c ON c.id = r.course_id) "
                + "UNION ALL (SELECT 'ATTENDANCE', CONCAT('Attendance marked for ', c.course_code, ' on ', DATE_FORMAT(a.attendance_date, '%d %b %Y')), MIN(a.marked_at) "
                + "FROM attendance a JOIN courses c ON c.id = a.course_id GROUP BY a.course_id, c.course_code, a.attendance_date) "
                + "ORDER BY ts DESC LIMIT ?", BaseDAO::row, limit);
    }

    /** Records whose data was changed after they were first created. */
    public List<Map<String, Object>> recentlyUpdated(int limit) {
        return list("(SELECT 'STUDENT' AS type, full_name AS title, CONCAT(roll_number, ' - ', department) AS subtitle, updated_at AS ts "
                + "FROM students WHERE updated_at > created_at) "
                + "UNION ALL (SELECT 'COURSE', course_name, CONCAT(course_code, ' - ', department), updated_at FROM courses WHERE updated_at > created_at) "
                + "UNION ALL (SELECT 'RESULT', s.full_name, CONCAT('Marks updated in ', c.course_code), r.updated_at "
                + "FROM results r JOIN students s ON s.id = r.student_id JOIN courses c ON c.id = r.course_id WHERE r.updated_at > r.created_at) "
                + "ORDER BY ts DESC LIMIT ?", BaseDAO::row, limit);
    }

    public List<Map<String, Object>> studentReport(String department, double passPercentage) {
        StringBuilder sql = new StringBuilder(
                "SELECT s.id AS studentId, s.roll_number AS rollNumber, s.full_name AS studentName, s.department AS department, "
                        + "s.semester AS semester, s.status AS status, "
                        + "(SELECT COUNT(*) FROM student_courses sc WHERE sc.student_id = s.id) AS enrolledCourses, "
                        + "(SELECT COUNT(*) FROM results r WHERE r.student_id = s.id) AS gradedCourses, "
                        + "(SELECT COUNT(*) FROM results r WHERE r.student_id = s.id AND r.marks_obtained * 100 / r.max_marks < ?) AS failedCourses, "
                        + "(SELECT ROUND(AVG(r.marks_obtained * 100 / r.max_marks), 2) FROM results r WHERE r.student_id = s.id) AS percentage, "
                        + "(SELECT ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 2) FROM attendance a WHERE a.student_id = s.id) AS attendance "
                        + "FROM students s WHERE 1=1");
        List<Object> params = new ArrayList<>();
        params.add(passPercentage); // placeholder inside the SELECT list comes first
        if (department != null && !department.isBlank()) {
            sql.append(" AND s.department = ?");
            params.add(department);
        }
        sql.append(" ORDER BY s.roll_number");
        return list(sql.toString(), params, BaseDAO::row);
    }

    public List<Map<String, Object>> courseReport() {
        return list("SELECT c.id AS courseId, c.course_code AS courseCode, c.course_name AS courseName, c.department AS department, "
                + "c.semester AS semester, c.instructor_name AS instructor, "
                + "(SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id) AS enrolled, "
                + "COUNT(r.id) AS graded, "
                + "ROUND(AVG(r.marks_obtained * 100 / r.max_marks), 2) AS average, "
                + "ROUND(MAX(r.marks_obtained * 100 / r.max_marks), 2) AS highest, "
                + "ROUND(MIN(r.marks_obtained * 100 / r.max_marks), 2) AS lowest, "
                + "(SELECT ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 2) FROM attendance a WHERE a.course_id = c.id) AS attendance "
                + "FROM courses c LEFT JOIN results r ON r.course_id = c.id "
                + "GROUP BY c.id, c.course_code, c.course_name, c.department, c.semester, c.instructor_name "
                + "ORDER BY c.semester, c.course_code", BaseDAO::row);
    }

    public long passedCount(long courseId, double passPercentage) {
        return longOf("SELECT COUNT(*) FROM results WHERE course_id = ? AND marks_obtained * 100 / max_marks >= ?",
                courseId, passPercentage);
    }

    public List<Map<String, Object>> attendanceReport(Long courseId, String department) {
        StringBuilder sql = new StringBuilder(
                "SELECT s.id AS studentId, s.roll_number AS rollNumber, s.full_name AS studentName, s.department AS department, "
                        + "COUNT(*) AS total, SUM(a.status = 'PRESENT') AS present, SUM(a.status = 'ABSENT') AS absent, "
                        + "SUM(a.status = 'LEAVE') AS `leave`, ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 2) AS percentage "
                        + "FROM attendance a JOIN students s ON s.id = a.student_id WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (courseId != null) {
            sql.append(" AND a.course_id = ?");
            params.add(courseId);
        }
        if (department != null && !department.isBlank()) {
            sql.append(" AND s.department = ?");
            params.add(department);
        }
        sql.append(" GROUP BY s.id, s.roll_number, s.full_name, s.department ORDER BY s.roll_number");
        return list(sql.toString(), params, BaseDAO::row);
    }

    public List<Map<String, Object>> departmentReport() {
        return list("SELECT s.department AS department, COUNT(*) AS students, SUM(s.status = 'ACTIVE') AS active, "
                + "(SELECT COUNT(*) FROM courses c WHERE c.department = s.department) AS courses, "
                + "(SELECT ROUND(AVG(r.marks_obtained * 100 / r.max_marks), 2) FROM results r JOIN students s2 ON s2.id = r.student_id "
                + "WHERE s2.department = s.department) AS averagePercentage, "
                + "(SELECT ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 2) FROM attendance a JOIN students s3 ON s3.id = a.student_id "
                + "WHERE s3.department = s.department) AS attendance "
                + "FROM students s GROUP BY s.department ORDER BY students DESC, s.department", BaseDAO::row);
    }
}
