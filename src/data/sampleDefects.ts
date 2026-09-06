import { InspectionEntry } from '../types/inspection';

export const SAMPLE_AEROSPACE_DEFECTS: Omit<InspectionEntry, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'CFRP Main Wing Spar Inter-laminar Delamination at Rib-14 Attachment',
    program: 'Airbus A350',
    facility: 'Toulouse Final Assembly Line (Clément Ader)',
    coordinates: '43.6291° N, 1.3638° E',
    blueprintLocation: { x: 38, y: 44, zone: 'Port Wing Center Spar - Rib 14' },
    partNumber: 'A350-57-2201-901',
    serialNumber: 'MSN-0418-SP',
    severity: 'critical',
    discrepancyText: 'During ultrasonic phased-array NDT post-fastener torque inspection at Wing Spar Rib-14, acoustic attenuation scan revealed a 18mm x 7mm inter-laminar delamination zone located between carbon-fiber plies 24 and 28. Discrepancy exceeds the allowable damage limit (ADL max 5mm) per SRM 57-10-02. Suspected localized clamping over-pressure during automated robotic drilling jig deployment.',
    ncrStatus: 'engineering_review',
    verificationStatus: 'pending',
    confidenceScore: 52, // INTEGER 0-100, < 60 (qualifies for Supervisor Review Queue)
    confidenceEvaluation: 'LOW',
    fmeaScore: 92,
    tags: ['CFRP', 'Wing Spar', 'Ultrasonic NDT', 'Structural Safety', 'Airbus A350'],
    analysis: {
      executiveSummary: 'Critical inter-laminar CFRP delamination identified on the A350 main wing spar exceeding allowable SRM damage thresholds by 13mm.',
      rootCauseHypothesis: 'Robotic automated fastener drill jig clamping cylinder pressure transducer drift causing localized compression shear during titanium bushing insertion.',
      fmeaScore: 92,
      severityAssessment: 'CRITICAL - Direct primary flight load path. Flight grounding risk if untreated.',
      containmentSteps: [
        'Halt automated drilling on Line 3 Wing Box Assembly.',
        'Quarantine affected Wing Spar Section MSN-0418.',
        'Perform 100% Phased-Array scan across all 24 fastener locations on adjacent Rib-13 and Rib-15.'
      ],
      dispositionRecommendation: 'Submit Concession Request to Airbus Design Office (Toulouse). Perform stepped-scarf composite bonded repair with high-modulus carbon pre-preg autoclave patch per SRM 51-70-00.',
      suggestedReflections: [
        'Did the robotic drilling load cell log a pressure spike above 4.5 kN during cycle #142?',
        'Verify moisture exposure telemetry of the spar prior to autoclave cure cycle.'
      ]
    }
  },
  {
    title: 'Stage 1 High Pressure Turbine Blade TBC Ceramic Spallation',
    program: 'Rolls-Royce Trent XWB',
    facility: 'Derby Test Bed 80 (Sinfin A)',
    coordinates: '52.8833° N, 1.4833° W',
    blueprintLocation: { x: 62, y: 32, zone: 'HP Turbine Stage 1 - Blade #19' },
    partNumber: 'FW39281-R04',
    serialNumber: 'XWB-97-TB80-8842',
    severity: 'major',
    discrepancyText: 'Borescope inspection of Trent XWB-97 engine after 150-hour endurance test cycling revealed 4.2mm² Thermal Barrier Coating (TBC) yttria-stabilized zirconia spallation on the suction side leading edge of Blade #19. Underlying single-crystal nickel superalloy substrate exhibits initial localized thermal oxidation coloration. Cooling film hole #4 shows 25% particulate slag constriction.',
    ncrStatus: 'open',
    verificationStatus: 'pending',
    confidenceScore: 48, // INTEGER 0-100, < 60 (qualifies for Supervisor Review Queue)
    confidenceEvaluation: 'LOW',
    fmeaScore: 78,
    tags: ['Turbine Blade', 'TBC Spallation', 'Propulsion', 'Derby Test Cell', 'Rolls-Royce'],
    analysis: {
      executiveSummary: 'High-temperature thermal barrier coating degradation on Trent XWB HP Turbine blade with cooling film aperture constriction.',
      rootCauseHypothesis: 'Thermal cyclic shock combined with calcium-magnesium-alumino-silicate (CMAS) environmental deposit interaction causing coating spallation.',
      fmeaScore: 78,
      severityAssessment: 'MAJOR - Component subject to 1600°C combustor exit gas stream. Substrate thermal fatigue propagation risk.',
      containmentSteps: [
        'Isolate Stage 1 Turbine Rotor set for metallographic CT evaluation.',
        'Check fuel nozzle spray patterns on combustor sectors 3 and 4 for hot-spot streak anomalies.',
        'Inspect cooling airflow differential pressure logs across all 68 rotor blades.'
      ],
      dispositionRecommendation: 'Remove and replace Blade #19 with fresh EB-PVD coated single-crystal spare. Send spalled blade to Materials Failure Lab for SEM/EDS micro-structural analysis.',
      suggestedReflections: [
        'What was the combustor exit temperature profile variance during maximum thrust transient testing?',
        'Are adjacent blade cooling holes showing similar micro-particulate buildup?'
      ]
    }
  },
  {
    title: 'Fly-by-Wire Rudder Dual-Channel Hydraulic Actuator Differential Delta',
    program: 'Bombardier Global 7500',
    facility: 'Montreal Mirabel Manufacturing Center',
    coordinates: '45.6811° N, 74.0389° W',
    blueprintLocation: { x: 88, y: 18, zone: 'Empennage Rudder Servo-Actuator Bay' },
    partNumber: 'B7500-27-4100-3',
    serialNumber: 'BD-7500-FCS-019',
    severity: 'major',
    discrepancyText: 'Pre-flight avionics integration loop test indicated a 380 PSI differential pressure split between Hydraulic Circuit 1 (Blue) and Circuit 3 (Green) during dynamic 40 deg/sec rudder sweep cycles. Secondary electro-hydraulic servo valve (EHSV) spool displacement lag measured at 42 milliseconds, triggering amber CAS caution message [FCS RUD PRESS ASYM].',
    ncrStatus: 'open',
    verificationStatus: 'approved',
    confidenceScore: 89, // INTEGER 0-100, HIGH
    confidenceEvaluation: 'HIGH',
    fmeaScore: 74,
    tags: ['Fly-by-Wire', 'Hydraulics', 'Avionics', 'Mirabel Plant', 'Bombardier'],
    analysis: {
      executiveSummary: 'Hydraulic pressure split and EHSV spool response latency identified in Global 7500 dual-redundant rudder flight control system.',
      rootCauseHypothesis: 'Micro-contamination in EHSV pilot stage flapper orifice or internal spool seal micro-extrusion under 3000 PSI operating pressures.',
      fmeaScore: 74,
      severityAssessment: 'MAJOR - Redundant flight control surface integrity requirement. Must resolve prior to customer flight acceptance.',
      containmentSteps: [
        'Quarantine Actuator S/N BD-7500-FCS-019 and flush hydraulic test rig manifold.',
        'Perform fluid particulate count per NAS 1638 Class 5 standard on Circuit 1 and 3 reservoir samples.',
        'Perform zero-null calibration verification on FCC (Flight Control Computer) channel B.'
      ],
      dispositionRecommendation: 'Bench-test and replace EHSV manifold sub-assembly. Retest with automated 500-cycle frequency response sweep script.',
      suggestedReflections: [
        'Did hydraulic fluid sampling confirm compliance with Skydrol 500B-4 particulate purity specs?',
        'Is there any recorded firmware revision mismatch between FCC Channel A and B?'
      ]
    }
  },
  {
    title: 'Titanium Fan Blade Leading Edge FOD Micro-Pitting & Indentation',
    program: 'Airbus A320neo',
    facility: 'Hamburg Finkenwerder Delivery Center',
    coordinates: '53.5358° N, 9.8358° E',
    blueprintLocation: { x: 22, y: 65, zone: 'Engine #1 Nacelle / Titanium Fan Rotor' },
    partNumber: 'LEAP-1A-72-1002',
    serialNumber: 'CFM-NEO-FBL-077',
    severity: 'minor',
    discrepancyText: 'Post-flight-line taxi run walkaround inspection detected a 0.8mm depth sharp indentation on Fan Blade #11 leading edge at 70% blade height radius. Notch radius is 0.15mm with minor localized burr. Blending allowable limit per CFM Engine Maintenance Manual is max 1.2mm depth with 4:1 blend ratio.',
    ncrStatus: 'draft',
    verificationStatus: 'pending',
    confidenceScore: 58, // INTEGER 0-100, < 60 (qualifies for Supervisor Review Queue)
    confidenceEvaluation: 'MODERATE',
    fmeaScore: 42,
    tags: ['Fan Blade', 'FOD', 'CFM LEAP-1A', 'Hamburg', 'Airbus'],
    analysis: {
      executiveSummary: 'Minor foreign object debris (FOD) leading edge nick on titanium fan blade within allowable SRM blend limits.',
      rootCauseHypothesis: 'Runway/taxiway gravel particulate ingestion during reverse thrust ground validation run.',
      fmeaScore: 42,
      severityAssessment: 'MINOR - Within SRM Blend limits. No structural crack propagation identified under dye penetrant check.',
      containmentSteps: [
        'Inspect runway 23 taxiway sweep logs at Finkenwerder.',
        'Perform Fluorescent Penetrant Inspection (FPI) around notch root to ensure zero micro-fissures.'
      ],
      dispositionRecommendation: 'Perform precision manual rotary stone blending with 4:1 taper ratio per EMM 72-21-00. Re-verify dynamic fan balance.',
      suggestedReflections: [
        'Is the post-blend residual thickness well within aerodynamic flutter margin criteria?'
      ]
    }
  }
];
