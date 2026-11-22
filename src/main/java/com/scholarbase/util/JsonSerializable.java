package com.scholarbase.util;

import java.util.Map;

/** Implemented by model classes so they can be written as JSON without reflection. */
public interface JsonSerializable {
    Map<String, Object> toMap();
}
