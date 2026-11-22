package com.scholarbase.util;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

/** Small, dependency-free input validation helpers shared by the service layer. */
public final class Validator {

    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    /** 10-digit Indian mobile number starting 6-9, optional +91 prefix. */
    private static final Pattern PHONE = Pattern.compile("^(\\+91[- ]?)?[6-9][0-9]{9}$");
    private static final Pattern ROLL = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9/_-]{1,29}$");
    private static final Pattern COURSE_CODE = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9-]{1,19}$");

    private Validator() {
    }

    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    public static boolean isEmail(String s) {
        return s != null && s.length() <= 120 && EMAIL.matcher(s).matches();
    }

    public static boolean isPhone(String s) {
        return s != null && PHONE.matcher(s).matches();
    }

    public static boolean isRollNumber(String s) {
        return s != null && ROLL.matcher(s).matches();
    }

    public static boolean isCourseCode(String s) {
        return s != null && COURSE_CODE.matcher(s).matches();
    }

    public static LocalDate parseDate(String s) {
        if (isBlank(s)) return null;
        try {
            return LocalDate.parse(s.trim());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public static Integer parseInt(String s) {
        if (isBlank(s)) return null;
        try {
            return Integer.valueOf(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Long parseLong(String s) {
        if (isBlank(s)) return null;
        try {
            return Long.valueOf(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Double parseDouble(String s) {
        if (isBlank(s)) return null;
        try {
            double d = Double.parseDouble(s.trim());
            return Double.isNaN(d) || Double.isInfinite(d) ? null : d;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
