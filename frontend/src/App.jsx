import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Lock, 
  LogOut, 
  ChevronRight, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Users, 
  Check, 
  X,
  Mail,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  Menu,
  ArrowLeft,
  Search,
  Globe,
  CirclePlay,
  ExternalLink,
  Megaphone
} from 'lucide-react';
import NammaMlaAnalytics from './NammaMlaAnalytics';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';


const CM_VIJAY_YOUTUBE_LINKS = [
  {
    title: 'CM Vijay Latest Speeches',
    subtitle: 'Recent public speeches and updates',
    url: 'https://www.youtube.com/results?search_query=CM+Vijay+latest+speech'
  },
  {
    title: 'CM Vijay Public Meetings',
    subtitle: 'Meeting videos and event coverage',
    url: 'https://www.youtube.com/results?search_query=CM+Vijay+public+meeting'
  },
  {
    title: 'CM Vijay News Updates',
    subtitle: 'Latest news coverage on YouTube',
    url: 'https://www.youtube.com/results?search_query=CM+Vijay+news+latest'
  },
  {
    title:'MLA Balamurugan',
    subtitle: 'latest news of Balamurugan',
    url:'https://www.youtube.com/shorts/XmIpdUCum-o'
  }
];

function SocialBrandIcon({ type, size = 20, color = 'currentColor' }) {
  if (type === 'twitter') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (type === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11.5" fill={color} />
        <path d="M13 6.5V3.5c-.6-.1-1.4-.2-2.2-.2-2.7 0-4.6 1.6-4.6 4.7v2.4H3.5v3h2.7V21h3.5v-7.6h2.5l.5-3H9.7V8.4c0-1 .3-1.6 1-1.9Z" fill="#ffffff" />
      </svg>
    );
  }

  if (type === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none" />
      </svg>
    );
  }

  return <Globe size={size} color={color} />;
}

const TVK_SOCIAL_CHANNELS = [
  {
    title: 'TVK Official X / Twitter',
    subtitle: 'Party announcements, speeches, and live updates',
    url: 'https://x.com/TVKOnline',
    iconType: 'twitter',
    iconColor: '#1DA1F2'
  },
  {
    title: 'TVK Facebook Page',
    subtitle: 'Events, public messages, and community posts',
    url: 'https://www.facebook.com/TVKPartyOfficial',
    iconType: 'facebook',
    iconColor: '#1877F2'
  },
  {
    title: 'TVK Instagram',
    subtitle: 'Short videos, campaign highlights, and visuals',
    url: 'https://www.instagram.com/tvkpartyofficial/',
    iconType: 'instagram',
    iconColor: '#E1306C'
  },
  {
    title: 'TVK Official Website',
    subtitle: 'News, policy updates, and party initiatives',
    url: 'https://www.tvkparty.org/',
    iconType: 'website',
    iconColor: 'var(--primary-green)'
  }
];

const PUBLIC_POLL_SUMMARY = [
  {
    title: 'Public Service Feedback',
    status: 'Active',
    votes: '2,184',
    result: '82% positive response'
  },
  {
    title: 'Road Repair Priority',
    status: 'Completed',
    votes: '1,436',
    result: 'North Ambattur selected'
  },
  {
    title: 'Water Supply Survey',
    status: 'Active',
    votes: '968',
    result: '64% request timing changes'
  }
];

const LATEST_NEWS = [
  {
    date: '2026-07-05',
    headline: 'MLA Balamurugan Inaugurates New Road Development Project in Ward 80',
    description: 'Ambattur MLA Shri Balamurugan inaugurated a new road development project worth ₹2.5 crore in Ward 80, aimed at improving connectivity and infrastructure for residents.',
    category: 'Development'
  },
  {
    date: '2026-07-03',
    headline: 'Free Health Camp Organized at Ambattur Government Hospital',
    description: 'A free general health and eye check-up camp was organized in collaboration with the Tamil Nadu Health Department. Over 1,200 residents benefited from the camp.',
    category: 'Health'
  },
  {
    date: '2026-06-28',
    headline: 'Water Supply Scheme Expansion Approved for North Ambattur',
    description: 'The Tamil Nadu government has approved a ₹1.8 crore water supply expansion project for North Ambattur, benefiting over 5,000 households with improved water access.',
    category: 'Infrastructure'
  },
  {
    date: '2026-06-25',
    headline: 'CM Vijay Announces New Industrial Park in Ambattur Region',
    description: 'Chief Minister Vijay announced the establishment of a new industrial park in the Ambattur region, expected to create 10,000+ job opportunities for local youth.',
    category: 'Announcement'
  },
  {
    date: '2026-06-20',
    headline: 'Ambattur Constituency Grievance Redressal Camp on July 10',
    description: 'MLA Balamurugan will hold a special grievance redressal camp on July 10 at the Ambattur Panchayat Union Office. Residents are encouraged to participate.',
    category: 'Event'
  },
  {
    date: '2026-06-18',
    headline: 'Digital Literacy Program Launched for Ambattur Residents',
    description: 'A new digital literacy program has been launched to provide free computer and internet training for residents aged 18-60. Registrations are open at the constituency office.',
    category: 'Education'
  },
  {
    date: '2026-06-15',
    headline: 'Street Light Maintenance Drive Completed Across 12 Wards',
    description: 'The corporation completed a comprehensive street light maintenance drive covering 12 wards in Ambattur. Over 800 street lights were repaired or replaced.',
    category: 'Development'
  },
  {
    date: '2026-06-12',
    headline: 'Waste Management Awareness Campaign from July 1',
    description: 'A month-long waste management and segregation awareness campaign will begin from July 1 across all wards in Ambattur constituency.',
    category: 'Environment'
  }
];

const TRANSLATIONS = {
  ta: {
    portalTitle: "அம்பத்தூர் தொகுதி பொது சேவை இணையதளம்\nAmbattur Constituency Public Service Portal",
    meetMla: "அம்பத்தூர் சட்டமன்ற உறுப்பினர் பாலமுருகனைச் சந்தியுங்கள்\nMeet Ambattur MLA Balamurugan",
    raiseTrackGrievance: "உங்கள் குறைகளை சமர்ப்பித்து கண்காணிக்கவும்\nRaise and Track your Grievance",
    bookAppt: "சந்திப்பு முன்பதிவு\nBook Appointment",
    trackAppt: "சந்திப்பு கண்காணிப்பு\nTrack Appointment",
    submitGrievance: "புகார் சமர்ப்பித்தல்\nSubmit Grievance",
    trackGrievance: "புகார் கண்காணிப்பு\nTrack Grievance",
    grievancesReceived: "பெறப்பட்ட புகார்கள்\nGrievances Received",
    resolutionRate: "புகார் தீர்வு விகிதம்\nGrievance Resolution Rate",
    appointmentsFacilitated: "சந்திப்புகள் ஏற்பாடு செய்யப்பட்டுள்ளது\nAppointments Facilitated",
    officerLogin: "அதிகாரப்பூர்வ உள்நுழைவு:\nOfficer Login:",
    clickHere: "உள்நுழைய இங்கே கிளிக் செய்யவும்\nClick here for login",
    bioTitle: "அம்பத்தூர் சட்டமன்ற உறுப்பினர் பாலமுருகன்\nMeet Your MLA Balamurugan",
    bioText: "சட்டமன்ற உறுப்பினர் பாலமுருகன் அம்பத்தூர் தொகுதியின் அர்ப்பணிப்புள்ள பிரதிநிதி ஆவார். தனது பதவிக்காலத்தில், டிஜிட்டல் தீர்வுகள் மூலம் குடிமக்கள் நிர்வாகத்தை மிகவும் வெளிப்படையானதாகவும் அணுகக்கூடியதாகவும் மாற்றுவதில் கவனம் செலுத்தியுள்ளார். அவரது தலைமையில், தொகுதி அலுவலகம் குடிநீர் விநியோகம், சாலை பராமரிப்பு மற்றும் அடிப்படை குடிமைச் சேவைகள் உள்ளிட்ட உள்ளூர் பொதுப் பிரச்சினைகளைத் தீர்ப்பதற்கு முன்னுரிமை அளித்துள்ளது.",
    bioQuote: '"ஒவ்வொரு குடிமகனுக்கும் நேரடியாகச் சேவையாற்றும் ஒரு பொறுப்பான ஆட்சி முறையை உருவாக்குவதே எங்களது குறிக்கோள். இந்த ஆன்லைன் போர்ட்டல் மூலம், மக்களுக்கும் பொதுச் சேவைகளுக்கும் இடையே உள்ள இடைவெளியைக் குறைப்பதை நோக்கமாகக் கொண்டுள்ளோம், உங்கள் குரல் கேட்கப்பட்டு உடனடியாக நடவடிக்கை எடுக்கப்படுவதை உறுதிசெய்கிறோம்."',
    bookingTitle: "பொதுமக்கள் சந்திப்பு முன்பதிவு\nBook Citizens Consultation",
    bookingDesc: "சந்திப்புக்கான தேதி, நேரம் மற்றும் தங்களின் விபரங்களை உள்ளிடவும்.\nPlease choose an available date, slot timing, and enter citizen information.",
    selectDate: "1. கிடைக்கக்கூடிய தேதியைத் தேர்ந்தெடுக்கவும்\n1. Select Available Date",
    chooseSlot: "2. நேரத்தைத் தேர்ந்தெடுக்கவும்\n2. Choose Time Slot",
    citizenForm: "3. பொதுமக்கள் பதிவு படிவம்\n3. Citizen Registration Form",
    noSlots: "தற்போது சந்திப்புகள் ஏதும் இல்லை. விரைவில் சரிபார்க்கவும்.\nNo current available slots. Check back soon.",
    booked: "முன்பதிவு செய்யப்பட்டுள்ளது\nBooked",
    available: "கிடைக்கக்கூடியது\nAvailable",
    trackApptTitle: "சந்திப்பு நிலை கண்காணிப்பு\nTrack Appointment Status",
    trackApptDesc: "தங்களின் கைபேசி எண் மற்றும் குறுஞ்செய்தி மூலம் பெறப்பட்ட டோக்கனை உள்ளிடவும்.\nEnter your registered mobile number and appointment ID / Token to check active schedule status.",
    submitGrievanceTitle: "பொது குறைபாடு சமர்ப்பித்தல்\nSubmit Public Grievance",
    submitGrievanceDesc: "தங்களின் விபரங்கள் மற்றும் புகார் பற்றிய விரிவான தகவல்களை உள்ளிடவும்.\nFile local issues regarding water, roads, sanitation, or electricity. Attach relevant photos.",
    trackGrievanceTitle: "புகார் நிலை கண்காணிப்பு\nTrack Grievance Status",
    trackGrievanceDesc: "புகாரின் நிலையை கண்காணிக்க தங்களின் புகார் எண் மற்றும் கைபேசி எண்ணை உள்ளிடவும்.\nEnter your registered mobile number and Grievance ID to check the active resolution progress.",
    bookApptDetails: "சட்டமன்ற உறுப்பினர் பாலமுருகனுடன் தொகுதி அலுவலகத்தில் தனிப்பட்ட சந்திப்பை திட்டமிடுங்கள். வாராந்திர கிடைக்கும் தன்மையின் அடிப்படையில் சந்திப்புகள் தானாக உருவாக்கப்படுகின்றன.\nSchedule a personal consultation slot with MLA Balamurugan at the constituency office. Slots are dynamically generated based on weekly availability.",
    trackApptDetails: "உங்கள் சந்திப்பு நிலை, வரும் நேரம் ஆகியவற்றை சரிபார்த்து, அதிகாரப்பூர்வ சந்திப்பு டோக்கனைப் பதிவிறக்கவும் அல்லது அச்சிடவும்.\nVerify your meeting slot status, view reporting times, and download or print your official consultation receipt token.",
    submitGrievanceDetails: "தெரு விளக்குகள், சுகாதாரம், சாலைகள் மற்றும் குடிநீர் விநியோகம் தொடர்பான பொது அல்லது சமூக பிரச்சினைகளை நேரடியாக தொகுதி அலுவலக தரவுத்தளத்தில் சமர்ப்பிக்கவும்.\nSubmit public or community issues regarding street lights, sanitation, roads, and water supply directly to the constituency office database.",
    trackGrievanceDetails: "சட்டமன்ற உறுப்பினரின் குறைதீர்க்கும் குழுவால் எழுதப்பட்ட செயலில் உள்ள தீர்வு நிலை, துறை ஒதுக்கீடு விவரங்கள் மற்றும் அதிகாரப்பூர்வ குறிப்புகளைக் கண்காணிக்கவும்.\nMonitor the active resolution status, department assignment details, and official notes written by the MLA's grievance team.",
    getSlot: "முன்பதிவு செய்\nGet a Slot",
    checkStatus: "நிலையைச் சரிபார்\nCheck Status",
    fileGrievance: "புகார் செய்\nFile Grievance",
    trackStatus: "நிலையைக் கண்காணி\nTrack Status",
    fullNameLabel: "முழு பெயர் *\nFull Name *",
    mobileLabel: "கைபேசி எண் *\nMobile Number *",
    addressLabel: "முகவரி *\nAddress *",
    purposeLabel: "சந்திப்பின் நோக்கம் *\nPurpose of Meeting *",
    optionalFields: "விருப்பத்திற்குரிய புலங்கள்\nOptional Fields",
    aadhaarLabel: "ஆதார் அட்டை எண்\nAadhaar Card Number",
    wardLabel: "தொகுதி வார்டு எண்\nConstituency Ward Number",
    complaintCategory: "புகார் வகை (குறைபாடுகளுக்கு)\nComplaint Category (for Grievances)",
    emailLabel: "மின்னஞ்சல் முகவரி\nEmail Address",
    back: "பின்னால்\nBack",
    submit: "சமர்ப்பி\nSubmit",
    officeAddressHeader: "அலுவலக முகவரி\nOffice Address",
    officeAddressContent: [
      "மாண்புமிகு சட்டமன்ற உறுப்பினர் அலுவலகம்\nMLA Office",
      "அம்பத்தூர் தொகுதி\nAmbattur Constituency",
      "சென்னை, தமிழ்நாடு\nChennai, Tamil Nadu"
    ],
    adminInCharge: "நிர்வாக அதிகாரி பொறுப்பில்.\nAdmin Officer in charge.",
    workingHoursHeader: "வேலை நேரம்\nWorking Hours",
    workingHoursDays: "திங்கள் - வெள்ளி: காலை 09:00 - மாலை 05:00\nMonday - Friday: 09:00 AM - 05:00 PM",
    workingHoursWeekend: "சனி & ஞாயிறு: விடுமுறை\nSaturday & Sunday: Closed",
    workingHoursHoliday: "* அனைத்து அரசு விடுமுறை நாட்களிலும் மூடப்படும்.\n* Closed on all public holidays.",
    helplineHeader: "உதவி எண்கள் & மின்னஞ்சல்\nHelplines & Email",
    helplineLabel: "உதவி எண்:\nHelpline:",
    privacyPolicy: "தனியுரிமைக் கொள்கை\nPrivacy Policy",
    allRightsReserved: "© 2026 சட்டமன்ற உறுப்பினர் குடிமக்கள் போர்டல். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.\n© 2026 MLA Citizen Portal. All rights reserved.",
    developedFor: "அம்பத்தூர் சட்டமன்ற உறுப்பினர் பாலமுருகன் அலுவலகத்திற்காக உருவாக்கப்பட்டது - தமிழ்நாடு சட்டமன்ற பேரவை.\nDeveloped for the Office of MLA Balamurugan, Ambattur - Tamil Nadu Legislative Assembly.",
    grievanceRecord: "குறைபாடு பதிவு\nGRIEVANCE RECORD",
    citizenName: "குடிமகன் பெயர்:\nCitizen Name:",
    category: "வகை:\nCategory:",
    wardNumberLabel: "வார்டு எண்:\nWard Number:",
    descriptionLabel: "விளக்கம்:\nDescription:",
    officialComments: "அதிகாரப்பூர்வ கருத்துகள் / பதில்:\nOfficial Comments / Response:",
    submittedProof: "சமர்ப்பிக்கப்பட்ட ஆதார இணைப்புகள்:\nSubmitted Proof Attachments:",
    statusHistory: "நிலை முன்னேற்ற வரலாறு:\nStatus Progression History:",
    statusLabel: "நிலை:\nStatus:",
    appointmentToken: "சந்திப்பு டோக்கன்\nAPPOINTMENT TOKEN",
    purpose: "நோக்கம்:\nPurpose:",
    meetingDate: "சந்திப்பு தேதி:\nMeeting Date:",
    meetingTime: "சந்திப்பு நேரம்:\nMeeting Time:",
    reportingTime: "வருகை நேரம்:\nReporting Time:",
  }
};

function renderTextWithRedStar(str) {
  if (!str) return null;
  const segments = str.split('*');
  return segments.reduce((acc, segment, idx) => {
    if (idx === 0) return [segment];
    return [...acc, <span key={idx} style={{ color: '#ef4444', marginLeft: '2px', marginRight: '2px', fontWeight: 'bold' }}>*</span>, segment];
  }, []);
}

function BilingualText({ text, ta, en }) {
  let tamilText = ta || '';
  let englishText = en || '';

  if (text) {
    const parts = text.split('\n');
    tamilText = parts[0] || '';
    englishText = parts[1] || '';
  }

  if (!tamilText && !englishText) return null;

  if (!englishText) {
    return <span>{renderTextWithRedStar(tamilText)}</span>;
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'inherit', textAlign: 'inherit' }}>
      <span style={{ fontSize: '1.05em', fontWeight: 'bold' }}>{renderTextWithRedStar(tamilText)}</span>
      <span style={{ fontSize: '0.85em', opacity: 0.85, fontWeight: 'normal', marginTop: '2px' }}>{renderTextWithRedStar(englishText)}</span>
    </span>
  );
}

function getTicketProgress(type, status) {
  const normalizedStatus = (status || '').toUpperCase();

  if (type === 'appointment') {
    if (normalizedStatus === 'CANCELLED') {
      return {
        steps: ['Raised', 'Confirmed', 'Completed'],
        currentIndex: 2,
        currentLabel: 'Cancelled',
        description: 'The appointment was cancelled.',
        cancelled: true,
      };
    }

    if (normalizedStatus === 'COMPLETED') {
      return {
        steps: ['Raised', 'Confirmed', 'Completed'],
        currentIndex: 2,
        currentLabel: 'Completed',
        description: 'The visit has been completed.',
      };
    }

    if (normalizedStatus === 'CONFIRMED') {
      return {
        steps: ['Raised', 'Confirmed', 'Completed'],
        currentIndex: 1,
        currentLabel: 'Confirmed',
        description: 'The appointment is confirmed and ready.',
      };
    }

    if (normalizedStatus === 'RESCHEDULED') {
      return {
        steps: ['Raised', 'Confirmed', 'Completed'],
        currentIndex: 1,
        currentLabel: 'Rescheduled',
        description: 'The appointment was moved to a new slot.',
      };
    }

    return {
      steps: ['Raised', 'Confirmed', 'Completed'],
      currentIndex: 0,
      currentLabel: 'Pending',
      description: 'The request is waiting for officer confirmation.',
    };
  }

  if (type === 'grievance') {
    if (normalizedStatus === 'RESOLVED') {
      return {
        steps: ['Filed', 'Review', 'Resolved'],
        currentIndex: 2,
        currentLabel: 'Resolved',
        description: 'The grievance has been resolved.',
      };
    }

    if (normalizedStatus === 'REJECTED') {
      return {
        steps: ['Filed', 'Review', 'Resolved'],
        currentIndex: 2,
        currentLabel: 'Rejected',
        description: 'The grievance was rejected.',
        rejected: true,
      };
    }

    if (normalizedStatus === 'IN_PROGRESS') {
      return {
        steps: ['Filed', 'Review', 'Resolved'],
        currentIndex: 1,
        currentLabel: 'In Progress',
        description: 'The complaint is being reviewed and actioned.',
      };
    }

    return {
      steps: ['Filed', 'Review', 'Resolved'],
      currentIndex: 0,
      currentLabel: 'Pending',
      description: 'The grievance is waiting for officer review.',
    };
  }

  return null;
}

function renderStageProgress(type, status, compact = false) {
  const progress = getTicketProgress(type, status);
  if (!progress) return null;

  return (
    <div className={`ticket-progress ${compact ? 'ticket-progress-compact' : ''}`}>
      <div className="ticket-progress-header">
        <span className={`ticket-progress-label ${progress.cancelled ? 'cancelled' : ''} ${progress.rejected ? 'rejected' : ''}`}>
          Stage: {progress.currentLabel}
        </span>
        <span className="ticket-progress-steps">{progress.steps.join(' → ')}</span>
      </div>
      <div className="ticket-progress-track">
        {progress.steps.map((step, index) => {
          const isActive = index <= progress.currentIndex;
          const isCurrent = index === progress.currentIndex;
          return (
            <div
              key={`${type}-${step}-${index}`}
              className={`ticket-progress-segment ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
            />
          );
        })}
      </div>
      <div className="ticket-progress-meta">
        <span className="ticket-progress-caption">{progress.description}</span>
      </div>
    </div>
  );
}

function AnimatedCounter({ end, duration = 2000, suffix = "", start = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTimestamp = null;
    const endNum = parseInt(end, 10);
    if (isNaN(endNum)) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      setCount(Math.floor(easeProgress * endNum));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endNum);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

function StatsCounters({ lang }) {
  const [stats, setStats] = useState({
    received: 1147,
    rate: 96,
    facilitated: 725
  });
  
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem('public_stats_cache');
    const today = new Date().toDateString();
    if (cached) {
      const data = JSON.parse(cached);
      if (data.date === today) {
        setStats(data.stats);
        return;
      }
    }
    const newStats = {
      received: 1147,
      rate: 96,
      facilitated: 725
    };
    localStorage.setItem('public_stats_cache', JSON.stringify({
      date: today,
      stats: newStats
    }));
    setStats(newStats);
  }, []);

  return (
    <div ref={containerRef} className="stats-counters-container" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      margin: '24px 0',
      padding: '16px 24px',
      background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      textAlign: 'center'
    }}>
      <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stat-icon" style={{ fontSize: '1.25rem' }}>⬆️</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-green)', margin: 0 }}>
            <AnimatedCounter end={stats.received} suffix="+" start={isVisible} />
          </h3>
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
          <BilingualText ta="பெறப்பட்ட புகார்கள்" en="Grievances Received" />
        </p>
      </div>

      <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stat-icon" style={{ fontSize: '1.25rem' }}>✅</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--saffron-orange)', margin: 0 }}>
            <AnimatedCounter end={stats.rate} suffix="%" start={isVisible} />
          </h3>
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
          <BilingualText ta="புகார் தீர்வு விகிதம்" en="Grievance Resolution Rate" />
        </p>
      </div>

      <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="stat-icon" style={{ fontSize: '1.25rem' }}>⬆️</span>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--navy-blue)', margin: 0 }}>
            <AnimatedCounter end={stats.facilitated} suffix="+" start={isVisible} />
          </h3>
        </div>
        <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
          <BilingualText ta="சந்திப்புகள் ஏற்பாடு செய்யப்பட்டுள்ளது" en="Appointments Facilitated" />
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const lang = 'ta';
  
  
  const [currentView, setCurrentView] = useState('home'); // home, booking, success, admin-login, admin-dashboard, grievance-submit, grievance-success, grievance-track, appointment-track, whats-new
  const [voiceState, setVoiceState] = useState({ page: null, status: 'stopped' }); // status: 'stopped', 'playing', 'paused'
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Booking Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    address: '',
    purpose: '',
    aadhaarNumber: '',
    wardNumber: '',
    grievanceCategory: 'General',
    email: ''
  });
  const [bookingResult, setBookingResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Grievance Form State
  const [grievanceFormData, setGrievanceFormData] = useState({
    fullName: '',
    mobileNumber: '',
    address: '',
    email: '',
    constituency: 'Ambattur',
    wardNumber: '80',
    category: 'Water Supply',
    description: '',
    attachments: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [grievanceResult, setGrievanceResult] = useState(null);
  const [isRecordingGrievance, setIsRecordingGrievance] = useState(false);
  const recognitionRef = useRef(null);
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState(null); // null, 'ta-IN', 'en-US'

  const handleOpenSpeechModal = () => {
    setSpeechTranscript('');
    setSpeechLanguage(null);
    setShowSpeechModal(true);
  };

  const startRecognition = (selectedLang) => {
    setSpeechLanguage(selectedLang);
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Your browser does not support voice input.", "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang; 
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let accumulatedTranscript = '';
    setSpeechTranscript('');

    recognition.onstart = () => {
      setIsRecordingGrievance(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      accumulatedTranscript += finalTranscript;
      setSpeechTranscript(accumulatedTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        showNotification("Voice input failed: " + event.error, "error");
      }
    };

    recognition.onend = () => {
      setIsRecordingGrievance(false);
    };

    recognition.start();
  };

  const handleStopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecordingGrievance(false);
  };

  // Tracking States
  const [fetchedNews, setFetchedNews] = useState([]);
  const [trackGrievanceId, setTrackGrievanceId] = useState('');
  const [trackGrievancePhone, setTrackGrievancePhone] = useState('');
  const [trackedGrievance, setTrackedGrievance] = useState(null);

  const [trackAppointmentToken, setTrackAppointmentToken] = useState('');
  const [trackAppointmentPhone, setTrackAppointmentPhone] = useState('');
  const [trackedAppointment, setTrackedAppointment] = useState(null);
  
  // Admin Authentication & Dashboard state
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token') || '');
  const [adminView, setAdminView] = useState('appointments'); // appointments, availability, stats, grievances
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const withLoading = (promise, delayMs = 300) => {
    let completed = false;
    const timer = setTimeout(() => {
      if (!completed) {
        setGlobalLoading(true);
      }
    }, delayMs);

    return promise.finally(() => {
      completed = true;
      clearTimeout(timer);
      setGlobalLoading(false);
    });
  };

  const parseApiResponse = async (res) => {
    const rawText = await res.text();
    try {
      return JSON.parse(rawText || '{}');
    } catch {
      return { detail: rawText || res.statusText || 'Unknown error from server.' };
    }
  };

  const normalizeFetchError = (err, fallbackMessage) => {
    if (err instanceof TypeError) {
      return fallbackMessage || 'Unable to reach the backend server. Please ensure it is running and accessible.';
    }
    return err.message || fallbackMessage || 'An unknown error occurred.';
  };
  
  // Admin Data State
  const [adminAppointments, setAdminAppointments] = useState([]);
  const [adminAvailability, setAdminAvailability] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminGrievances, setAdminGrievances] = useState([]);
  const [adminSMSLogs, setAdminSMSLogs] = useState([]);
  const [grievanceSourceFilter, setGrievanceSourceFilter] = useState('ALL');
  const [importResult, setImportResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'appointments', 'grievances', or null
  const [expandedAppointments, setExpandedAppointments] = useState({});
  const [expandedGrievances, setExpandedGrievances] = useState({});
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null); // { message: '', type: 'success' | 'error' }
  const [adminProfile, setAdminProfile] = useState(null);
  const [passwordUpdateData, setPasswordUpdateData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordUpdateData.newPassword !== passwordUpdateData.confirmPassword) {
      showNotification("New passwords do not match.", "error");
      return;
    }
    if (passwordUpdateData.newPassword.length < 6) {
      showNotification("New password must be at least 6 characters.", "error");
      return;
    }
    
    fetch(API_BASE + '/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        old_password: passwordUpdateData.oldPassword,
        new_password: passwordUpdateData.newPassword
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Password change failed.');
        }
        return data;
      })
      .then(() => {
        setPasswordUpdateData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        showNotification("Password changed successfully!", "success");
      })
      .catch(err => {
        showNotification(err.message, "error");
      });
  };


  const toggleAppointmentExpanded = (id) => {
    setExpandedAppointments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGrievanceExpanded = (id) => {
    setExpandedGrievances(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const renderGrievanceDetailPane = (g) => {
    if (!g) return null;
    return (
      <div className="card grievance-detail-card" style={{ textAlign: 'left' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px'}}>
          <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem'}}>{g.id} Details</h3>
          <button type="button" className="btn btn-secondary" style={{padding: '4px 8px'}} onClick={(e) => { e.stopPropagation(); setSelectedGrievance(null); }}><X size={15} /></button>
        </div>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', marginBottom: '20px'}}>
          <div>
            <strong>Citizen:</strong> {g.citizen.full_name} ({g.citizen.mobile_number})
          </div>
          <div>
            <strong>Address:</strong> {g.citizen.address}
          </div>
          <div>
            <strong>Constituency/Ward:</strong> {g.constituency} / Ward {g.ward_number}
          </div>
          <div>
            <strong>Source:</strong> {g.source_type === 'MANUAL_IMPORT' ? `CM Helpline (${g.external_reference_id || 'No Ref'})` : 'Direct Portal'}
          </div>
          {g.received_at && (
            <div>
              <strong>Received At:</strong> {new Date(g.received_at).toLocaleString()}
            </div>
          )}

          <div>
            <strong>Description:</strong>
            <div style={{backgroundColor: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', marginTop: '6px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap'}}>{g.description}</div>
          </div>

          {/* Render Attachments */}
          {g.attachments && g.attachments.length > 0 && (
            <div>
              <strong>Attachments:</strong>
              <div className="attachments-grid">
                {g.attachments.map((att, idx) => (
                  <div key={idx} className="attachment-card">
                    {att.file_type === 'IMAGE' ? (
                      <a href={att.file_url} target="_blank" rel="noreferrer">
                        <img src={att.file_url} alt="Attachment" className="attachment-preview" />
                      </a>
                    ) : (
                      <a href={att.file_url} target="_blank" rel="noreferrer" style={{fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--primary-green)'}}>
                        PLAY VIDEO
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status update form */}
        <form onSubmit={handleUpdateGrievanceStatus} style={{borderTop: '1px solid var(--border-color)', paddingTop: '16px'}}>
          <div className="form-group">
            <label className="form-label">Update Status</label>
            <select 
              className="form-select"
              value={g.status}
              onChange={e => setSelectedGrievance({...g, status: e.target.value})}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Official Remarks / Comments</label>
            <textarea 
              className="form-textarea"
              placeholder="Add resolution details or update remarks..."
              value={grievanceRemarks}
              onChange={e => setGrievanceRemarks(e.target.value)}
            />
          </div>
          <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '10px'}}>
            Save Status Remarks
          </button>
        </form>
      </div>
    );
  };

  const navigateBack = () => {
    if (currentView === 'success') {
      setCurrentView('booking');
    } else if (currentView === 'grievance-success') {
      setCurrentView('grievance-submit');
    } else if (currentView === 'whats-new') {
      setCurrentView('home');
    } else {
      setCurrentView('home');
    }
  };

  const renderBackButton = () => {
    return (
      <button 
        onClick={navigateBack} 
        className="back-btn" 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#ffffff',
          backgroundColor: 'var(--primary-green-dark)',
          border: '2px solid var(--saffron-orange)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.2s ease',
        }}
      >
        <ArrowLeft size={16} /> {TRANSLATIONS[lang].back}
      </button>
    );
  };

  const handleVoiceHelpClick = (page) => {
    if (voiceState.page === page) {
      if (voiceState.status === 'playing') {
        window.speechSynthesis.pause();
        setVoiceState({ page, status: 'paused' });
      } else if (voiceState.status === 'paused') {
        window.speechSynthesis.resume();
        setVoiceState({ page, status: 'playing' });
      } else {
        startVoiceHelp(page);
      }
    } else {
      startVoiceHelp(page);
    }
  };

  const startVoiceHelp = (page) => {
    window.speechSynthesis.cancel();

    let textTa = '';

    if (page === 'grievance-submit') {
      textTa = "குறைதீர்ப்புப் பக்கத்திற்கு உங்களை வரவேற்கிறோம். இந்தப் பக்கத்தில், உங்கள் விவரங்கள் மற்றும் புகைப்படங்கள் அல்லது காணொளிகளைப் பதிவிடுவதன் மூலம் நீங்கள் எதிர்கொள்ளும் குறைகளைத் தெரிவிக்கலாம்; உங்கள் புகாரை குரல் வழி உள்ளீடு (voice input) மூலமாகவும் பதிவு செய்யலாம்.";
    } else if (page === 'grievance-track') {
      textTa = "குறைதீர்ப்பு கண்காணிப்புப் பக்கத்திற்கு உங்களை வரவேற்கிறோம். இந்தப் பக்கத்தில், உங்கள் கைபேசி எண் மற்றும் குறைதீர்ப்பு குறிப்பு எண்ணை உள்ளிட்டு, நீங்கள் சமர்ப்பித்த குறைதீர்ப்பின் தற்போதைய நிலையை சரிபார்த்துக் கொள்ளலாம்.";
    } else if (page === 'booking') {
      textTa = "சந்திப்பு முன்பதிவுப் பக்கத்திற்கு உங்களை வரவேற்கிறோம். இந்தப் பக்கத்தில், சட்டமன்ற உறுப்பினரைச் சந்திப்பதற்கான தேதி மற்றும் நேரத்தைத் தேர்ந்தெடுத்து, உங்கள் விவரங்களை உள்ளிட்டு முன்பதிவை உறுதி செய்து கொள்ளலாம்.";
    } else if (page === 'appointment-track') {
      textTa = "சந்திப்பு முன்பதிவு கண்காணிப்புப் பக்கத்திற்கு உங்களை வரவேற்கிறோம். இந்தப் பக்கத்தில், உங்கள் கைபேசி எண் மற்றும் டோக்கன் எண்ணை உள்ளிட்டு, முன்பதிவு செய்யப்பட்ட சந்திப்பின் தற்போதைய நிலையைத் தெரிந்துகொள்ளலாம்.";
    }

    if (!textTa) return;

    const uTa = new SpeechSynthesisUtterance(textTa);
    uTa.lang = 'ta-IN';
    uTa.rate = 0.95;

    uTa.onend = () => {
      setVoiceState({ page: null, status: 'stopped' });
    };

    uTa.onerror = () => {
      setVoiceState({ page: null, status: 'stopped' });
    };

    setVoiceState({ page, status: 'playing' });
    window.speechSynthesis.speak(uTa);
  };

  const renderVoiceHelpButton = (page) => {
    const isActive = voiceState.page === page;
    const isPlaying = isActive && voiceState.status === 'playing';
    const isPaused = isActive && voiceState.status === 'paused';

    let btnTextEn = "Voice Help";
    let btnTextTa = "குரல் வழி உதவி";
    let icon = "🔊";

    if (isPlaying) {
      btnTextEn = "Pause";
      btnTextTa = "இடைநிறுத்து";
      icon = "⏸️";
    } else if (isPaused) {
      btnTextEn = "Resume";
      btnTextTa = "தொடரவும்";
      icon = "▶️";
    }

    return (
      <button
        type="button"
        onClick={() => handleVoiceHelpClick(page)}
        className="voice-help-btn"
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          padding: '8px 14px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: isPlaying ? 'var(--primary-orange, #f97316)' : 'var(--primary-green)',
          backgroundColor: isPlaying ? 'var(--primary-orange-light, #ffedd5)' : 'var(--primary-green-light)',
          border: `1px solid ${isPlaying ? 'var(--primary-orange, #f97316)' : 'var(--primary-green)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontWeight: 'bold' }}>{btnTextEn}</span>
        </span>
        <span style={{ fontSize: '0.85em', opacity: 0.85, fontWeight: 'normal' }}>{btnTextTa}</span>
      </button>
    );
  };



  
  // Create availability Form State
  const [newAvail, setNewAvail] = useState({
    available_date: '',
    start_time: '09:00',
    end_time: '13:00',
    slot_duration: 30
  });

  // Rescheduling Dialog State
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlotId, setRescheduleSlotId] = useState(null);

  // Grievance remark state
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [grievanceRemarks, setGrievanceRemarks] = useState('');

  // Dialog Refs
  const rescheduleDialogRef = useRef(null);

  // Handle Supabase Auth redirect hashes (e.g. password recovery redirects)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');
      
      if (accessToken && type === 'recovery') {
        setAdminToken(accessToken);
        setCurrentView('admin-reset-password');
        showNotification("Authenticated via password recovery link. Please choose a new password.", "success");
        // Clear hash from URL securely
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }, []);

  // Fetch available dates for public booking
  useEffect(() => {
    fetch(API_BASE + '/slots/dates')
      .then(res => res.json())
      .then(data => {
        if (data.dates && data.dates.length > 0) {
          setAvailableDates(data.dates);
        }
      })
      .catch(err => console.error("Error fetching dates:", err));
  }, [currentView]);

  // Fetch slots when date selection changes
  useEffect(() => {
    if (selectedDate) {
      fetch(`${API_BASE}/slots/${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.slots) {
            setSlots(data.slots);
          }
        })
        .catch(err => console.error("Error fetching slots:", err));
    }
  }, [selectedDate]);

  // Cancel any active voice help when navigating to a different view
  useEffect(() => {
    window.speechSynthesis.cancel();
    setVoiceState({ page: null, status: 'stopped' });
  }, [currentView]);

  // Fetch government notifications when viewing home or whats-new page, auto-refresh on home
  useEffect(() => {
    if (currentView === 'home' || currentView === 'whats-new') {
      fetch(API_BASE + '/news/government')
        .then(res => res.json())
        .then(data => {
          if (data.news && data.news.length > 0) {
            setFetchedNews(data.news);
          }
        })
        .catch(() => {});
    }
  }, [currentView]);

  // Auto-refresh notifications every 5 minutes on home page
  useEffect(() => {
    if (currentView === 'home') {
      const interval = setInterval(() => {
        fetch(API_BASE + '/news/government')
          .then(res => res.json())
          .then(data => {
            if (data.news && data.news.length > 0) {
              setFetchedNews(data.news);
            }
          })
          .catch(() => {});
      }, 300000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Fetch admin stats and listings when token is set and active
  useEffect(() => {
    if (adminToken && currentView === 'admin-dashboard') {
      fetchAdminData();
    }
  }, [adminToken, currentView, adminView]);

  const fetchAdminData = () => {
    const headers = { 'Authorization': `Bearer ${adminToken}` };

    // Fetch admin details
    fetch(API_BASE + '/admin/me', { headers })
      .then(res => {
        if (res.status === 401) handleAdminLogout();
        return res.json();
      })
      .then(data => setAdminProfile(data))
      .catch(err => console.error("Error fetching admin profile:", err));

    // Fetch consolidated dashboard statistics
    fetch(API_BASE + '/admin/dashboard', { headers })
      .then(res => {
        if (res.status === 401) handleAdminLogout();
        return res.json();
      })
      .then(data => setAdminStats(data))
      .catch(err => console.error("Error fetching dashboard statistics:", err));

    // Fetch appointments
    fetch(API_BASE + '/admin/appointments', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.appointments) setAdminAppointments(data.appointments);
      })
      .catch(err => console.error("Error fetching appointments:", err));

    // Fetch availability
    fetch(API_BASE + '/admin/availability', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.availabilities) setAdminAvailability(data.availabilities);
      })
      .catch(err => console.error("Error fetching availability:", err));

    // Fetch grievances
    fetch(API_BASE + '/admin/grievances', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.grievances) setAdminGrievances(data.grievances);
      })
      .catch(err => console.error("Error fetching admin grievances:", err));

    // Fetch SMS notification logs
    fetch(API_BASE + '/admin/notifications/logs', { headers })
      .then(res => res.json())
      .then(data => {
        if (data.logs) setAdminSMSLogs(data.logs);
      })
      .catch(err => console.error("Error fetching SMS logs:", err));
  };

  // Fetch slots for rescheduling date
  useEffect(() => {
    if (rescheduleDate) {
      fetch(`${API_BASE}/slots/${rescheduleDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.slots) {
            // Only show available slots
            setRescheduleSlots(data.slots.filter(s => s.status === 'AVAILABLE'));
          }
        })
        .catch(err => console.error("Error fetching reschedule slots:", err));
    }
  }, [rescheduleDate]);

  // Reset Booking Form
  const resetBookingForm = () => {
    setFormData({
      fullName: '',
      mobileNumber: '',
      address: '',
      purpose: '',
      aadhaarNumber: '',
      wardNumber: '',
      grievanceCategory: 'General'
    });
    setSelectedSlot(null);
    setSelectedDate('');
    setErrorMsg('');
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('Please select an appointment time slot.');
      return;
    }
    
    const payload = {
      slot_id: selectedSlot.id,
      citizen: {
        full_name: formData.fullName,
        mobile_number: formData.mobileNumber,
        address: formData.address
      },
      purpose: formData.purpose,
      aadhaar_number: formData.aadhaarNumber || null,
      ward_number: formData.wardNumber || null,
      grievance_category: formData.grievanceCategory
    };

    fetch(API_BASE + '/appointments/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to book slot.');
        }
        return data;
      })
      .then(data => {
        setBookingResult(data);
        setCurrentView('success');
        resetBookingForm();
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  // Handle grievance file upload
  const handleGrievanceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'pdf'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      showNotification("Supported file formats are: JPG, JPEG, PNG, WEBP, MP4, MOV, PDF.", "error");
      return;
    }

    // Validate size
    const isVideo = file.type.startsWith('video/') || ['mp4', 'mov'].includes(fileExtension);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 30 * 1024 * 1024; // 50MB for video, 30MB for others
    if (file.size > maxSize) {
      showNotification(`File size exceeds limit. Maximum allowed size is ${isVideo ? '50MB' : '30MB'}.`, "error");
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    fetch(API_BASE + '/grievances/upload', {
      method: 'POST',
      body: uploadData
    })
      .then(async res => {
        const data = await parseApiResponse(res);
        if (!res.ok) {
          throw new Error(data.detail || data.message || 'File upload failed.');
        }
        return data;
      })
      .then(data => {
        setGrievanceFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, { file_type: data.file_type, file_url: data.file_url }]
        }));
      })
      .catch(err => {
        const userMessage = normalizeFetchError(err, 'File upload failed. Please check backend connectivity.');
        setErrorMsg(userMessage);
        console.error('Grievance upload error:', err);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  // Handle CSV Ingestion for Admin
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    setErrorMsg('');

    const uploadData = new FormData();
    uploadData.append('file', file);

    withLoading(
      fetch(API_BASE + '/admin/grievances/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: uploadData
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Failed to import CSV.');
          }
          return data;
        })
        .then(data => {
          setImportResult(data);
          // Refresh the admin data (specifically grievances list and stats)
          fetchAdminData();
        })
        .catch(err => {
          setErrorMsg(err.message);
        })
        .finally(() => {
          setIsImporting(false);
          e.target.value = null; // Clear file input
        })
    );
  };

  // Submit Grievance Form
  const handleGrievanceSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (grievanceFormData.description.length < 15) {
      setErrorMsg('Grievance description must be at least 15 characters long.');
      return;
    }

    const payload = {
      citizen: {
        full_name: grievanceFormData.fullName,
        mobile_number: grievanceFormData.mobileNumber,
        address: grievanceFormData.address,
        email: grievanceFormData.email || null
      },
      constituency: grievanceFormData.constituency,
      ward_number: grievanceFormData.wardNumber,
      category: grievanceFormData.category,
      description: grievanceFormData.description,
      attachments: grievanceFormData.attachments
    };

    fetch(API_BASE + '/grievances/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await parseApiResponse(res);
        if (!res.ok) {
          throw new Error(data.detail || data.message || 'Failed to submit grievance.');
        }
        return data;
      })
      .then(data => {
        setGrievanceResult(data);
        setCurrentView('grievance-success');
      })
      .catch(err => {
        const userMessage = normalizeFetchError(err, 'Failed to submit grievance. Please check backend connectivity.');
        setErrorMsg(userMessage);
        console.error('Grievance submit error:', err);
      });
  };

  // Track Grievance
  const handleTrackGrievance = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setTrackedGrievance(null);

    fetch(`${API_BASE}/grievances/track/${trackGrievanceId}?phone=${trackGrievancePhone}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Grievance tracking failed.');
        }
        return data;
      })
      .then(data => {
        setTrackedGrievance(data.grievance);
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  // Track Appointment
  const handleTrackAppointment = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setTrackedAppointment(null);

    fetch(`${API_BASE}/appointments/track/${trackAppointmentToken}?phone=${trackAppointmentPhone}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Appointment tracking failed.');
        }
        return data;
      })
      .then(data => {
        setTrackedAppointment(data.appointment);
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  // Update Grievance Status (Admin)
  const handleUpdateGrievanceStatus = (e) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setErrorMsg('');

    fetch(`${API_BASE}/admin/grievances/${selectedGrievance.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: selectedGrievance.status,
        remarks: grievanceRemarks
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to update status.');
        }
        return data;
      })
      .then(() => {
        setSelectedGrievance(null);
        setGrievanceRemarks('');
        showNotification("Grievance status updated successfully.", "success");
        fetchAdminData();
      })
      .catch(err => {
        setErrorMsg(err.message);
      });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const params = new URLSearchParams();
    params.append('username', loginData.username);
    params.append('password', loginData.password);

    withLoading(
      fetch(API_BASE + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Login failed.');
          }
          return data;
        })
        .then(data => {
          localStorage.setItem('admin_token', data.access_token);
          setAdminToken(data.access_token);
          setCurrentView('admin-dashboard');
          setLoginData({ username: '', password: '' });
        })
        .catch(err => {
          setErrorMsg(err.message);
        })
    );
  };

  const handleRequestPasswordRecovery = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotLoading(true);

    withLoading(
      fetch(API_BASE + '/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Failed to send recovery link.');
          }
          return data;
        })
        .then(data => {
          showNotification(data.message || "Reset link sent successfully.", "success");
          setForgotPasswordMode(false);
          setForgotEmail('');
        })
        .catch(err => {
          setErrorMsg(err.message);
        })
        .finally(() => {
          setForgotLoading(false);
        })
    );
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (resetPasswordData.newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setResetLoading(true);

    withLoading(
      fetch(API_BASE + '/admin/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ new_password: resetPasswordData.newPassword })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Password reset failed.');
          }
          return data;
        })
        .then(data => {
          showNotification("Password updated successfully! Please log in with your new password.", "success");
          localStorage.removeItem('admin_token');
          setAdminToken('');
          setResetPasswordData({ newPassword: '', confirmPassword: '' });
          setCurrentView('admin-login');
        })
        .catch(err => {
          setErrorMsg(err.message);
        })
        .finally(() => {
          setResetLoading(false);
        })
    );
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdminToken('');
    setCurrentView('home');
  };

  const handleCreateAvailability = (e) => {
    e.preventDefault();
    setErrorMsg('');

    withLoading(
      fetch(API_BASE + '/admin/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(newAvail)
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Failed to create availability.');
          }
          return data;
        })
        .then(() => {
          setNewAvail({
            available_date: '',
            start_time: '09:00',
            end_time: '13:00',
            slot_duration: 30
          });
          showNotification("Slot have been generated successfully.", "success");
          fetchAdminData();
        })
        .catch(err => setErrorMsg(err.message))
    );
  };

  const handleDeleteAvailability = (id) => {
    if (!window.confirm("Are you sure you want to delete this availability window? This will delete all generated slots.")) return;
    setErrorMsg('');

    withLoading(
      fetch(`${API_BASE}/admin/availability/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Failed to delete availability.');
          }
          return data;
        })
        .then(() => {
          fetchAdminData();
        })
        .catch(err => setErrorMsg(err.message))
    );
  };

  const handleUpdateStatus = (apptId, newStatus) => {
    setErrorMsg('');
    withLoading(
      fetch(`${API_BASE}/admin/appointments/${apptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Failed to update status.');
          }
          return data;
        })
        .then(() => {
          showNotification("Appointment status updated successfully.", "success");
          fetchAdminData();
        })
        .catch(err => setErrorMsg(err.message))
    );
  };

  const openRescheduleModal = (appt) => {
    setReschedulingAppt(appt);
    setRescheduleDate('');
    setRescheduleSlots([]);
    setRescheduleSlotId(null);
    if (rescheduleDialogRef.current) {
      rescheduleDialogRef.current.showModal();
    }
  };

  const submitReschedule = () => {
    if (!rescheduleSlotId) {
      showNotification("Please select a new slot.", "error");
      return;
    }
    setErrorMsg('');

    withLoading(
      fetch(`${API_BASE}/admin/appointments/${reschedulingAppt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ 
          status: 'RESCHEDULED',
          new_slot_id: rescheduleSlotId 
        })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Rescheduling failed.');
          }
          return data;
        })
        .then(() => {
          if (rescheduleDialogRef.current) rescheduleDialogRef.current.close();
          showNotification("Appointment rescheduled successfully.", "success");
          fetchAdminData();
        })
        .catch(err => {
          showNotification(err.message, "error");
        })
    );
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest('.nav-dropdown') && !event.target.closest('.navbar-toggle')) {
        setActiveDropdown(null);
      }
      if (!event.target.closest('.mobile-admin-nav')) {
        setAdminMenuOpen(false);
      }
      if (!event.target.closest('.lang-dropdown')) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="app-container">
      {/* Custom In-App Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`} style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '0.95rem',
          minWidth: '300px',
          maxWidth: '90%',
          justifyContent: 'center',
          animation: 'slide-down-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
          border: notification.type === 'success' ? '1px solid #059669' : '1px solid #dc2626'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Voice Grievance Recording Modal */}
      {showSpeechModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ color: 'var(--navy-blue)', fontSize: '1.2rem', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎙️ <BilingualText ta="குரல் மூலம் புகார் பதிவு" en="Voice Grievance Recording" />
              </h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px' }} 
                onClick={() => {
                  handleStopVoiceRecording();
                  setShowSpeechModal(false);
                }}
              >
                <X size={16} />
              </button>
            </div>

            {!speechLanguage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0' }}>
                <p style={{ color: 'var(--navy-blue)', fontWeight: '700', fontSize: '1rem', textAlign: 'center', margin: 0 }}>
                  <BilingualText ta="குரல் பதிவு மொழியைத் தேர்ந்தெடுக்கவும்" en="Select Voice Recording Language" />
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      borderColor: 'var(--primary-green)',
                      backgroundColor: 'var(--primary-green-light)',
                      color: 'var(--primary-green)',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => startRecognition('ta-IN')}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>தமிழ் (Tamil)</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}><BilingualText ta="தமிழ் உரைபெயர்ப்பு" en="Tamil Speech-to-Text" /></span>
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      borderColor: 'var(--color-info)',
                      backgroundColor: 'var(--color-info-bg)',
                      color: 'var(--color-info)',
                      borderRadius: 'var(--radius-md)',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => startRecognition('en-US')}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>English (English)</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}><BilingualText ta="ஆங்கில உரைபெயர்ப்பு" en="English Speech-to-Text" /></span>
                  </button>
                </div>
              </div>
            ) : isRecordingGrievance ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                <div className="mic-animation" style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  animation: 'pulse 1.5s infinite'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(239, 68, 68)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#ffffff',
                    fontSize: '1.25rem'
                  }}>
                    🎤
                  </div>
                </div>
                
                <p style={{ fontWeight: 'bold', color: 'rgb(239, 68, 68)', animation: 'pulse-text 1.5s infinite', margin: 0, textAlign: 'center' }}>
                  <BilingualText ta="பேசவும்... (பேசி முடித்ததும் நிறுத்து பொத்தானை அழுத்தவும்)" en="Speaking... (Click Stop when finished)" />
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
                  <BilingualText text={`மொழி / Language: ${speechLanguage === 'ta-IN' ? 'தமிழ் (Tamil)' : 'English (English)'}`} />
                </div>

                <div style={{
                  width: '100%',
                  minHeight: '100px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  wordBreak: 'break-word'
                }}>
                  {speechTranscript || <span style={{ opacity: 0.5 }}><BilingualText text={"குரல் உரை இங்கே தோன்றும்... / Speech text will appear here..."} /></span>}
                </div>

                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleStopVoiceRecording}
                  style={{ width: '100%', padding: '10px' }}
                >
                  🛑 <BilingualText ta="நிறுத்து" en="Stop Recording" />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  <BilingualText ta="நீங்கள் பேசிய உரை கீழே உருவாக்கப்பட்டுள்ளது. தேவைப்பட்டால் திருத்திக் கொண்டு உறுதிப்படுத்தவும்:" en="Speech-to-text generated transcript below. Edit if needed and confirm:" />
                </p>

                <textarea
                  className="form-textarea"
                  value={speechTranscript}
                  onChange={(e) => setSpeechTranscript(e.target.value)}
                  style={{ minHeight: '120px', width: '100%' }}
                  placeholder="உரை எதுவும் இல்லை. மீண்டும் பேச முயற்சிக்கவும்."
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: '1 1 130px', padding: '10px' }}
                    onClick={() => startRecognition(speechLanguage)}
                  >
                    🔄 <BilingualText ta="மீண்டும் பேசவும்" en="Try Again" />
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: '1 1 130px', padding: '10px' }}
                    onClick={() => setSpeechLanguage(null)}
                  >
                    🌐 <BilingualText ta="மொழி மாற்று" en="Change Language" />
                  </button>
                  <button 
                    type="button" 
                    className="nav-link-btn" 
                    style={{ flex: '1 1 100%', padding: '10px' }}
                    onClick={() => {
                      setGrievanceFormData(prev => ({
                        ...prev,
                        description: prev.description ? prev.description + '\n' + speechTranscript : speechTranscript
                      }));
                      setShowSpeechModal(false);
                      showNotification("உரை சேர்க்கப்பட்டது! / Text added successfully!", "success");
                    }}
                  >
                    ✅ <BilingualText ta="உறுதி செய்" en="Confirm & Use" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Gov Header Ribbon */}
      <div className="gov-ribbon"></div>
      
      {/* Gov Banner */}
      <div className="gov-banner">
        <div className="gov-banner-left">
          <span>MLA OFFICE PORTAL</span>
        </div>
        <div className="gov-banner-right">TAMIL NADU LEGISLATIVE ASSEMBLY</div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar" style={{ padding: '8px 40px' }}>
        <div className="navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative' }}>
          <div className="navbar-brand" onClick={() => {
            setCurrentView('home');
            setMobileMenuOpen(false);
            setActiveDropdown(null);
          }} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px'}}>
            <img src="/Emblem_of_Tamil_Nadu.svg" alt="Emblem of Tamil Nadu" className="navbar-emblem" />
            <img src="/tvk_flag.png" alt="TVK Flag" style={{ height: '40px', width: 'auto', borderRadius: '4px' }} />
          </div>

          <div className="navbar-middle-text" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '1.25rem', fontWeight: '800', color: '#b91c1c', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {lang === 'en' ? (
              <>
                <span style={{ color: '#d7263d' }}>Ambattur Constituency</span> Public Service Portal
              </>
            ) : (
              <>
                <span style={{ color: '#d7263d' }}>அம்பத்தூர் தொகுதி</span> பொது சேவை இணையதளம்
              </>
            )}
          </div>

          <div className="navbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="nav-link-btn navbar-admin-btn" 
              onClick={() => {
                if (adminToken) {
                  setCurrentView('admin-dashboard');
                  setAdminView('appointments');
                } else {
                  setCurrentView('admin-login');
                  setErrorMsg('');
                }
                setMobileMenuOpen(false);
                setActiveDropdown(null);
              }}
            >
              <span className="desktop-admin-text">{adminToken ? 'Dashboard' : 'Admin'}</span>
              <span className="mobile-admin-text">{adminToken ? 'Dashboard' : 'Admin'}</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  const text = "அம்பத்தூர் சட்டமன்ற தொகுதி பொது சேவை இணையதளத்திற்கு உங்களை அன்போடு வரவேற்கிறோம்.";
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = 'ta-IN';
                  utterance.rate = 0.9;
                  window.speechSynthesis.speak(utterance);
                } else {
                  const audio = new Audio('/welcome.m4a');
                  audio.play().catch(e => console.error("Audio playback error:", e));
                }
              }}
              style={{
                padding: '4px 8px', 
                fontSize: '0.75rem', 
                borderColor: 'var(--primary-green)', 
                color: 'var(--primary-green)', 
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                height: '40px'
              }}
              title="Listen to Welcome Message"
            >
              🔊 <BilingualText ta="வரவேற்பு" en="Welcome" />
            </button>
            
            <img src="/Honble CM photo_2026_.jpg" alt="CM Photo" className="navbar-emblem" style={{ borderRadius: '50%', objectFit: 'cover', aspectRatio: '1/1' }} />
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* VIEW: HOME SCREEN */}
        {currentView === 'home' && (
          <div className="container" style={{ padding: '0 20px 40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Welcome Audio Button Removed from here */}

            {/* Interstitial Text */}
            <div className="interstitial-text responsive-interstitial-title" style={{ 
              textAlign: 'center', 
              margin: '40px 0 20px 0', 
              fontWeight: '800', 
              color: 'var(--navy-blue)', 
              borderTop: 'none', 
              borderBottom: 'none',
              paddingTop: '0px',
              paddingBottom: '0px',
              fontFamily: 'var(--font-sans)',
              lineHeight: '1.2'
            }}>
              <BilingualText ta="அம்பத்தூர் சட்டமன்ற உறுப்பினர் பாலமுருகனைச் சந்தியுங்கள்" en="Meet Ambattur MLA Balamurugan" />
            </div>

            {/* Quick Actions grid - Row 1 */}
            <div className="quick-actions-grid" style={{ marginBottom: '30px' }}>
              {/* Card 1: Book Appointment */}
              <div className="quick-action-card card-green" onClick={() => {
                setCurrentView('booking');
                resetBookingForm();
              }}>
                <div className="quick-action-icon-wrapper">
                  <Calendar size={24} />
                </div>
                <div className="quick-action-title"><BilingualText text={TRANSLATIONS[lang].bookAppt} /></div>
                <div className="quick-action-subtitle"><BilingualText ta="முன்பதிவு செய்ய" en="Schedule a meeting" /></div>
              </div>

              {/* Card 3: Track Appointment */}
              <div className="quick-action-card card-blue" onClick={() => {
                setCurrentView('appointment-track');
                setErrorMsg('');
                setTrackedAppointment(null);
              }}>
                <div className="quick-action-icon-wrapper">
                  <Clock size={24} />
                </div>
                <div className="quick-action-title"><BilingualText text={TRANSLATIONS[lang].trackAppt} /></div>
                <div className="quick-action-subtitle"><BilingualText ta="சந்திப்பு நிலை அறிய" en="Monitor meeting status" /></div>
              </div>
            </div>

            <div className="interstitial-text responsive-interstitial-title" style={{ 
              textAlign: 'center', 
              margin: '0px 0 20px 0', 
              fontWeight: '800', 
              color: 'var(--navy-blue)', 
              fontFamily: 'var(--font-sans)',
              lineHeight: '1.2'
            }}>
              <BilingualText ta="உங்கள் குறையைப் பதிவு செய்து கண்காணிக்கவும்" en="Raise and track your grievance" />
            </div>

            {/* Quick Actions grid - Row 2 */}
            <div className="quick-actions-grid">
              {/* Card 2: Submit Grievance */}
              <div className="quick-action-card card-orange" onClick={() => {
                setCurrentView('grievance-submit');
                setErrorMsg('');
                setGrievanceResult(null);
              }}>
                <div className="quick-action-icon-wrapper">
                  <FileText size={24} />
                </div>
                <div className="quick-action-title"><BilingualText text={TRANSLATIONS[lang].submitGrievance} /></div>
                <div className="quick-action-subtitle"><BilingualText ta="புகாரைப் பதிவு செய்ய" en="File local issue" /></div>
              </div>

              {/* Card 4: Track Grievance */}
              <div className="quick-action-card card-navy" onClick={() => {
                setCurrentView('grievance-track');
                setErrorMsg('');
                setTrackedGrievance(null);
              }}>
                <div className="quick-action-icon-wrapper">
                  <Search size={24} />
                </div>
                <div className="quick-action-title"><BilingualText text={TRANSLATIONS[lang].trackGrievance} /></div>
                <div className="quick-action-subtitle"><BilingualText ta="புகார் நிலையை அறிய" en="Monitor resolution status" /></div>
              </div>
            </div>

            {/* Key Notifications */}
            <div className="quick-actions-grid" style={{ marginTop: '24px', marginBottom: '10px' }}>
              <div 
                className="quick-action-card card-red" 
                onClick={() => setCurrentView('whats-new')}
                style={{ gridColumn: '1 / -1' }}
              >
                <div className="quick-action-icon-wrapper">
                  <Megaphone size={24} />
                </div>
                <div className="quick-action-title">
                  <BilingualText ta="அரசு அறிவிப்புகள்" en="Key Notifications" />
                </div>
                <div className="quick-action-subtitle">
                  <BilingualText ta="அரசின் முக்கிய அறிவிப்புகளை அறிய" en="View government notifications" />
                </div>
              </div>
            </div>



            {/* Animated Counters Section */}
            <StatsCounters lang={lang} />

            {/* Polls Summary Section */}
            <section style={{ marginTop: '40px', padding: '28px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ color: 'var(--navy-blue)', fontWeight: '800', marginBottom: '8px' }}>Polls Summary</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                    Quick view of public feedback polls and citizen participation.
                  </p>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-green-light)',
                  color: 'var(--primary-green)',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  <TrendingUp size={16} /> Updated weekly
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '14px',
                marginBottom: '22px'
              }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-green)', marginBottom: '8px', fontWeight: '700' }}>
                    <FileText size={18} /> Total Polls
                  </div>
                  <strong style={{ color: 'var(--navy-blue)', fontSize: '1.5rem' }}>12</strong>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-green)', marginBottom: '8px', fontWeight: '700' }}>
                    <Users size={18} /> Participants
                  </div>
                  <strong style={{ color: 'var(--navy-blue)', fontSize: '1.5rem' }}>8,420</strong>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-green)', marginBottom: '8px', fontWeight: '700' }}>
                    <CheckCircle size={18} /> Completed
                  </div>
                  <strong style={{ color: 'var(--navy-blue)', fontSize: '1.5rem' }}>9</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {PUBLIC_POLL_SUMMARY.map((poll) => (
                  <div key={poll.title} style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '14px 16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#ffffff'
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', color: 'var(--navy-blue)', marginBottom: '4px' }}>{poll.title}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{poll.votes} votes - {poll.result}</span>
                    </div>
                    <span style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: poll.status === 'Active' ? 'var(--color-success-bg)' : 'var(--navy-blue-light)',
                      color: poll.status === 'Active' ? 'var(--color-success)' : 'var(--navy-blue)',
                      fontSize: '0.78rem',
                      fontWeight: '800'
                    }}>
                      {poll.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Progress Tracking Button Section */}
            <div style={{ marginTop: '40px', textAlign: 'center' }}>
              <button 
                onClick={() => {
                  setCurrentView('home-progress');
                  setErrorMsg('');
                  setTrackedGrievance(null);
                  setTrackGrievanceId('');
                  setTrackGrievancePhone('');
                }}
                className="nav-link-btn"
                style={{
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  minWidth: '160px'
                }}
              >
                📊 <BilingualText ta="முன்னேற்றம் பார்க்க" en="Track Progress" />
              </button>
            </div>

            {/* MLA Biography Section */}
            <div className="mla-bio-section" style={{ marginTop: '40px' }}>
              <div className="mla-bio-image-wrapper">
                <div style={{
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  background: 'radial-gradient(circle, var(--primary-green-light) 0%, transparent 70%)',
                  zIndex: -1,
                  top: '0',
                  left: '0'
                }}></div>
                <img 
                  src="/mla_image.png" 
                  alt="MLA Balamurugan" 
                  className="mla-bio-image"
                />
              </div>
              <div className="mla-bio-content">
                <h2 className="mla-bio-title"><BilingualText text={TRANSLATIONS[lang].bioTitle} /></h2>
                <p className="mla-bio-text">
                  {TRANSLATIONS[lang].bioText}
                </p>
                <p className="mla-bio-text" style={{ fontStyle: 'italic', borderLeft: '4px solid var(--primary-green)', paddingLeft: '16px', color: 'var(--navy-blue)' }}>
                  {TRANSLATIONS[lang].bioQuote}
                </p>
              </div>
            </div>

            {/* CM Vijay YouTube Links Section */}
            <section style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ color: 'var(--navy-blue)', fontWeight: '800', marginBottom: '8px' }}>
                  <BilingualText ta="CM விஜய் YouTube இணைப்புகள்" en="CM Vijay YouTube Links" />
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 auto', maxWidth: '640px' }}>
                  <BilingualText ta="சமீபத்திய உரைகள், பொதுக்கூட்டங்கள் மற்றும் செய்தி காணொளிகளை பார்க்கவும்." en="Watch latest speeches, public meetings, and news videos separately." />
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                {CM_VIJAY_YOUTUBE_LINKS.map((link) => (
                  <a
                    key={link.title}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                      padding: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      backgroundColor: '#b91c1c',
                      border: 'none',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CirclePlay size={24} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{link.title}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{link.subtitle}</span>
                    </span>
                    <ExternalLink size={18} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </section>

            {/* TVK Social Media Channels Section */}
            <section style={{ marginTop: '36px', paddingTop: '28px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ color: 'var(--navy-blue)', fontWeight: '800', marginBottom: '8px' }}>
                  <BilingualText ta="TVK சமூக ஊடக சேனல்கள்" en="TVK Social Media Channels" />
                </h3>

              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                {TVK_SOCIAL_CHANNELS.map((channel) => (
                  <a
                    key={channel.title}
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                      padding: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      backgroundColor: '#b91c1c',
                      border: 'none',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <SocialBrandIcon type={channel.iconType} size={20} color={channel.iconColor} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{channel.title}</strong>
                    </span>
                    <ExternalLink size={18} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* VIEW: APPOINTMENT BOOKING SCREEN */}
        {currentView === 'booking' && (
          <div className="container" style={{maxWidth: '1000px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '-20px' }}>{renderBackButton()}</div>
              <div>{renderVoiceHelpButton('booking')}</div>
            </div>
            <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800', textAlign: 'center'}}>{TRANSLATIONS[lang].bookingTitle}</h2>
            <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '40px'}}>{TRANSLATIONS[lang].bookingDesc}</p>
            
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Date & Slot Selection Card */}
              <div className="card">
                <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Calendar size={18} /> {TRANSLATIONS[lang].selectDate}
                </h3>
                
                {availableDates.length === 0 ? (
                  <div style={{color: 'var(--text-secondary)', padding: '20px 0'}}>
                    {TRANSLATIONS[lang].noSlots}
                  </div>
                ) : (
                  <div className="date-selector-row">
                    {availableDates.map(dStr => (
                      <button 
                        key={dStr}
                        className={`date-btn ${selectedDate === dStr ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(dStr);
                          setSelectedSlot(null);
                        }}
                      >
                        {new Date(dStr).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <div style={{fontSize: '0.75rem', opacity: 0.8}}>
                          {new Date(dStr).toLocaleDateString([], { weekday: 'short' })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedDate && (
                  <>
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <Clock size={18} /> {TRANSLATIONS[lang].chooseSlot}
                    </h3>
                    <div className="slots-grid">
                      {slots.map(s => {
                        const isPast = new Date(s.slot_start) < new Date();
                        const isUnavailable = s.status !== 'AVAILABLE' || isPast;
                        const isSelected = selectedSlot && selectedSlot.id === s.id;
                        return (
                          <button
                            key={s.id}
                            disabled={isUnavailable}
                            className={`slot-card ${isUnavailable ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedSlot(s)}
                          >
                            {formatTime(s.slot_start)}
                            <div style={{fontSize: '0.7rem', marginTop: '4px', opacity: 0.8}}>
                              {isPast ? 
                                <BilingualText ta="முடிந்தது" en="Expired" /> : 
                                (s.status !== 'AVAILABLE' ? TRANSLATIONS[lang].booked : TRANSLATIONS[lang].available)
                              }
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Citizen Registration Form Card */}
              {selectedDate && selectedSlot && (
                <form className="card" onSubmit={handleBookSubmit}>
                  <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <User size={18} /> {TRANSLATIONS[lang].citizenForm}
                  </h3>
                  
                  <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText text={TRANSLATIONS[lang].fullNameLabel} /></label>
                      <input 
                        type="text" 
                        required
                        placeholder="முழு பெயரை உள்ளிடவும்"
                        className="form-input"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>

                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText text={TRANSLATIONS[lang].mobileLabel} /></label>
                      <input 
                        type="tel" 
                        required
                        placeholder="e.g. 9876543210"
                        className="form-input"
                        value={formData.mobileNumber}
                        onChange={e => setFormData({...formData, mobileNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{marginBottom: '20px'}}>
                    <label className="form-label"><BilingualText text={TRANSLATIONS[lang].addressLabel} /></label>
                    <textarea 
                      required
                      placeholder="வீட்டு முகவரி விவரங்கள்"
                      className="form-textarea"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                  <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText text={TRANSLATIONS[lang].purposeLabel} /></label>
                      <select
                        required
                        className="form-select"
                        value={formData.purpose}
                        onChange={e => setFormData({...formData, purpose: e.target.value})}
                      >
                        <option value="" disabled>{TRANSLATIONS[lang].purposeSelect}</option>
                        <option value="Grievance">குறைபாடு / Grievance</option>
                        <option value="Compliementary">பாராட்டு / Complimentary</option>
                        <option value="Suggestion">ஆலோசனை / Suggestion</option>
                        <option value="Welfare Scheme">நலத்திட்டம் / Welfare Scheme</option>
                        <option value="Infrastructure Request">கட்டமைப்பு கோரிக்கை / Infrastructure Request</option>
                        <option value="Other">இதர / Other</option>
                      </select>
                    </div>

                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText ta="ஆதார் எண்" en="Aadhaar Number" /> (Optional)</label>
                      <input 
                        type="text" 
                        maxLength="12"
                        placeholder="12 இலக்க ஆதார் எண்"
                        className="form-input"
                        value={formData.aadhaarNumber}
                        onChange={e => setFormData({...formData, aadhaarNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <hr style={{margin: '24px 0', borderColor: 'var(--border-color)'}}/>
                  
                  <div style={{marginBottom: '16px'}}>
                    <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase'}}>{TRANSLATIONS[lang].optionalFields}</span>
                  </div>

                  <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText ta="வார்டு எண் / பகுதி" en="Ward Number / Area" /> (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Ward 14"
                        className="form-input"
                        value={formData.wardNumber}
                        onChange={e => setFormData({...formData, wardNumber: e.target.value})}
                      />
                    </div>

                    <div className="form-group" style={{marginBottom: 0}}>
                      <label className="form-label"><BilingualText ta="குறைபாட்டு வகை" en="Grievance Category" /> (Optional)</label>
                      <select 
                        className="form-select"
                        value={formData.grievanceCategory}
                        onChange={e => setFormData({...formData, grievanceCategory: e.target.value})}
                      >
                        <option value="General">பொதுவானது / General</option>
                        <option value="Water Supply">குடிநீர் விநியோகம் / Water Supply</option>
                        <option value="Road Maintenance">சாலை பராமரிப்பு / Road Maintenance</option>
                        <option value="Electricity">மின்சாரம் / Electricity</option>
                        <option value="Education/Scholarship">கல்வி / உதவித்தொகை / Education / Scholarship</option>
                        <option value="Health/Sanitation">சுகாதாரம் / துப்புரவு / Health / Sanitation</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="nav-link-btn"
                    style={{width: '100%', padding: '14px', marginTop: '10px'}}
                  >
                    <BilingualText ta="முன்பதிவை உறுதிசெய்" en="Confirm Booking" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW: BOOKING SUCCESS SCREEN */}
        {currentView === 'success' && bookingResult && (
          <div className="container" style={{maxWidth: '600px'}}>
            {renderBackButton()}
            <div className="card" style={{textAlign: 'center', padding: '40px'}}>
              <div style={{display: 'flex', justifyContent: 'center', color: 'var(--color-success)', marginBottom: '20px'}}>
                <CheckCircle size={60} />
              </div>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800'}}><BilingualText ta="சந்திப்பு முன்பதிவு உறுதி செய்யப்பட்டது!" en="Appointment Confirmed!" /></h2>
              <p style={{color: 'var(--text-secondary)', marginBottom: '30px'}}><BilingualText ta="சட்டமன்றப் பதிவேட்டில் தங்களின் சந்திப்பு நேரம் வெற்றிகரமாக முன்பதிவு செய்யப்பட்டுள்ளது." en="Your slot has been reserved successfully inside the assembly records." /></p>
              
              <div style={{
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)', 
                padding: '24px', 
                border: '1px dashed var(--border-color)',
                textAlign: 'left',
                marginBottom: '30px'
              }}>
                <div style={{marginBottom: '12px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}><BilingualText ta="பொதுமக்கள் டோக்கன்:" en="Citizen Token:" /></span>
                  <strong style={{color: 'var(--navy-blue)', fontSize: '1.1rem'}}>{bookingResult.token_number}</strong>
                </div>
                <div style={{marginBottom: '12px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}><BilingualText ta="சந்திப்பு தேதி:" en="Meeting Date:" /></span>
                  <strong style={{color: 'var(--text-primary)'}}>{formatDate(bookingResult.slot_start)}</strong>
                </div>
                <div style={{marginBottom: '12px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}><BilingualText ta="சந்திப்பு நேரம்:" en="Meeting Time:" /></span>
                  <strong style={{color: 'var(--text-primary)'}}>{formatTime(bookingResult.slot_start)}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px'}}>
                  <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}><BilingualText ta="வருகை நேரம்:" en="Reporting Time:" /></span>
                  <strong style={{color: 'var(--saffron-orange)'}}>{bookingResult.reporting_time} (<BilingualText ta="10 நிமிடம் முன்னதாக" en="10m early" />)</strong>
                </div>
              </div>

              <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
                <button className="nav-link-btn" onClick={() => setCurrentView('home')}>
                  <BilingualText ta="முகப்பு பக்கத்திற்குச் செல்" en="Return Home" />
                </button>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                  <BilingualText ta="டிக்கெட்டை அச்சிடுக" en="Print Ticket" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: GRIEVANCE SUBMISSION SCREEN */}
        {currentView === 'grievance-submit' && (
          <div className="container" style={{maxWidth: '1000px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '-20px' }}>{renderBackButton()}</div>
              <div>{renderVoiceHelpButton('grievance-submit')}</div>
            </div>
            <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800', textAlign: 'center'}}>{TRANSLATIONS[lang].submitGrievanceTitle}</h2>
            <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '40px'}}>{TRANSLATIONS[lang].submitGrievanceDesc}</p>

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <form className="card" onSubmit={handleGrievanceSubmit}>
              <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                <FileText size={18} style={{marginTop: '2px'}} /> <BilingualText ta="குறைபாடு பதிவுப் படிவம்" en="Grievance Registration Form" />
              </h3>

              <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText text={TRANSLATIONS[lang].fullNameLabel} /></label>
                  <input 
                    type="text" 
                    required
                    placeholder="முழு பெயரை உள்ளிடவும்"
                    className="form-input"
                    value={grievanceFormData.fullName}
                    onChange={e => setGrievanceFormData({...grievanceFormData, fullName: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText text={TRANSLATIONS[lang].mobileLabel} /></label>
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g. 9876543210"
                    className="form-input"
                    value={grievanceFormData.mobileNumber}
                    onChange={e => setGrievanceFormData({...grievanceFormData, mobileNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText text={TRANSLATIONS[lang].emailLabel} /> (Optional)</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    className="form-input"
                    value={grievanceFormData.email}
                    onChange={e => setGrievanceFormData({...grievanceFormData, email: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText ta="தொகுதி *" en="Constituency *" /></label>
                  <input 
                    type="text" 
                    disabled 
                    className="form-input" 
                    value={grievanceFormData.constituency} 
                    style={{backgroundColor: 'var(--bg-tertiary)'}}
                  />
                </div>
              </div>

              <div className="grid-2" style={{gap: '20px', marginBottom: '20px'}}>
                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText ta="வார்டு எண் *" en="Ward Number *" /></label>
                  <select 
                    className="form-select"
                    required
                    value={grievanceFormData.wardNumber}
                    onChange={e => setGrievanceFormData({...grievanceFormData, wardNumber: e.target.value})}
                  >
                    <option value="79">Ward 79</option>
                    <option value="80">Ward 80</option>
                    <option value="81">Ward 81</option>
                  </select>
                </div>

                <div className="form-group" style={{marginBottom: 0}}>
                  <label className="form-label"><BilingualText ta="குறைபாட்டு வகை *" en="Grievance Category *" /></label>
                  <select 
                    className="form-select"
                    required
                    value={grievanceFormData.category}
                    onChange={e => setGrievanceFormData({...grievanceFormData, category: e.target.value})}
                  >
                    <option value="Water Supply">குடிநீர் விநியோகம் / Water Supply</option>
                    <option value="Road Maintenance">சாலை பராமரிப்பு / Road Maintenance</option>
                    <option value="Street Light">தெருவிளக்கு / Street Light</option>
                    <option value="Electricity">மின்சாரம் / Electricity</option>
                    <option value="Sanitation">சுகாதாரம் / Sanitation</option>
                    <option value="Other">இதர / Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><BilingualText ta="முகவரி *" en="Residential Address *" /></label>
                <textarea 
                  required
                  placeholder="வீட்டு முகவரியை உள்ளிடவும்"
                  className="form-textarea"
                  value={grievanceFormData.address}
                  onChange={e => setGrievanceFormData({...grievanceFormData, address: e.target.value})}
                />
              </div>

              <div className="form-group">
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                  <label className="form-label" style={{marginBottom: 0}}><BilingualText ta="விரிவான விளக்கம் (குறைந்தது 15 எழுத்துக்கள்) *" en="Detailed Description (Min 15 chars) *" /></label>
                  <button 
                    type="button" 
                    onClick={handleOpenSpeechModal} 
                    className={`btn ${isRecordingGrievance ? 'btn-danger' : 'btn-secondary'}`}
                    style={{padding: '6px 12px', fontSize: '0.85rem'}}
                  >
                    🎤 {isRecordingGrievance ? <BilingualText ta="கேட்கிறது..." en="Listening..." /> : <BilingualText ta="புகாரைத் தெரிவிக்கவும்" en="Speak Complaint" />}
                  </button>
                </div>
                <textarea 
                  required
                  placeholder="உங்களது பிரச்சினையை விரிவாக விளக்கவும்..."
                  className="form-textarea"
                  value={grievanceFormData.description}
                  onChange={e => setGrievanceFormData({...grievanceFormData, description: e.target.value})}
                />
              </div>

              {/* Multi File Attachment upload area */}
              <div className="form-group">
                <label className="form-label"><BilingualText ta="சான்றுகள் (விருப்பத்திற்குரியது)" en="Media Attachments / proof (Optional)" /></label>
                <div className="upload-dropzone" onClick={() => document.getElementById('grievance-file-input').click()}>
                  <Plus size={24} />
                  <div>
                    {isUploading ? <BilingualText ta="கோப்பு பதிவேற்றப்படுகிறது..." en="Uploading file..." /> : <BilingualText ta="சான்று படம்/வீடியோவை பதிவேற்ற கிளிக் செய்யவும்" en="Click to select or upload image/video proof" />}
                  </div>
                  <input 
                    type="file" 
                    id="grievance-file-input" 
                    style={{display: 'none'}} 
                    onChange={handleGrievanceFileUpload}
                    accept="image/*,video/*"
                  />
                </div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4'}}>
                  <BilingualText ta="ஆதாரிக்கப்படும் வடிவங்கள்: JPG, JPEG, PNG, WEBP, MP4, MOV, PDF. அதிகபட்ச அளவு: 30MB (படங்கள்/PDF), 50MB (வீடியோக்கள்)." en="Supported formats: JPG, JPEG, PNG, WEBP, MP4, MOV, PDF. Max size: 30MB for images/PDFs, 50MB for videos." />
                </div>

                {grievanceFormData.attachments.length > 0 && (
                  <div className="attachments-grid" style={{marginTop: '20px'}}>
                    {grievanceFormData.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-card" style={{ position: 'relative' }}>
                        {att.file_type === 'IMAGE' ? (
                          <img src={att.file_url} alt="Attachment preview" className="attachment-preview" />
                        ) : (
                          <div style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-green)'}}>VIDEO</div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setGrievanceFormData(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== idx)
                            }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 10
                          }}
                          title="Remove upload"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="nav-link-btn" 
                style={{width: '100%', padding: '14px', marginTop: '10px'}}
                disabled={isUploading}
              >
                <BilingualText ta="புகாரைச் சமர்ப்பிக்கவும்" en="Submit Grievance" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW: GRIEVANCE SUCCESS SCREEN */}
        {currentView === 'grievance-success' && grievanceResult && (
          <div className="container" style={{maxWidth: '600px'}}>
            {renderBackButton()}
            <div className="card" style={{textAlign: 'center', padding: '40px'}}>
              <div style={{display: 'flex', justifyContent: 'center', color: 'var(--color-success)', marginBottom: '20px'}}>
                <CheckCircle size={60} />
              </div>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800'}}><BilingualText ta="புகார் பதிவு செய்யப்பட்டது!" en="Grievance Registered!" /></h2>
              <p style={{color: 'var(--text-secondary)', marginBottom: '30px'}}><BilingualText ta="தங்களின் புகார் சட்டமன்றத் தரவுத்தளத்தில் வெற்றிகரமாகப் பதிவு செய்யப்பட்டுள்ளது." en="Your grievance is successfully recorded in the assembly database." /></p>
              
              <div style={{
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)', 
                padding: '24px', 
                border: '1px dashed var(--border-color)',
                textAlign: 'left',
                marginBottom: '30px'
              }}>
                <div style={{marginBottom: '12px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: 'var(--text-secondary)', fontWeight: '500'}}><BilingualText ta="புகார் ஐடி:" en="Grievance ID:" /></span>
                  <strong style={{color: 'var(--navy-blue)', fontSize: '1.2rem'}}>{grievanceResult.grievance_id}</strong>
                </div>
                <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px', lineHeight: '1.5'}}>
                  <BilingualText ta="இந்தத் தனித்துவமான குறிப்பு ஐடியைக் குறித்துக் கொள்ளவும். உங்கள் ஐடி மற்றும் தொலைபேசி எண்ணைப் பயன்படுத்தி புகார் நிலையைக் கண்காணிக்கலாம்." en="Please note down this unique reference ID. You can track your resolution progress on the Track page using this ID and your phone number." />
                </div>
              </div>

              <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
                <button className="nav-link-btn" onClick={() => setCurrentView('home')}>
                  <BilingualText ta="முகப்பு பக்கத்திற்குச் செல்" en="Return Home" />
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setCurrentView('grievance-submit');
                  setGrievanceResult(null);
                }}>
                  <BilingualText ta="மற்றொரு புகாரைச் சமர்ப்பி" en="Submit Another" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TRACK GRIEVANCE SCREEN */}
        {currentView === 'grievance-track' && (
          <div className="container" style={{maxWidth: '800px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '-20px' }}>{renderBackButton()}</div>
              <div>{renderVoiceHelpButton('grievance-track')}</div>
            </div>
            <div className="card" style={{marginBottom: '30px'}}>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '20px', fontWeight: '800', textAlign: 'center'}}>{TRANSLATIONS[lang].trackGrievanceTitle}</h2>
              
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleTrackGrievance}>
                <div className="form-group">
                  <label className="form-label"><BilingualText ta="புகார் குறிப்பு ஐடி (எ.கா. AMB-GID-1) *" en="Grievance Reference ID (e.g. AMB-GID-1) *" /></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="புகார் ஐடியை உள்ளிடவும்"
                    className="form-input" 
                    value={trackGrievanceId} 
                    onChange={e => setTrackGrievanceId(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><BilingualText text={TRANSLATIONS[lang].mobileLabel} /></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
                    className="form-input" 
                    value={trackGrievancePhone} 
                    onChange={e => setTrackGrievancePhone(e.target.value)} 
                  />
                </div>
                <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '12px'}}>
                  <BilingualText ta="குறைபாடு நிலையைத் தேடு" en="Lookup Grievance Status" />
                </button>
              </form>
            </div>

            {trackedGrievance && (
              <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                  <div>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600'}}>{TRANSLATIONS[lang].grievanceRecord}</span>
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.25rem', fontWeight: '800'}}>{trackedGrievance.id}</h3>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                    <span className={`badge badge-${trackedGrievance.status.toLowerCase()}`} style={{fontSize: '0.85rem', padding: '6px 14px'}}>
                      {trackedGrievance.status}
                    </span>
                  </div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px'}}>
                  <div>
                    <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].citizenName}</span>
                    <div>{trackedGrievance.citizen.full_name}</div>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].category}</span>
                      <div>{trackedGrievance.category}</div>
                    </div>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].wardNumberLabel}</span>
                      <div><BilingualText ta="வார்டு" en="Ward" /> {trackedGrievance.ward_number}</div>
                    </div>
                  </div>
                  <div>
                    <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].descriptionLabel}</span>
                    <div style={{backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem'}}>{trackedGrievance.description}</div>
                  </div>
                  {trackedGrievance.officer_comments && (
                    <div>
                      <span className="form-label" style={{marginBottom: '4px', color: 'var(--primary-green)'}}>{TRANSLATIONS[lang].officialComments}</span>
                      <div style={{backgroundColor: 'var(--primary-green-light)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(2, 102, 53, 0.2)', fontSize: '0.95rem', fontWeight: '500'}}>{trackedGrievance.officer_comments}</div>
                    </div>
                  )}
                </div>

                {/* Media attachments */}
                {trackedGrievance.attachments && trackedGrievance.attachments.length > 0 && (
                  <div style={{marginBottom: '30px'}}>
                    <span className="form-label">{TRANSLATIONS[lang].submittedProof}</span>
                    <div className="attachments-grid">
                      {trackedGrievance.attachments.map((att, idx) => (
                        <div key={idx} className="attachment-card">
                          {att.file_type === 'IMAGE' ? (
                            <a href={att.file_url} target="_blank" rel="noreferrer">
                              <img src={att.file_url} alt="Attachment" className="attachment-preview" />
                            </a>
                          ) : (
                            <a href={att.file_url} target="_blank" rel="noreferrer" style={{fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--primary-green)'}}>
                              <BilingualText ta="வீடியோவை இயக்கு" en="PLAY VIDEO" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <span className="form-label">{TRANSLATIONS[lang].statusHistory}</span>
                  <div className="timeline">
                    {trackedGrievance.history.map((h, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-badge"></div>
                        <div className="timeline-content">
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                            <strong>{TRANSLATIONS[lang].statusLabel} {h.new_status}</strong>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{formatDate(h.created_at)}</span>
                          </div>
                          <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{h.remarks}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: TRACK APPOINTMENT SCREEN */}
        {currentView === 'appointment-track' && (
          <div className="container" style={{maxWidth: '800px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ marginBottom: '-20px' }}>{renderBackButton()}</div>
              <div>{renderVoiceHelpButton('appointment-track')}</div>
            </div>
            <div className="card" style={{marginBottom: '30px'}}>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '20px', fontWeight: '800', textAlign: 'center'}}>{TRANSLATIONS[lang].trackApptTitle}</h2>
              
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleTrackAppointment}>
                <div className="form-group">
                  <label className="form-label"><BilingualText ta="சந்திப்பு டோக்கன் எண் *" en="Appointment Token Number *" /></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="டோக்கனை உள்ளிடவும் (எ.கா. TKN-...)"
                    className="form-input" 
                    value={trackAppointmentToken} 
                    onChange={e => setTrackAppointmentToken(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><BilingualText text={TRANSLATIONS[lang].mobileLabel} /></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
                    className="form-input" 
                    value={trackAppointmentPhone} 
                    onChange={e => setTrackAppointmentPhone(e.target.value)} 
                  />
                </div>
                <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '12px'}}>
                  <BilingualText ta="சந்திப்பு நிலையைத் தேடு" en="Lookup Appointment Status" />
                </button>
              </form>
            </div>

            {trackedAppointment && (
              <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                  <div>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600'}}>{TRANSLATIONS[lang].appointmentToken}</span>
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.2rem', fontWeight: '800'}}>{trackedAppointment.token_number}</h3>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                    <span className={`badge badge-${trackedAppointment.status.toLowerCase()}`} style={{fontSize: '0.85rem', padding: '6px 14px'}}>
                      {trackedAppointment.status}
                    </span>
                  </div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].citizenName}</span>
                      <div>{trackedAppointment.citizen.full_name}</div>
                    </div>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].purpose}</span>
                      <div>{trackedAppointment.purpose}</div>
                    </div>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].meetingDate}</span>
                      <strong>{formatDate(trackedAppointment.slot.slot_start)}</strong>
                    </div>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}>{TRANSLATIONS[lang].meetingTime}</span>
                      <strong>{formatTime(trackedAppointment.slot.slot_start)}</strong>
                    </div>
                  </div>
                  <div style={{borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px', display: 'flex', justifyContent: 'space-between'}}>
                    <span className="form-label">{TRANSLATIONS[lang].reportingTime}</span>
                    <strong style={{color: 'var(--saffron-orange)'}}>{trackedAppointment.reporting_time}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: HOME PROGRESS TRACKING SCREEN */}
        {currentView === 'home-progress' && (
          <div className="container" style={{maxWidth: '600px'}}>
            {renderBackButton()}
            <div className="card" style={{marginBottom: '30px'}}>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '20px', fontWeight: '800', textAlign: 'center'}}><BilingualText ta="புகார் முன்னேற்றத்தைக் கண்காணி" en="Track Grievance Progress" /></h2>
              
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <form onSubmit={handleTrackGrievance}>
                <div className="form-group">
                  <label className="form-label"><BilingualText ta="புகார் ஐடி (எ.கா. AMB-GID-1) *" en="Grievance ID (e.g. AMB-GID-1) *" /></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="புகார் ஐடியை உள்ளிடவும்"
                    className="form-input" 
                    value={trackGrievanceId} 
                    onChange={e => setTrackGrievanceId(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><BilingualText ta="தொலைபேசி எண் *" en="Phone Number *" /></label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
                    className="form-input" 
                    value={trackGrievancePhone} 
                    onChange={e => setTrackGrievancePhone(e.target.value)} 
                  />
                </div>
                <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '12px'}}>
                  <BilingualText ta="சமர்ப்பிக்கவும்" en="Submit" />
                </button>
              </form>
            </div>

            {trackedGrievance && (
              <div className="card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px'}}>
                  <div>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600'}}><BilingualText ta="குறைபாடு பதிவு" en="GRIEVANCE RECORD" /></span>
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.25rem', fontWeight: '800'}}>{trackedGrievance.id}</h3>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                    <span className={`badge badge-${trackedGrievance.status.toLowerCase()}`} style={{fontSize: '0.85rem', padding: '6px 14px'}}>
                      {trackedGrievance.status}
                    </span>
                  </div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px'}}>
                  <div>
                    <span className="form-label" style={{marginBottom: '4px'}}><BilingualText ta="குடிமகன் பெயர்:" en="Citizen Name:" /></span>
                    <div>{trackedGrievance.citizen.full_name}</div>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}><BilingualText ta="வகை:" en="Category:" /></span>
                      <div>{trackedGrievance.category}</div>
                    </div>
                    <div>
                      <span className="form-label" style={{marginBottom: '4px'}}><BilingualText ta="வார்டு எண்:" en="Ward Number:" /></span>
                      <div><BilingualText ta="வார்டு" en="Ward" /> {trackedGrievance.ward_number}</div>
                    </div>
                  </div>
                  <div>
                    <span className="form-label" style={{marginBottom: '4px'}}><BilingualText ta="விளக்கம்:" en="Description:" /></span>
                    <div style={{backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem'}}>{trackedGrievance.description}</div>
                  </div>
                  {trackedGrievance.officer_comments && (
                    <div>
                      <span className="form-label" style={{marginBottom: '4px', color: 'var(--primary-green)'}}><BilingualText ta="அதிகாரப்பூர்வ கருத்துகள் / பதில்:" en="Official Comments / Response:" /></span>
                      <div style={{backgroundColor: 'var(--primary-green-light)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(2, 102, 53, 0.2)', fontSize: '0.95rem', fontWeight: '500'}}>{trackedGrievance.officer_comments}</div>
                    </div>
                  )}
                </div>

                {/* Media attachments */}
                {trackedGrievance.attachments && trackedGrievance.attachments.length > 0 && (
                  <div style={{marginBottom: '30px'}}>
                    <span className="form-label"><BilingualText ta="சமர்ப்பிக்கப்பட்ட ஆதார இணைப்புகள்:" en="Submitted Proof Attachments:" /></span>
                    <div className="attachments-grid">
                      {trackedGrievance.attachments.map((att, idx) => (
                        <div key={idx} className="attachment-card">
                          {att.file_type === 'IMAGE' ? (
                            <a href={att.file_url} target="_blank" rel="noreferrer">
                              <img src={att.file_url} alt="Attachment" className="attachment-preview" />
                            </a>
                          ) : (
                            <a href={att.file_url} target="_blank" rel="noreferrer" style={{fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--primary-green)'}}>
                              <BilingualText ta="வீடியோவை இயக்கு" en="PLAY VIDEO" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Timeline */}
                <div>
                  <span className="form-label"><BilingualText ta="நிலை முன்னேற்ற வரலாறு:" en="Status Progression History:" /></span>
                  <div className="timeline">
                    {trackedGrievance.history.map((h, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-badge"></div>
                        <div className="timeline-content">
                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                            <strong><BilingualText ta="நிலை:" en="Status:" /> {h.new_status}</strong>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{formatDate(h.created_at)}</span>
                          </div>
                          <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{h.remarks}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: WHATS NEW */}
        {currentView === 'whats-new' && (
          <div className="container" style={{maxWidth: '700px'}}>
            {renderBackButton()}
            <div className="card" style={{marginBottom: '30px'}}>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '8px', fontWeight: '800', textAlign: 'center'}}>
                <BilingualText ta="அரசு அறிவிப்புகள் மற்றும் முக்கிய செய்திகள்" en="Key Notifications & Latest News" />
              </h2>
              <p style={{color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginTop: '4px', marginBottom: '24px'}}>
                <BilingualText ta="சமீபத்திய அரசு செய்திகள் மற்றும் அறிவிப்புகளை அறிய" en="Stay informed with government updates" />
              </p>

              {/* Latest News Items */}
              {(fetchedNews.length > 0 ? fetchedNews : LATEST_NEWS).length === 0 ? (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0'}}>
                  <BilingualText ta="தற்போது எந்த செய்தியும் இல்லை" en="No news available at the moment" />
                </p>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {(fetchedNews.length > 0 ? fetchedNews : LATEST_NEWS).map((item, idx) => {
                    const Wrapper = item.link ? 'a' : 'div';
                    const wrapperProps = item.link ? {
                      href: item.link,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      style: { textDecoration: 'none', display: 'block' }
                    } : {};
                    return (
                      <Wrapper
                        key={idx}
                        {...wrapperProps}
                        style={{
                          ...(wrapperProps.style || {}),
                          padding: '18px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          borderLeft: '4px solid var(--primary-green)',
                          cursor: item.link ? 'pointer' : 'default',
                          transition: 'box-shadow 0.2s'
                        }}
                        onMouseOver={e => { if (item.link) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                        onMouseOut={e => { if (item.link) e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: 'var(--primary-green)',
                            letterSpacing: '0.5px'
                          }}>
                            {item.category}
                          </span>
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                              {item.date && item.date.match(/^\d{4}-\d{2}-\d{2}$/) 
                                ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : item.date}
                            </span>
                            {item.link && <ExternalLink size={12} color="var(--text-secondary)" />}
                          </div>
                        </div>
                        <h4 style={{fontSize: '0.95rem', fontWeight: '700', color: 'var(--navy-blue)', margin: '0 0 6px 0', lineHeight: '1.4'}}>
                          {item.headline}
                        </h4>
                        {item.description && (
                          <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5'}}>
                            {item.description}
                          </p>
                        )}
                      </Wrapper>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ADMIN LOGIN SCREEN */}
        {currentView === 'admin-login' && (
          <div className="container" style={{maxWidth: '450px'}}>
            {renderBackButton()}
            {forgotPasswordMode ? (
              <form className="card" onSubmit={handleRequestPasswordRecovery}>
                <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800', textAlign: 'center'}}>Reset Admin Password</h2>
                <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px'}}>Request a password recovery link to your admin email</p>
                
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="Enter Admin Email Address"
                    className="form-input"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="nav-link-btn"
                  style={{width: '100%', padding: '14px', marginTop: '10px'}}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Sending link..." : "Send Reset Link"}
                </button>

                <div style={{textAlign: 'center', marginTop: '16px'}}>
                  <button 
                    type="button" 
                    onClick={() => { setForgotPasswordMode(false); setErrorMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--saffron-orange)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form className="card" onSubmit={handleAdminLogin}>
                <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800', textAlign: 'center'}}>Admin Portal Login</h2>
                <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px'}}>MLA Office Personnel Authentication</p>
                
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="Enter Email Address"
                    className="form-input"
                    value={loginData.username}
                    onChange={e => setLoginData({...loginData, username: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                    <label className="form-label" style={{margin: 0}}>Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setForgotPasswordMode(true); setErrorMsg(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="Enter Password"
                    className="form-input"
                    value={loginData.password}
                    onChange={e => setLoginData({...loginData, password: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  className="nav-link-btn"
                  style={{width: '100%', padding: '14px', marginTop: '10px'}}
                >
                  Authenticate
                </button>
              </form>
            )}
          </div>
        )}

        {/* VIEW: ADMIN RESET PASSWORD SCREEN */}
        {currentView === 'admin-reset-password' && (
          <div className="container" style={{maxWidth: '450px'}}>
            <form className="card" onSubmit={handleResetPassword}>
              <h2 style={{color: 'var(--navy-blue)', marginBottom: '10px', fontWeight: '800', textAlign: 'center'}}>Create New Password</h2>
              <p style={{color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px'}}>Set a secure password for your administrator account</p>
              
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter New Password (min 6 chars)"
                  className="form-input"
                  value={resetPasswordData.newPassword}
                  onChange={e => setResetPasswordData({...resetPasswordData, newPassword: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Re-enter New Password"
                  className="form-input"
                  value={resetPasswordData.confirmPassword}
                  onChange={e => setResetPasswordData({...resetPasswordData, confirmPassword: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="nav-link-btn"
                style={{width: '100%', padding: '14px', marginTop: '10px'}}
                disabled={resetLoading}
              >
                {resetLoading ? "Updating password..." : "Reset Password"}
              </button>

              <div style={{textAlign: 'center', marginTop: '16px'}}>
                <button 
                  type="button" 
                  onClick={() => {
                    localStorage.removeItem('admin_token');
                    setAdminToken('');
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                    setCurrentView('admin-login');
                    setErrorMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--saffron-orange)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel and Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'admin-dashboard' && (
          <div className="admin-layout">
            {/* Sidebar Navigation */}
            <aside className="admin-sidebar">
              <div className="mobile-admin-nav" style={{width: '100%'}}>
                <label className="form-label" style={{fontWeight: '700', marginBottom: '8px', color: 'var(--navy-blue)', display: 'block'}}>Control Panel Navigation</label>
                <div className={`control-panel-dropdown ${adminMenuOpen ? 'open' : ''}`}>
                  <button 
                    type="button"
                    className="control-panel-dropdown-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdminMenuOpen(!adminMenuOpen);
                    }}
                  >
                    <span>
                      {adminView === 'appointments' && 'Appointments'}
                      {adminView === 'availability' && 'MLA Timetable'}
                      {adminView === 'grievances' && 'Grievances Inbox'}
                      {adminView === 'stats' && 'Analytics & Reports'}
                      {adminView === 'namma-mla' && 'Namma MLA Analytics'}
                      {adminView === 'sms' && 'SMS Logs'}
                      {adminView === 'settings' && 'Settings'}
                    </span>
                    <ChevronDown size={16} className="chevron-icon" />
                  </button>
                  <div className="control-panel-dropdown-menu">
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'appointments' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('appointments');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <Users size={16} /> Appointments
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'availability' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('availability');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <Calendar size={16} /> MLA Timetable
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'grievances' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('grievances');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <FileText size={16} /> Grievances Inbox
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'stats' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('stats');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <TrendingUp size={16} /> Analytics & Reports
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'namma-mla' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('namma-mla');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <FileSpreadsheet size={16} /> Namma MLA Analytics
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'sms' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('sms');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <Mail size={16} /> SMS Logs
                    </button>
                    <button 
                      type="button"
                      className={`control-panel-dropdown-item ${adminView === 'settings' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminView('settings');
                        setAdminMenuOpen(false);
                      }}
                    >
                      <Lock size={16} /> Settings
                    </button>
                  </div>
                </div>
              </div>
              <div className="desktop-admin-nav" style={{width: '100%'}}>
                <div style={{marginBottom: '20px', padding: '0 16px'}}>
                  <span style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px'}}>CONTROL PANEL</span>
                </div>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'appointments' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('appointments')}
                >
                  <Users size={18} /> Appointments
                </button>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'availability' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('availability')}
                >
                  <Calendar size={18} /> MLA Timetable
                </button>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'grievances' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('grievances')}
                >
                  <FileText size={18} /> Grievances Inbox
                </button>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'stats' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('stats')}
                >
                  <TrendingUp size={18} /> Analytics & Reports
                </button>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'namma-mla' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('namma-mla')}
                >
                  <FileSpreadsheet size={18} /> Namma MLA Analytics
                </button>
                <button 
                  className={`admin-sidebar-link btn ${adminView === 'sms' ? 'active' : 'btn-secondary'}`}
                  style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                  onClick={() => setAdminView('sms')}
                >
                  <Mail size={18} /> SMS Logs
                </button>

                <div style={{marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)'}}>
                  <button 
                    className={`admin-sidebar-link btn ${adminView === 'settings' ? 'active' : 'btn-secondary'}`}
                    style={{border: 'none', width: '100%', justifyContent: 'flex-start'}}
                    onClick={() => setAdminView('settings')}
                  >
                    <Lock size={18} /> Settings
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Admin Area */}
            <section className="admin-main">
              {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

              {/* TAB: NAMMA MLA ANALYTICS */}
              {adminView === 'namma-mla' && (
                <NammaMlaAnalytics 
                  adminToken={adminToken} 
                  API_BASE={API_BASE} 
                  showNotification={showNotification} 
                />
              )}

              {/* TAB: STATS/ANALYTICS */}
              {adminView === 'stats' && adminStats && (
                <div>
                  <h2 style={{color: 'var(--navy-blue)', marginBottom: '30px', fontWeight: '800'}}>Analytics Dashboard</h2>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total Appointments</div>
                      <div className="stat-val">{adminStats.total_appointments}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Today's Appointments</div>
                      <div className="stat-val">{adminStats.today_appointments}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Total Grievances</div>
                      <div className="stat-val">{adminStats.total_grievances}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Pending Grievances</div>
                      <div className="stat-val">{adminStats.pending_grievances}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Resolved Grievances</div>
                      <div className="stat-val">{adminStats.resolved_grievances}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Slot Allocation %</div>
                      <div className="stat-val">{adminStats.slot_utilization_percent}%</div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="card">
                      <h3 style={{color: 'var(--navy-blue)', marginBottom: '20px'}}>Resolution Overview</h3>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)'}}>
                          <span style={{fontWeight: '600'}}>Pending Action</span>
                          <strong>{adminStats.pending_grievances}</strong>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)'}}>
                          <span style={{fontWeight: '600'}}>Resolved Cases</span>
                          <strong>{adminStats.resolved_grievances}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="card" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                      <FileSpreadsheet size={60} style={{color: 'var(--primary-green)', marginBottom: '20px'}} />
                      <h3 style={{color: 'var(--navy-blue)', marginBottom: '10px'}}>Export Database Reports</h3>
                      <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px'}}>Download local copies of slot scheduling lists and grievance reports in tabular layout.</p>
                      <button className="btn btn-secondary" onClick={() => window.print()}>Print Analytics Summary</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: APPOINTMENTS MANAGEMENT */}
              {adminView === 'appointments' && (
                <div>
                  <h2 style={{color: 'var(--navy-blue)', marginBottom: '24px', fontWeight: '800'}}>Constituency Appointments Ledger</h2>
                  
                  <div className="table-wrapper">
                    {adminAppointments.length === 0 ? (
                      <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>
                        No appointments currently registered.
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Citizen Details</th>
                            <th>Time & Slot</th>
                            <th>Purpose / Ward</th>
                            <th>Aadhaar</th>
                            <th>Token No</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminAppointments.map(appt => {
                            const isExpanded = !!expandedAppointments[appt.id];
                            return (
                              <tr key={appt.id} className={isExpanded ? 'expanded-row' : ''}>
                                <td data-label="Citizen Details">
                                  <strong style={{color: 'var(--navy-blue)'}}>{appt.citizen.full_name}</strong>
                                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{appt.citizen.mobile_number}</div>
                                  <div style={{fontSize: '0.75rem', color: 'var(--text-light)'}}>{appt.citizen.address}</div>
                                  <button 
                                    className="mobile-expand-btn"
                                    onClick={() => toggleAppointmentExpanded(appt.id)}
                                  >
                                    {isExpanded ? 'Hide Details' : 'Show Details'}
                                  </button>
                                </td>
                                <td data-label="Time & Slot" className="collapsible-col">
                                  <div>{formatDate(appt.slot.slot_start)}</div>
                                  <div style={{fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-green)'}}>{formatTime(appt.slot.slot_start)}</div>
                                </td>
                                <td data-label="Purpose / Ward" className="collapsible-col">
                                  <div style={{fontWeight: '500'}}>{appt.purpose}</div>
                                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                    Category: {appt.grievance_category || 'N/A'} {appt.ward_number ? `| Ward: ${appt.ward_number}` : ''}
                                  </div>
                                </td>
                                <td data-label="Aadhaar" className="collapsible-col" style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{appt.aadhaar_number || 'Not provided'}</td>
                                <td data-label="Token No" className="collapsible-col"><code style={{backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px'}}>{appt.token_number}</code></td>
                                <td data-label="Status">
                                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start'}}>
                                    <span className={`badge badge-${appt.status.toLowerCase()}`}>
                                      {appt.status}
                                    </span>
                                    {renderStageProgress('appointment', appt.status)}
                                  </div>
                                </td>
                                <td data-label="Actions">
                                  <div style={{display: 'flex', gap: '6px'}}>
                                    {appt.status === 'PENDING' && (
                                      <button 
                                        className="btn btn-secondary" 
                                        style={{padding: '6px 10px', color: 'var(--color-success)', borderColor: 'var(--color-success)'}}
                                        onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                                        title="Confirm Appointment"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    
                                    {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                                      <>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{padding: '6px 10px'}}
                                          onClick={() => openRescheduleModal(appt)}
                                          title="Reschedule Appointment"
                                        >
                                          Reschedule
                                        </button>
                                        <button 
                                          className="btn btn-danger" 
                                          style={{padding: '6px 10px'}}
                                          onClick={() => {
                                            if (window.confirm("Are you sure you want to cancel this appointment? / இந்த சந்திப்பை ரத்து செய்ய விரும்புகிறீர்களா?")) {
                                              handleUpdateStatus(appt.id, 'CANCELLED');
                                            }
                                          }}
                                          title="Cancel Appointment"
                                        >
                                          <X size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AVAILABILITY TIMETABLE */}
              {adminView === 'availability' && (
                <div>
                  <h2 style={{color: 'var(--navy-blue)', marginBottom: '24px', fontWeight: '800'}}>MLA Availability Schedule Management</h2>
                  
                  <div className="grid-2">
                    {/* Schedule Generation Form */}
                    <form className="card" onSubmit={handleCreateAvailability} style={{height: 'fit-content'}}>
                      <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Plus size={18} /> Add Availability Window
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label">Available Date</label>
                        <input 
                          type="date" 
                          required
                          className="form-input"
                          min={new Date().toISOString().split('T')[0]}
                          value={newAvail.available_date}
                          onChange={e => setNewAvail({...newAvail, available_date: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Start Time</label>
                        <input 
                          type="time" 
                          required
                          className="form-input"
                          value={newAvail.start_time}
                          onChange={e => setNewAvail({...newAvail, start_time: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">End Time</label>
                        <input 
                          type="time" 
                          required
                          className="form-input"
                          value={newAvail.end_time}
                          onChange={e => setNewAvail({...newAvail, end_time: e.target.value})}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Slot Duration (Minutes)</label>
                        <select 
                          className="form-select"
                          value={newAvail.slot_duration}
                          onChange={e => setNewAvail({...newAvail, slot_duration: parseInt(e.target.value)})}
                        >
                          <option value="15">15 Minutes</option>
                          <option value="30">30 Minutes</option>
                          <option value="60">60 Minutes (1 hour)</option>
                        </select>
                      </div>

                      <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '12px'}}>
                        Generate Slots
                      </button>
                    </form>

                    {/* Active Windows List */}
                    <div className="card">
                      <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px'}}>Current Timetable Windows</h3>
                      {adminAvailability.length === 0 ? (
                        <div style={{color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center'}}>
                          No availability slots created yet. Use form to generate.
                        </div>
                      ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                          {adminAvailability.map(avail => (
                            <div key={avail.id} style={{
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '16px', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: 'var(--radius-md)'
                            }}>
                              <div>
                                <strong style={{color: 'var(--navy-blue)'}}>{new Date(avail.available_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px'}}>
                                  {avail.start_time} - {avail.end_time} ({avail.slot_duration} min slots)
                                </div>
                              </div>
                              <button 
                                className="btn btn-danger" 
                                style={{padding: '8px'}}
                                onClick={() => handleDeleteAvailability(avail.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GRIEVANCES MANAGEMENT */}
              {adminView === 'grievances' && (() => {
                const filteredGrievances = adminGrievances.filter(g => {
                  if (grievanceSourceFilter === 'ALL') return true;
                  if (grievanceSourceFilter === 'DIRECT_PORTAL') {
                    return g.source_type === 'DIRECT_PORTAL';
                  }
                  if (grievanceSourceFilter === 'CM_HELPLINE') {
                    return g.source_system === 'CM_HELPLINE' || g.source_type === 'MANUAL_IMPORT';
                  }
                  return true;
                });

                return (
                  <div>
                    <h2 style={{color: 'var(--navy-blue)', marginBottom: '24px', fontWeight: '800'}}>Constituency Grievances Inbox</h2>
                    
                    {/* Filters & Import Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                      {/* Filter buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className={`btn ${grievanceSourceFilter === 'ALL' ? 'active' : 'btn-secondary'}`}
                          onClick={() => setGrievanceSourceFilter('ALL')}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          All Sources
                        </button>
                        <button 
                          className={`btn ${grievanceSourceFilter === 'DIRECT_PORTAL' ? 'active' : 'btn-secondary'}`}
                          onClick={() => setGrievanceSourceFilter('DIRECT_PORTAL')}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          Direct Portal
                        </button>
                        <button 
                          className={`btn ${grievanceSourceFilter === 'CM_HELPLINE' ? 'active' : 'btn-secondary'}`}
                          onClick={() => setGrievanceSourceFilter('CM_HELPLINE')}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          CM Helpline
                        </button>
                      </div>

                      {/* CSV Ingestion */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label htmlFor="csv-import-file" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', margin: 0, padding: '8px 16px', fontSize: '0.85rem' }}>
                          Upload CM Helpline CSV
                        </label>
                        <input 
                          type="file" 
                          id="csv-import-file" 
                          accept=".csv" 
                          onChange={handleCSVImport} 
                          style={{ display: 'none' }}
                          disabled={isImporting}
                        />
                        {isImporting && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Importing...</span>}
                      </div>
                    </div>

                    {/* Import result alert banner */}
                    {importResult && (
                      <div 
                        className={`alert ${importResult.summary.failed > 0 ? 'alert-warning' : 'alert-success'}`} 
                        style={{ 
                          marginBottom: '24px', 
                          padding: '16px 20px', 
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: importResult.summary.failed > 0 ? 'var(--saffron-orange)' : 'var(--primary-green)',
                          backgroundColor: importResult.summary.failed > 0 ? 'rgba(255, 153, 51, 0.08)' : 'var(--primary-green-light)',
                          color: importResult.summary.failed > 0 ? '#b35c00' : 'var(--primary-green-dark)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '6px' }}>
                              CSV Import Summary:
                            </strong>
                            <span>
                              {importResult.summary.imported} successfully imported, {importResult.summary.failed} failed out of {importResult.summary.total} total rows.
                            </span>
                          </div>
                          <button 
                            className="btn" 
                            style={{ 
                              padding: '4px 10px', 
                              fontSize: '0.75rem', 
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              color: 'inherit',
                              borderRadius: '4px'
                            }} 
                            onClick={() => setImportResult(null)}
                          >
                            Dismiss
                          </button>
                        </div>

                        {/* If there are failures, list the reasons why */}
                        {importResult.summary.failed > 0 && importResult.details && (
                          <div style={{ 
                            marginTop: '12px', 
                            paddingTop: '12px', 
                            borderTop: '1px solid rgba(255, 153, 51, 0.2)',
                            fontSize: '0.85rem'
                          }}>
                            <strong style={{ display: 'block', marginBottom: '6px' }}>Failure Reasons:</strong>
                            <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {importResult.details
                                .filter(detail => !detail.success)
                                .map((detail, idx) => (
                                  <li key={idx}>
                                    <strong>Row {detail.row}:</strong> {detail.error}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid-2" style={{gridTemplateColumns: selectedGrievance ? 'minmax(0, 1.45fr) minmax(0, 0.55fr)' : '1fr', gap: '20px', alignItems: 'start'}}>
                      
                      {/* Grievance Ledger List */}
                      <div className="table-wrapper">
                        {filteredGrievances.length === 0 ? (
                          <div style={{padding: '40px', textAlign: 'center', color: 'var(--text-secondary)'}}>
                            No grievances match the selected filter.
                          </div>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Citizen</th>
                                <th>Category / Ward</th>
                                <th>Grievance ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredGrievances.map(g => {
                                const isExpanded = !!expandedGrievances[g.id];
                                return (
                                  <React.Fragment key={g.id}>
                                    <tr className={isExpanded ? 'expanded-row' : ''} style={{cursor: 'pointer'}} onClick={() => { setSelectedGrievance(g); setGrievanceRemarks(g.officer_comments || ''); }}>
                                      <td data-label="Citizen">
                                        <strong style={{color: 'var(--navy-blue)'}}>{g.citizen.full_name}</strong>
                                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>{g.citizen.mobile_number}</div>
                                        {(g.source_system === 'CM_HELPLINE' || g.source_type === 'MANUAL_IMPORT') && (
                                          <span className="badge badge-pending helpline-badge" style={{ 
                                            fontSize: '0.7rem', 
                                            padding: '4px 8px', 
                                            marginTop: '6px', 
                                            display: 'inline-block', 
                                            color: 'var(--saffron-orange)', 
                                            border: '1px solid var(--saffron-orange)', 
                                            backgroundColor: 'transparent',
                                            borderRadius: '4px',
                                            lineHeight: '1.2',
                                            textAlign: 'left'
                                          }}>
                                            <span style={{ display: 'block', fontWeight: 'bold' }}>CM Helpline</span>
                                            {g.external_reference_id && (
                                              <span style={{ display: 'block', fontSize: '0.65rem', marginTop: '2px' }}>
                                                ({g.external_reference_id})
                                              </span>
                                            )}
                                          </span>
                                        )}
                                        <button 
                                          className="mobile-expand-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGrievanceExpanded(g.id);
                                          }}
                                        >
                                          {isExpanded ? 'Hide Details' : 'Show Details'}
                                        </button>
                                      </td>
                                      <td data-label="Category / Ward" className="collapsible-col">
                                        <div style={{fontWeight: '500'}}>{g.category}</div>
                                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Ward {g.ward_number}</div>
                                      </td>
                                      <td data-label="Grievance ID" className="collapsible-col"><code style={{backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px'}}>{g.id}</code></td>
                                      <td data-label="Date" className="collapsible-col">{new Date(g.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                      <td data-label="Status">
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start'}}>
                                          <span className={`badge badge-${g.status.toLowerCase()}`}>
                                            {g.status}
                                          </span>
                                          {renderStageProgress('grievance', g.status)}
                                        </div>
                                      </td>
                                      <td data-label="Action">
                                        <button className="btn btn-secondary" style={{padding: '6px 12px', fontSize: '0.8rem'}} onClick={(e) => { e.stopPropagation(); setSelectedGrievance(g); setGrievanceRemarks(g.officer_comments || ''); }}>
                                          View / Update
                                        </button>
                                      </td>
                                    </tr>
                                    {selectedGrievance && selectedGrievance.id === g.id && (
                                      <tr className="mobile-only-detail-row" onClick={(e) => e.stopPropagation()}>
                                        <td colSpan="6" style={{ padding: '12px 0', border: 'none' }}>
                                          {renderGrievanceDetailPane(selectedGrievance)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Grievance Moderation detail pane */}
                      {selectedGrievance && (
                        <div className="desktop-only-detail">
                          {renderGrievanceDetailPane(selectedGrievance)}
                        </div>
                      )}

                  </div>
                </div>
              );
            })()}

            {/* TAB: SETTINGS */}
            {adminView === 'settings' && (
              <div>
                <h2 style={{color: 'var(--navy-blue)', marginBottom: '24px', fontWeight: '800'}}>Portal Settings</h2>
                
                <div className="grid-2" style={{ alignItems: 'start' }}>
                  {/* Admin Details */}
                  <div className="card">
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px'}}>Account Profile</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Email Address</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--navy-blue)' }}>{adminProfile?.email || 'Loading...'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Assigned Role</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary-green)' }}>{adminProfile?.role || 'Loading...'}</strong>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ width: '100%' }}
                        onClick={handleAdminLogout}
                      >
                        <LogOut size={16} style={{ marginRight: '8px' }} /> Sign Out of Portal
                      </button>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form className="card" onSubmit={handleChangePassword}>
                    <h3 style={{color: 'var(--navy-blue)', fontSize: '1.1rem', marginBottom: '20px'}}>Update Password</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        required
                        className="form-input"
                        value={passwordUpdateData.oldPassword}
                        onChange={e => setPasswordUpdateData({...passwordUpdateData, oldPassword: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        required
                        className="form-input"
                        value={passwordUpdateData.newPassword}
                        onChange={e => setPasswordUpdateData({...passwordUpdateData, newPassword: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        className="form-input"
                        value={passwordUpdateData.confirmPassword}
                        onChange={e => setPasswordUpdateData({...passwordUpdateData, confirmPassword: e.target.value})}
                      />
                    </div>

                    <button type="submit" className="nav-link-btn" style={{width: '100%', padding: '12px'}}>
                      Save New Password
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: SMS LOGS */}
            {adminView === 'sms' && (
              <div>
                <h2 style={{color: 'var(--navy-blue)', marginBottom: '24px', fontWeight: '800'}}>SMS Dispatch Logs</h2>
                <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>Real-time logs of text notifications dispatched to citizens.</p>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Phone Number</th>
                        <th>Message Content</th>
                        <th>Provider</th>
                        <th>Status</th>
                        <th>Dispatched At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminSMSLogs.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '30px'}}>
                            No SMS log records found.
                          </td>
                        </tr>
                      ) : (
                        adminSMSLogs.map((log) => (
                          <tr key={log.id}>
                            <td style={{fontWeight: '700', color: 'var(--navy-blue)'}}>#{log.id}</td>
                            <td>{log.phone}</td>
                            <td style={{maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.85rem', lineHeight: '1.4'}}>{log.message}</td>
                            <td>
                              <span className="badge" style={{backgroundColor: '#e0f2fe', color: '#0369a1'}}>
                                {log.provider}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${log.status === 'SENT' ? 'badge-completed' : 'badge-cancelled'}`}>
                                {log.status}
                              </span>
                            </td>
                            <td style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      {currentView !== 'admin-dashboard' && (
        <footer style={{
          backgroundColor: '#000000', 
          color: '#ffffff', 
          padding: '50px 20px 30px 20px', 
          borderTop: '4px solid var(--saffron-orange)',
          fontSize: '0.8rem',
          lineHeight: '1.5'
        }}>
          <div className="footer-grid-container">
            {/* Column 1: Contact Address */}
            <div className="footer-column">
              <h4 style={{ fontSize: '1rem', marginBottom: '16px' }}><BilingualText text={TRANSLATIONS[lang].officeAddressHeader} /></h4>
              <div className="footer-column-content" style={{ fontSize: '0.85rem' }}>
                {TRANSLATIONS[lang].officeAddressContent.map((line, idx) => (
                  <div key={idx} style={{ marginBottom: '8px' }}><BilingualText text={line} /></div>
                ))}
                <div style={{ marginTop: '16px', opacity: 0.9 }}>
                  <BilingualText text={TRANSLATIONS[lang].adminInCharge} />
                </div>
              </div>
            </div>

            {/* Column 2: Working Hours */}
            <div className="footer-column">
              <h4 style={{ fontSize: '1rem', marginBottom: '16px' }}><BilingualText text={TRANSLATIONS[lang].workingHoursHeader} /></h4>
              <div className="footer-column-content" style={{ fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '12px' }}><BilingualText text={TRANSLATIONS[lang].workingHoursDays} /></div>
                <div style={{ marginBottom: '12px' }}><BilingualText text={TRANSLATIONS[lang].workingHoursWeekend} /></div>
                <div style={{ marginTop: '12px', color: 'var(--saffron-orange)' }}>
                  <BilingualText text={TRANSLATIONS[lang].workingHoursHoliday} />
                </div>
              </div>
            </div>

            {/* Column 3: Helplines */}
            <div className="footer-column">
              <h4 style={{ fontSize: '1rem', marginBottom: '16px' }}><BilingualText text={TRANSLATIONS[lang].helplineHeader} /></h4>
              <div className="footer-column-content" style={{ fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '12px' }}>
                  <BilingualText text={TRANSLATIONS[lang].helplineLabel} /> <a href="tel:+914426543210" style={{ fontWeight: '600' }}>+91 44 2654 3210</a>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <BilingualText text={TRANSLATIONS[lang].emailLabel} /> <a href="mailto:mlaofficeambattur@gmail.com">mlaofficeambattur@gmail.com</a>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--saffron-orange)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.8rem',
                      padding: '0',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      textAlign: 'left'
                    }}
                  >
                    <BilingualText text={TRANSLATIONS[lang].privacyPolicy} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', maxWidth: '800px', margin: '30px auto 20px auto' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ opacity: 0.9 }}><BilingualText text={TRANSLATIONS[lang].allRightsReserved} /></p>
            <p style={{ color: 'var(--text-light)', marginTop: '12px' }}><BilingualText text={TRANSLATIONS[lang].developedFor} /></p>
            <p style={{ marginTop: '16px', fontSize: '0.75rem', opacity: 0.85 }}>
              <span style={{ color: '#ffffff', marginRight: '6px' }}>{TRANSLATIONS[lang].officerLogin}</span>
              <a href="#admin-login" onClick={(e) => {
                e.preventDefault();
                setCurrentView('admin-login');
                window.scrollTo(0, 0);
              }} style={{ color: 'var(--saffron-orange)', textDecoration: 'underline', fontWeight: '600' }}>
                {TRANSLATIONS[lang].clickHere}
              </a>
            </p>
          </div>
        </footer>
      )}

      {/* Native Dialog Modal for Rescheduling */}
      <dialog ref={rescheduleDialogRef} id="reschedule-modal" style={{
        margin: 'auto',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl)',
        padding: '30px',
        width: '100%',
        maxWidth: '500px'
      }}>
        {reschedulingAppt && (
          <div>
            <h3 style={{color: 'var(--navy-blue)', marginBottom: '10px'}}>Reschedule Appointment</h3>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>
              Rescheduling appointment for <strong>{reschedulingAppt.citizen.full_name}</strong> (Token: {reschedulingAppt.token_number})
            </p>

            <div className="form-group">
              <label className="form-label">Select Date</label>
              <input 
                type="date"
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                value={rescheduleDate}
                onChange={e => {
                  setRescheduleDate(e.target.value);
                  setRescheduleSlotId(null);
                }}
              />
            </div>

            {rescheduleDate && (
              <div className="form-group">
                <label className="form-label">Available Slots</label>
                {rescheduleSlots.length === 0 ? (
                  <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>No available slots for this date.</p>
                ) : (
                  <div style={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: '10px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '8px 0'
                  }}>
                    {rescheduleSlots.map(s => (
                      <button
                        type="button"
                        key={s.id}
                        className={`slot-card available ${rescheduleSlotId === s.id ? 'selected' : ''}`}
                        onClick={() => setRescheduleSlotId(s.id)}
                        style={{padding: '8px', fontSize: '0.8rem'}}
                      >
                        {formatTime(s.slot_start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px'}}>
              <form method="dialog">
                <button className="btn btn-secondary">Cancel</button>
              </form>
              <button className="btn btn-primary" onClick={submitReschedule}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </dialog>

      {/* Privacy Policy Modal */}
      {privacyOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(11, 34, 64, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setPrivacyOpen(false)}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            padding: '30px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px'}}>
              <h3 style={{color: 'var(--navy-blue)', fontSize: '1.25rem', fontWeight: '800', margin: 0}}>Privacy Policy</h3>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{padding: '6px 10px', minWidth: 'auto', border: 'none', background: 'none'}} 
                onClick={() => setPrivacyOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px'}}>
              Citizen data is collected only for grievance and appointment processing.
            </p>
            <div style={{textAlign: 'right'}}>
              <button type="button" className="btn btn-primary" onClick={() => setPrivacyOpen(false)} style={{padding: '10px 20px'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {globalLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Processing your request, please wait...</div>
        </div>
      )}
    </div>
  );
}
