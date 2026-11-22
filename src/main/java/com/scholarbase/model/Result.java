package com.scholarbase.model;

import java.util.Map;

public class Result extends BaseEntity {

    private long studentId;
    private long courseId;
    /** Null on a roster row where marks have not been entered yet. */
    private Double marksObtained;
    private Double maxMarks;

    // Joined display fields
    private String studentName;
    private String rollNumber;
    private String courseCode;
    private String courseName;
    private int credits;

    // Derived by GradingService - never stored in the database
    private Double percentage;
    private String grade;
    private Integer gradePoints;
    private String status;

    public Result() {
    }

    public long getStudentId() { return studentId; }
    public void setStudentId(long studentId) { this.studentId = studentId; }
    public long getCourseId() { return courseId; }
    public void setCourseId(long courseId) { this.courseId = courseId; }
    public Double getMarksObtained() { return marksObtained; }
    public void setMarksObtained(Double marksObtained) { this.marksObtained = marksObtained; }
    public Double getMaxMarks() { return maxMarks; }
    public void setMaxMarks(Double maxMarks) { this.maxMarks = maxMarks; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }
    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Integer getGradePoints() { return gradePoints; }
    public void setGradePoints(Integer gradePoints) { this.gradePoints = gradePoints; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = super.toMap();
        m.put("studentId", studentId);
        m.put("studentName", studentName);
        m.put("rollNumber", rollNumber);
        m.put("courseId", courseId);
        m.put("courseCode", courseCode);
        m.put("courseName", courseName);
        m.put("credits", credits);
        m.put("marksObtained", marksObtained);
        m.put("maxMarks", maxMarks);
        m.put("percentage", percentage);
        m.put("grade", grade);
        m.put("gradePoints", gradePoints);
        m.put("status", status);
        return m;
    }
}
