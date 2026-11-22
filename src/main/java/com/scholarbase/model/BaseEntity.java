package com.scholarbase.model;

import com.scholarbase.util.JsonSerializable;
import java.util.LinkedHashMap;
import java.util.Map;

/** Common parent of all persisted models: every entity has a numeric primary key. */
public abstract class BaseEntity implements JsonSerializable, java.io.Serializable {

    private static final long serialVersionUID = 1L;

    private long id;

    protected BaseEntity() {
    }

    protected BaseEntity(long id) {
        this.id = id;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    /** Subclasses add their own fields to the map that starts with the id. */
    @Override
    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        return m;
    }
}
