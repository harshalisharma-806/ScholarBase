package com.scholarbase.service;

import com.scholarbase.dao.CourseDAO;
import com.scholarbase.dao.ResultDAO;
import com.scholarbase.dao.StudentDAO;
import com.scholarbase.model.Course;
import com.scholarbase.model.Result;
import com.scholarbase.model.Student;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.PageResult;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ResultService {

    private static final double MAX_ALLOWED_MARKS = 1000;

    private final ResultDAO results = new ResultDAO();
    private final StudentDAO students = new StudentDAO();
    private final CourseDAO courses = new CourseDAO();
    private final GradingService grading = GradingService.get();

    /** Fills in percentage, grade, grade points and PASS/FAIL using the configured rules. */
    public Result enrich(Result r) {
        if (r.getMarksObtained() != null && r.getMaxMarks() != null && r.getMaxMarks() > 0) {
            GradingService.Evaluation e = grading.evaluate(r.getMarksObtained(), r.getMaxMarks());
            r.setPercentage(e.percentage());
            r.setGrade(e.grade());
            r.setGradePoints(e.gradePoints());
            r.setStatus(e.passed() ? "PASS" : "FAIL");
        }
        return r;
    }

    public PageResult<Result> list(Long courseId, Long studentId, String q, int page, int size) {
        PageResult<Result> p = results.search(courseId, studentId, q, page, size);
        p.getItems().forEach(this::enrich);
        return p;
    }

    public Map<String, Object> roster(long courseId) {
        Course course = requireCourse(courseId);
        List<Result> rows = results.roster(courseId);
        rows.forEach(this::enrich);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("course", course);
        out.put("defaultMaxMarks", grading.getDefaultMaxMarks());
        out.put("students", rows);
        return out;
    }

    /** Saves marks for one student in one course (insert or update). */
    public Result save(long studentId, long courseId, Double marks, Double maxMarks) {
        Map<String, String> errors = new LinkedHashMap<>();
        validateMarks(marks, maxMarks, errors, "marksObtained", "maxMarks");
        if (!errors.isEmpty()) throw ApiException.validation(errors);
        requireCourse(courseId);
        if (students.findById(studentId) == null) throw ApiException.notFound("Student");
        if (!courses.isEnrolled(studentId, courseId)) {
            throw new ApiException(400, "This student is not allocated to the selected course.");
        }
        Result r = new Result();
        r.setStudentId(studentId);
        r.setCourseId(courseId);
        r.setMarksObtained(marks);
        r.setMaxMarks(maxMarks);
        results.upsert(r);
        return r;
    }

    /** Saves a whole marks sheet; entries without marks are skipped. Every entry is validated before anything is written. */
    public int saveAll(long courseId, List<Result> entries) {
        requireCourse(courseId);
        List<Result> toSave = new ArrayList<>();
        Map<String, String> errors = new LinkedHashMap<>();
        for (Result r : entries) {
            if (r.getMarksObtained() == null) continue;
            Map<String, String> rowErrors = new LinkedHashMap<>();
            validateMarks(r.getMarksObtained(), r.getMaxMarks(), rowErrors, "marks", "max");
            if (!rowErrors.isEmpty()) {
                errors.put("row-" + r.getStudentId(), rowErrors.values().iterator().next());
            } else if (!courses.isEnrolled(r.getStudentId(), courseId)) {
                errors.put("row-" + r.getStudentId(), "Student is not allocated to this course.");
            } else {
                r.setCourseId(courseId);
                toSave.add(r);
            }
        }
        if (!errors.isEmpty()) throw ApiException.validation(errors);
        if (toSave.isEmpty()) throw new ApiException(400, "Enter marks for at least one student.");
        results.upsertAll(toSave);
        return toSave.size();
    }

    public void delete(long id) {
        if (results.delete(id) == 0) throw ApiException.notFound("Result");
    }

    /** Student-wise result sheet: every course plus totals, overall percentage, grade, GPA and pass/fail. */
    public Map<String, Object> studentSheet(long studentId) {
        Student student = students.findById(studentId);
        if (student == null) throw ApiException.notFound("Student");
        List<Result> rows = results.findByStudent(studentId);
        rows.forEach(this::enrich);

        double totalObtained = 0, totalMax = 0, weightedPoints = 0;
        int credits = 0, failed = 0;
        for (Result r : rows) {
            totalObtained += r.getMarksObtained();
            totalMax += r.getMaxMarks();
            weightedPoints += r.getGradePoints() * r.getCredits();
            credits += r.getCredits();
            if ("FAIL".equals(r.getStatus())) failed++;
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("courses", rows.size());
        summary.put("totalObtained", GradingService.round2(totalObtained));
        summary.put("totalMax", GradingService.round2(totalMax));
        if (rows.isEmpty() || totalMax == 0) {
            summary.put("percentage", null);
            summary.put("grade", null);
            summary.put("gpa", null);
            summary.put("status", "N/A");
        } else {
            double pct = GradingService.round2(totalObtained * 100 / totalMax);
            summary.put("percentage", pct);
            summary.put("grade", grading.gradeFor(pct));
            summary.put("gpa", credits == 0 ? null : GradingService.round2(weightedPoints / credits));
            summary.put("status", failed == 0 ? "PASS" : "FAIL");
        }
        summary.put("failedCourses", failed);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("student", student);
        out.put("results", rows);
        out.put("summary", summary);
        return out;
    }

    /** Course-wise result sheet with class statistics and a grade distribution. */
    public Map<String, Object> courseSheet(long courseId) {
        Course course = requireCourse(courseId);
        List<Result> rows = results.findByCourse(courseId);
        rows.forEach(this::enrich);

        double sum = 0, highest = 0, lowest = 100;
        int passed = 0;
        Map<String, Integer> distribution = new LinkedHashMap<>();
        for (String g : grading.gradeLabels()) distribution.put(g, 0);
        for (Result r : rows) {
            sum += r.getPercentage();
            highest = Math.max(highest, r.getPercentage());
            lowest = Math.min(lowest, r.getPercentage());
            if ("PASS".equals(r.getStatus())) passed++;
            distribution.merge(r.getGrade(), 1, Integer::sum);
        }
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("enrolled", course.getEnrolledCount());
        stats.put("graded", rows.size());
        stats.put("pending", Math.max(0, course.getEnrolledCount() - rows.size()));
        stats.put("average", rows.isEmpty() ? null : GradingService.round2(sum / rows.size()));
        stats.put("highest", rows.isEmpty() ? null : GradingService.round2(highest));
        stats.put("lowest", rows.isEmpty() ? null : GradingService.round2(lowest));
        stats.put("passed", passed);
        stats.put("failed", rows.size() - passed);
        stats.put("passRate", rows.isEmpty() ? null : GradingService.round2(passed * 100.0 / rows.size()));
        List<Map<String, Object>> dist = new ArrayList<>();
        distribution.forEach((g, n) -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("label", g);
            d.put("value", n);
            dist.add(d);
        });
        stats.put("gradeDistribution", dist);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("course", course);
        out.put("results", rows);
        out.put("stats", stats);
        return out;
    }

    private Course requireCourse(long courseId) {
        Course c = courses.findById(courseId);
        if (c == null) throw ApiException.notFound("Course");
        return c;
    }

    private void validateMarks(Double marks, Double max, Map<String, String> errors, String marksKey, String maxKey) {
        if (max == null || max <= 0 || max > MAX_ALLOWED_MARKS) {
            errors.put(maxKey, "Maximum marks must be between 1 and " + (int) MAX_ALLOWED_MARKS + ".");
        }
        if (marks == null) {
            errors.put(marksKey, "Enter the marks obtained.");
        } else if (marks < 0) {
            errors.put(marksKey, "Marks cannot be negative.");
        } else if (max != null && max > 0 && marks > max) {
            errors.put(marksKey, "Marks cannot exceed the maximum of " + trim(max) + ".");
        }
    }

    private static String trim(double v) {
        return v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
    }
}
