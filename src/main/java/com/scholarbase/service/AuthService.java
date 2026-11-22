package com.scholarbase.service;

import com.scholarbase.dao.AdminDAO;
import com.scholarbase.model.Admin;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.PasswordUtil;
import com.scholarbase.util.Validator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {

    private static final int MAX_FAILURES = 5;
    private static final long LOCK_WINDOW_MS = 10 * 60 * 1000L;
    /** Used so a login for an unknown user costs the same time as one for a real user. */
    private static final String DUMMY_HASH = PasswordUtil.hash("scholarbase-dummy-password");
    /** key -> {failure count, window start (epoch ms)} */
    private static final Map<String, long[]> FAILURES = new ConcurrentHashMap<>();

    private final AdminDAO admins = new AdminDAO();

    /** Returns the authenticated admin, or null when the credentials are wrong. */
    public Admin authenticate(String login, String password, String clientIp) {
        String key = login.toLowerCase() + "|" + clientIp;
        long now = System.currentTimeMillis();
        long[] state = FAILURES.get(key);
        if (state != null && now - state[1] > LOCK_WINDOW_MS) {
            FAILURES.remove(key);
            state = null;
        }
        if (state != null && state[0] >= MAX_FAILURES) {
            throw new ApiException(429, "Too many failed attempts. Please wait a few minutes and try again.");
        }

        Admin admin = admins.findByLogin(login);
        boolean ok = PasswordUtil.verify(password, admin != null ? admin.getPasswordHash() : DUMMY_HASH) && admin != null;
        if (!ok) {
            FAILURES.compute(key, (k, v) -> {
                if (v == null) return new long[]{1, now};
                v[0]++;
                return v;
            });
            return null;
        }
        FAILURES.remove(key);
        admins.touchLastLogin(admin.getId());
        return admin;
    }

    public Admin updateProfile(long adminId, String fullName, String email) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (Validator.isBlank(fullName) || fullName.trim().length() < 2) errors.put("fullName", "Enter your full name.");
        if (!Validator.isEmail(email)) errors.put("email", "Enter a valid email address.");
        else if (admins.emailTaken(email.trim(), adminId)) errors.put("email", "This email is used by another administrator.");
        if (!errors.isEmpty()) throw ApiException.validation(errors);
        admins.updateProfile(adminId, fullName.trim(), email.trim().toLowerCase());
        return admins.findById(adminId);
    }

    public void changePassword(long adminId, String current, String next, String confirm) {
        Map<String, String> errors = new LinkedHashMap<>();
        Admin admin = admins.findById(adminId);
        if (admin == null) throw ApiException.notFound("Administrator");
        if (!PasswordUtil.verify(current == null ? "" : current, admin.getPasswordHash())) {
            errors.put("currentPassword", "Current password is incorrect.");
        }
        if (next == null || next.length() < 8 || !next.matches(".*[A-Za-z].*") || !next.matches(".*[0-9].*")) {
            errors.put("newPassword", "Use at least 8 characters with letters and numbers.");
        } else if (next.equals(current)) {
            errors.put("newPassword", "New password must be different from the current one.");
        }
        if (next != null && !next.equals(confirm)) errors.put("confirmPassword", "Passwords do not match.");
        if (!errors.isEmpty()) throw ApiException.validation(errors);
        admins.updatePassword(adminId, PasswordUtil.hash(next));
    }
}
