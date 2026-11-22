package com.scholarbase.model;

import java.time.LocalDateTime;
import java.util.Map;

public class Admin extends BaseEntity {

    private String username;
    private String email;
    private String fullName;
    private String passwordHash;
    private LocalDateTime lastLogin;

    public Admin() {
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    /** The password hash is deliberately never serialised. */
    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = super.toMap();
        m.put("username", username);
        m.put("email", email);
        m.put("fullName", fullName);
        m.put("lastLogin", lastLogin);
        return m;
    }
}
