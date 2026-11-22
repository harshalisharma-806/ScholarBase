package com.scholarbase.controller;

import com.scholarbase.service.DashboardService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * /api/dashboard      statistics, chart data and recent-activity lists
 * /api/notifications  derived alerts for the bell icon
 * /api/search?q=      global search over students and courses
 */
@WebServlet({"/api/dashboard", "/api/notifications", "/api/search"})
public class DashboardServlet extends BaseApiServlet {

    private final DashboardService service = new DashboardService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String uri = req.getRequestURI();
        if (uri.endsWith("/notifications")) {
            ok(resp, service.notifications());
        } else if (uri.endsWith("/search")) {
            ok(resp, service.search(str(req, "q")));
        } else {
            ok(resp, service.dashboard());
        }
    }
}
