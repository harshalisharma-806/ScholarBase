package com.scholarbase.controller;

import com.scholarbase.model.Course;
import com.scholarbase.service.CourseService;
import com.scholarbase.util.ApiException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * GET  /api/courses             paged list; filters: q, department, semester, page, size
 * GET  /api/courses?id=3        course plus enrolled students
 * POST /api/courses action=create | update | delete | allocate | allocateMatching | deallocate
 */
@WebServlet("/api/courses")
public class CourseServlet extends BaseApiServlet {

    private final CourseService service = new CourseService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        if (req.getParameter("id") != null) {
            ok(resp, service.detail(requireId(req, "id")));
            return;
        }
        ok(resp, service.list(str(req, "q"), str(req, "department"), intParam(req, "semester"), page(req), pageSize(req)));
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "action")) {
            case "create" -> done(resp, "Course added successfully.", "course", service.create(fromRequest(req)));
            case "update" -> {
                Course c = fromRequest(req);
                c.setId(requireId(req, "id"));
                done(resp, "Course updated.", "course", service.update(c));
            }
            case "delete" -> {
                service.delete(requireId(req, "id"));
                done(resp, "Course deleted.");
            }
            case "allocate" -> {
                int added = service.allocate(requireId(req, "courseId"), longList(req, "studentId"));
                done(resp, added == 0 ? "Those students were already allocated to this course."
                        : added + (added == 1 ? " student allocated." : " students allocated."), "added", added);
            }
            case "allocateMatching" -> {
                int added = service.allocateMatching(requireId(req, "courseId"));
                done(resp, added == 0 ? "No new students matched this course's department and semester."
                        : added + (added == 1 ? " student allocated." : " students allocated."), "added", added);
            }
            case "deallocate" -> {
                service.deallocate(requireId(req, "courseId"), requireId(req, "studentId"));
                done(resp, "Student removed from the course.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }

    private static Course fromRequest(HttpServletRequest req) {
        Course c = new Course();
        c.setCourseCode(str(req, "courseCode"));
        c.setCourseName(str(req, "courseName"));
        c.setDepartment(str(req, "department"));
        Integer sem = intParam(req, "semester");
        c.setSemester(sem == null ? 0 : sem);
        Integer credits = intParam(req, "credits");
        c.setCredits(credits == null ? 0 : credits);
        c.setInstructorName(str(req, "instructorName"));
        c.setDescription(str(req, "description"));
        return c;
    }
}
