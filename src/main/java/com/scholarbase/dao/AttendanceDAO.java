package com.scholarbase.dao;

import com.scholarbase.model.Attendance;
import com.scholarbase.util.PageResult;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AttendanceDAO extends BaseDAO {

    private static final String JOINED =
            "SELECT a.id, a.student_id, a.course_id, a.attendance_date, a.status, s.full_name, s.roll_number, "
                    + "c.course_code, c.course_name FROM attendance a "
                    + "JOIN students s ON s.id = a.student_id JOIN courses c ON c.id = a.course_id";

    private static Attendance map(ResultSet rs) throws SQLException {
        Attendance a = new Attendance();
        a.setId(rs.getLong("id"));
        a.setStudentId(rs.getLong("student_id"));
        a.setCourseId(rs.getLong("course_id"));
        a.setDate(date(rs, "attendance_date"));
        a.setStatus(rs.getString("status"));
        a.setStudentName(rs.getString("full_name"));
        a.setRollNumber(rs.getString("roll_number"));
        a.setCourseCode(rs.getString("course_code"));
        a.setCourseName(rs.getString("course_name"));
        return a;
    }

    /** Everyone enrolled in the course, with their status on the given date (status is null when not yet marked). */
    public List<Attendance> roster(long courseId, LocalDate date) {
        return list("SELECT COALESCE(a.id, 0) AS id, s.id AS student_id, sc.course_id, DATE(?) AS attendance_date, a.status, "
                        + "s.full_name, s.roll_number, c.course_code, c.course_name "
                        + "FROM student_courses sc JOIN students s ON s.id = sc.student_id JOIN courses c ON c.id = sc.course_id "
                        + "LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = sc.course_id AND a.attendance_date = ? "
                        + "WHERE sc.course_id = ? AND s.status = 'ACTIVE' ORDER BY s.roll_number",
                AttendanceDAO::map, date, date, courseId);
    }

    public PageResult<Attendance> search(Long courseId, LocalDate date, String q, String status, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (courseId != null) {
            where.append(" AND a.course_id = ?");
            params.add(courseId);
        }
        if (date != null) {
            where.append(" AND a.attendance_date = ?");
            params.add(date);
        }
        if (q != null && !q.isBlank()) {
            where.append(" AND (s.full_name LIKE ? OR s.roll_number LIKE ?)");
            params.add(like(q));
            params.add(like(q));
        }
        if (status != null && !status.isBlank()) {
            where.append(" AND a.status = ?");
            params.add(status);
        }
        String from = " FROM attendance a JOIN students s ON s.id = a.student_id JOIN courses c ON c.id = a.course_id";
        long total = longOf("SELECT COUNT(*)" + from + where, params);
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((page - 1) * size);
        List<Attendance> items = list(JOINED + where + " ORDER BY a.attendance_date DESC, s.roll_number LIMIT ? OFFSET ?",
                pageParams, AttendanceDAO::map);
        return new PageResult<>(items, total, page, size);
    }

    /** Inserts or updates one row per (student, course, date) inside a single transaction. */
    public void upsertAll(long courseId, LocalDate date, List<Attendance> entries) {
        transaction(c -> {
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO attendance (student_id, course_id, attendance_date, status) VALUES (?,?,?,?) "
                            + "ON DUPLICATE KEY UPDATE status = VALUES(status)")) {
                for (Attendance e : entries) {
                    ps.setLong(1, e.getStudentId());
                    ps.setLong(2, courseId);
                    ps.setObject(3, date);
                    ps.setString(4, e.getStatus());
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        });
    }

    public boolean exists(long id) {
        return longOf("SELECT COUNT(*) FROM attendance WHERE id = ?", id) > 0;
    }

    public int updateStatus(long id, String status) {
        return update("UPDATE attendance SET status = ? WHERE id = ?", status, id);
    }

    public int delete(long id) {
        return update("DELETE FROM attendance WHERE id = ?", id);
    }

    /**
     * Attendance per student and course. percentage = present / total * 100
     * (Leave counts as not present).
     */
    public List<Map<String, Object>> summary(Long courseId, Long studentId, String q) {
        StringBuilder sql = new StringBuilder(
                "SELECT s.id AS studentId, s.full_name AS studentName, s.roll_number AS rollNumber, s.department AS department, "
                        + "c.id AS courseId, c.course_code AS courseCode, c.course_name AS courseName, "
                        + "COUNT(*) AS total, SUM(a.status = 'PRESENT') AS present, SUM(a.status = 'ABSENT') AS absent, "
                        + "SUM(a.status = 'LEAVE') AS `leave`, ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 2) AS percentage "
                        + "FROM attendance a JOIN students s ON s.id = a.student_id JOIN courses c ON c.id = a.course_id WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (courseId != null) {
            sql.append(" AND a.course_id = ?");
            params.add(courseId);
        }
        if (studentId != null) {
            sql.append(" AND a.student_id = ?");
            params.add(studentId);
        }
        if (q != null && !q.isBlank()) {
            sql.append(" AND (s.full_name LIKE ? OR s.roll_number LIKE ?)");
            params.add(like(q));
            params.add(like(q));
        }
        sql.append(" GROUP BY s.id, s.full_name, s.roll_number, s.department, c.id, c.course_code, c.course_name "
                + "ORDER BY s.roll_number, c.course_code");
        return list(sql.toString(), params, BaseDAO::row);
    }

    /** Overall attendance of one student across all courses (null when nothing is recorded). */
    public Double overallForStudent(long studentId) {
        return doubleOf("SELECT SUM(status = 'PRESENT') * 100 / COUNT(*) FROM attendance WHERE student_id = ?", studentId);
    }

    public Double overallPercentage() {
        return doubleOf("SELECT SUM(status = 'PRESENT') * 100 / COUNT(*) FROM attendance");
    }

    public Map<String, Long> statusCounts() {
        Map<String, Long> out = new LinkedHashMap<>();
        out.put(Attendance.PRESENT, 0L);
        out.put(Attendance.ABSENT, 0L);
        out.put(Attendance.LEAVE, 0L);
        for (Map<String, Object> r : list("SELECT status AS label, COUNT(*) AS value FROM attendance GROUP BY status", BaseDAO::row)) {
            out.put(String.valueOf(r.get("label")), ((Number) r.get("value")).longValue());
        }
        return out;
    }

    /** Daily % present for the most recent days that have attendance recorded, oldest first. */
    public List<Map<String, Object>> dailyTrend(int days) {
        List<Map<String, Object>> rows = list(
                "SELECT attendance_date AS date, ROUND(SUM(status = 'PRESENT') * 100 / COUNT(*), 2) AS percentage "
                        + "FROM attendance GROUP BY attendance_date ORDER BY attendance_date DESC LIMIT ?",
                BaseDAO::row, days);
        java.util.Collections.reverse(rows);
        return rows;
    }

    public long countStudentsBelow(double threshold) {
        return longOf("SELECT COUNT(*) FROM (SELECT student_id FROM attendance GROUP BY student_id "
                + "HAVING SUM(status = 'PRESENT') * 100 / COUNT(*) < ?) t", threshold);
    }

    public List<Map<String, Object>> studentsBelow(double threshold, int limit) {
        return list("SELECT s.id AS studentId, s.full_name AS studentName, s.roll_number AS rollNumber, "
                        + "ROUND(SUM(a.status = 'PRESENT') * 100 / COUNT(*), 1) AS percentage "
                        + "FROM attendance a JOIN students s ON s.id = a.student_id GROUP BY s.id, s.full_name, s.roll_number "
                        + "HAVING SUM(a.status = 'PRESENT') * 100 / COUNT(*) < ? ORDER BY percentage LIMIT ?",
                BaseDAO::row, threshold, limit);
    }
}
