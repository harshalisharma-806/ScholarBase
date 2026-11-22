package com.scholarbase.controller;

import com.scholarbase.service.ReportService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * GET /api/reports?type=student|course|attendance|department|toppers|overall
 *     optional: department, courseId, limit, format=csv (downloads a CSV file instead of JSON)
 */
@WebServlet("/api/reports")
public class ReportServlet extends BaseApiServlet {

    private final ReportService service = new ReportService();

    @Override
    @SuppressWarnings("unchecked")
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String type = str(req, "type").isEmpty() ? "overall" : str(req, "type");
        Integer limit = intParam(req, "limit");
        Map<String, Object> report = service.build(type, str(req, "department"), longParam(req, "courseId"),
                limit == null || limit < 1 ? 10 : Math.min(limit, 100));

        if ("csv".equals(req.getParameter("format"))) {
            writeCsv(resp, type, (List<Map<String, Object>>) report.get("columns"), (List<Map<String, Object>>) report.get("rows"));
        } else {
            ok(resp, report);
        }
    }

    private void writeCsv(HttpServletResponse resp, String type, List<Map<String, Object>> columns,
                          List<Map<String, Object>> rows) throws IOException {
        resp.setContentType("text/csv;charset=UTF-8");
        resp.setHeader("Content-Disposition", "attachment; filename=\"scholarbase-" + type + "-report.csv\"");
        resp.setHeader("Cache-Control", "no-store");
        StringBuilder sb = new StringBuilder("﻿"); // BOM so Excel opens UTF-8 correctly
        for (int i = 0; i < columns.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(cell(columns.get(i).get("label")));
        }
        sb.append("\r\n");
        for (Map<String, Object> row : rows) {
            for (int i = 0; i < columns.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(cell(row.get(columns.get(i).get("key"))));
            }
            sb.append("\r\n");
        }
        resp.getWriter().write(sb.toString());
    }

    /** Quotes a CSV cell and neutralises spreadsheet formulas (=, +, -, @) in text values. */
    private static String cell(Object value) {
        if (value == null) return "";
        String s = value.toString();
        if (value instanceof String && !s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0 && !s.matches("-?\\d+(\\.\\d+)?")) {
            s = "'" + s;
        }
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
