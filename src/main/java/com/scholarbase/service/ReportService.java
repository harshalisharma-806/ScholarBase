package com.scholarbase.service;

import com.scholarbase.dao.AnalyticsDAO;
import com.scholarbase.dao.AttendanceDAO;
import com.scholarbase.dao.CourseDAO;
import com.scholarbase.dao.ResultDAO;
import com.scholarbase.dao.StudentDAO;
import com.scholarbase.util.ApiException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds every report in one uniform shape: title, columns, rows and a short summary.
 * The same structure drives the on-screen table, browser printing and CSV export.
 */
public class ReportService {

    private final AnalyticsDAO analytics = new AnalyticsDAO();
    private final StudentDAO students = new StudentDAO();
    private final CourseDAO courses = new CourseDAO();
    private final AttendanceDAO attendance = new AttendanceDAO();
    private final ResultDAO results = new ResultDAO();
    private final GradingService grading = GradingService.get();

    public Map<String, Object> build(String type, String department, Long courseId, int limit) {
        return switch (type) {
            case "student" -> studentReport(department);
            case "course" -> courseReport();
            case "attendance" -> attendanceReport(courseId, department);
            case "department" -> departmentReport();
            case "toppers" -> toppersReport(limit);
            case "overall" -> overallReport();
            default -> throw new ApiException(400, "Unknown report type.");
        };
    }

    private Map<String, Object> studentReport(String department) {
        List<Map<String, Object>> rows = analytics.studentReport(department, grading.getPassPercentage());
        int withResults = 0;
        for (Map<String, Object> r : rows) {
            Object pct = r.get("percentage");
            long graded = ((Number) r.get("gradedCourses")).longValue();
            r.put("grade", pct == null ? null : grading.gradeFor(((Number) pct).doubleValue()));
            r.put("result", graded == 0 ? "-" : (((Number) r.get("failedCourses")).longValue() == 0 ? "PASS" : "FAIL"));
            if (graded > 0) withResults++;
        }
        return report("Student Academic Report",
                cols("rollNumber", "Roll No", "studentName", "Student", "department", "Department", "semester", "Sem",
                        "enrolledCourses", "Courses", "gradedCourses", "Graded", "percentage", "Average %", "grade", "Grade",
                        "failedCourses", "Failed", "result", "Result", "attendance", "Attendance %"),
                rows, summary("Students", rows.size(), "With results", withResults));
    }

    private Map<String, Object> courseReport() {
        List<Map<String, Object>> rows = analytics.courseReport();
        for (Map<String, Object> r : rows) {
            long graded = ((Number) r.get("graded")).longValue();
            if (graded == 0) {
                r.put("passRate", null);
            } else {
                long passed = analytics.passedCount(((Number) r.get("courseId")).longValue(), grading.getPassPercentage());
                r.put("passRate", GradingService.round2(passed * 100.0 / graded));
            }
        }
        return report("Course Performance Report",
                cols("courseCode", "Code", "courseName", "Course", "department", "Department", "semester", "Sem",
                        "instructor", "Instructor", "enrolled", "Enrolled", "graded", "Graded", "average", "Average %",
                        "highest", "Highest %", "lowest", "Lowest %", "passRate", "Pass rate %", "attendance", "Attendance %"),
                rows, summary("Courses", rows.size()));
    }

    private Map<String, Object> attendanceReport(Long courseId, String department) {
        List<Map<String, Object>> rows = analytics.attendanceReport(courseId, department);
        double minimum = grading.getAttendanceMinimum();
        int shortage = 0;
        for (Map<String, Object> r : rows) {
            boolean low = ((Number) r.get("percentage")).doubleValue() < minimum;
            r.put("standing", low ? "SHORTAGE" : "OK");
            if (low) shortage++;
        }
        return report("Attendance Report",
                cols("rollNumber", "Roll No", "studentName", "Student", "department", "Department", "total", "Classes",
                        "present", "Present", "absent", "Absent", "leave", "Leave", "percentage", "Attendance %", "standing", "Standing"),
                rows, summary("Students", rows.size(), "Below " + (int) minimum + "%", shortage));
    }

    private Map<String, Object> departmentReport() {
        List<Map<String, Object>> rows = analytics.departmentReport();
        return report("Department-wise Student Statistics",
                cols("department", "Department", "students", "Students", "active", "Active", "courses", "Courses",
                        "averagePercentage", "Average %", "attendance", "Attendance %"),
                rows, summary("Departments", rows.size()));
    }

    private Map<String, Object> toppersReport(int limit) {
        List<Map<String, Object>> rows = results.topStudents(limit);
        int rank = 1;
        for (Map<String, Object> r : rows) {
            r.put("rank", rank++);
            r.put("grade", grading.gradeFor(((Number) r.get("percentage")).doubleValue()));
        }
        return report("Top-performing Students",
                cols("rank", "Rank", "rollNumber", "Roll No", "studentName", "Student", "department", "Department",
                        "semester", "Sem", "courses", "Courses", "percentage", "Average %", "grade", "Grade"),
                rows, summary("Students listed", rows.size()));
    }

    private Map<String, Object> overallReport() {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(metric("Total students", students.count()));
        rows.add(metric("Active students", students.countActive()));
        rows.add(metric("Total courses", courses.count()));
        Double perf = results.averagePercentage();
        rows.add(metric("Average academic performance (%)", perf == null ? null : GradingService.round2(perf)));
        Double pass = results.passRate(grading.getPassPercentage());
        rows.add(metric("Course pass rate (%)", pass == null ? null : GradingService.round2(pass)));
        rows.add(metric("Students with a failed course", results.countFailing(grading.getPassPercentage())));
        Double att = attendance.overallPercentage();
        rows.add(metric("Average attendance (%)", att == null ? null : GradingService.round2(att)));
        rows.add(metric("Students below " + (int) grading.getAttendanceMinimum() + "% attendance",
                attendance.countStudentsBelow(grading.getAttendanceMinimum())));
        return report("Overall Academic Performance", cols("metric", "Metric", "value", "Value"), rows, List.of());
    }

    // ---- helpers -------------------------------------------------------------------------------------------

    private static Map<String, Object> metric(String name, Object value) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("metric", name);
        m.put("value", value);
        return m;
    }

    /** cols("key","Label","key2","Label2", ...) */
    private static List<Map<String, Object>> cols(String... keyLabelPairs) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i + 1 < keyLabelPairs.length; i += 2) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("key", keyLabelPairs[i]);
            c.put("label", keyLabelPairs[i + 1]);
            out.add(c);
        }
        return out;
    }

    /** summary("Label", value, "Label2", value2, ...) */
    private static List<Map<String, Object>> summary(Object... labelValuePairs) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i + 1 < labelValuePairs.length; i += 2) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("label", labelValuePairs[i]);
            s.put("value", labelValuePairs[i + 1]);
            out.add(s);
        }
        return out;
    }

    private static Map<String, Object> report(String title, List<Map<String, Object>> columns,
                                              List<Map<String, Object>> rows, List<Map<String, Object>> summary) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", title);
        m.put("columns", columns);
        m.put("rows", rows);
        m.put("summary", summary);
        m.put("generatedAt", LocalDateTime.now().withNano(0));
        return m;
    }
}
