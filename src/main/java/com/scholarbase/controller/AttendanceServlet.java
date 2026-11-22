package com.scholarbase.controller;

import com.scholarbase.model.Attendance;
import com.scholarbase.service.AttendanceService;
import com.scholarbase.util.ApiException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * GET  /api/attendance?view=records  (default) paged records; filters: courseId, date, q, status
 * GET  /api/attendance?view=roster&courseId=&date=   marking sheet
 * GET  /api/attendance?view=summary&courseId=&studentId=&q=   percentages
 * POST /api/attendance action=mark | update | delete
 */
@WebServlet("/api/attendance")
public class AttendanceServlet extends BaseApiServlet {

    private final AttendanceService service = new AttendanceService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "view")) {
            case "roster" -> {
                LocalDate date = dateParam(req, "date");
                if (date == null) date = LocalDate.now();
                ok(resp, service.roster(requireId(req, "courseId"), date));
            }
            case "summary" -> ok(resp, service.summary(longParam(req, "courseId"), longParam(req, "studentId"), str(req, "q")));
            default -> ok(resp, service.records(longParam(req, "courseId"), dateParam(req, "date"), str(req, "q"),
                    str(req, "status"), page(req), pageSize(req)));
        }
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        switch (str(req, "action")) {
            case "mark" -> {
                long courseId = requireId(req, "courseId");
                LocalDate date = dateParam(req, "date");
                String[] ids = req.getParameterValues("studentId");
                String[] statuses = req.getParameterValues("status");
                if (ids == null || statuses == null || ids.length != statuses.length) {
                    throw new ApiException(400, "Attendance data is incomplete.");
                }
                List<Attendance> entries = new ArrayList<>();
                for (int i = 0; i < ids.length; i++) {
                    Attendance a = new Attendance();
                    try {
                        a.setStudentId(Long.parseLong(ids[i].trim()));
                    } catch (NumberFormatException e) {
                        throw new ApiException(400, "Invalid student reference.");
                    }
                    a.setStatus(statuses[i].trim().toUpperCase());
                    entries.add(a);
                }
                int n = service.mark(courseId, date, entries);
                done(resp, "Attendance saved for " + n + (n == 1 ? " student." : " students."), "saved", n);
            }
            case "update" -> {
                service.updateStatus(requireId(req, "id"), str(req, "status").toUpperCase());
                done(resp, "Attendance updated.");
            }
            case "delete" -> {
                service.delete(requireId(req, "id"));
                done(resp, "Attendance record deleted.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }
}
