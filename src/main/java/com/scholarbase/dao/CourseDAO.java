package com.scholarbase.dao;

import com.scholarbase.model.Course;
import com.scholarbase.model.Student;
import com.scholarbase.util.PageResult;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO extends BaseDAO {

    private static final String SELECT_WITH_COUNT =
            "SELECT c.*, (SELECT COUNT(*) FROM student_courses sc WHERE sc.course_id = c.id) AS enrolled_count FROM courses c";

    private static Course map(ResultSet rs) throws SQLException {
        Course c = new Course();
        c.setId(rs.getLong("id"));
        c.setCourseCode(rs.getString("course_code"));
        c.setCourseName(rs.getString("course_name"));
        c.setDepartment(rs.getString("department"));
        c.setSemester(rs.getInt("semester"));
        c.setCredits(rs.getInt("credits"));
        c.setInstructorName(rs.getString("instructor_name"));
        c.setDescription(rs.getString("description"));
        c.setCreatedAt(dateTime(rs, "created_at"));
        c.setEnrolledCount(rs.getInt("enrolled_count"));
        return c;
    }

    public PageResult<Course> search(String q, String department, Integer semester, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            where.append(" AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.instructor_name LIKE ?)");
            params.add(like(q));
            params.add(like(q));
            params.add(like(q));
        }
        if (department != null && !department.isBlank()) {
            where.append(" AND c.department = ?");
            params.add(department);
        }
        if (semester != null) {
            where.append(" AND c.semester = ?");
            params.add(semester);
        }
        long total = longOf("SELECT COUNT(*) FROM courses c" + where, params);
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((page - 1) * size);
        List<Course> items = list(SELECT_WITH_COUNT + where + " ORDER BY c.semester, c.course_code LIMIT ? OFFSET ?",
                pageParams, CourseDAO::map);
        return new PageResult<>(items, total, page, size);
    }

    public Course findById(long id) {
        return one(SELECT_WITH_COUNT + " WHERE c.id = ?", CourseDAO::map, id);
    }

    public long insert(Course c) {
        return insert("INSERT INTO courses (course_code, course_name, department, semester, credits, instructor_name, description) "
                        + "VALUES (?,?,?,?,?,?,?)",
                c.getCourseCode(), c.getCourseName(), c.getDepartment(), c.getSemester(), c.getCredits(),
                c.getInstructorName(), c.getDescription());
    }

    public int update(Course c) {
        return update("UPDATE courses SET course_code=?, course_name=?, department=?, semester=?, credits=?, "
                        + "instructor_name=?, description=? WHERE id=?",
                c.getCourseCode(), c.getCourseName(), c.getDepartment(), c.getSemester(), c.getCredits(),
                c.getInstructorName(), c.getDescription(), c.getId());
    }

    public int delete(long id) {
        return update("DELETE FROM courses WHERE id = ?", id);
    }

    public boolean codeExists(String code, long excludeId) {
        return longOf("SELECT COUNT(*) FROM courses WHERE LOWER(course_code) = LOWER(?) AND id <> ?", code, excludeId) > 0;
    }

    public long count() {
        return longOf("SELECT COUNT(*) FROM courses");
    }

    public boolean isEnrolled(long studentId, long courseId) {
        return longOf("SELECT COUNT(*) FROM student_courses WHERE student_id = ? AND course_id = ?", studentId, courseId) > 0;
    }

    public List<Course> coursesOfStudent(long studentId) {
        return list(SELECT_WITH_COUNT + " JOIN student_courses mine ON mine.course_id = c.id AND mine.student_id = ? "
                + "ORDER BY c.semester, c.course_code", CourseDAO::map, studentId);
    }

    public List<Student> enrolledStudents(long courseId) {
        return list("SELECT s.* FROM students s JOIN student_courses sc ON sc.student_id = s.id "
                        + "WHERE sc.course_id = ? ORDER BY s.roll_number",
                rs -> {
                    Student s = new Student();
                    s.setId(rs.getLong("id"));
                    s.setFullName(rs.getString("full_name"));
                    s.setRollNumber(rs.getString("roll_number"));
                    s.setEmail(rs.getString("email"));
                    s.setPhone(rs.getString("phone"));
                    s.setDateOfBirth(date(rs, "date_of_birth"));
                    s.setGender(rs.getString("gender"));
                    s.setDepartment(rs.getString("department"));
                    s.setSemester(rs.getInt("semester"));
                    s.setAddress(rs.getString("address"));
                    s.setEnrollmentDate(date(rs, "enrollment_date"));
                    s.setStatus(rs.getString("status"));
                    s.setCreatedAt(dateTime(rs, "created_at"));
                    s.setUpdatedAt(dateTime(rs, "updated_at"));
                    return s;
                }, courseId);
    }

    /** Allocates a course to the given students; students already enrolled are skipped. Returns how many were added. */
    public int allocate(long courseId, List<Long> studentIds) {
        int[] added = {0};
        transaction(c -> {
            try (PreparedStatement ps = c.prepareStatement(
                    "INSERT IGNORE INTO student_courses (student_id, course_id) VALUES (?, ?)")) {
                for (Long studentId : studentIds) {
                    ps.setLong(1, studentId);
                    ps.setLong(2, courseId);
                    added[0] += ps.executeUpdate();
                }
            }
        });
        return added[0];
    }

    /** Enrols every active student whose department and semester match the course. */
    public int allocateMatching(long courseId) {
        return update("INSERT IGNORE INTO student_courses (student_id, course_id) "
                + "SELECT s.id, c.id FROM students s JOIN courses c ON c.department = s.department AND c.semester = s.semester "
                + "WHERE c.id = ? AND s.status = 'ACTIVE'", courseId);
    }

    public int deallocate(long courseId, long studentId) {
        return update("DELETE FROM student_courses WHERE course_id = ? AND student_id = ?", courseId, studentId);
    }

    public List<Course> quickSearch(String q, int limit) {
        return list(SELECT_WITH_COUNT + " WHERE c.course_name LIKE ? OR c.course_code LIKE ? ORDER BY c.course_code LIMIT ?",
                CourseDAO::map, like(q), like(q), limit);
    }
}
