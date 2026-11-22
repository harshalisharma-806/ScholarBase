package com.scholarbase.controller;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

/**
 * Guards every administrator page (/app/*) and API endpoint (/api/*).
 * - unauthenticated page requests are redirected to the login page,
 * - unauthenticated API requests receive 401 JSON,
 * - state-changing API requests must carry the session's CSRF token in the X-CSRF-Token header.
 */
@WebFilter(urlPatterns = {"/api/*", "/app/*"})
public class AuthFilter implements Filter {

    public static final String SESSION_ADMIN = "admin";
    public static final String SESSION_CSRF = "csrfToken";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String path = req.getRequestURI().substring(req.getContextPath().length());
        boolean api = path.startsWith("/api/");

        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.setHeader("X-Frame-Options", "DENY");
        resp.setHeader("Referrer-Policy", "same-origin");

        if (api && (path.equals("/api/login"))) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = req.getSession(false);
        boolean authenticated = session != null && session.getAttribute(SESSION_ADMIN) != null;

        if (!authenticated) {
            if (api) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                resp.setContentType("application/json;charset=UTF-8");
                resp.getWriter().write("{\"ok\":false,\"message\":\"Please sign in to continue.\",\"unauthenticated\":true}");
            } else {
                resp.sendRedirect(req.getContextPath() + "/login.html");
            }
            return;
        }

        if (api && !"GET".equals(req.getMethod())) {
            String expected = (String) session.getAttribute(SESSION_CSRF);
            String sent = req.getHeader("X-CSRF-Token");
            boolean valid = expected != null && sent != null
                    && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), sent.getBytes(StandardCharsets.UTF_8));
            if (!valid) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                resp.setContentType("application/json;charset=UTF-8");
                resp.getWriter().write("{\"ok\":false,\"message\":\"Your session token is invalid. Please reload the page.\"}");
                return;
            }
        }

        if (!api) {
            // keep protected pages out of the browser cache so Back after logout cannot reveal them
            resp.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            resp.setHeader("Pragma", "no-cache");
        }
        chain.doFilter(request, response);
    }
}
