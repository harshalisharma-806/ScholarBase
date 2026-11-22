package com.scholarbase.model;

import java.time.LocalDate;
import java.util.Map;

public class Attendance extends BaseEntity {

    public static final String PRESENT = "PRESENT";
    public static final String ABSENT = "ABSENT";
    public static final String LEAVE = "LEAVE";

    private long studentId;
    private long courseId;
    private LocalDate date;
    /** May be null on a roster row where attendance has not been marked yet. */
    private String status;

    // Joined display fields (not columns of the attendance table)
    private String studentName;
    private String rollNumber;
    private String courseCode;
    private String courseName;

    public Attendance() {
    }

    public static boolean isValidStatus(String s) {
        return PRESENT.equals(s) || ABSENT.equals(s) || LEAVE.equals(s);
    }

    public long getStudentId() { return studentId; }
    public void setStudentId(long studentId) { this.studentId = studentId; }
    public long getCourseId() { return courseId; }
    public void setCourseId(long courseId) { this.courseId = courseId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = super.toMap();
        m.put("studentId", studentId);
        m.put("studentName", studentName);
        m.put("rollNumber", rollNumber);
        m.put("courseId", courseId);
        m.put("courseCode", courseCode);
        m.put("courseName", courseName);
        m.put("date", date);
        m.put("status", status);
        return m;
    }
}
