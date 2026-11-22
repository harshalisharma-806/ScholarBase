package com.scholarbase.model;

import java.time.LocalDateTime;
import java.util.Map;

public class Course extends BaseEntity {

    private String courseCode;
    private String courseName;
    private String department;
    private int semester;
    private int credits;
    private String instructorName;
    private String description;
    private LocalDateTime createdAt;
    /** Filled by list queries; not a database column. */
    private int enrolledCount;

    public Course() {
    }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }
    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }
    public String getInstructorName() { return instructorName; }
    public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public int getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(int enrolledCount) { this.enrolledCount = enrolledCount; }

    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = super.toMap();
        m.put("courseCode", courseCode);
        m.put("courseName", courseName);
        m.put("department", department);
        m.put("semester", semester);
        m.put("credits", credits);
        m.put("instructorName", instructorName);
        m.put("description", description);
        m.put("enrolledCount", enrolledCount);
        m.put("createdAt", createdAt);
        return m;
    }
}
