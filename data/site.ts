export type Course = {
  slug: 'caregiving' | 'phlebotomy' | 'dialysis'|'emt'|'german'|'paramedicine';
  title: string;
  cardTitle: string;
  duration: string;
  fee: string;
  entry: string;
  heroImage: string;
  summary: string;
  overview: string[];
  highlights: string[];
  accreditation?: string[];
  careerPaths?: string[];
  targetAudience?: string[];
  entryRequirements?: string[];
  technicalRequirements?: string | string[];
};

export const site = {
  name: 'Shifah Medical Training College',
  shortName: 'Shifah Medical College',
  tagline: 'Health through innovation and research',
  intake: 'July to September 2026 Intake Ongoing',
  location: 'Ambwere Plaza, 2nd Floor, Kitale Town',
  phone: '+254 142 068933',
  whatsapp: '+254 794882948',
  email: 'admin@shifahmedicalcollege.co.ke',
  heroSlides: [
    {
      image: '/images/hero1.jpeg',
      title: 'Best Medical Training College in Kitale, Kenya.',
      text: 'Modern, clean, and practical medical training designed to prepare students for real-world service and professional growth.'
    },
    {
      image: '/images/hero4.jpeg',
      title: 'Phlebotomy & Caregiving Courses in Kenya — Apply Today.',
      text: 'From safe phlebotomy to clinical support skills, our programs focus on practical competence and professional readiness.'
    },
    {
      image: '/images/hero3.jpeg',
      title: 'Accredited Healthcare Training — Kitale, Kenya.',
      text: 'Explore healthcare-focused training supported by strong values, industry alignment, and a clear admissions pathway.'
    }
  ],
  marqueeItems: [
    'May 2026 intake ongoing',
    'Applications now open',
    'Caregiving, Safe Phlebotomy & Dialysis Technology available',
    'Practical training with a strong professional focus'
  ],
  vision: 'To be a centre of quality training and professional excellence in healthcare education.',
  mission: 'To strive to equip students with the knowledge, practical skills, and ethical values needed to excel in their professional roles.',
  motto: 'Health through innovation and research',
  about:
    'Shifah Medical Training College is positioned as a career-focused medical training institution in Kitale, committed to equipping learners with practical healthcare skills, ethical values, and a strong foundation for professional growth.',
  values: [
    { title: 'Excellence', text: 'We pursue the highest standards in education, training, and healthcare service.' },
    { title: 'Integrity', text: 'We uphold honesty, transparency, and ethical conduct in all interactions.' },
    { title: 'Evidence-Based Practice', text: 'We value informed training and care guided by best evidence, expertise, and human dignity.' },
    { title: 'Compassion', text: 'We foster empathy, sensitivity, and respect for every individual.' },
    { title: 'Collaboration', text: 'We promote teamwork and interdisciplinary communication for better outcomes.' },
    { title: 'Innovation', text: 'We embrace creativity, adaptability, and continuous improvement in learning and service.' }
  ],
  departments: [
  'Department of Emergency Medicine',
  'Department of Pathology',
  'Department of Laboratory',
  'Department of Nursing',
  'Department of Linguistics'
],
  partners: [
    { name: 'NITA', image: '/images/NITA.jpeg' },
    { name: 'TVET / CDACC', image: '/images/TVET CDACC.jpeg' },
    { name: 'Skyrock', image: '/images/Skyrock.png' },
    { name: 'CareCall', image: '/images/CareCall.jpeg' },
    { name: 'Equity Afya', image: '/images/Equity Afya.jpeg' },
    { name: 'Kansas Department', image: '/images/Kansas Department.jpeg' },
    { name: 'Signet Institute', image: '/images/Signet Institute.jpeg' },
    { name: 'Stable Health Foundation', image: '/images/Stable Health Foundation.jpeg' },
    { name: 'Harpers Management', image: '/images/Harpers Management.jpeg' },
    { name: 'TVETA', image: '/images/TVETA.jpeg' },
  ],
  admissionsSteps: [
    'Choose your preferred course.',
    'Complete the online application form.',
    'Download the application form, consent form, and medical assessment form from downloads in the website.',
    'Fill out and submit the forms via the official email admin@shifahmedcollege.ac.ke.',
    'For medical assessment form, make sure you take the tests from Shifah Hospital or any other accredited Hospital facility.',
    'Pay the application fee of Ksh.1500 Through the official payment channels Below.',
    'Wait for admissions review and guidance from the college.',
    'Receive the next steps on reporting, fees, and Classes.'
  ],
  requirements: [
    'KCSE mean grade of D- and above.',
    'Healthcare providers may also qualify for selected programmes.',
    'Applicants should provide accurate contact and academic details during application.'
  ],
  
  feeNotes: [
    'Confirmed flyer fees captured below for the available highlighted programmes.',
    'Some additional charges such as exams, insurance, uniforms, or ID may apply and should be confirmed with the college administration.'
  ]
};

export const courses: Course[] = [
  {
    slug: 'caregiving',
    title: 'Caregiving',
    cardTitle: 'Caregiving level 4',
    duration: '6 Months',
    fee: 'KSh 75,000',
    entry: 'KCSE D- and above',
    heroImage: '/images/caregiving.png',
    summary: 'Gain hands-on skills in patient care, hygiene, mobility and elderly support. Start your healthcare career at Shifah Medical Training College today.',
    overview: [
      'Our CNA & Caregiving programme is designed for learners who want to build practical caregiving skills for patient support and daily care.',
      'It emphasizes responsibility, empathy, professional conduct, and readiness for care-focused environments including home care, residential facilities, and community support roles.'
    ],
    highlights: [
      'Patient support and personal care fundamentals',
      'Hygiene, mobility assistance and elderly care',
      'Professional communication and ethics',
      'Practical preparation for caregiving environments'
    ],
    accreditation: ['NITA accredited certificate recognized locally and internationally'],
    careerPaths: ['Home care', 'Residential facilities', 'Community support'],
    entryRequirements: ['KCSE mean grade of D- and above']
  },
  {
    slug: 'phlebotomy',
    title: 'Safe Phlebotomy',
    cardTitle: 'Safe Phlebotomy',
    duration: '12 Weeks',
    fee: 'KSh 39,000',
    entry: 'KCSE D- and above',
    heroImage: '/images/phlebotomy.png',
    summary: 'Foundational knowledge and hands-on skills in phlebotomy, preparing healthcare workers to perform safe, ethical, and accurate blood specimen collection.',
    overview: [
      'This short course provides foundational knowledge and hands-on skills in phlebotomy, preparing healthcare workers to perform safe, ethical, and accurate blood specimen collection.',
      'The course follows a blended approach, combining online theory with supervised practical experience.'
    ],
    highlights: [
      'Safe specimen collection practices',
      'Ethical and accurate blood collection procedures',
      'Professional patient interaction',
      'Clinical hygiene and procedural confidence'
    ],
    targetAudience: [
      'Nursing students and professionals',
      'Laboratory technicians and assistants',
      'Clinical officers and medical students',
      'Healthcare workers needing phlebotomy skills',
      'Public health professionals'
    ],
    entryRequirements: [
      'KCSE Certificate (Grade D or D- for current healthcare students)',
      'Healthcare background or current practice in a medical field preferred'
    ],
    technicalRequirements: 'Basic computer skills for online learning components',
  },
  {
    slug: 'emt',
    title: 'Emergency Medical Technology(EMT)',
    cardTitle: 'Emergency Medical Technology(EMT)',
    duration: '1 Year',
    fee: 'KSh 58,000',
    entry: 'KCSE D- and above',
    heroImage: '/images/emt.png',
    summary: 'The Emergency Medical Technology (EMT) program equips students with the essential knowledge and practical skills required to provide immediate life-saving care during medical emergencies.',
    overview: [
      'Students are trained to assess patients, stabilize injuries, administer first aid, perform CPR, and safely transport patients to healthcare facilities. The course combines classroom learning with.', 
      'hands-on practical sessions and emergency response simulations to prepare graduates for real-world emergency situations.'
    ],
    highlights: [
      'Basic Life Support (BLS)',
      'Cardiopulmonary Resuscitation (CPR)',
      'Patient Assessment and Emergency Care',
      'Trauma and First Aid Management',
      'Airway Management',
      'Ambulance Operations and Patient Transport',
      'Disaster Preparedness and Mass Casualty Response',
      'Infection Prevention and Patient Safety'
    ],
    targetAudience: [
      'KCSE graduates interested in healthcare careers',
      'Individuals aspiring to work in ambulance services',
      'Fire and rescue personnel',
      'Security officers',
      'Community first responders',
      'NGO and humanitarian workers',
      'Individuals seeking a career in emergency medicine'
    ],
    entryRequirements: [
      'KCSE Mean Grade D- and Above',
'Passion for emergency medical care',
'Good communication and interpersonal skills',
'Physically and mentally fit to undertake practical emergency training'
    ],
    technicalRequirements: 'Basic computer skills for online learning components'
  },
  {
    slug: 'german',
    title: 'German Language',
    cardTitle: 'Certificate in German Language',
    duration: '2-3 Months',
    fee: 'KSh 16,500 for A1&A2 And 20,000 for B1&B2',
    entry: 'Open to all',
    heroImage: '/images/german.png',
    summary: 'The German Language program equips learners with practical communication skills for study, employment, and migration opportunities in Germany, Austria, and Switzerland.',
    overview: [
      'The course develops proficiency in speaking, listening, reading, and writing while introducing learners to German culture.',
      'workplace communication, and healthcare terminology. Students are prepared for internationally recognized German language examinations from A1 through B2.'
    ],
    highlights: [
      'level A1 2 Months duration',
      'level A2 2 Months duration',
      'level B1 3 Months duration',
      'level B2 3 Months duration'
    ],
    targetAudience: [
      'Healthcare professionals',
'Caregivers',
'Nursing students',
'Medical students',
'Individuals planning to study abroad',
'Job seekers targeting Germany and other German-speaking countries',
'Anyone interested in learning German'
    ],
    entryRequirements: [
      'National ID or Passport',
'Minimum age of 18 years (recommended)',
'No prior knowledge of German required for A1 level',
'Commitment to complete the selected language level'
    ],
    technicalRequirements: [
      'Laptop, tablet, or smartphone',
      'Reliable internet connection (for online sessions)',
      'Headset with microphone',
      'Email address',
      'Notebook and writing materials',
      'Access to online learning resources'
    ]
  },
  {
    slug: 'paramedicine',
    title: 'Diploma in Paramedicine',
    cardTitle: 'Diploma in Paramedicine',
    duration: '2 years',
    fee: 'KSh 58,000/term',
    entry: 'KCSE C plain',
    heroImage: '/images/paramedicine.png',
    summary: 'The Diploma in Paramedicine prepares students to deliver advanced pre-hospital emergency medical care.',
    overview: [
      'Learners acquire the clinical knowledge, technical skills, and professional competence.', 
      'needed to assess, treat, and safely transport critically ill or injured patients. The program integrates classroom instruction with.', 
      'extensive practical training, hospital clinical rotations, and ambulance field experience.'
      ],
    highlights: [
     'Advanced Patient Assessment',
'Emergency Pharmacology',
'Trauma and Critical Care',
'Advanced Cardiac Life Support',
'Medical and Surgical Emergencies',
'Airway and Respiratory Management',
'Obstetric and Pediatric Emergencies',
'Disaster Management',
'Clinical Practice and Ambulance Operations',
'Leadership and Emergency Medical Services Management',
    ],
    targetAudience: [
      'EMT graduates',
'Healthcare professionals seeking career advancement',
'KCSE graduates interested in emergency medicine',
'Clinical officers and nurses wishing to specialize',
'Individuals pursuing careers in ambulance and rescue services',
    ],
    entryRequirements: [
     'KCSE Mean Grade C (Plain) or equivalent',
'Minimum C in Biology',
'Minimum C in English or Kiswahili',
'Minimum C in Chemistry, Physics, or Mathematics',
'Certificate in Emergency Medical Technology (EMT) from a recognized institution',
    ],
    technicalRequirements: [
      'National ID or Passport',
      'Laptop (recommended)',
      'Basic computer literacy',
      'Internet access for e-learning activities',
      'Medical examination report',
      'Clinical uniform/PPE for practical training',
      'Notebook and scientific calculator (recommended)'
    ],
  },
  {
    slug: 'dialysis',
    title: 'Certificate in Dialysis Technology',
    cardTitle: 'Dialysis Technology',
    duration: '6 Months',
    fee: 'Contact admissions for final fee guidance',
    entry: 'Background in health related courses',
    heroImage: '/images/dialysis.png',
    summary: 'A technical programme introducing students to dialysis processes, machine handling, patient monitoring, and clinical response in renal care settings.',
    overview: [
      'Dialysis is the process of removing excess water, solutes and toxins from the blood through an artificial manner using medical equipment or machinery. It is generally applied to those suffering from kidney ailments or whose kidneys have stopped natural functioning.',
      'A dialysis technician assembles the machine, ensures it is in working order and sterile, checks the patient chart, administers local anaesthesia, and inserts the needle to start dialysis according to prescription.',
      "During dialysis, the technician monitors anticoagulant and fluid rates, adjusts them as needed, ensures the patient is in the proper position, and responds to any alarms or emergencies. After dialysis, the technician disconnects and cleans the machine and records the patient's vital signs."
    ],
    highlights: [
      'Machine assembly, preparation and sterilization',
      'Patient monitoring during dialysis sessions',
      'Anticoagulant and fluid rate management',
      'Response to alarms, procedures, and clinical routines',
      'Post-dialysis documentation and patient care'
    ],
    entryRequirements: [
      'Background in health-related courses',
      'Healthcare providers are also eligible'
    ]
  }
];
