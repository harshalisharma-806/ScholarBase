package com.scholarbase.service;

import com.scholarbase.dao.CourseDAO;
import com.scholarbase.dao.StudentDAO;
import com.scholarbase.model.Course;
import com.scholarbase.model.Student;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.DaoException;
import com.scholarbase.util.PageResult;
import com.scholarbase.util.Validator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CourseService {

    private final CourseDAO courses = new CourseDAO();
    private final StudentDAO students = new StudentDAO();

    public PageResult<Course> list(String q, String department, Integer semester, int page, int size) {
        return courses.search(q, department, semester, page, size);
    }

    public Course get(long id) {
        Course c = courses.findById(id);
        if (c == null) throw ApiException.notFound("Course");
        return c;
    }

    public Map<String, Object> detail(long id) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("course", get(id));
        List<Student> enrolled = courses.enrolledStudents(id);
        out.put("students", enrolled);
        return out;
    }

    public Course create(Course c) {
        normalise(c);
        validate(c, 0);
        try {
            return courses.findById(courses.insert(c));
        } catch (DaoException e) {
            throw translate(e);
        }
    }

    public Course update(Course c) {
        get(c.getId());
        normalise(c);
        validate(c, c.getId());
        try {
            courses.update(c);
        } catch (DaoException e) {
            throw translate(e);
        }
        return courses.findById(c.getId());
    }

    public void delete(long id) {
        if (courses.delete(id) == 0) throw ApiException.notFound("Course");
    }

    public int allocate(long courseId, List<Long> studentIds) {
        get(courseId);
        if (studentIds.isEmpty()) throw new ApiException(400, "Select at least one student.");
        for (Long sid : studentIds) {
            if (students.findById(sid) == null) throw ApiException.notFound("Student");
        }
        return courses.allocate(courseId, studentIds);
    }

    public int allocateMatching(long courseId) {
        get(courseId);
        return courses.allocateMatching(courseId);
    }

    public void deallocate(long courseId, long studentId) {
        if (courses.deallocate(courseId, studentId) == 0) {
            throw new ApiException(404, "That student is not allocated to this course.");
        }
    }

    private static ApiException translate(DaoException e) {
        if (e.isDuplicate()) return new ApiException(409, "A course with this code already exists.");
        throw e;
    }

    private static void normalise(Course c) {
        c.setCourseCode(trim(c.getCourseCode()).toUpperCase());
        c.setCourseName(trim(c.getCourseName()));
        c.setDepartment(trim(c.getDepartment()));
        c.setInstructorName(trim(c.getInstructorName()));
        c.setDescription(trim(c.getDescription()));
    }

    private static String trim(String v) {
        return v == null ? "" : v.trim();
    }

    private void validate(Course c, long id) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (c.getCourseCode().isEmpty()) {
            errors.put("courseCode", "Course code is required.");
        } else if (!Validator.isCourseCode(c.getCourseCode())) {
            errors.put("courseCode", "Use letters, digits and hyphens only (2-20 characters).");
        } else if (courses.codeExists(c.getCourseCode(), id)) {
            errors.put("courseCode", "This course code already exists.");
        }
        if (c.getCourseName().length() < 3 || c.getCourseName().length() > 150) {
            errors.put("courseName", "Enter the course name (3-150 characters).");
        }
        if (c.getDepartment().isEmpty()) errors.put("department", "Select a department.");
        if (c.getSemester() < 1 || c.getSemester() > 8) errors.put("semester", "Semester must be between 1 and 8.");
        if (c.getCredits() < 1 || c.getCredits() > 10) errors.put("credits", "Credits must be between 1 and 10.");
        if (c.getInstructorName().length() < 2 || c.getInstructorName().length() > 100) {
            errors.put("instructorName", "Enter the instructor's name.");
        }
        if (c.getDescription().length() > 1000) errors.put("description", "Description is too long (1000 characters maximum).");
        if (!errors.isEmpty()) throw ApiException.validation(errors);
    }
}
