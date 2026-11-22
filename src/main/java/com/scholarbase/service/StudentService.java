package com.scholarbase.service;

import com.scholarbase.dao.AttendanceDAO;
import com.scholarbase.dao.CourseDAO;
import com.scholarbase.dao.StudentDAO;
import com.scholarbase.model.Student;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.DaoException;
import com.scholarbase.util.PageResult;
import com.scholarbase.util.Validator;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

public class StudentService {

    public static final Set<String> GENDERS = Set.of("MALE", "FEMALE", "OTHER");
    public static final Set<String> STATUSES = Set.of("ACTIVE", "INACTIVE");

    private final StudentDAO students = new StudentDAO();
    private final CourseDAO courses = new CourseDAO();
    private final AttendanceDAO attendance = new AttendanceDAO();
    private final ResultService results = new ResultService();

    public PageResult<Student> list(String q, String department, Integer semester, String status, int page, int size) {
        return students.search(q, department, semester, status, page, size);
    }

    public Student get(long id) {
        Student s = students.findById(id);
        if (s == null) throw ApiException.notFound("Student");
        return s;
    }

    /** Full profile: details, allocated courses, attendance per course and the result sheet. */
    public Map<String, Object> profile(long id) {
        Student s = get(id);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("student", s);
        out.put("courses", courses.coursesOfStudent(id));
        out.put("attendance", attendance.summary(null, id, null));
        out.put("overallAttendance", attendance.overallForStudent(id));
        out.put("result", results.studentSheet(id));
        return out;
    }

    public Student create(Student s) {
        normalise(s);
        validate(s, 0);
        try {
            return students.findById(students.insert(s));
        } catch (DaoException e) {
            throw translate(e);
        }
    }

    public Student update(Student s) {
        get(s.getId());
        normalise(s);
        validate(s, s.getId());
        try {
            students.update(s);
        } catch (DaoException e) {
            throw translate(e);
        }
        return students.findById(s.getId());
    }

    public void delete(long id) {
        if (students.delete(id) == 0) throw ApiException.notFound("Student");
    }

    private static ApiException translate(DaoException e) {
        if (e.isDuplicate()) return new ApiException(409, "A student with this roll number or email already exists.");
        throw e;
    }

    private static void normalise(Student s) {
        s.setFullName(trim(s.getFullName()));
        s.setRollNumber(trim(s.getRollNumber()).toUpperCase());
        s.setEmail(trim(s.getEmail()).toLowerCase());
        s.setPhone(trim(s.getPhone()));
        s.setAddress(trim(s.getAddress()));
        s.setDepartment(trim(s.getDepartment()));
        s.setGender(trim(s.getGender()).toUpperCase());
        s.setStatus(Validator.isBlank(s.getStatus()) ? "ACTIVE" : s.getStatus().trim().toUpperCase());
    }

    private static String trim(String v) {
        return v == null ? "" : v.trim();
    }

    private void validate(Student s, long id) {
        Map<String, String> errors = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();

        if (s.getFullName().length() < 2 || s.getFullName().length() > 100) {
            errors.put("fullName", "Enter the student's full name (2-100 characters).");
        }
        if (s.getRollNumber().isEmpty()) {
            errors.put("rollNumber", "Roll number is required.");
        } else if (!Validator.isRollNumber(s.getRollNumber())) {
            errors.put("rollNumber", "Use letters, digits, - _ or / (2-30 characters).");
        } else if (students.rollNumberExists(s.getRollNumber(), id)) {
            errors.put("rollNumber", "This roll number is already registered.");
        }
        if (s.getEmail().isEmpty()) {
            errors.put("email", "Email is required.");
        } else if (!Validator.isEmail(s.getEmail())) {
            errors.put("email", "Enter a valid email address.");
        } else if (students.emailExists(s.getEmail(), id)) {
            errors.put("email", "This email is already registered.");
        }
        if (s.getPhone().isEmpty()) {
            errors.put("phone", "Phone number is required.");
        } else if (!Validator.isPhone(s.getPhone())) {
            errors.put("phone", "Enter a valid 10-digit mobile number.");
        }
        if (s.getDateOfBirth() == null) {
            errors.put("dateOfBirth", "Date of birth is required.");
        } else if (!s.getDateOfBirth().isBefore(today)) {
            errors.put("dateOfBirth", "Date of birth must be in the past.");
        }
        if (!GENDERS.contains(s.getGender())) errors.put("gender", "Select a gender.");
        if (s.getDepartment().isEmpty() || s.getDepartment().length() > 100) errors.put("department", "Select a department.");
        if (s.getSemester() < 1 || s.getSemester() > 8) errors.put("semester", "Semester must be between 1 and 8.");
        if (s.getAddress().isEmpty()) {
            errors.put("address", "Address is required.");
        } else if (s.getAddress().length() > 255) {
            errors.put("address", "Address is too long (255 characters maximum).");
        }
        if (s.getEnrollmentDate() == null) {
            errors.put("enrollmentDate", "Enrollment date is required.");
        } else if (s.getEnrollmentDate().isAfter(today)) {
            errors.put("enrollmentDate", "Enrollment date cannot be in the future.");
        } else if (s.getDateOfBirth() != null && !s.getEnrollmentDate().isAfter(s.getDateOfBirth())) {
            errors.put("enrollmentDate", "Enrollment date must be after the date of birth.");
        }
        if (!STATUSES.contains(s.getStatus())) errors.put("status", "Select a valid status.");

        if (!errors.isEmpty()) throw ApiException.validation(errors);
    }
}
