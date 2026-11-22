package com.scholarbase.service;

import com.scholarbase.dao.AnalyticsDAO;
import com.scholarbase.dao.AttendanceDAO;
import com.scholarbase.dao.CourseDAO;
import com.scholarbase.dao.ResultDAO;
import com.scholarbase.dao.StudentDAO;
import com.scholarbase.model.Student;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Builds the dashboard payload, notification list and global-search results. Every number comes from MySQL. */
public class DashboardService {

    private final StudentDAO students = new StudentDAO();
    private final CourseDAO courses = new CourseDAO();
    private final AttendanceDAO attendance = new AttendanceDAO();
    private final ResultDAO results = new ResultDAO();
    private final AnalyticsDAO analytics = new AnalyticsDAO();
    private final GradingService grading = GradingService.get();

    public Map<String, Object> dashboard() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalStudents", students.count());
        stats.put("activeStudents", students.countActive());
        stats.put("newThisWeek", students.countRegisteredSince(7));
        stats.put("totalCourses", courses.count());
        Double att = attendance.overallPercentage();
        stats.put("averageAttendance", att == null ? null : GradingService.round2(att));
        Double perf = results.averagePercentage();
        stats.put("averagePerformance", perf == null ? null : GradingService.round2(perf));
        stats.put("attendanceMinimum", grading.getAttendanceMinimum());

        Map<String, Long> counts = attendance.statusCounts();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stats", stats);
        out.put("enrollmentByDepartment", students.countByDepartment());
        out.put("enrollmentBySemester", students.countBySemester());
        out.put("attendanceStatus", counts);
        out.put("attendanceTrend", attendance.dailyTrend(10));
        out.put("performanceByCourse", results.averageByCourse());
        out.put("gradeDistribution", gradeDistribution());
        out.put("recentRegistrations", students.recentRegistrations(6));
        out.put("recentlyUpdated", analytics.recentlyUpdated(6));
        out.put("topStudents", results.topStudents(5));
        out.put("recentActivity", analytics.recentActivity(8));
        return out;
    }

    /** Counts every course result into the configured grade bands. */
    private List<Map<String, Object>> gradeDistribution() {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String g : grading.gradeLabels()) counts.put(g, 0);
        for (double pct : results.allPercentages()) counts.merge(grading.gradeFor(pct), 1, Integer::sum);
        List<Map<String, Object>> out = new ArrayList<>();
        counts.forEach((g, n) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("label", g);
            m.put("value", n);
            out.add(m);
        });
        return out;
    }

    public Map<String, Object> notifications() {
        List<Map<String, Object>> items = new ArrayList<>();
        double minimum = grading.getAttendanceMinimum();

        long low = attendance.countStudentsBelow(minimum);
        if (low > 0) {
            items.add(note("warning", "Low attendance",
                    low + (low == 1 ? " student is" : " students are") + " below the " + (int) minimum + "% attendance requirement.",
                    "attendance.html?tab=summary&below=1"));
        }
        long failing = results.countFailing(grading.getPassPercentage());
        if (failing > 0) {
            items.add(note("danger", "Failing results",
                    failing + (failing == 1 ? " student has" : " students have") + " at least one failed course.",
                    "results.html"));
        }
        long fresh = students.countRegisteredSince(7);
        if (fresh > 0) {
            items.add(note("info", "New registrations",
                    fresh + (fresh == 1 ? " student" : " students") + " registered in the last 7 days.", "students.html"));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items);
        out.put("count", items.size());
        return out;
    }

    private static Map<String, Object> note(String level, String title, String text, String link) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("level", level);
        m.put("title", title);
        m.put("text", text);
        m.put("link", link);
        return m;
    }

    public Map<String, Object> search(String q) {
        Map<String, Object> out = new LinkedHashMap<>();
        List<Student> found = q.length() < 2 ? List.of() : students.quickSearch(q, 5);
        out.put("students", found);
        out.put("courses", q.length() < 2 ? List.of() : courses.quickSearch(q, 5));
        return out;
    }
}
