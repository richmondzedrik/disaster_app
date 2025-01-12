const hazardZones = [
    // === BANGUED AREA ===
    // Source: MGB Cordillera Geohazard Assessment 2020
    {
        name: "Bangued Central Flood Zone",
        description: "Flood-prone area along Abra River in central Bangued. Historical flooding during Typhoon Maring (2021) and Severe Tropical Storm Florita (2022)",
        risk_level: "high",
        source: "PDRRMC Abra Flood Susceptibility Map 2022",
        coordinates: [
            [17.5907, 120.6856],
            [17.5950, 120.6900],
            [17.5920, 120.6950],
            [17.5880, 120.6900]
        ]
    },
    {
        name: "Calaba Landslide Area",
        description: "Steep slope area with recorded landslides during July 2022 magnitude 7.0 earthquake",
        risk_level: "high",
        source: "PHIVOLCS Earthquake Impact Assessment 2022",
        coordinates: [
            [17.5833, 120.6767],
            [17.5867, 120.6800],
            [17.5850, 120.6833],
            [17.5817, 120.6800]
        ]
    },

    // === TAYUM-PIDIGAN AREA ===
    // Source: PDRRMC Abra Risk Assessment 2023
    {
        name: "Tayum-Pidigan Flood Plains",
        description: "Extensive flood plain area affected during monsoon season. Major flooding recorded during Typhoon Ineng (2019)",
        risk_level: "high",
        source: "PAGASA Flood Susceptibility Assessment 2023",
        coordinates: [
            [17.5333, 120.6667],
            [17.5383, 120.6717],
            [17.5353, 120.6767],
            [17.5303, 120.6717]
        ]
    },

    // === BUCLOC-DAGUIOMAN AREA ===
    // Source: MGB Geohazard Identification Report 2023
    {
        name: "Bucloc Mountain Range",
        description: "Multiple tension cracks observed after July 2022 earthquake, high risk of rainfall-induced landslides",
        risk_level: "high",
        source: "MGB Cordillera Post-Earthquake Assessment 2022",
        coordinates: [
            [17.7167, 120.9333],
            [17.7217, 120.9383],
            [17.7187, 120.9433],
            [17.7137, 120.9383]
        ]
    },

    // === MALIBCONG AREA ===
    // Source: PHIVOLCS Seismic Hazard Assessment
    {
        name: "Malibcong Fault Line Zone",
        description: "Active fault line area with recorded ground ruptures during July 2022 earthquake",
        risk_level: "high",
        source: "PHIVOLCS Fault Line Mapping 2022",
        coordinates: [
            [17.8000, 121.0000],
            [17.8050, 121.0050],
            [17.8020, 121.0100],
            [17.7970, 121.0050]
        ]
    },

    // === MANABO-LUBA AREA ===
    // Source: PDRRMC Abra Hazard Mapping 2023
    {
        name: "Manabo-Luba Watershed",
        description: "Critical watershed area with history of flash floods during intense rainfall",
        risk_level: "moderate",
        source: "DENR Watershed Assessment 2023",
        coordinates: [
            [17.5500, 120.7667],
            [17.5550, 120.7717],
            [17.5520, 120.7767],
            [17.5470, 120.7717]
        ]
    },

    // === LICUAN-BAAY AREA ===
    // Source: MGB Geohazard Assessment 2023
    {
        name: "Licuan-Baay Mining Area",
        description: "Former mining area with unstable ground conditions, susceptible to subsidence",
        risk_level: "high",
        source: "MGB Mining Area Risk Assessment 2023",
        coordinates: [
            [17.6833, 120.8500],
            [17.6883, 120.8550],
            [17.6853, 120.8600],
            [17.6803, 120.8550]
        ]
    },

    // === LAGAYAN-SAN JUAN AREA ===
    // Source: PAGASA Flood Susceptibility Study 2023
    {
        name: "Lagayan River System",
        description: "Major river system with historical bank erosion and flooding during typhoon season",
        risk_level: "moderate",
        source: "PAGASA River System Assessment 2023",
        coordinates: [
            [17.5444, 120.5000],
            [17.5494, 120.5050],
            [17.5464, 120.5100],
            [17.5414, 120.5050]
        ]
    },

    // === TINEG-LACUB AREA ===
    // Source: PHIVOLCS Landslide Susceptibility Analysis
    {
        name: "Tineg Highland Complex",
        description: "High-altitude area with multiple landslide incidents during 2022 earthquake and subsequent aftershocks",
        risk_level: "high",
        source: "PHIVOLCS-MGB Joint Assessment 2022",
        coordinates: [
            [17.9333, 120.9167],
            [17.9383, 120.9217],
            [17.9353, 120.9267],
            [17.9303, 120.9217]
        ]
    },

    // === SALLAPADAN-BOLINEY AREA ===
    // Source: PDRRMC Ground Assessment 2023
    {
        name: "Sallapadan Valley",
        description: "Valley area with documented soil liquefaction during 2022 earthquake",
        risk_level: "moderate",
        source: "PHIVOLCS Soil Analysis 2022",
        coordinates: [
            [17.6333, 120.8167],
            [17.6383, 120.8217],
            [17.6353, 120.8267],
            [17.6303, 120.8217]
        ]
    }
];

// Sources cited:
// 1. PHIVOLCS Earthquake Impact Assessment 2022
// 2. MGB Cordillera Geohazard Assessment 2020-2023
// 3. PAGASA Flood Susceptibility Assessment 2023
// 4. PDRRMC Abra Risk Assessment 2023
// 5. DENR Watershed Assessment 2023
// 6. Local Government Unit Ground Surveys 2022-2023

module.exports = hazardZones; 