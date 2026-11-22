package com.scholarbase.dao;

import com.scholarbase.model.Result;
import com.scholarbase.util.PageResult;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ResultDAO extends BaseDAO {

    private static final String JOINED =
            "SELECT r.id, r.student_id, r.course_id, r.marks_obtained, r.max_marks, s.full_name, s.roll_number, "
                    + "c.course_code, c.course_name, c.credits FROM results r "
                    + "JOIN students s ON s.id = r.student_id JOIN courses c ON c.id = r.course_id";

    private static Result map(ResultSet rs) throws SQLException {
        Result r = new Result();
        r.setId(rs.getLong("id"));
        r.setStudentId(rs.getLong("student_id"));
        r.setCourseId(rs.getLong("course_id"));
        r.setMarksObtained(nullableDouble(rs, "marks_obtained"));
        r.setMaxMarks(nullableDouble(rs, "max_marks"));
        r.setStudentName(rs.getString("full_name"));
        r.setRollNumber(rs.getString("roll_number"));
        r.setCourseCode(rs.getString("course_code"));
        r.setCourseName(rs.getString("course_name"));
        r.setCredits(rs.getInt("credits"));
        return r;
    }

    public PageResult<Result> search(Long courseId, Long studentId, String q, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (courseId != null) {
            where.append(" AND r.course_id = ?");
            params.add(courseId);
        }
        if (studentId != null) {
            where.append(" AND r.student_id = ?");
            params.add(studentId);
        }
        if (q != null && !q.isBlank()) {
            where.append(" AND (s.full_name LIKE ? OR s.roll_number LIKE ?)");
            params.add(like(q));
            params.add(like(q));
        }
        String from = " FROM results r JOIN students s ON s.id = r.student_id JOIN courses c ON c.id = r.course_id";
        long total = longOf("SELECT COUNT(*)" + from + where, params);
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((page - 1) * size);
        List<Result> items = list(JOINED + where + " ORDER BY r.updated_at DESC, r.id DESC LIMIT ? OFFSET ?",
                pageParams, ResultDAO::map);
        return new PageResult<>(items, total, page, size);
    }

    public List<Result> findByStudent(long studentId) {
        return list(JOINED + " WHERE r.student_id = ? ORDER BY c.semester, c.course_code", ResultDAO::map, studentId);
    }

    public List<Result> findByCourse(long courseId) {
        return list(JOINED + " WHERE r.course_id = ? ORDER BY r.marks_obtained * 100 / r.max_marks DESC, s.roll_number",
                ResultDAO::map, courseId);
    }

    /** Enrolled students with their marks for the course; marks are null where not yet entered. */
    public List<Result> roster(long courseId) {
        return list("SELECT COALESCE(r.id, 0) AS id, s.id AS student_id, sc.course_id, r.marks_obtained, r.max_marks, "
                        + "s.full_name, s.roll_number, c.course_code, c.course_name, c.credits "
                        + "FROM student_courses sc JOIN students s ON s.id = sc.student_id JOIN courses c ON c.id = sc.course_id "
                        + "LEFT JOIN results r ON r.student_id = s.id AND r.course_id = sc.course_id "
                        + "WHERE sc.course_id = ? ORDER BY s.roll_number",
                ResultDAO::map, courseId);
    }

    public Result findById(long id) {
        return one(JOINED + " WHERE r.id = ?", ResultDAO::map, id);
    }

    public void upsert(Result r) {
        update("INSERT INTO results (student_id, course_id, marks_obtained, max_marks) VALUES (?,?,?,?) "
                        + "ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), max_marks = VALUES(max_marks)",
                r.getStudentId(), r.getCourseId(), r.getMarksObtained(), r.getMaxMarks());
    }

    public void upsertAll(List<Result> results) {
        transaction(c -> {
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT INTO results (student_id, course_id, marks_obtained, max_marks) VALUES (?,?,?,?) "
                            + "ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained), max_marks = VALUES(max_marks)")) {
                for (Result r : results) {
                    ps.setLong(1, r.getStudentId());
                    ps.setLong(2, r.getCourseId());
                    ps.setObject(3, r.getMarksObtained());
                    ps.setObject(4, r.getMaxMarks());
                    ps.addBatch();
                }
                ps.executeBatch();
            }
        });
    }

    public int delete(long id) {
        return update("DELETE FROM results WHERE id = ?", id);
    }

    public Double averagePercentage() {
        return doubleOf("SELECT AVG(marks_obtained * 100 / max_marks) FROM results");
    }

    /** Every result as a percentage - used to build the grade distribution with the configurable grade scale. */
    public List<Double> allPercentages() {
        return list("SELECT marks_obtained * 100 / max_marks AS pct FROM results", rs -> rs.getDouble("pct"));
    }

    public List<Map<String, Object>> averageByCourse() {
        return list("SELECT c.course_code AS label, ROUND(AVG(r.marks_obtained * 100 / r.max_marks), 2) AS value "
                + "FROM results r JOIN courses c ON c.id = r.course_id GROUP BY c.id, c.course_code ORDER BY c.course_code", BaseDAO::row);
    }

    public List<Map<String, Object>> topStudents(int limit) {
        return list("SELECT s.id AS studentId, s.full_name AS studentName, s.roll_number AS rollNumber, s.department AS department, "
                        + "s.semester AS semester, COUNT(*) AS courses, ROUND(AVG(r.marks_obtained * 100 / r.max_marks), 2) AS percentage "
                        + "FROM results r JOIN students s ON s.id = r.student_id "
                        + "GROUP BY s.id, s.full_name, s.roll_number, s.department, s.semester "
                        + "ORDER BY AVG(r.marks_obtained * 100 / r.max_marks) DESC, s.full_name LIMIT ?",
                BaseDAO::row, limit);
    }

    /** Share of individual course results at or above the pass mark (null when nothing is graded). */
    public Double passRate(double passPercentage) {
        return doubleOf("SELECT SUM(marks_obtained * 100 / max_marks >= ?) * 100 / COUNT(*) FROM results", passPercentage);
    }

    public long countFailing(double passPercentage) {
        return longOf("SELECT COUNT(DISTINCT student_id) FROM results WHERE marks_obtained * 100 / max_marks < ?", passPercentage);
    }
}
