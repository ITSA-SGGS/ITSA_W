import { SampleEvent, CommitteeMember, GalleryItem } from '../types';

// SAMPLE TECHNICAL EVENTS (PLACEHOLDER DATA)
export const SAMPLE_TECHNICAL_EVENTS: SampleEvent[] = [
  {
    id: 'technova',
    index: '01',
    title: 'TECHNOVA',
    subtitle: 'Technical Symposium',
    description: 'A sample technical event showcasing technology, engineering keynotes, student project exhibits, and algorithmic challenges.',
    year: '2026',
    venue: 'Computing Laboratories',
    cover_image_url: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.23%20PM.jpeg',
  },
  {
    id: 'codeforge',
    index: '02',
    title: 'CODEFORGE',
    subtitle: 'Coding Competition',
    description: 'A sample competitive programming, data structures, and problem-solving sprint across algorithmic problem sets.',
    year: '2026',
    venue: 'Department Auditorium',
    cover_image_url: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM.jpeg',
  },
  {
    id: 'build-lab',
    index: '03',
    title: 'BUILD LAB',
    subtitle: 'Technical Workshop',
    description: 'A sample hands-on technical workshop covering modern systems architecture, performance tuning, and software craft.',
    year: '2026',
    venue: 'Systems Lab',
    cover_image_url: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.20%20PM.jpeg',
  },
  {
    id: 'hack-sprint',
    index: '04',
    title: 'SYSTEMS HACK SPRINT',
    subtitle: 'Rapid Engineering Hackathon',
    description: 'A sample 24-hour collaborative sprint where teams prototype solutions for real-world software and hardware challenges.',
    year: '2026',
    venue: 'Innovation Hub',
  },
];

// SAMPLE SPORTS EVENTS (PLACEHOLDER DATA)
export const SAMPLE_SPORTS_EVENTS: SampleEvent[] = [
  {
    id: 'football-cup',
    index: '01',
    title: 'INTER-DEPARTMENT FOOTBALL',
    subtitle: 'Sports Tournament',
    description: 'A sample fast-paced departmental football tournament testing teamwork, endurance, and athletic strategy.',
    year: '2026',
    venue: 'Institute Football Ground',
  },
  {
    id: 'cricket-cup',
    index: '02',
    title: 'CRICKET CUP',
    subtitle: 'Sports Tournament',
    description: 'A sample inter-batch cricket series bringing together students in a multi-round championship fixture.',
    year: '2026',
    venue: 'Institute Cricket Ground',
  },
  {
    id: 'badminton-open',
    index: '03',
    title: 'BADMINTON OPEN',
    subtitle: 'Sports Competition',
    description: 'A sample indoor racquet tournament featuring singles and doubles knockout fixtures.',
    year: '2026',
    venue: 'Indoor Sports Complex',
  },
  {
    id: 'chess-championship',
    index: '04',
    title: 'CHESS CHAMPIONSHIP',
    subtitle: 'Strategic Tournament',
    description: 'A sample rapid time-control chess tournament testing tactical foresight and strategic calculation.',
    year: '2026',
    venue: 'Department Hall',
  },
];

// SAMPLE CULTURAL EVENTS (PLACEHOLDER DATA)
export const SAMPLE_CULTURAL_EVENTS: SampleEvent[] = [
  {
    id: 'cultural-fest',
    index: '01',
    title: 'CULTURAL FEST',
    subtitle: 'Student Cultural Celebration',
    description: 'A sample vibrant showcase of student musical performances, stage productions, choreography, and artistic expressions.',
    year: '2026',
    venue: 'Main Auditorium',
    cover_image_url: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM%20(1).jpeg',
  },
  {
    id: 'open-mic',
    index: '02',
    title: 'OPEN MIC',
    subtitle: 'Music, Poetry & Performance',
    description: 'A sample creative stage providing students an open platform for acoustic sessions, spoken word, and performance art.',
    year: '2026',
    venue: 'Amphitheatre',
  },
  {
    id: 'festive-night',
    index: '03',
    title: 'FESTIVE NIGHT',
    subtitle: 'Cultural Evening',
    description: 'A sample annual celebratory gathering uniting the student body through arts, heritage presentations, and community storytelling.',
    year: '2026',
    venue: 'Department Quadrangle',
    cover_image_url: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.21%20PM.jpeg',
  },
  {
    id: 'digital-arts-exhibit',
    index: '04',
    title: 'DIGITAL ARTS EXHIBIT',
    subtitle: 'Creative Media Showcase',
    description: 'A sample interactive gallery featuring student digital art, creative photography, and audiovisual installations.',
    year: '2026',
    venue: 'Exhibition Lobby',
  },
];

// OFFICIAL COMMITTEE MEMBERS - ACADEMIC YEAR 2026–2027 (NO REGISTRATION NUMBERS)
export const CORE_COMMITTEE: CommitteeMember[] = [
  {
    id: 'tanishq-raut',
    name: 'Tanishq Raut',
    position: 'President',
    photo: '/team/tanishq-raut.jpg',
    tier: 'CORE',
  },
  {
    id: 'rahul-gulade',
    name: 'Rahul Gulade',
    position: 'Vice President',
    photo: '/team/rahul-gulade.jpg',
    tier: 'CORE',
  },
  {
    id: 'palak-baladwa',
    name: 'Palak Baladwa',
    position: 'Vice President',
    photo: '/team/palak-baladwa.jpg',
    tier: 'CORE',
  },
  {
    id: 'alok-singh',
    name: 'Alok Singh',
    position: 'Treasurer',
    photo: '/team/alok-singh.jpg',
    tier: 'CORE',
  },
  {
    id: 'aryan-kale',
    name: 'Aryan Kale',
    position: 'Vice Treasurer',
    photo: '/team/aryan-kale.jpg',
    tier: 'CORE',
  },
];

export const TY_LEADERSHIP: CommitteeMember[] = [
  {
    id: 'nandini-chintewad',
    name: 'Nandini Chintewad',
    position: 'Technical Head',
    photo: '/team/nandini-chintewad.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'TECHNICAL',
  },
  {
    id: 'pradnya-jadhav',
    name: 'Pradnya Jadhav',
    position: 'Technical Co-Head',
    photo: '/team/pradnya-jadhav.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'TECHNICAL',
  },
  {
    id: 'diksha-yelage',
    name: 'Diksha Yelage',
    position: 'Event Operations Head',
    photo: '/team/diksha-yelage.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'OPERATIONS',
  },
  {
    id: 'ghananil-shirpurkar',
    name: 'Ghananil Shirpurkar',
    position: 'Event Operations Co-Head',
    photo: '/team/ghananil-shirpurkar.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'OPERATIONS',
  },
  {
    id: 'aditya-mirajgave',
    name: 'Aditya Mirajgave',
    position: 'Media Head',
    photo: '/team/aditya-mirajgave.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'MEDIA',
  },
  {
    id: 'mrunal-raje',
    name: 'Mrunal Raje',
    position: 'Media Co-Head',
    photo: '/team/mrunal-raje.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'MEDIA',
  },
  {
    id: 'shrish-wadgaonkar',
    name: 'Shrish Wadgaonkar',
    position: 'Anchoring Head',
    photo: '/team/shrish-wadgaonkar.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'ANCHORING',
  },
  {
    id: 'shravani-kharwadkar',
    name: 'Shravani Kharwadkar',
    position: 'Anchoring Co-Head',
    photo: '/team/shravani-kharwadkar.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'ANCHORING',
  },
  {
    id: 'yash-bangalkar',
    name: 'Yash Bangalkar',
    position: 'Sports Head',
    photo: '/team/yash-bangalkar.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'SPORTS',
  },
  {
    id: 'vardhan-wanjari',
    name: 'Vardhan Wanjari',
    position: 'Sports Co-Head',
    photo: '/team/vardhan-wanjari.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'SPORTS',
  },
  {
    id: 'dharmaraj-deshmukh',
    name: 'Dharmaraj Deshmukh',
    position: 'Alumni & Relations Head',
    photo: '/team/dharmaraj-deshmukh.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'ALUMNI',
  },
  {
    id: 'mayuri-awalwar',
    name: 'Mayuri Awalwar',
    position: 'Alumni & Relations Co-Head',
    photo: '/team/mayuri-awalwar.jpg',
    tier: 'TY_LEADERSHIP',
    domain: 'ALUMNI',
  },
];

export const SY_COORDINATOR_GROUPS = [
  {
    domainName: 'OVERALL COORDINATION',
    domainKey: 'OVERALL',
    members: [
      { id: 'anand-soni', name: 'Anand Soni', position: 'Main Coordinator', photo: '/team/anand-soni.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'sarangi-aware', name: 'Sarangi Aware', position: 'Main Coordinator', photo: '/team/sarangi-aware.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'swarali-kulkarni', name: 'Swarali Kulkarni', position: 'Joint Coordinator', photo: '/team/swarali-kulkarni.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'samir-singh', name: 'Samir Singh', position: 'Joint Coordinator', photo: '/team/samir-singh.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'TECHNICAL',
    domainKey: 'TECHNICAL',
    members: [
      { id: 'pratik-bisen', name: 'Pratik Bisen', position: 'Technical Main Coordinator', photo: '/team/pratik-bisen.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'dipak-bhondekar', name: 'Dipak Bhondekar', position: 'Technical Joint Coordinator', photo: '/team/dipak-bhondekar.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'ANCHORING',
    domainKey: 'ANCHORING',
    members: [
      { id: 'shravani-dhole', name: 'Shravani Dhole', position: 'Anchoring Main Coordinator', photo: '/team/shravani-dhole.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'gayatri-yadav', name: 'Gayatri Yadav', position: 'Anchoring Joint Coordinator', photo: '/team/gayatri-yadav.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'MEDIA',
    domainKey: 'MEDIA',
    members: [
      { id: 'lokesh-badgujar', name: 'Lokesh Badgujar', position: 'Media Main Coordinator', photo: '/team/lokesh-badgujar.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'harsh-chandak', name: 'Harsh Chandak', position: 'Media Joint Coordinator', photo: '/team/harsh-chandak.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'FINANCE',
    domainKey: 'FINANCE',
    members: [
      { id: 'chirag-turkar', name: 'Chirag Turkar', position: 'Finance Main Coordinator', photo: '/team/chirag-turkar.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'krushnal-gawande', name: 'Krushnal Gawande', position: 'Finance Joint Coordinator', photo: '/team/krushnal-gawande.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'SPORTS',
    domainKey: 'SPORTS',
    members: [
      { id: 'umair-khan', name: 'Umair Khan', position: 'Sports Main Coordinator', photo: '/team/umair-khan.jpg', tier: 'SY_COORDINATOR' as const },
      { id: 'shrinivas-thakur', name: 'Shrinivas Thakur', position: 'Sports Joint Coordinators', photo: '/team/shrinivas-thakur.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
  {
    domainName: 'ALUMNI & RELATIONS',
    domainKey: 'ALUMNI',
    members: [
      { id: 'mayuri-kadam', name: 'Mayuri Kadam', position: 'Alumni & Relations Main Coordinator', photo: '/team/mayuri-kadam.jpg', tier: 'SY_COORDINATOR' as const },
    ],
  },
];

export const FACULTY_DIGNITARIES = [
  {
    name: 'Dr. Ankush Sawarkar',
    position: 'ITSA Faculty Coordinator',
    department: 'Department of Information Technology',
    photo: '/team/dr-ankush-sawarkar.jpg',
  },
  {
    name: 'Dr. C. P. Navdeti',
    position: 'Head of the Department',
    department: 'Department of Information Technology',
    photo: '/team/dr-cp-navdeti.jpg',
  },
  {
    name: 'Dr. M. V. Vaidya',
    position: 'Dean Student Activities',
    department: 'SGGSIE&T, Nanded',
    photo: '/team/dr-mv-vaidya.jpg',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'archive-01',
    index: '01',
    title: 'Archive Record 01',
    category: 'ARCHIVE',
    meta: 'ITSA · SGGSIE&T Records',
    image: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.23%20PM.jpeg',
    aspect: 'wide',
  },
  {
    id: 'archive-02',
    index: '02',
    title: 'Archive Record 02',
    category: 'ARCHIVE',
    meta: 'ITSA · SGGSIE&T Records',
    image: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM.jpeg',
    aspect: 'wide',
  },
  {
    id: 'archive-03',
    index: '03',
    title: 'Archive Record 03',
    category: 'ARCHIVE',
    meta: 'ITSA · SGGSIE&T Records',
    image: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.20%20PM.jpeg',
    aspect: 'square',
  },
  {
    id: 'archive-04',
    index: '04',
    title: 'Archive Record 04',
    category: 'ARCHIVE',
    meta: 'ITSA · SGGSIE&T Records',
    image: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.22%20PM%20(1).jpeg',
    aspect: 'square',
  },
  {
    id: 'archive-05',
    index: '05',
    title: 'Archive Record 05',
    category: 'ARCHIVE',
    meta: 'ITSA · SGGSIE&T Records',
    image: '/archive/WhatsApp%20Image%202026-09-02%20at%203.39.21%20PM.jpeg',
    aspect: 'square',
  },
];
