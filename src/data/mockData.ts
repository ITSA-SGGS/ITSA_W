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
  },
  {
    id: 'codeforge',
    index: '02',
    title: 'CODEFORGE',
    subtitle: 'Coding Competition',
    description: 'A sample competitive programming, data structures, and problem-solving sprint across algorithmic problem sets.',
    year: '2026',
  },
  {
    id: 'build-lab',
    index: '03',
    title: 'BUILD LAB',
    subtitle: 'Technical Workshop',
    description: 'A sample hands-on technical workshop covering modern systems architecture, performance tuning, and software craft.',
    year: '2026',
  },
  {
    id: 'hack-sprint',
    index: '04',
    title: 'SYSTEMS HACK SPRINT',
    subtitle: 'Rapid Engineering Hackathon',
    description: 'A sample 24-hour collaborative sprint where teams prototype solutions for real-world software and hardware challenges.',
    year: '2026',
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
  },
  {
    id: 'cricket-cup',
    index: '02',
    title: 'CRICKET CUP',
    subtitle: 'Sports Tournament',
    description: 'A sample inter-batch cricket series bringing together students in a multi-round championship fixture.',
    year: '2026',
  },
  {
    id: 'badminton-open',
    index: '03',
    title: 'BADMINTON OPEN',
    subtitle: 'Sports Competition',
    description: 'A sample indoor racquet tournament featuring singles and doubles knockout fixtures.',
    year: '2026',
  },
  {
    id: 'chess-championship',
    index: '04',
    title: 'CHESS CHAMPIONSHIP',
    subtitle: 'Strategic Tournament',
    description: 'A sample rapid time-control chess tournament testing tactical foresight and strategic calculation.',
    year: '2026',
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
  },
  {
    id: 'open-mic',
    index: '02',
    title: 'OPEN MIC',
    subtitle: 'Music, Poetry & Performance',
    description: 'A sample creative stage providing students an open platform for acoustic sessions, spoken word, and performance art.',
    year: '2026',
  },
  {
    id: 'festive-night',
    index: '03',
    title: 'FESTIVE NIGHT',
    subtitle: 'Cultural Evening',
    description: 'A sample annual celebratory gathering uniting the student body through arts, heritage presentations, and community storytelling.',
    year: '2026',
  },
  {
    id: 'digital-arts-exhibit',
    index: '04',
    title: 'DIGITAL ARTS EXHIBIT',
    subtitle: 'Creative Media Showcase',
    description: 'A sample interactive gallery featuring student digital art, creative photography, and audiovisual installations.',
    year: '2026',
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
    id: 'gallery-01',
    title: 'THE KEYNOTE HALL',
    caption: 'Annual National Technical Symposium inauguration at SGGSIE&T Auditorium.',
    year: '2026',
    category: 'SYMPOSIUM',
    aspect: 'wide',
    meta: 'ISO 400 · 35mm · f/2.0',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 'gallery-02',
    title: 'MIDNIGHT HACKATHON FLOOR',
    caption: 'Hour 18 of the 24-hour sprint in the Central Computing Facility.',
    year: '2026',
    category: 'HACKATHON',
    aspect: 'tall',
    meta: 'ISO 1600 · 24mm · f/1.8',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'gallery-03',
    title: 'SYSTEMS & LINUX LAB',
    caption: 'Students compiling custom kernel modules and tuning memory parameters.',
    year: '2026',
    category: 'WORKSHOP',
    aspect: 'square',
    meta: 'ISO 800 · 50mm · f/2.8',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'gallery-04',
    title: 'HARDWARE PROTOTYPING CRUCIBLE',
    caption: 'Soldering sensor telemetry nodes and robotics motor controllers.',
    year: '2025',
    category: 'PROJECTS',
    aspect: 'wide',
    meta: 'ISO 640 · 85mm · f/2.2',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'gallery-05',
    title: 'OPEN SOURCE SPRINT',
    caption: 'Collaborative code reviews and pull requests merged during sprint day.',
    year: '2025',
    category: 'CODE SPRINT',
    aspect: 'square',
    meta: 'ISO 500 · 28mm · f/2.0',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'gallery-06',
    title: 'ALUMNI FIRESIDE EXCHANGE',
    caption: 'SGGSIE&T alumni sharing industry architecture lessons with undergraduates.',
    year: '2025',
    category: 'COMMUNITY',
    aspect: 'tall',
    meta: 'ISO 1000 · 35mm · f/1.4',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
  }
];
