package com.scholarbase.controller;

import com.scholarbase.util.ApiException;
import com.scholarbase.util.DaoException;
import com.scholarbase.util.Json;
import com.scholarbase.util.Validator;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Parent of all JSON API servlets: UTF-8 handling, uniform JSON responses and one place
 * where exceptions are turned into HTTP status codes. Subclasses implement only handleGet / handlePost.
 */
public abstract class BaseApiServlet extends HttpServlet {

    protected static final int DEFAULT_PAGE_SIZE = 10;
    protected static final int MAX_PAGE_SIZE = 200;

    protected abstract void handleGet(HttpServletRequest req, HttpServletResponse resp) throws Exception;

    protected void handlePost(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        throw new ApiException(405, "Method not allowed.");
    }

    @Override
    protected final void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, false);
    }

    @Override
    protected final void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        dispatch(req, resp, true);
    }

    private void dispatch(HttpServletRequest req, HttpServletResponse resp, boolean post) throws IOException {
        req.setCharacterEncoding("UTF-8");
        resp.setCharacterEncoding("UTF-8");
        try {
            if (post) handlePost(req, resp);
            else handleGet(req, resp);
        } catch (ApiException e) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("ok", false);
            body.put("message", e.getMessage());
            body.put("errors", e.getErrors());
            send(resp, e.getStatus(), body);
        } catch (DaoException e) {
            log("Database error", e);
            if (e.isDuplicate()) {
                error(resp, 409, "That record already exists.");
            } else if (e.isConstraintViolation()) {
                error(resp, 400, "The request conflicts with existing data (for example a missing or linked record).");
            } else {
                error(resp, 500, "A database error occurred. Check that MySQL is running and the connection settings are correct.");
            }
        } catch (Exception e) {
            log("Unexpected error", e);
            error(resp, 500, "Something went wrong on the server.");
        }
    }

    // ---- responses -----------------------------------------------------------------------------------------

    protected void send(HttpServletResponse resp, int status, Object body) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        resp.getWriter().write(Json.stringify(body));
    }

    protected void ok(HttpServletResponse resp, Object body) throws IOException {
        send(resp, 200, body);
    }

    /** {"ok":true,"message":..., plus any extra key/value pairs} */
    protected void done(HttpServletResponse resp, String message, Object... extraKeyValues) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("message", message);
        for (int i = 0; i + 1 < extraKeyValues.length; i += 2) body.put(String.valueOf(extraKeyValues[i]), extraKeyValues[i + 1]);
        send(resp, 200, body);
    }

    protected void error(HttpServletResponse resp, int status, String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", false);
        body.put("message", message);
        send(resp, status, body);
    }

    // ---- parameter helpers ---------------------------------------------------------------------------------

    protected static String str(HttpServletRequest req, String name) {
        String v = req.getParameter(name);
        return v == null ? "" : v.trim();
    }

    protected static Integer intParam(HttpServletRequest req, String name) {
        return Validator.parseInt(req.getParameter(name));
    }

    protected static Long longParam(HttpServletRequest req, String name) {
        return Validator.parseLong(req.getParameter(name));
    }

    protected static long requireId(HttpServletRequest req, String name) {
        Long id = longParam(req, name);
        if (id == null || id <= 0) throw new ApiException(400, "Missing or invalid " + name + ".");
        return id;
    }

    protected static LocalDate dateParam(HttpServletRequest req, String name) {
        return Validator.parseDate(req.getParameter(name));
    }

    protected static int page(HttpServletRequest req) {
        Integer p = intParam(req, "page");
        return p == null || p < 1 ? 1 : p;
    }

    protected static int pageSize(HttpServletRequest req) {
        Integer s = intParam(req, "size");
        if (s == null || s < 1) return DEFAULT_PAGE_SIZE;
        return Math.min(s, MAX_PAGE_SIZE);
    }

    protected static List<Long> longList(HttpServletRequest req, String name) {
        List<Long> out = new ArrayList<>();
        String[] values = req.getParameterValues(name);
        if (values != null) {
            for (String v : values) {
                Long id = Validator.parseLong(v);
                if (id != null && id > 0) out.add(id);
            }
        }
        return out;
    }
}
