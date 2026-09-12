"""
Decode tables for the STATS19 number codes.

Source: dft-road-casualty-statistics-road-safety-open-dataset-data-guide-2025.xlsx
sheet "2024_code_list". Every value here was read from that file.

-1 = "Data missing or out of range"
99 = "unknown (self reported)"  -- the collision was reported by the public,
     not attended by police, so the detail was never recorded properly.
"""

DAY_OF_WEEK = {
    1: "Sunday", 2: "Monday", 3: "Tuesday", 4: "Wednesday",
    5: "Thursday", 6: "Friday", 7: "Saturday",
}

WEATHER_CONDITIONS = {
    1: "Fine no high winds",
    2: "Raining no high winds",
    3: "Snowing no high winds",
    4: "Fine + high winds",
    5: "Raining + high winds",
    6: "Snowing + high winds",
    7: "Fog or mist",
    8: "Other",
    9: "Unknown",
    -1: "Data missing",
}

ROAD_SURFACE_CONDITIONS = {
    1: "Dry",
    2: "Wet or damp",
    3: "Snow",
    4: "Frost or ice",
    5: "Flood over 3cm deep",
    6: "Oil or diesel",
    7: "Mud",
    9: "Unknown (self reported)",
    -1: "Data missing",
}

LIGHT_CONDITIONS = {
    1: "Daylight",
    4: "Darkness - lights lit",
    5: "Darkness - lights unlit",
    6: "Darkness - no lighting",
    7: "Darkness - lighting unknown",
    -1: "Data missing",
}

ROAD_TYPE = {
    1: "Roundabout",
    2: "One way street",
    3: "Dual carriageway",
    6: "Single carriageway",
    7: "Slip road",
    9: "Unknown",
    12: "One way street/Slip road",
    -1: "Data missing",
}

JUNCTION_DETAIL = {
    0: "Not at junction or within 20 metres",
    13: "T or staggered junction",
    16: "Crossroads",
    17: "Junction with more than four arms (not roundabout)",
    18: "Using private drive or entrance",
    19: "Other junction",
    99: "Unknown (self reported)",
    -1: "Data missing",
}

JUNCTION_CONTROL = {
    0: "Not at junction or within 20 metres",
    1: "Authorised person",
    2: "Auto traffic signal",
    3: "Stop sign",
    4: "Give way or uncontrolled",
    9: "Unknown (self reported)",
    -1: "Data missing",
}

URBAN_OR_RURAL_AREA = {
    1: "Urban",
    2: "Rural",
    3: "Unallocated",
    -1: "Data missing",
}

FIRST_ROAD_CLASS = {
    1: "Motorway", 2: "A(M)", 3: "A", 4: "B", 5: "C", 6: "Unclassified",
    -1: "Data missing",
}

TRUNK_ROAD_FLAG = {
    1: "Trunk (managed by Highways England)",
    2: "Non-trunk",
    -1: "Data missing",
}
