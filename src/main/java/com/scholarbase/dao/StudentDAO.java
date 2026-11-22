package com.scholarbase.dao;

import com.scholarbase.model.Student;
import com.scholarbase.util.PageResult;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StudentDAO extends BaseDAO {

    private static Student map(ResultSet rs) throws SQLException {
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
    }

    public PageResult<Student> search(String q, String department, Integer semester, String status, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            where.append(" AND (full_name LIKE ? OR roll_number LIKE ?)");
            params.add(like(q));
            params.add(like(q));
        }
        if (department != null && !department.isBlank()) {
            where.append(" AND department = ?");
            params.add(department);
        }
        if (semester != null) {
            where.append(" AND semester = ?");
            params.add(semester);
        }
        if (status != null && !status.isBlank()) {
            where.append(" AND status = ?");
            params.add(status);
        }
        long total = longOf("SELECT COUNT(*) FROM students" + where, params);
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((page - 1) * size);
        List<Student> items = list("SELECT * FROM students" + where + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?",
                pageParams, StudentDAO::map);
        return new PageResult<>(items, total, page, size);
    }

    public Student findById(long id) {
        return one("SELECT * FROM students WHERE id = ?", StudentDAO::map, id);
    }

    public long insert(Student s) {
        return insert("INSERT INTO students (full_name, roll_number, email, phone, date_of_birth, gender, department, "
                        + "semester, address, enrollment_date, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                s.getFullName(), s.getRollNumber(), s.getEmail(), s.getPhone(), s.getDateOfBirth(), s.getGender(),
                s.getDepartment(), s.getSemester(), s.getAddress(), s.getEnrollmentDate(), s.getStatus());
    }

    public int update(Student s) {
        return update("UPDATE students SET full_name=?, roll_number=?, email=?, phone=?, date_of_birth=?, gender=?, "
                        + "department=?, semester=?, address=?, enrollment_date=?, status=? WHERE id=?",
                s.getFullName(), s.getRollNumber(), s.getEmail(), s.getPhone(), s.getDateOfBirth(), s.getGender(),
                s.getDepartment(), s.getSemester(), s.getAddress(), s.getEnrollmentDate(), s.getStatus(), s.getId());
    }

    public int delete(long id) {
        return update("DELETE FROM students WHERE id = ?", id);
    }

    public boolean rollNumberExists(String roll, long excludeId) {
        return longOf("SELECT COUNT(*) FROM students WHERE LOWER(roll_number) = LOWER(?) AND id <> ?", roll, excludeId) > 0;
    }

    public boolean emailExists(String email, long excludeId) {
        return longOf("SELECT COUNT(*) FROM students WHERE LOWER(email) = LOWER(?) AND id <> ?", email, excludeId) > 0;
    }

    public long count() {
        return longOf("SELECT COUNT(*) FROM students");
    }

    public long countActive() {
        return longOf("SELECT COUNT(*) FROM students WHERE status = 'ACTIVE'");
    }

    public long countRegisteredSince(int days) {
        return longOf("SELECT COUNT(*) FROM students WHERE created_at >= (NOW() - INTERVAL ? DAY)", days);
    }

    public List<Map<String, Object>> countByDepartment() {
        return list("SELECT department AS label, COUNT(*) AS value FROM students GROUP BY department ORDER BY value DESC, department",
                BaseDAO::row);
    }

    public List<Map<String, Object>> countBySemester() {
        return list("SELECT CONCAT('Sem ', semester) AS label, COUNT(*) AS value FROM students GROUP BY semester ORDER BY semester",
                BaseDAO::row);
    }

    public List<Student> recentRegistrations(int limit) {
        return list("SELECT * FROM students ORDER BY created_at DESC, id DESC LIMIT ?", StudentDAO::map, limit);
    }

    /** Lightweight lookup for the global search box. */
    public List<Student> quickSearch(String q, int limit) {
        return list("SELECT * FROM students WHERE full_name LIKE ? OR roll_number LIKE ? ORDER BY full_name LIMIT ?",
                StudentDAO::map, like(q), like(q), limit);
    }
}
