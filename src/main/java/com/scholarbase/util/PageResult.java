package com.scholarbase.util;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** One page of results plus the total row count for pagination controls. */
public class PageResult<T> implements JsonSerializable {

    private final List<T> items;
    private final long total;
    private final int page;
    private final int size;

    public PageResult(List<T> items, long total, int page, int size) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    public List<T> getItems() {
        return items;
    }

    public long getTotal() {
        return total;
    }

    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("items", items);
        m.put("total", total);
        m.put("page", page);
        m.put("size", size);
        m.put("totalPages", Math.max(1, (int) Math.ceil(total / (double) size)));
        return m;
    }
}
