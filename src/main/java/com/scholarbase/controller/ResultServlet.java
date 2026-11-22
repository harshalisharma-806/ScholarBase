package com.scholarbase.controller;

import com.scholarbase.model.Result;
import com.scholarbase.service.GradingService;
import com.scholarbase.service.ResultService;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.Validator;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

/**
 * GET  /api/results?view=records (default)   paged; filters: courseId, studentId, q
 * GET  /api/results?view=roster&courseId=    marks entry sheet
 * GET  /api/results?view=student&studentId=  student-wise result sheet
 * GET  /api/results?view=course&courseId=    course-wise result sheet
 * GET  /api/results?view=grading             configured grade scale
 * POST /api/results action=save | saveBulk | delete
 */
@WebServlet("/api/results")
public class ResultServlet extends BaseApiServlet {

    private final ResultService service = new ResultService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "view")) {
            case "roster" -> ok(resp, service.roster(requireId(req, "courseId")));
            case "student" -> ok(resp, service.studentSheet(requireId(req, "studentId")));
            case "course" -> ok(resp, service.courseSheet(requireId(req, "courseId")));
            case "grading" -> ok(resp, GradingService.get().toMap());
            default -> ok(resp, service.list(longParam(req, "courseId"), longParam(req, "studentId"), str(req, "q"),
                    page(req), pageSize(req)));
        }
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "action")) {
            case "save" -> {
                Result r = service.save(requireId(req, "studentId"), requireId(req, "courseId"),
                        Validator.parseDouble(req.getParameter("marksObtained")),
                        Validator.parseDouble(req.getParameter("maxMarks")));
                done(resp, "Marks saved.", "result", service.enrich(r));
            }
            case "saveBulk" -> {
                long courseId = requireId(req, "courseId");
                Double max = Validator.parseDouble(req.getParameter("maxMarks"));
                String[] ids = req.getParameterValues("studentId");
                String[] marks = req.getParameterValues("marks");
                if (ids == null || marks == null || ids.length != marks.length) {
                    throw new ApiException(400, "Marks data is incomplete.");
                }
                List<Result> entries = new ArrayList<>();
                for (int i = 0; i < ids.length; i++) {
                    Long sid = Validator.parseLong(ids[i]);
                    if (sid == null) throw new ApiException(400, "Invalid student reference.");
                    Result r = new Result();
                    r.setStudentId(sid);
                    r.setMaxMarks(max);
                    String raw = marks[i].trim();
                    if (!raw.isEmpty()) {
                        Double m = Validator.parseDouble(raw);
                        if (m == null) throw new ApiException(400, "Marks must be numbers.");
                        r.setMarksObtained(m);
                    }
                    entries.add(r);
                }
                int n = service.saveAll(courseId, entries);
                done(resp, "Marks saved for " + n + (n == 1 ? " student." : " students."), "saved", n);
            }
            case "delete" -> {
                service.delete(requireId(req, "id"));
                done(resp, "Result deleted.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }
}
