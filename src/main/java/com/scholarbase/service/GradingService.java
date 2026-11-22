package com.scholarbase.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

/**
 * Single source of truth for pass mark, grade scale and attendance minimum.
 * All values are read from grading.properties - nothing is hardcoded elsewhere.
 */
public final class GradingService {

    public record GradeBand(String grade, double minimum, int points) {
    }

    public record Evaluation(double percentage, String grade, int gradePoints, boolean passed) {
    }

    private static final GradingService INSTANCE = new GradingService();

    private final double passPercentage;
    private final double defaultMaxMarks;
    private final double attendanceMinimum;
    private final List<GradeBand> scale = new ArrayList<>();

    private GradingService() {
        Properties p = new Properties();
        try (InputStream in = GradingService.class.getClassLoader().getResourceAsStream("grading.properties")) {
            if (in != null) p.load(in);
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
        passPercentage = Double.parseDouble(p.getProperty("pass.percentage", "40"));
        defaultMaxMarks = Double.parseDouble(p.getProperty("default.max.marks", "100"));
        attendanceMinimum = Double.parseDouble(p.getProperty("attendance.minimum", "75"));
        for (String band : p.getProperty("grade.scale", "A:70:8,B:50:6,C:40:5,F:0:0").split(",")) {
            String[] parts = band.trim().split(":");
            if (parts.length == 3) {
                scale.add(new GradeBand(parts[0].trim(), Double.parseDouble(parts[1]), Integer.parseInt(parts[2].trim())));
            }
        }
        scale.sort(Comparator.comparingDouble(GradeBand::minimum).reversed());
    }

    public static GradingService get() {
        return INSTANCE;
    }

    public double getPassPercentage() { return passPercentage; }
    public double getDefaultMaxMarks() { return defaultMaxMarks; }
    public double getAttendanceMinimum() { return attendanceMinimum; }
    public List<GradeBand> getScale() { return scale; }

    public Evaluation evaluate(double marks, double maxMarks) {
        double pct = round2(marks * 100.0 / maxMarks);
        GradeBand band = bandFor(pct);
        return new Evaluation(pct, band.grade(), band.points(), pct >= passPercentage);
    }

    public GradeBand bandFor(double percentage) {
        for (GradeBand b : scale) {
            if (percentage >= b.minimum()) return b;
        }
        return scale.get(scale.size() - 1);
    }

    public String gradeFor(double percentage) {
        return bandFor(percentage).grade();
    }

    public boolean isPass(double percentage) {
        return percentage >= passPercentage;
    }

    /** Grade labels in scale order (highest first), e.g. for chart axes. */
    public List<String> gradeLabels() {
        List<String> labels = new ArrayList<>();
        for (GradeBand b : scale) labels.add(b.grade());
        return labels;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("passPercentage", passPercentage);
        m.put("defaultMaxMarks", defaultMaxMarks);
        m.put("attendanceMinimum", attendanceMinimum);
        List<Map<String, Object>> bands = new ArrayList<>();
        for (GradeBand b : scale) {
            Map<String, Object> bm = new LinkedHashMap<>();
            bm.put("grade", b.grade());
            bm.put("minimum", b.minimum());
            bm.put("points", b.points());
            bands.add(bm);
        }
        m.put("scale", bands);
        return m;
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
