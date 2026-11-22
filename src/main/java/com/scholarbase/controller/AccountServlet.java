package com.scholarbase.controller;

import com.scholarbase.model.Admin;
import com.scholarbase.service.AuthService;
import com.scholarbase.service.GradingService;
import com.scholarbase.util.ApiException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * /api/session  - who is signed in + the CSRF token the frontend must echo on POST requests
 * /api/settings - profile, password change, and the read-only academic rules from grading.properties
 */
@WebServlet({"/api/session", "/api/settings"})
public class AccountServlet extends BaseApiServlet {

    private final AuthService auth = new AuthService();

    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        HttpSession session = req.getSession(false);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("admin", session.getAttribute(AuthFilter.SESSION_ADMIN));
        body.put("csrfToken", session.getAttribute(AuthFilter.SESSION_CSRF));
        if (req.getRequestURI().endsWith("/settings")) body.put("grading", GradingService.get().toMap());
        ok(resp, body);
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        HttpSession session = req.getSession(false);
        Admin current = (Admin) session.getAttribute(AuthFilter.SESSION_ADMIN);
        switch (str(req, "action")) {
            case "updateProfile" -> {
                Admin updated = auth.updateProfile(current.getId(), req.getParameter("fullName"), req.getParameter("email"));
                session.setAttribute(AuthFilter.SESSION_ADMIN, updated);
                done(resp, "Profile updated.", "admin", updated);
            }
            case "changePassword" -> {
                auth.changePassword(current.getId(), req.getParameter("currentPassword"),
                        req.getParameter("newPassword"), req.getParameter("confirmPassword"));
                done(resp, "Password changed successfully.");
            }
            default -> throw new ApiException(400, "Unknown action.");
        }
    }
}
