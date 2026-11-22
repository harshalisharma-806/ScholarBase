package com.scholarbase.util;

import java.sql.SQLException;

/** Unchecked wrapper for JDBC failures so service and controller code stays readable. */
public class DaoException extends RuntimeException {

    public DaoException(String message, Throwable cause) {
        super(message, cause);
    }

    /** True when MySQL rejected the statement because of a UNIQUE key (error 1062). */
    public boolean isDuplicate() {
        return getCause() instanceof SQLException se && se.getErrorCode() == 1062;
    }

    /** True for any integrity-constraint failure (SQLSTATE class 23): duplicate, foreign key, NOT NULL... */
    public boolean isConstraintViolation() {
        return getCause() instanceof SQLException se && se.getSQLState() != null && se.getSQLState().startsWith("23");
    }
}
