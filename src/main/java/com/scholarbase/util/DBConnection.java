package com.scholarbase.util;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Creates JDBC connections to the scholarbase database.
 * Settings come from db.properties on the classpath; the environment variables
 * SCHOLARBASE_DB_URL, SCHOLARBASE_DB_USER and SCHOLARBASE_DB_PASSWORD override them,
 * so credentials never have to be committed to Git.
 */
public final class DBConnection {

    private static final Properties CONFIG = new Properties();

    static {
        try (InputStream in = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) CONFIG.load(in);
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (IOException | ClassNotFoundException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    private DBConnection() {
    }

    private static String setting(String envKey, String propKey, String fallback) {
        String fromEnv = System.getenv(envKey);
        if (fromEnv != null && !fromEnv.isBlank()) return fromEnv;
        return CONFIG.getProperty(propKey, fallback);
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                setting("SCHOLARBASE_DB_URL", "db.url",
                        "jdbc:mysql://localhost:3306/scholarbase?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"),
                setting("SCHOLARBASE_DB_USER", "db.user", "root"),
                setting("SCHOLARBASE_DB_PASSWORD", "db.password", ""));
    }
}
