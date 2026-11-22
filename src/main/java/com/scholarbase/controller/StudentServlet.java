package com.scholarbase.controller;

import com.scholarbase.model.Student;
import com.scholarbase.service.StudentService;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.Validator;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET  /api/students              paged list; filters: q, department, semester, status, page, size
 * GET  /api/students?id=7         full profile (details, courses, attendance, results)
 * POST /api/students action=create | update | delete
 */
@WebServlet("/api/students")
public class StudentServlet extends BaseApiServlet {

    private final StudentService service = new StudentService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        if (req.getParameter("id") != null) {
            ok(resp, service.profile(requireId(req, "id")));
            return;
        }
        ok(resp, service.list(str(req, "q"), str(req, "department"), intParam(req, "semester"),
                str(req, "status"), page(req), pageSize(req)));
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "action")) {
            case "create" -> done(resp, "Student registered successfully.", "student", service.create(fromRequest(req)));
            case "update" -> {
                Student s = fromRequest(req);
                s.setId(requireId(req, "id"));
                done(resp, "Student details updated.", "student", service.update(s));
            }
            case "delete" -> {
                service.delete(requireId(req, "id"));
                done(resp, "Student deleted.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }

    private static Student fromRequest(HttpServletRequest req) {
        Student s = new Student();
        s.setFullName(str(req, "fullName"));
        s.setRollNumber(str(req, "rollNumber"));
        s.setEmail(str(req, "email"));
        s.setPhone(str(req, "phone"));
        s.setDateOfBirth(Validator.parseDate(req.getParameter("dateOfBirth")));
        s.setGender(str(req, "gender"));
        s.setDepartment(str(req, "department"));
        Integer sem = intParam(req, "semester");
        s.setSemester(sem == null ? 0 : sem);
        s.setAddress(str(req, "address"));
        s.setEnrollmentDate(Validator.parseDate(req.getParameter("enrollmentDate")));
        s.setStatus(str(req, "status"));
        return s;
    }
}
