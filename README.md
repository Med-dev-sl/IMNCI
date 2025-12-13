
 

 

1.     Patient Management Module

 

Description

 

This module manages patient registration, search, and demographic information.

 

Functional Requirements
 

 Patient Registration                      

 

·        ID: FR-PM-001

·        Title: Register New Patient

·        Priority: High

·        Description: System shall allow health workers to register new patients

·        Source: Health Worker

·        Pre-condition: User is logged in and has CREATE_PATIENT permission

·        Post-condition: Patient record created in local and central database

 

Requirements:
 

1.  System SHALL capture mandatory fields:

 

·        First name

·        Date of birth

·        Gender

·        Mother's name

 

2.  System SHALL capture optional fields:
 

·        Last name

·        Father's name

·        Contact number

·        Village

·        GPS coordinates


3.  System SHALL generate unique patient ID:
 

·        Format: [FacilityCode]-[Year]-[SequentialNumber]

·        Example: BO-HC-2024-0001

·        Sequential number SHALL reset annually

 

4.  System SHALL support estimated date of birth:
 

·        Allow selection: "Exact", "Estimated (±1 month)", "Unknown"

·        Capture age in months if date unknown

 

5.  System SHALL validate all inputs:
 

·        Name: Only letters, spaces, hyphens

·        Date: Reasonable range (not < 2010, not future)

·        Phone: Valid Sierra Leone format

 

6.  System SHALL store data locally immediately

 

7.  System SHALL queue for sync to central server

 

8.  System SHALL provide confirmation with patient ID

 

 Patient Search                      

 

·        ID: FR-PM-002

·        Title: Search Existing Patients

·        Priority: High

·        Description: System shall allow searching for existing patients

·        Source: Health Worker

·        Pre-condition: User is logged in

·        Post-condition: Display search results

 

Requirements:
 

1.  System SHALL support multiple search criteria:

 

·        Patient ID (exact match)

·        First name (fuzzy match, minimum 3 chars)

·        Last name (fuzzy match)


·        Mother's name (fuzzy match

·        Phone number (exact match)

 

2.  System SHALL support filters:
 

·        Age range (months)

·        Village

·        Last visit date range

·        Active/Inactive status

 

3.  System SHALL display results with key information:
 

·        Patient ID, Name, Age, Gender, Last visit date

·        Maximum 20 results per page

·        Pagination for large result sets

 

4.  System SHALL work offline:
 

·        Search local SQLite database

·        Indicate if searching local vs remote

 

5.  System SHALL provide quick actions from results:
 

·        Start new assessment

·        View patient profile

·        Edit patient details

 

6.  Search performance:
 

-  Local search: < 2 seconds for 10,000 records

 

-  Remote search: < 5 seconds including network

 

 Patient Profile Management                      

 

·        ID: FR-PM-003

·        Title: Manage Patient Profile

·        Priority: Medium

·        Description: System shall allow viewing and updating patient profiles

·        Source: Health Worker


·        Pre-condition: User is logged in and has VIEW_PATIENT permission

·        Post-condition: Patient profile displayed/update

 

Requirements:
 

1.  System SHALL display comprehensive profile:

 

·        Demographic information

·        Assessment history (date, diagnosis, severity)

·        Immunization status (with next due dates)

·        Growth charts (weight-for-age trend)

·        Current medications

·        Alerts (e.g., missed follow-ups)

 

2.  System SHALL allow updates to:
 

·        Contact information

·        Address

·        Additional notes

 

3.  System SHALL track changes:
 

·        Who changed what and when

·        Require reason for significant changes

·        Supervisor approval for critical changes

 

4.  System SHALL support patient status changes:
 

·        Mark as transferred (with receiving facility)

·        Mark as deceased (with date and cause)

·        Mark as inactive (after 2 years no contact)

 

5.  System SHALL generate printable summary
 

Non-Functional Requirements

 

 Data Privacy                      

 

·        ID: NFR-PM-001

·        Title: Patient Data Privacy


·        Description: System shall protect patient privacy

·        Category: Security

 

Requirements:
 

·        System SHALL encrypt patient data at rest (AES-256)

·        System SHALL encrypt data in transit (TLS 1.3)

·        System SHALL implement role-based access control

·        System SHALL log all patient data accesses

·        System SHALL support data anonymization for analytics

·        System SHALL comply with Data Protection Act 2019

 

 Performance                      

 

·        ID: NFR-PM-002

·        Title: Patient Search Performance

·        Description: System shall provide fast patient search

·        Category: Performance

 

Requirements:
 

·        Local search: < 2 seconds for 95% of searches

·        Remote search: < 5 seconds including network latency

·        Patient registration: < 30 seconds including validation

·        Profile loading: < 3 seconds for complete profile

·        Offline operation: Full functionality without network

 

2.  IMNCI Assessment Module Description
Guided clinical assessment following IMNCI protocol for children and infants.

 

Functional Requirements
 

 Danger Signs Assessment                      

 

·        ID: FR-AS-001

·        Title: Assess Danger Signs


·        Priority: Critical

·        Description: System shall guide assessment of danger signs

·        Source: IMNCI Guidelines

·        Pre-condition: Patient selected, new assessment started

·        Post-condition: Danger signs identified and classified

 

Requirements:
 

1.  System SHALL present questions in order:

 

a.  "Is the child able to drink or breastfeed?"

 

-  Options: Yes normally, Drinking poorly, No - cannot drink

 

b.  "Has the child vomited everything?"

 

-  Options: No, Yes everything

 

c.  "Has the child had convulsions?"

 

-  Options: No, Yes

 

2.  System SHALL guide observation:
 

a.  "Is the child lethargic or unconscious?"

 

-  Options: No - alert, Lethargic, Unconscious

 

b.  "Is the child convulsing now?"

 

-  Options: No, Yes

 

3.  System SHALL automatically classify:
 

·        If ANY danger sign present → "DANGER SIGNS PRESENT"

·        Immediate alert with red background

·        Skip to referral workflow

 

4.  System SHALL provide visual indicators:

 

·        Green: No danger signs

·        Red: Danger signs present


·        Clear warning message for danger signs

 

5.  System SHALL allow progression only after all questions answered
 

 Respiratory Assessment                      

 

·        ID: FR-AS-002

·        Title: Assess Cough/Difficulty Breathing

·        Priority: High

·        Description: System shall guide respiratory assessment

·        Source: IMNCI Guidelines

·        Pre-condition: No danger signs present

·        Post-condition: Respiratory classification determined

 

Requirements:
 

1.  System SHALL ask: "Does the child have cough or difficult breathing?"

 

·        If No: Skip to next symptom

·        If Yes: Proceed with detailed assessment

 

2.  System SHALL provide 60-second respiratory rate counter:
 

·        Large timer display (60 → 0)

·        Tap counter for each breath

·        Visual/audio cues for timing

·        Pause/resume capability

 

-  Automatic classification of fast breathing:
 

• < 2 months: ≥ 60 bpm = fast

 

• 2-12 months: ≥ 50 bpm = fast

 

• 1-5 years: ≥ 40 bpm = fast

 

3.  System SHALL guide chest indrawing assessment:
 

·        Display images/video of normal vs indrawing

·        Options: None, Mild, Severe


·        Option to take photo for documentation

 

4.  System SHALL check for stridor and wheezing:
 

·        Audio recording option (30 seconds max)

·        Playback for verification

·        Options: Present, Absent

 

5.  System SHALL automatically classify:
 

·        Any danger sign OR stridor = "VERY SEVERE DISEASE"

·        Chest indrawing OR fast breathing = "PNEUMONIA"

·        Neither = "NO PNEUMONIA"

 

6.  System SHALL calculate oxygen saturation if available:
 

·        Connect to Bluetooth pulse oximeter

·        Record SpO2 and heart rate

·        Alert if SpO2 < 90%

 

 Diarrhea Assessment                      

 

·        ID: FR-AS-003

·        Title: Assess Diarrhea

·        Priority: High

·        Description: System shall guide diarrhea assessment

·        Source: IMNCI Guidelines

·        Pre-condition: Patient selected

·        Post-condition: Dehydration level classified

 

Requirements:
 

1.  System SHALL ask: "Does the child have diarrhea?"

 

·        If No: Skip to next symptom

·        If Yes: Record duration in days

·        Ask: "Is there blood in the stool?"


2.  System SHALL guide dehydration assessment:
 

a.  Look at child's general condition

 

-  Options: Lethargic/unconscious, Restless/irritable, Normal

 

b. Look for sunken eyes

 

-  Options: Sunken, Normal

 

c.  Offer fluid and observe drinking

 

-  Options: Not able to drink/drinking poorly, Drinks eagerly/thirsty, Normal

 

d.  Skin pinch test

 

-  Demonstration video

 

-  Options: Goes back very slowly (>2 sec), Goes back slowly, Goes back quickly

 

3.  System SHALL automatically classify dehydration:
 

·        ≥2 of: Lethargic, sunken eyes, not able to drink, skin pinch very slow

·        → "SEVERE DEHYDRATION" (PINK)

·        ≥2 of: Restless, sunken eyes, drinks eagerly, skin pinch slow

·        → "SOME DEHYDRATION" (YELLOW)

·        Otherwise → "NO DEHYDRATION" (GREEN)

 

4.  System SHALL check for persistent diarrhea (≥14 days)
 

5.  System SHALL check for dysentery (blood in stool)

 

 Nutrition Assessment                      

 

·        ID: FR-AS-004

·        Title: Assess Nutritional Status

·        Priority: High

·        Description: System shall guide nutrition assessment

·        Source: IMNCI Guidelines

·        Pre-condition: Patient selected

·        Post-condition: Nutritional status classified


Requirements:
 

1.  System SHALL record measurements:

 

·        Weight (kg) with Bluetooth scale integration

·        Height/Length (cm) with measurement guide

·        MUAC (mm) with color-coded tape guide

 

2.  System SHALL check for bilateral edema:
 

·        Demonstration images

·        Press test instruction

·        Options: Present, Absent

 

3.  System SHALL calculate and classify:
 

·        Weight-for-Height Z-score using WHO growth standards

·        Automatic classification:

  Edema OR MUAC <115mm OR WFH < -3z = "SEVERE ACUTE MALNUTRITION"   MUAC 115-125mm OR WFH -3 to -2z = "MODERATE ACUTE MALNUTRITION"  Otherwise = "NO ACUTE MALNUTRITION"

4.  System SHALL conduct appetite test if Severe Acute Malnutrition (SAM) suspected:
 

•    Provide RUTF according to weight

•    30-minute timer

•    Record amount eaten

•    Classify: Pass (eats required amount), Fail

 

5.  System SHALL check for medical complications:
 

•    Any danger sign

•    Severe pneumonia

•    Dehydration

•    High fever

•    Determine if SAM is complicated or uncomplicated


Non-Functional Requirements
 

 Clinical Accuracy                      

 

•    ID: NFR-AS-001

•    Title: Clinical Decision Accuracy

•    Description: System shall provide accurate clinical classifications

•    Category: Safety

 

Requirements:
 

1.  System SHALL implement exact IMNCI algorithm

 

2.  System SHALL be validated against expert clinician assessments

 

3.  System SHALL achieve >95% classification accuracy

 

4.  System SHALL provide clear audit trail of decision logic

 

5.  System SHALL allow override with documented reason

 

 Assessment Performance                      

 

•    ID: NFR-AS-002

•    Title: Assessment Completion Time

•    Description: System shall enable fast assessments

•    Category: Performance

 

Requirements:
 

1.  Complete assessment (all symptoms): < 10 minutes

 

2.  Danger signs assessment: < 2 minutes

 

3.  Respiratory rate counting: 60 seconds exactly

 

4.  System response between questions: < 1 second

 

5.  Save assessment progress: < 3 seconds


3.  Treatment Planning Module

 

Description

 

Generate evidence-based treatment plans and calculate drug dosages.

 

Functional Requirements
 

 Automated Treatment Generation                      

 

•    ID: FR-TP-001

•    Title: Generate Treatment Plan

•    Priority: High

•    Description: System shall generate treatment based on classifications

•    Source: IMNCI Guidelines

•    Pre-condition: Assessment completed with classifications

•    Post-condition: Treatment plan generated

 

Requirements:
 

1.  System SHALL generate treatment based on color classification:

 

•    PINK (Urgent): Pre-referral treatments + referral instructions

•    YELLOW (Treatment): Outpatient treatment plan

•    GREEN (Home care): Counseling and follow-up

 

2.  For PINK classifications, system SHALL provide:
 

•    List of pre-referral treatments to give immediately

•    Referral form with patient details

•    Instructions for transport and care during referral

•    Contact information for referral facility

 

3.  For YELLOW classifications, system SHALL provide:
 

•    Complete medication list with dosages

•    Counseling points for caregiver

•    Follow-up schedule

•    Warning signs to watch for


4.  System SHALL check for treatment conflicts:
 

•    Drug-drug interactions

•    Contraindications based on age/condition

•    Duplicate therapies

 

5.  System SHALL provide treatment in multiple formats:
 

•    Printable treatment card (A6 size)

•    SMS to caregiver (summary)

•    PDF for facility records

 

 Drug Dosage Calculator                      

 

•    ID: FR-TP-002

•    Title: Calculate Drug Dosages

•    Priority: High

•    Description: System shall calculate accurate drug dosages

•    Source: National Drug Formulary

•    Pre-condition: Patient weight/age known, drug selected

•    Post-condition: Dosage calculated and validated

 

Requirements:
 

1.  System SHALL calculate based on weight (primary) or age:

 

•    Weight-based: mg/kg, ml/kg

•    Age-based: Use when weight unknown

 

2.  System SHALL support all IMNCI essential drugs:
 

•    Amoxicillin (pneumonia, ear infection)

•    Paracetamol (fever, pain)

•    ORS (dehydration)

•    Zinc (diarrhea)

•    Artemether-Lumefantrine (malaria)

•    Cotrimoxazole (HIV prophylaxis)


•    Others as per national formulary

 

3.  System SHALL adjust for formulation:
 

•    Tablets: 250mg, 500mg

•    Syrup: 125mg/5ml, 250mg/5ml

•    Dispersible tablets

•    Injections

 

4.  System SHALL calculate total quantity needed:
 

•    Based on dose, frequency, duration

•    Round to nearest practical unit (½ tablet, 5ml)

•    Check against available stock

 

5.  System SHALL provide safety checks:
 

•    Maximum daily dose not exceeded

•    Minimum effective dose achieved

•    Age restrictions respected

•    Renal/hepatic adjustments if needed

 

6.  System SHALL generate administration instructions:

 

•    "Give 1 tablet (250mg) 2 times daily for 5 days"

•    "Take with food"

•    "Complete full course even if child gets better"

 

 Prescription Management                      

 

•    ID: FR-TP-003

•    Title: Manage Prescriptions

•    Priority: Medium

•    Description: System shall manage prescription lifecycle

•    Source: Health Worker

•    Pre-condition: Treatment plan generated

•    Post-condition: Prescription finalized and dispensed


Requirements:
 

1.  System SHALL allow prescription customization:

 

•    Add/remove medications

•    Adjust dosages (with safety warnings)

•    Add special instructions

•    Specify alternative if drug unavailable

 

2.  System SHALL require authentication for prescription:
 

•    Prescriber name and signature (digital)

•    Date and time

•    Facility stamp

 

3.  System SHALL track prescription status:
 

•    Created

•    Dispensed (partial/full)

•    Completed

•    Cancelled

 

4.  System SHALL generate prescription labels:
 

•    Patient name and ID

•    Drug name, strength, dosage

•    Instructions

•    Expiry date if dispensed

 

5.  System SHALL support repeat prescriptions:
 

•    For chronic conditions

•    Maximum 3 months supply

•    Review required for extension

 

Non-Functional Requirements
 

 Medication Safety                      

 

•    ID: NFR-TP-001


•    Title: Medication Safety

•    Description: System shall prevent medication errors

•    Category: Safety

 

Requirements:
 

1.  System SHALL prevent overdose calculations

 

2.  System SHALL warn about contraindications

 

3.  System SHALL check for drug interactions

 

4.  System SHALL validate against age/weight ranges

 

5.  System SHALL provide clear administration instructions

 

6.  Error rate in dosage calculations: < 0.1%

 

 Prescription Integrity                      

 

•    ID: NFR-TP-002

•    Title: Prescription Integrity

•    Description: System shall ensure prescription integrity

•    Category: Security

 

Requirements:
 

1.  System SHALL prevent unauthorized prescription changes

 

2.  System SHALL maintain audit trail of all changes

 

3.  System SHALL require authentication for dispensing

 

4.  System SHALL prevent duplicate dispensing

 

5.  System SHALL support prescription recall if needed

 

4.  Drug Inventory Module Description
Manage drug stock levels, expiry dates, and reordering.


Functional Requirements
 

 Stock Level Management                      

 

•    ID: FR-IN-001

•    Title: Manage Stock Levels

•    Priority: High

•    Description: System shall track drug stock levels

•    Source: Pharmacist

•    Pre-condition: User has INVENTORY_ACCESS permission

•    Post-condition: Stock levels accurately recorded

 

Requirements:
 

1.  System SHALL maintain current stock for each drug:

 

•    Drug name, generic name, formulation, strength

•    Current quantity, unit (tablets, ml, bottles)

•    Minimum stock level (reorder point)

•    Maximum stock level

 

2.  System SHALL automatically update stock on:
 

•    Receipt from medical store

•    Dispensing to patient

•    Adjustment (loss, damage, transfer)

•    Physical count (stock take)

 

3.  System SHALL provide real-time stock view:
 

•    Color-coded by status (Adequate, Low, Out)

•    Sort by: Name, stock level, expiry date

•    Filter by: Category, status

 

4.  System SHALL generate stock alerts:
 

•    Low stock (below minimum)

•    Stockout (zero stock

•    Near expiry (30, 15, 7 days)


•    Overstock (above maximum)

 

5.  System SHALL support batch management:
 

•    Batch number tracking

•    Expiry date per batch

•    FIFO (First In, First Out) dispensing

 

 Drug Dispensing                      

 

•    ID: FR-IN-002

•    Title: Dispense Drugs

•    Priority: High

•    Description: System shall manage drug dispensing

•    Source: Pharmacist

•    Pre-condition: Valid prescription exists

•    Post-condition: Drugs dispensed and stock updated

 

Requirements:
 

1.  System SHALL link dispensing to prescription:

 

•    Select prescription from list

•    Show prescribed drugs and quantities

•    Allow partial dispensing if stock insufficient

 

2.  System SHALL validate before dispensing:
 

•    Stock available

•    Not expired

•    Correct batch selected

•    Prescription still valid

 

3.  System SHALL record dispensing details:
 

•    Date and time

•    Quantity dispensed

•    Batch number and expiry

•    Dispenser name


•    Witness for controlled drugs

 

4.  System SHALL generate dispensing label:
 

•    Patient name and ID

•    Drug name, strength, quantity

•    Instructions

•    Expiry date

•    Dispensing date

 

5.  System SHALL update stock automatically

 

6.  System SHALL generate dispensing receipt

 

 Reorder Management                      

 

•    ID: FR-IN-003

•    Title: Manage Drug Reorders

•    Priority: Medium

•    Description: System shall manage drug reordering

•    Source: Pharmacist

•    Pre-condition: Low stock alert triggered

•    Post-condition: Reorder submitted

 

Requirements:
 

1.  System SHALL generate automatic reorder suggestions:

 

•    Based on consumption patterns

•    Minimum 2 weeks lead time considered

•    Adjust for seasonal variations

 

2.  System SHALL allow manual reorder creation:
 

•    Select drugs and quantities

•    Add notes/comments

•    Set priority (routine, urgent)


3.  System SHALL generate reorder form:
 

•    Facility information

•    Drug list with quantities

•    Justification for urgent orders

•    Authorized signatures

 

4.  System SHALL track reorder status:
 

•    Draft

•    Submitted

•    Acknowledged

•    Shipped

•    Received

 

5.  System SHALL update stock on receipt:
 

•    Scan barcodes or manual entry

•    Verify against order

•    Record batch numbers and expiry dates

 

Non-Functional Requirements
 

 Inventory Accuracy                      

 

•    ID: NFR-IN-001

•    Title: Inventory Accuracy

•    Description: System shall maintain accurate inventory records

•    Category: Reliability

 

Requirements:
 

1.  Stock level accuracy: >99% compared to physical count

 

2.  Automatic stock updates: Real-time (within 1 second)

 

3.  Data consistency: Local and central databases synchronized

 

4.  Transaction logging: All stock movements recorded


5.  Reconciliation: Daily reconciliation with dispensing records

 

 Barcode Performance                      

 

•    ID: NFR-IN-002

•    Title: Barcode Scanning Performance

•    Description: System shall support efficient barcode scanning

•    Category: Performance

 

Requirements:
 

1.  Barcode recognition: < 2 seconds per item

 

2.  Batch processing: Support scanning multiple items

 

3.  Offline scanning: Store scans for later processing

 

4.  Error rate: < 1% misreads

 

5.  Supported formats: Code 128, Code 39, QR codes

 

5. Analytics & Reporting Module Description
Provide real-time analytics, dashboards, and reporting capabilities.

 

Functional Requirements
 

 Real-time Dashboard                      

 

•    ID: FR-AR-001

•    Title: Provide Real-time Dashboard

•    Priority: Medium

•    Description: System shall provide configurable dashboards

•    Source: Facility Manager

•    Pre-condition: User has VIEW_ANALYTICS permission

•    Post-condition: Dashboard displayed with current data

 

Requirements:
 

1.  System SHALL provide facility-level dashboard:


•    Key metrics: Patients seen today, referrals, common diagnoses

•    Disease trends (last 7, 30, 90 days)

•    Staff performance indicators

•    Drug stock status

•    Data quality indicators

 

2.  System SHALL provide district-level dashboard:
 

-  Aggregate data from all facilities

 

-  Facility performance comparison

 

-  Disease outbreak detection

 

-  Resource allocation overview

 

-  Map visualization

 

3.  System SHALL provide national-level dashboard:
 

-  National health indicators

 

-  Regional comparisons

 

-  Trend analysis

 

-  Achievement of targets

 

-  Equity analysis

 

4.  System SHALL support customizable widgets:
 

-  Add/remove widgets

 

-  Resize and rearrange

 

-  Set refresh intervals

 

-  Save dashboard layouts

 

5.  System SHALL provide drill-down capability:
 

-  Click on chart to see underlying data


-  Filter by date range, facility, diagnosis

 

-  Export underlying data

 

 Disease Surveillance                      

 

•    ID: FR-AR-002

•    Title: Disease Surveillance

•    Priority: High

•    Description: System shall detect disease outbreaks

•    Source: District Supervisor

•    Pre-condition: Sufficient data available (minimum 30 days)

•    Post-condition: Alerts generated if thresholds exceeded

 

Requirements:
 

1.  System SHALL monitor key diseases:

 

-  Malaria

 

-  Pneumonia

 

-  Diarrhea

 

-  Measles

 

-  Malnutrition

 

2.  System SHALL calculate baselines:
 

-  Historical averages (last 4 weeks)

 

-  Adjust for day of week and seasonality

 

-  Calculate confidence intervals

 

3.  System SHALL detect outbreaks:
 

-  Current cases > 2 standard deviations above baseline

 

-  Cluster detection (geographic, temporal)

 

-  Rate of increase > 50% week-on-week


4.  System SHALL generate alerts:
 

-  Email/SMS to district supervisors

 

-  In-system notifications

 

-  Severity levels (Information, Warning, Critical)

 

5.  System SHALL provide investigation tools:
 

-  Line listing of cases

 

-  Epidemic curve

 

-  Map of affected areas

 

-  Demographic breakdown

 

 Performance Reporting                      

 

•    ID: FR-AR-003

•    Title: Generate Performance Reports

•    Priority: Medium

•    Description: System shall generate standardized reports

•    Source: Health Manager

•    Pre-condition: User has EXPORT_DATA permission

•    Post-condition: Report generated in requested format

 

Requirements:
 

1.  System SHALL provide standard reports:

 

-  Daily activity report

 

-  Monthly performance report

 

-  Drug consumption report

 

-  Referral analysis report

 

-  Data quality report


2.  System SHALL support custom reports:
 

-  Select data fields

 

-  Apply filters (date, facility, diagnosis)

 

-  Choose visualization type

 

-  Save report templates

 

3.  System SHALL support multiple output formats:
 

-  PDF (for printing)

 

-  Excel (for analysis)

 

-  CSV (for import to other systems)

 

-  HTML (for web viewing)

 

4.  System SHALL support scheduled reports:
 

-  Daily, weekly, monthly schedules

 

-  Email distribution lists

 

-  Automatic archive

 

5.  System SHALL ensure data privacy:
 

-  Aggregate data for public reports

 

-  Anonymize patient data

 

-  Role-based access to detailed data

 

Non-Functional Requirements
 

 Analytics Performance                      

 

•    ID: NFR-AR-001

•    Title: Analytics Performance

•    Description: System shall provide fast analytics


•    Category: Performance

 

Requirements:
 

1.  Dashboard loading: < 5 seconds for facility level

 

2.  Report generation: < 30 seconds for monthly reports

 

3.  Data aggregation: Real-time (within 1 minute)

 

4.  Historical data: Support 5+ years of data

 

5.  Concurrent users: Support 100+ simultaneous dashboard users

 

 Data Visualization                      

 

•    ID: NFR-AR-002

•    Title: Data Visualization Quality

•    Description: System shall provide clear data visualizations

•    Category: Usability

 

Requirements:
 

1.  Charts: Interactive with tooltips and zoom

 

2.  Maps: Support district and chiefdom levels

 

3.  Color coding: Consistent and accessible (colorblind friendly)

 

4.  Mobile responsive: Adapt to screen size

 

5.  Export quality: High resolution for printing

 

6.  Training & Support Module Description
Provide training materials and decision support for health workers.

 

Functional Requirements
 

 Interactive Training                      

 

•    ID: FR-TS-001


•    Title: Provide Interactive Training

•    Priority: Medium

•    Description: System shall provide training modules

•    Source: Health Worker

•    Pre-condition: User logged in

•    Post-condition: Training module completed

 

Requirements:
 

1.  System SHALL provide training modules:

 

-  IMNCI Fundamentals (2 hours)

 

-  Digital System Navigation (1 hour)

 

-  Clinical Skills (videos and simulations)

 

-  Drug Calculations (interactive exercises)

 

-  Data Quality (case studies)

 

2.  System SHALL track training progress:
 

-  Modules completed

 

-  Time spent

 

-  Assessment scores

 

-  Certificates earned

 

3.  System SHALL provide knowledge assessments:
 

-  Pre- and post-training tests

 

-  Clinical scenario simulations

 

-  Instant feedback

 

-  Remediation suggestions


4.  System SHALL support offline learning:
 

-  Download modules for offline use

 

-  Sync progress when online

 

-  Low bandwidth optimization

 

5.  System SHALL provide multilingual content:
 

-  English (primary)

 

-  Krio (audio translations)

 

-  Local language support as available

 

 Clinical Decision Support                      

 

•    ID: FR-TS-002

•    Title: Provide Clinical Decision Support

•    Priority: Medium

•    Description: System shall provide clinical guidance

•    Source: Health Worker

•    Pre-condition: User logged in

•    Post-condition: Clinical guidance accessed

 

Requirements:
 

1.  System SHALL provide quick reference:

 

-  IMNCI classification charts

 

-  Drug dosage tables

 

-  Referral criteria

 

-  Emergency procedures

 

2.  System SHALL provide clinical guidelines:
 

-  WHO/MoH latest guidelines

 

-  Treatment protocols


-  Diagnostic criteria

 

-  Case management flowcharts

 

3.  System SHALL provide differential diagnosis:
 

-  Symptom-based guidance

 

-  Red flag identification

 

-  When to refer

 

-  Alternative diagnoses to consider

 

4.  System SHALL provide updates and alerts:
 

-  New treatment guidelines

 

-  Drug stock changes

 

-  Disease outbreak alerts

 

-  Training opportunities

 

5.  System SHALL support "Ask an Expert":
 

-  Submit clinical questions

 

-  Receive expert responses (when online)

 

-  Archive of common questions

 

Non-Functional Requirements
 

Training Effectiveness

 

•    ID: NFR-TS-001

•    Title: Training Effectiveness

•    Description: System shall provide effective training

•    Category: Usability

 

 

 

Requirements:

1.  Completion rate: >80% of users complete basic training

 

2.  Knowledge retention: >70% pass post-training assessment

 

3.  Time to proficiency: <2 hours for basic navigation

 

4.  User satisfaction: >4/5 rating for training materials

 

5.  Accessibility: Available on all device types

 

7.  System Administration Module Description
Manage users, facilities, and system configuration.

 

Functional Requirements
 

 User Management                      

 

•    ID: FR-SA-001

•    Title: Manage System Users

•    Priority: High

•    Description: System shall manage user accounts and permissions

•    Source: System Administrator

•    Pre-condition: User has ADMIN permissions

•    Post-condition: User account created/updated

 

Requirements:
 

1.  System SHALL support user creation:

 

-  Basic info: Name, email, phone

 

-  Role assignment (health worker, pharmacist, supervisor, admin)

 

-  Facility assignment

 

-  Set initial password

 

2.  System SHALL manage permissions:
 

-  Role-based access control (RBAC)


-  Fine-grained permissions (view, create, edit, delete)

 

-  Facility-based data access restrictions

 

-  Time-based access (working hours only)

 

3.  System SHALL support authentication:
 

-  Username/password

 

-  Two-factor authentication (optional)

 

-  Session management (timeout after 30 minutes inactivity)

 

-  Password policy enforcement (minimum 8 chars, complexity)

 

4.  System SHALL track user activity:
 

-  Login/logout times

 

-  Actions performed

 

-  Data accessed

 

-  Export activity logs

 

5.  System SHALL support bulk operations:
 

-  Import users from CSV

 

-  Bulk role assignment

 

-  Bulk password reset

 

-  Export user list

 

 Facility Management                      

 

•    ID: FR-SA-002

•    Title: Manage Health Facilities

•    Priority: High

•    Description: System shall manage facility information

•    Source: System Administrator


•    Pre-condition: User has ADMIN permissions

•    Post-condition: Facility configured

 

Requirements:
 

1.  System SHALL maintain facility database:

 

-  Facility code and name

 

-  Type (hospital, health center, clinic, MCHP)

 

-  Location (district, chiefdom, GPS coordinates)

 

-  Contact information

 

-  Catchment population

 

2.  System SHALL configure facility settings:
 

-  Available services (OPD, immunization, pharmacy)

 

-  Staff complement

 

-  Operating hours

 

-  Referral pathways

 

3.  System SHALL manage facility hierarchy:
 

-  District > Chiefdom > Facility structure

 

-  Reporting relationships

 

-  Support supervision structure

 

4.  System SHALL track facility status:
 

-  Active, Inactive, Closed

 

-  Opening/closing dates

 

-  Reason for status change


5.  System SHALL generate facility reports:
 

-  Services offered

 

-  Staff roster

 

-  Equipment inventory

 

-  Performance metrics

 

Non-Functional Requirements
 

 Administration Security                      

 

•    ID: NFR-SA-001

•    Title: Administration Security

•    Description: System shall secure administrative functions

•    Category: Security

 

Requirements:
 

1.  Admin authentication: Two-factor authentication required

 

2.  Audit logging: All admin actions logged

 

3.  Access control: Principle of least privilege

 

4.  Session security: Secure session management

 

5.  Data protection: Encrypted admin credentials

 

8.  Integration Module Description
Integrate with external systems and services.

 

Functional Requirements
 

 DHIS2 Integration                      

 

•    ID: FR-IT-001

•    Title: Integrate with DHIS2


•    Priority: High

•    Description: System shall exchange data with DHIS2

•    Source: National Health Information System

•    Pre-condition: DHIS2 API available, credentials configured

•    Post-condition: Data synchronized with DHIS2

 

Requirements:
 

1.  System SHALL export aggregate data daily:

 

-  Patient counts by age, gender

 

-  Disease classifications

 

-  Treatment outcomes

 

-  Service utilization

 

2.  System SHALL import reference data:
 

-  Facility lists

 

-  District boundaries

 

-  Indicator definitions

 

-  Reporting periods

 

3.  System SHALL handle synchronization:
 

-  Daily automatic sync

 

-  Manual sync on demand

 

-  Conflict resolution

 

-  Error handling and retry

 

4.  System SHALL maintain data mapping:
 

-  IMNCI classifications to DHIS2 data elements

 

-  Facility codes mapping


-  Date format conversion

 

5.  System SHALL provide sync monitoring:
 

-  Last successful sync

 

-  Data volumes transferred

 

-  Error reports

 

-  Sync status dashboard

 

 SMS/USSD Integration                      

 

•    ID: FR-IT-002

•    Title: Integrate with SMS/USSD

•    Priority: Medium

•    Description: System shall send/receive SMS/USSD messages

•    Source: Caregivers

•    Pre-condition: SMS gateway configured, patient has phone number

•    Post-condition: Message delivered/received

 

Requirements:
 

1.  System SHALL send SMS to caregivers:

 

-  Treatment reminders

 

-  Follow-up appointments

 

-  Health education messages

 

-  Emergency alerts

 

2.  System SHALL receive SMS from caregivers:
 

-  Appointment confirmations

 

-  Treatment side effects

 

-  Emergency requests

 

-  Feedback


3.  System SHALL support USSD menus:
 

-  Check child's treatment

 

-  Find nearest facility

 

-  Emergency contact

 

-  Health information

 

4.  System SHALL manage message queues:
 

-  Priority queuing (emergency first)

 

-  Retry failed messages

 

-  Delivery status tracking

 

-  Cost monitoring

 

5.  System SHALL ensure message privacy:
 

-  No patient names in messages

 

-  Use unique identifiers

 

-  Opt-out mechanism

 

-  Compliance with telecom regulations

 

Non-Functional Requirements
 

 Integration Reliability                      

 

•    ID: NFR-IT-001

•    Title: Integration Reliability

•    Description: System shall provide reliable integrations

•    Category: Reliability

 

Requirements:
 

1.  DHIS2 sync success rate: >99%


2.  SMS delivery rate: >95% within 5 minutes

 

3.  API availability: 99.9% uptime

 

4.  Error handling: Graceful degradation when services unavailable

 

5.  Data consistency: No data loss during integration failures