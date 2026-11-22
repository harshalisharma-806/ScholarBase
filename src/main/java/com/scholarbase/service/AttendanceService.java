package com.scholarbase.service;

import com.scholarbase.dao.AttendanceDAO;
import com.scholarbase.dao.CourseDAO;
import com.scholarbase.model.Attendance;
import com.scholarbase.model.Course;
import com.scholarbase.util.ApiException;
import com.scholarbase.util.PageResult;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AttendanceService {

    private final AttendanceDAO attendance = new AttendanceDAO();
    private final CourseDAO courses = new CourseDAO();
    private final GradingService grading = GradingService.get();

    public PageResult<Attendance> records(Long courseId, LocalDate date, String q, String status, int page, int size) {
        return attendance.search(courseId, date, q, status, page, size);
    }

    /** The marking sheet: all active students enrolled in the course with their current status for the date. */
    public Map<String, Object> roster(long courseId, LocalDate date) {
        Course course = courses.findById(courseId);
        if (course == null) throw ApiException.notFound("Course");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("course", course);
        out.put("date", date);
        out.put("students", attendance.roster(courseId, date));
        return out;
    }

    /** Marks (or re-marks) attendance for a whole class on one date. */
    public int mark(long courseId, LocalDate date, List<Attendance> entries) {
        if (courses.findById(courseId) == null) throw ApiException.notFound("Course");
        if (date == null) throw new ApiException(400, "Select a valid date.");
        if (date.isAfter(LocalDate.now())) throw new ApiException(400, "Attendance cannot be marked for a future date.");
        if (entries.isEmpty()) throw new ApiException(400, "There are no students to mark.");
        for (Attendance e : entries) {
            if (!Attendance.isValidStatus(e.getStatus())) throw new ApiException(400, "Invalid attendance status.");
            if (!courses.isEnrolled(e.getStudentId(), courseId)) {
                throw new ApiException(400, "A selected student is not allocated to this course.");
            }
        }
        attendance.upsertAll(courseId, date, entries);
        return entries.size();
    }

    public void updateStatus(long id, String status) {
        if (!Attendance.isValidStatus(status)) throw new ApiException(400, "Invalid attendance status.");
        // MySQL reports 0 changed rows when the value is unchanged, so check existence explicitly
        if (!attendance.exists(id)) throw ApiException.notFound("Attendance record");
        attendance.updateStatus(id, status);
    }

    public void delete(long id) {
        if (attendance.delete(id) == 0) throw ApiException.notFound("Attendance record");
    }

    /** Student-wise (and course-wise) attendance percentages plus overall totals. */
    public Map<String, Object> summary(Long courseId, Long studentId, String q) {
        List<Map<String, Object>> rows = attendance.summary(courseId, studentId, q);
        long total = 0, present = 0, absent = 0, leave = 0;
        double minimum = grading.getAttendanceMinimum();
        for (Map<String, Object> r : rows) {
            total += ((Number) r.get("total")).longValue();
            present += ((Number) r.get("present")).longValue();
            absent += ((Number) r.get("absent")).longValue();
            leave += ((Number) r.get("leave")).longValue();
            double pct = ((Number) r.get("percentage")).doubleValue();
            r.put("belowMinimum", pct < minimum);
        }
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("total", total);
        totals.put("present", present);
        totals.put("absent", absent);
        totals.put("leave", leave);
        totals.put("percentage", total == 0 ? null : GradingService.round2(present * 100.0 / total));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rows", rows);
        out.put("totals", totals);
        out.put("minimum", minimum);
        return out;
    }
}
