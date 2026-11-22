package com.scholarbase.dao;

import com.scholarbase.model.Admin;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AdminDAO extends BaseDAO {

    private static Admin map(ResultSet rs) throws SQLException {
        Admin a = new Admin();
        a.setId(rs.getLong("id"));
        a.setUsername(rs.getString("username"));
        a.setEmail(rs.getString("email"));
        a.setFullName(rs.getString("full_name"));
        a.setPasswordHash(rs.getString("password_hash"));
        a.setLastLogin(dateTime(rs, "last_login"));
        return a;
    }

    /** Accepts either the username or the email address, case-insensitively. */
    public Admin findByLogin(String login) {
        return one("SELECT * FROM admins WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
                AdminDAO::map, login, login);
    }

    public Admin findById(long id) {
        return one("SELECT * FROM admins WHERE id = ?", AdminDAO::map, id);
    }

    public void touchLastLogin(long id) {
        update("UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?", id);
    }

    public boolean emailTaken(String email, long excludeId) {
        return longOf("SELECT COUNT(*) FROM admins WHERE LOWER(email) = LOWER(?) AND id <> ?", email, excludeId) > 0;
    }

    public void updateProfile(long id, String fullName, String email) {
        update("UPDATE admins SET full_name = ?, email = ? WHERE id = ?", fullName, email, id);
    }

    public void updatePassword(long id, String passwordHash) {
        update("UPDATE admins SET password_hash = ? WHERE id = ?", passwordHash, id);
    }
}
