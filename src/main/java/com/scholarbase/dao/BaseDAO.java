package com.scholarbase.dao;

import com.scholarbase.util.DBConnection;
import com.scholarbase.util.DaoException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared JDBC plumbing. Every statement is a PreparedStatement with bound parameters,
 * so user input is never concatenated into SQL.
 */
public abstract class BaseDAO {

    @FunctionalInterface
    protected interface RowMapper<T> {
        T map(ResultSet rs) throws SQLException;
    }

    @FunctionalInterface
    protected interface TxWork {
        void run(Connection c) throws SQLException;
    }

    protected <T> List<T> list(String sql, List<Object> params, RowMapper<T> mapper) {
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            bind(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                List<T> out = new ArrayList<>();
                while (rs.next()) out.add(mapper.map(rs));
                return out;
            }
        } catch (SQLException e) {
            throw new DaoException("Query failed: " + e.getMessage(), e);
        }
    }

    protected <T> List<T> list(String sql, RowMapper<T> mapper, Object... params) {
        return list(sql, Arrays.asList(params), mapper);
    }

    protected <T> T one(String sql, RowMapper<T> mapper, Object... params) {
        List<T> rows = list(sql, Arrays.asList(params), mapper);
        return rows.isEmpty() ? null : rows.get(0);
    }

    protected long longOf(String sql, List<Object> params) {
        Double d = doubleOf(sql, params);
        return d == null ? 0L : d.longValue();
    }

    protected long longOf(String sql, Object... params) {
        return longOf(sql, Arrays.asList(params));
    }

    /** First column of the first row as a Double, or null when there is no row or the value is NULL. */
    protected Double doubleOf(String sql, List<Object> params) {
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            bind(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                BigDecimal v = rs.getBigDecimal(1);
                return v == null ? null : v.doubleValue();
            }
        } catch (SQLException e) {
            throw new DaoException("Query failed: " + e.getMessage(), e);
        }
    }

    protected Double doubleOf(String sql, Object... params) {
        return doubleOf(sql, Arrays.asList(params));
    }

    protected int update(String sql, Object... params) {
        try (Connection c = DBConnection.getConnection(); PreparedStatement ps = c.prepareStatement(sql)) {
            bind(ps, Arrays.asList(params));
            return ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Update failed: " + e.getMessage(), e);
        }
    }

    protected long insert(String sql, Object... params) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, Arrays.asList(params));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                return keys.next() ? keys.getLong(1) : 0L;
            }
        } catch (SQLException e) {
            throw new DaoException("Insert failed: " + e.getMessage(), e);
        }
    }

    /** Runs several statements atomically; rolls back if any of them fails. */
    protected void transaction(TxWork work) {
        try (Connection c = DBConnection.getConnection()) {
            c.setAutoCommit(false);
            try {
                work.run(c);
                c.commit();
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new DaoException("Transaction failed: " + e.getMessage(), e);
        }
    }

    protected static void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            ps.setObject(i + 1, params.get(i));
        }
    }

    /** Escapes % and _ so user text is matched literally inside LIKE. */
    protected static String like(String text) {
        String escaped = text.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    protected static LocalDate date(ResultSet rs, String col) throws SQLException {
        return rs.getObject(col, LocalDate.class);
    }

    protected static LocalDateTime dateTime(ResultSet rs, String col) throws SQLException {
        Timestamp ts = rs.getTimestamp(col);
        return ts == null ? null : ts.toLocalDateTime();
    }

    protected static Double nullableDouble(ResultSet rs, String col) throws SQLException {
        BigDecimal v = rs.getBigDecimal(col);
        return v == null ? null : v.doubleValue();
    }

    /** Generic row-to-map conversion for analytics queries; column labels become JSON keys. */
    protected static Map<String, Object> row(ResultSet rs) throws SQLException {
        ResultSetMetaData md = rs.getMetaData();
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 1; i <= md.getColumnCount(); i++) {
            Object v = rs.getObject(i);
            if (v instanceof BigDecimal bd) {
                v = bd.scale() <= 0 ? (Object) bd.longValue() : (Object) bd.setScale(2, RoundingMode.HALF_UP).doubleValue();
            } else if (v instanceof Timestamp ts) {
                v = ts.toLocalDateTime();
            } else if (v instanceof java.sql.Date d) {
                v = d.toLocalDate();
            }
            m.put(md.getColumnLabel(i), v);
        }
        return m;
    }
}
