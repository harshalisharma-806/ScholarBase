package com.scholarbase.controller;

import com.scholarbase.model.Admin;
import com.scholarbase.service.AuthService;
import com.scholarbase.util.ApiException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet("/api/login")
public class LoginServlet extends BaseApiServlet {

    static final String REMEMBER_COOKIE = "sb_user";
    private static final int REMEMBER_SECONDS = 30 * 24 * 60 * 60;
    private static final int SHORT_SESSION_SECONDS = 30 * 60;
    private static final int LONG_SESSION_SECONDS = 7 * 24 * 60 * 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthService auth = new AuthService();

    /** Tells the login page which username to pre-fill (set by "Remember me") and whether a session already exists. */
    @Override
    protected void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String remembered = "";
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (REMEMBER_COOKIE.equals(c.getName())) remembered = URLDecoder.decode(c.getValue(), StandardCharsets.UTF_8);
            }
        }
        HttpSession existing = req.getSession(false);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("rememberedUser", remembered);
        body.put("authenticated", existing != null && existing.getAttribute(AuthFilter.SESSION_ADMIN) != null);
        ok(resp, body);
    }

    @Override
    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        String login = str(req, "username");
        String password = req.getParameter("password") == null ? "" : req.getParameter("password");
        boolean remember = "true".equals(req.getParameter("remember")) || "on".equals(req.getParameter("remember"));

        Map<String, String> errors = new LinkedHashMap<>();
        if (login.isEmpty()) errors.put("username", "Enter your username or email.");
        if (password.isEmpty()) errors.put("password", "Enter your password.");
        if (!errors.isEmpty()) throw ApiException.validation(errors);

        Admin admin = auth.authenticate(login, password, req.getRemoteAddr());
        if (admin == null) {
            throw new ApiException(401, "Invalid username or password.");
        }

        // new session id on every login prevents session fixation
        HttpSession old = req.getSession(false);
        if (old != null) old.invalidate();
        HttpSession session = req.getSession(true);
        session.setAttribute(AuthFilter.SESSION_ADMIN, admin);
        session.setAttribute(AuthFilter.SESSION_CSRF, newToken());
        session.setMaxInactiveInterval(remember ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS);

        Cookie cookie = new Cookie(REMEMBER_COOKIE, remember ? URLEncoder.encode(admin.getUsername(), StandardCharsets.UTF_8) : "");
        cookie.setHttpOnly(true);
        cookie.setPath(req.getContextPath().isEmpty() ? "/" : req.getContextPath());
        cookie.setMaxAge(remember ? REMEMBER_SECONDS : 0);
        resp.addCookie(cookie);

        done(resp, "Welcome back, " + admin.getFullName() + "!", "admin", admin, "redirect", "app/dashboard.html");
    }

    static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
