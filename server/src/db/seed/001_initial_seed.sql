-- ============================================================================
-- ITSA PLATFORM — NEON POSTGRESQL INITIAL SEED DATA
-- Script: 001_initial_seed.sql
-- Target: Neon Serverless PostgreSQL
-- Description:
--   Populates baseline site settings, official organizational positions,
--   the active 2026-2027 committee roster, 5 authentic archive photographs,
--   and 12 sample events.
--   Zero student registration numbers are present.
--   Zero real admin credentials are created (prepared for Phase 2).
-- ============================================================================

-- ============================================================================
-- 1. BASELINE SITE SETTINGS
-- ============================================================================
INSERT INTO site_settings (key, value, description, is_public)
VALUES
  (
    'academic_year',
    '"2026–2027"'::jsonb,
    'Current active academic tenure year',
    true
  ),
  (
    'telemetry_status',
    '"SYS: LINUX_KERNEL_STABLE"'::jsonb,
    'Hero telemetry status string',
    true
  ),
  (
    'quote_content',
    '{"quote": "The best way to predict the future is to invent it.", "author": "Alan Kay"}'::jsonb,
    'Cinematic quote section text and attribution',
    true
  ),
  (
    'contact_info',
    '{"email": "itsa@sggs.ac.in", "institution": "SGGSIE&T, Nanded", "address": "Department of Information Technology, Shri Guru Gobind Singhji Institute of Engineering & Technology, Vishnupuri, Nanded — 431606, Maharashtra, India."}'::jsonb,
    'Official department contact details',
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

-- ============================================================================
-- 2. ORGANIZATIONAL POSITIONS (32 ROLES)
-- ============================================================================
INSERT INTO positions (name, tier, domain, description, display_order, is_active)
VALUES
  -- Core Committee
  ('President', 'CORE', 'OVERALL', 'Executive lead of the Information Technology Students Association', 1, true),
  ('Vice President', 'CORE', 'OVERALL', 'Executive co-lead overseeing committee operations and initiatives', 2, true),
  ('Treasurer', 'CORE', 'FINANCE', 'Head of financial planning, event budgeting, and fiscal compliance', 3, true),
  ('Vice Treasurer', 'CORE', 'FINANCE', 'Co-lead assisting treasury management and disbursements', 4, true),

  -- Third Year (TY) Leadership
  ('Technical Head', 'TY_LEADERSHIP', 'TECHNICAL', 'Lead for competitive programming, hackathons, and technical projects', 5, true),
  ('Technical Co-Head', 'TY_LEADERSHIP', 'TECHNICAL', 'Co-lead for technical infrastructure and workshops', 6, true),
  ('Event Operations Head', 'TY_LEADERSHIP', 'OPERATIONS', 'Director of departmental symposiums and event logistics', 7, true),
  ('Event Operations Co-Head', 'TY_LEADERSHIP', 'OPERATIONS', 'Co-lead for venue coordination and scheduling', 8, true),
  ('Media Head', 'TY_LEADERSHIP', 'MEDIA', 'Head of digital media, brand identity, and documentation', 9, true),
  ('Media Co-Head', 'TY_LEADERSHIP', 'MEDIA', 'Co-lead for creative design, photography, and video coverage', 10, true),
  ('Anchoring Head', 'TY_LEADERSHIP', 'ANCHORING', 'Lead coordinator for formal stage hosting and ceremonies', 11, true),
  ('Anchoring Co-Head', 'TY_LEADERSHIP', 'ANCHORING', 'Co-lead for public speaking and ceremonial anchoring', 12, true),
  ('Sports Head', 'TY_LEADERSHIP', 'SPORTS', 'Head organizer for departmental tournaments and athletic meets', 13, true),
  ('Sports Co-Head', 'TY_LEADERSHIP', 'SPORTS', 'Co-lead for indoor and outdoor sports fixtures', 14, true),
  ('Alumni & Relations Head', 'TY_LEADERSHIP', 'ALUMNI', 'Head for alumni outreach, guest lectures, and networking', 15, true),
  ('Alumni & Relations Co-Head', 'TY_LEADERSHIP', 'ALUMNI', 'Co-lead for corporate linkages and alumni relations', 16, true),

  -- Second Year (SY) Coordinators
  ('Main Coordinator', 'SY_COORDINATOR', 'OVERALL', 'Overall coordination lead for student activities', 17, true),
  ('Joint Coordinator', 'SY_COORDINATOR', 'OVERALL', 'Joint coordinator for overall event support', 18, true),
  ('Technical Main Coordinator', 'SY_COORDINATOR', 'TECHNICAL', 'Coordinator for lab sessions and technical workshops', 19, true),
  ('Technical Joint Coordinator', 'SY_COORDINATOR', 'TECHNICAL', 'Joint coordinator for programming sprints and tech tools', 20, true),
  ('Anchoring Main Coordinator', 'SY_COORDINATOR', 'ANCHORING', 'Ceremonial hosting and stage presentation coordinator', 21, true),
  ('Anchoring Joint Coordinator', 'SY_COORDINATOR', 'ANCHORING', 'Joint anchoring coordinator', 22, true),
  ('Media Main Coordinator', 'SY_COORDINATOR', 'MEDIA', 'Media assets, coverage, and photography coordinator', 23, true),
  ('Media Joint Coordinator', 'SY_COORDINATOR', 'MEDIA', 'Joint media design coordinator', 24, true),
  ('Finance Main Coordinator', 'SY_COORDINATOR', 'FINANCE', 'Accounts and sponsorship coordinator', 25, true),
  ('Finance Joint Coordinator', 'SY_COORDINATOR', 'FINANCE', 'Joint finance and invoice tracking coordinator', 26, true),
  ('Sports Main Coordinator', 'SY_COORDINATOR', 'SPORTS', 'Sports scheduling and match operations coordinator', 27, true),
  ('Sports Joint Coordinator', 'SY_COORDINATOR', 'SPORTS', 'Joint sports refereeing and ground coordination', 28, true),
  ('Alumni & Relations Main Coordinator', 'SY_COORDINATOR', 'ALUMNI', 'Alumni directory and communications coordinator', 29, true),

  -- Faculty Dignitaries
  ('ITSA Faculty Coordinator', 'FACULTY', 'OVERALL', 'Faculty advisor guiding student body initiatives', 30, true),
  ('Head of the Department', 'FACULTY', 'OVERALL', 'Head of the Department of Information Technology', 31, true),
  ('Dean Student Activities', 'FACULTY', 'OVERALL', 'Dean of Student Affairs, SGGSIE&T', 32, true);

-- ============================================================================
-- 3. OFFICIAL COMMITTEE MEMBERS (35 INDIVIDUALS, ACADEMIC YEAR 2026–2027)
-- ============================================================================
INSERT INTO committee_members (name, position, tier, domain, department, photo_url, tenure_year, display_order, is_active)
VALUES
  -- Core Committee
  ('Tanishq Raut', 'President', 'CORE', 'OVERALL', NULL, '/team/tanishq-raut.jpg', '2026–2027', 1, true),
  ('Rahul Gulade', 'Vice President', 'CORE', 'OVERALL', NULL, '/team/rahul-gulade.jpg', '2026–2027', 2, true),
  ('Palak Baladwa', 'Vice President', 'CORE', 'OVERALL', NULL, '/team/palak-baladwa.jpg', '2026–2027', 3, true),
  ('Alok Singh', 'Treasurer', 'CORE', 'FINANCE', NULL, '/team/alok-singh.jpg', '2026–2027', 4, true),
  ('Aryan Kale', 'Vice Treasurer', 'CORE', 'FINANCE', NULL, '/team/aryan-kale.jpg', '2026–2027', 5, true),

  -- TY Leadership
  ('Nandini Chintewad', 'Technical Head', 'TY_LEADERSHIP', 'TECHNICAL', NULL, '/team/nandini-chintewad.jpg', '2026–2027', 6, true),
  ('Pradnya Jadhav', 'Technical Co-Head', 'TY_LEADERSHIP', 'TECHNICAL', NULL, '/team/pradnya-jadhav.jpg', '2026–2027', 7, true),
  ('Diksha Yelage', 'Event Operations Head', 'TY_LEADERSHIP', 'OPERATIONS', NULL, '/team/diksha-yelage.jpg', '2026–2027', 8, true),
  ('Ghananil Shirpurkar', 'Event Operations Co-Head', 'TY_LEADERSHIP', 'OPERATIONS', NULL, '/team/ghananil-shirpurkar.jpg', '2026–2027', 9, true),
  ('Aditya Mirajgave', 'Media Head', 'TY_LEADERSHIP', 'MEDIA', NULL, '/team/aditya-mirajgave.jpg', '2026–2027', 10, true),
  ('Mrunal Raje', 'Media Co-Head', 'TY_LEADERSHIP', 'MEDIA', NULL, '/team/mrunal-raje.jpg', '2026–2027', 11, true),
  ('Shrish Wadgaonkar', 'Anchoring Head', 'TY_LEADERSHIP', 'ANCHORING', NULL, '/team/shrish-wadgaonkar.jpg', '2026–2027', 12, true),
  ('Shravani Kharwadkar', 'Anchoring Co-Head', 'TY_LEADERSHIP', 'ANCHORING', NULL, '/team/shravani-kharwadkar.jpg', '2026–2027', 13, true),
  ('Yash Bangalkar', 'Sports Head', 'TY_LEADERSHIP', 'SPORTS', NULL, '/team/yash-bangalkar.jpg', '2026–2027', 14, true),
  ('Vardhan Wanjari', 'Sports Co-Head', 'TY_LEADERSHIP', 'SPORTS', NULL, '/team/vardhan-wanjari.jpg', '2026–2027', 15, true),
  ('Dharmaraj Deshmukh', 'Alumni & Relations Head', 'TY_LEADERSHIP', 'ALUMNI', NULL, '/team/dharmaraj-deshmukh.jpg', '2026–2027', 16, true),
  ('Mayuri Awalwar', 'Alumni & Relations Co-Head', 'TY_LEADERSHIP', 'ALUMNI', NULL, '/team/mayuri-awalwar.jpg', '2026–2027', 17, true),

  -- SY Coordinators
  ('Anand Soni', 'Main Coordinator', 'SY_COORDINATOR', 'OVERALL', NULL, '/team/anand-soni.jpg', '2026–2027', 18, true),
  ('Sarangi Aware', 'Main Coordinator', 'SY_COORDINATOR', 'OVERALL', NULL, '/team/sarangi-aware.jpg', '2026–2027', 19, true),
  ('Swarali Kulkarni', 'Joint Coordinator', 'SY_COORDINATOR', 'OVERALL', NULL, '/team/swarali-kulkarni.jpg', '2026–2027', 20, true),
  ('Samir Singh', 'Joint Coordinator', 'SY_COORDINATOR', 'OVERALL', NULL, '/team/samir-singh.jpg', '2026–2027', 21, true),
  ('Pratik Bisen', 'Technical Main Coordinator', 'SY_COORDINATOR', 'TECHNICAL', NULL, '/team/pratik-bisen.jpg', '2026–2027', 22, true),
  ('Dipak Bhondekar', 'Technical Joint Coordinator', 'SY_COORDINATOR', 'TECHNICAL', NULL, '/team/dipak-bhondekar.jpg', '2026–2027', 23, true),
  ('Shravani Dhole', 'Anchoring Main Coordinator', 'SY_COORDINATOR', 'ANCHORING', NULL, '/team/shravani-dhole.jpg', '2026–2027', 24, true),
  ('Gayatri Yadav', 'Anchoring Joint Coordinator', 'SY_COORDINATOR', 'ANCHORING', NULL, '/team/gayatri-yadav.jpg', '2026–2027', 25, true),
  ('Lokesh Badgujar', 'Media Main Coordinator', 'SY_COORDINATOR', 'MEDIA', NULL, '/team/lokesh-badgujar.jpg', '2026–2027', 26, true),
  ('Harsh Chandak', 'Media Joint Coordinator', 'SY_COORDINATOR', 'MEDIA', NULL, '/team/harsh-chandak.jpg', '2026–2027', 27, true),
  ('Chirag Turkar', 'Finance Main Coordinator', 'SY_COORDINATOR', 'FINANCE', NULL, '/team/chirag-turkar.jpg', '2026–2027', 28, true),
  ('Krushnal Gawande', 'Finance Joint Coordinator', 'SY_COORDINATOR', 'FINANCE', NULL, '/team/krushnal-gawande.jpg', '2026–2027', 29, true),
  ('Umair Khan', 'Sports Main Coordinator', 'SY_COORDINATOR', 'SPORTS', NULL, '/team/umair-khan.jpg', '2026–2027', 30, true),
  ('Shrinivas Thakur', 'Sports Joint Coordinator', 'SY_COORDINATOR', 'SPORTS', NULL, '/team/shrinivas-thakur.jpg', '2026–2027', 31, true),
  ('Mayuri Kadam', 'Alumni & Relations Main Coordinator', 'SY_COORDINATOR', 'ALUMNI', NULL, '/team/mayuri-kadam.jpg', '2026–2027', 32, true),

  -- Faculty Dignitaries
  ('Dr. Ankush Sawarkar', 'ITSA Faculty Coordinator', 'FACULTY', 'OVERALL', 'Department of Information Technology', '/team/dr-ankush-sawarkar.jpg', '2026–2027', 33, true),
  ('Dr. C. P. Navdeti', 'Head of the Department', 'FACULTY', 'OVERALL', 'Department of Information Technology', '/team/dr-cp-navdeti.jpg', '2026–2027', 34, true),
  ('Dr. M. V. Vaidya', 'Dean Student Activities', 'FACULTY', 'OVERALL', 'SGGSIE&T, Nanded', '/team/dr-mv-vaidya.jpg', '2026–2027', 35, true);

-- ============================================================================
-- 4. AUTHENTIC ARCHIVE PHOTOGRAPHIC RECORDS (5 REAL IMAGES)
-- ============================================================================
INSERT INTO archive_records (title, description, image_url, year, event_name, display_order, is_published)
VALUES
  ('Archive Record 01', 'Computing Laboratory & Technical Sprint', '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.23%20PM.jpeg', 2025, 'Laboratory Session', 1, true),
  ('Archive Record 02', 'Auditorium Seminar & Technical Presentation', '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM.jpeg', 2025, 'Department Seminar', 2, true),
  ('Archive Record 03', 'Certificate & Award Felicitation Ceremony', '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.20%20PM.jpeg', 2025, 'Felicitation Ceremony', 3, true),
  ('Archive Record 04', 'Engineer''s Day Faculty Felicitation', '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM%20(1).jpeg', 2025, 'Engineer''s Day Celebration', 4, true),
  ('Archive Record 05', 'Guest & Coordinator Felicitation', '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.21%20PM.jpeg', 2025, 'Department Felicitation', 5, true);

-- ============================================================================
-- 5. BASELINE SAMPLE EVENTS (12 EVENTS)
-- ============================================================================
INSERT INTO events (title, description, category, year, status, is_published, display_order)
VALUES
  ('TECHNOVA', 'A technical symposium showcasing technology, engineering keynotes, student project exhibits, and algorithmic challenges.', 'TECHNICAL', 2026, 'UPCOMING', true, 1),
  ('CODEFORGE', 'A competitive programming, data structures, and problem-solving sprint across algorithmic problem sets.', 'TECHNICAL', 2026, 'UPCOMING', true, 2),
  ('BUILD LAB', 'A hands-on technical workshop covering modern systems architecture, performance tuning, and software craft.', 'TECHNICAL', 2026, 'UPCOMING', true, 3),
  ('SYSTEMS HACK SPRINT', 'A collaborative sprint where teams prototype solutions for real-world software and hardware challenges.', 'TECHNICAL', 2026, 'UPCOMING', true, 4),

  ('INTER-DEPARTMENT FOOTBALL', 'A fast-paced departmental football tournament testing teamwork, endurance, and athletic strategy.', 'SPORTS', 2026, 'UPCOMING', true, 5),
  ('CRICKET CUP', 'An inter-batch cricket series bringing together students in a multi-round championship fixture.', 'SPORTS', 2026, 'UPCOMING', true, 6),
  ('BADMINTON OPEN', 'An indoor racquet tournament featuring singles and doubles knockout fixtures.', 'SPORTS', 2026, 'UPCOMING', true, 7),
  ('CHESS CHAMPIONSHIP', 'A rapid time-control chess tournament testing tactical foresight and strategic calculation.', 'SPORTS', 2026, 'UPCOMING', true, 8),

  ('CULTURAL FEST', 'A vibrant showcase of student musical performances, stage productions, choreography, and artistic expressions.', 'CULTURAL', 2026, 'UPCOMING', true, 9),
  ('OPEN MIC', 'A creative stage providing students an open platform for acoustic sessions, spoken word, and performance art.', 'CULTURAL', 2026, 'UPCOMING', true, 10),
  ('FESTIVE NIGHT', 'An annual celebratory gathering uniting the student body through arts, heritage presentations, and community storytelling.', 'CULTURAL', 2026, 'UPCOMING', true, 11),
  ('DIGITAL ARTS EXHIBIT', 'An interactive gallery featuring student digital art, creative photography, and audiovisual installations.', 'CULTURAL', 2026, 'UPCOMING', true, 12);
