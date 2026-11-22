package com.scholarbase.util;

import java.util.Collections;
import java.util.Map;

/** A failure that maps directly to an HTTP status and a JSON error body. */
public class ApiException extends RuntimeException {

    private final int status;
    private final Map<String, String> errors;

    public ApiException(int status, String message) {
        this(status, message, Collections.emptyMap());
    }

    public ApiException(int status, String message, Map<String, String> errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    public static ApiException validation(Map<String, String> errors) {
        return new ApiException(400, "Please correct the highlighted fields.", errors);
    }

    public static ApiException notFound(String what) {
        return new ApiException(404, what + " not found.");
    }

    public int getStatus() {
        return status;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
