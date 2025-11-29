import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Expert from "@/models/Expert";

export const dynamic = 'force-dynamic';

const EXPERT_DATA = [
    {
      name: "Dr. Anaya Chatterjee",
      username: "anaya_chatterjee",
      email: "anaya.chatterjee@example.com",
      profilePicture:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop",
      videoUrl: "https://www.youtube.com/embed/1Cicv9yo_dI",
      specialization: "Clinical Psychologist",
      bio: "Trauma-informed therapist specializing in EMDR and somatic healing. Helping adults recover from past emotional injuries.",
      experienceYears: 11,
      education: "M.Phil Clinical Psychology, NIMHANS",
      location: "Kolkata, India",
      languages: ["English", "Bengali", "Hindi"],
      gender: "Female",
      rating: 4.8,
      reviewCount: 132,
      isVerified: true,
      treatmentTags: ["Trauma", "EMDR", "Anxiety", "Healing"],
      isOnline: true,
      lastSeen: new Date("2025-01-20T10:35:00Z"),
  
      documents: [
        {
          title: "EMDR Certification",
          url: "https://raw.githubusercontent.com/sample-docs/psychology/master/emdr-cert.pdf",
          type: "pdf",
        },
        {
          title: "Therapy Workshop Certificate",
          url: "https://raw.githubusercontent.com/sample-docs/psychology/master/workshop-cert.jpg",
          type: "image",
        },
      ],
  
      services: [
        {
          name: "EMDR Session",
          duration: 60,
          videoPrice: 2200,
          clinicPrice: 2600,
        },
        {
          name: "Trauma Counseling",
          duration: 50,
          videoPrice: 1800,
          clinicPrice: 2100,
        },
      ],
  
      availability: [
        { dayOfWeek: "Monday", startTime: "10:00", endTime: "17:00" },
        { dayOfWeek: "Thursday", startTime: "10:00", endTime: "17:00" },
        { dayOfWeek: "Saturday", startTime: "11:00", endTime: "16:00" },
      ],
  
      leaves: [
        {
          startDate: new Date("2025-02-05T00:00:00Z"),
          endDate: new Date("2025-02-10T00:00:00Z"),
          reason: "Conference",
        },
      ],
  
      clinics: [
        {
          name: "Healing Minds Centre",
          address: "Salt Lake, Kolkata",
          images: [
            "https://images.unsplash.com/photo-1629909613238-f9a555d38e31?q=80&w=400&auto=format&fit=crop",
          ],
          timings: "Mon-Sat: 10am - 7pm",
          mapUrl: "https://maps.google.com/?q=Salt+Lake+Kolkata",
        },
      ],
  
      awards: [
        {
          title: "Best Trauma Therapist",
          year: 2022,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/awards/master/award1.pdf",
        },
      ],
  
      registrations: [
        {
          registrationNumber: "RCI-5567",
          council: "Rehabilitation Council of India",
          year: 2014,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/licenses/master/license1.pdf",
        },
      ],
  
      memberships: ["Indian Psychological Society", "EMDR India Network"],
  
      workExperience: [
        {
          role: "Clinical Psychologist",
          hospital: "Apollo Multispeciality Hospital",
          startYear: 2014,
          endYear: 2019,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/experience/master/apollo.pdf",
        },
      ],
  
      faqs: [
        {
          question: "Do you offer online EMDR?",
          answer: "Yes, online EMDR sessions are available.",
        },
        {
          question: "Do you provide homework exercises?",
          answer: "Yes, worksheets and exercises are shared.",
        },
      ],
  
      reviews: [
        {
          reviewerName: "Ritika Sharma",
          rating: 5,
          tags: ["Empathy", "Trauma Support"],
          comment:
            "She helped me rebuild my confidence after years of trauma.",
          date: new Date("2024-12-11T00:00:00Z"),
        },
      ],
    },
  
    {
      name: "Dr. Kabir Malhotra",
      username: "kabir_malhotra",
      email: "kabir.malhotra@example.com",
      profilePicture:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
      videoUrl: "https://www.youtube.com/embed/sa8fK15-vO4",
      specialization: "Psychiatrist",
      bio: "Specialist in mood disorders, addiction recovery, and psychiatric evaluations.",
      experienceYears: 17,
      education: "MD Psychiatry, PGIMER",
      location: "Delhi, India",
      languages: ["English", "Hindi", "Punjabi"],
      gender: "Male",
      rating: 4.7,
      reviewCount: 205,
      isVerified: true,
      treatmentTags: ["Addiction", "Depression", "Bipolar Disorder"],
      isOnline: false,
      lastSeen: new Date("2025-01-19T14:22:00Z"),
  
      documents: [
        {
          title: "Medical License",
          url: "https://raw.githubusercontent.com/sample-docs/licenses/master/med-license.pdf",
          type: "pdf",
        },
      ],
  
      services: [
        {
          name: "Psychiatric Evaluation",
          duration: 45,
          videoPrice: 2500,
          clinicPrice: 3000,
        },
        {
          name: "Medication Review",
          duration: 20,
          videoPrice: 1200,
          clinicPrice: 1500,
        },
      ],
  
      availability: [
        { dayOfWeek: "Tuesday", startTime: "10:00", endTime: "18:00" },
        { dayOfWeek: "Friday", startTime: "11:00", endTime: "17:00" },
      ],
  
      leaves: [
        {
          startDate: new Date("2025-03-15T00:00:00Z"),
          endDate: new Date("2025-03-20T00:00:00Z"),
          reason: "Workshop",
        },
      ],
  
      clinics: [
        {
          name: "MindCare Clinic",
          address: "Connaught Place, Delhi",
          images: [
            "https://images.unsplash.com/photo-1629909613238-f9a555d38e31?q=80&w=400&auto=format&fit=crop",
          ],
          timings: "Tue-Fri: 10am - 7pm",
          mapUrl: "https://maps.google.com/?q=Connaught+Place+Delhi",
        },
      ],
  
      awards: [
        {
          title: "Top Psychiatrist Award",
          year: 2021,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/awards/master/psychiatry-award.pdf",
        },
      ],
  
      registrations: [
        {
          registrationNumber: "RCI-9034",
          council: "Medical Council of India",
          year: 2010,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/licenses/master/mci-cert.pdf",
        },
      ],
  
      memberships: [
        "Indian Psychiatric Society",
        "National Mental Health Association",
      ],
  
      workExperience: [
        {
          role: "Senior Psychiatrist",
          hospital: "Max Super Speciality Hospital",
          startYear: 2010,
          endYear: 2018,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/experience/master/max.pdf",
        },
      ],
  
      faqs: [
        {
          question: "Do you prescribe medication?",
          answer: "Yes, after proper evaluation.",
        },
      ],
  
      reviews: [
        {
          reviewerName: "Aman Verma",
          rating: 5,
          tags: ["Medication", "Support"],
          comment:
            "He understood my symptoms clearly and helped reduce my panic attacks.",
          date: new Date("2024-11-25T00:00:00Z"),
        },
      ],
    },
  
    {
      name: "Ms. Sarah Fernandez",
      username: "sarah_counselor",
      email: "sarah.fernandez@example.com",
      profilePicture:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
      videoUrl: "https://www.youtube.com/embed/R1vskiVDwl4",
      specialization: "Counseling Psychologist",
      bio: "Helping young adults navigate relationship issues, career stress, and self-esteem challenges.",
      experienceYears: 6,
      education: "MA Psychology, Mumbai University",
      location: "Mumbai, India",
      languages: ["English", "Marathi", "Konkani"],
      gender: "Female",
      rating: 4.7,
      reviewCount: 45,
      isVerified: true,
      treatmentTags: ["Relationships", "Self-esteem", "Career Counseling"],
      isOnline: true,
      lastSeen: new Date("2025-01-21T07:15:00Z"),
  
      documents: [
        {
          title: "Counseling Diploma",
          url: "https://raw.githubusercontent.com/sample-docs/psychology/master/counseling-diploma.pdf",
          type: "pdf",
        },
      ],
  
      services: [
        {
          name: "Individual Therapy",
          duration: 60,
          videoPrice: 1200,
          clinicPrice: 1500,
        },
        {
          name: "Career Counseling",
          duration: 50,
          videoPrice: 1100,
          clinicPrice: null,
        },
      ],
  
      availability: [
        { dayOfWeek: "Saturday", startTime: "10:00", endTime: "16:00" },
        { dayOfWeek: "Sunday", startTime: "10:00", endTime: "14:00" },
      ],
  
      leaves: [],
  
      clinics: [
        {
          name: "Urban Mind Clinic",
          address: "Bandra West, Mumbai",
          images: [
            "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=400&auto=format&fit=crop",
          ],
          timings: "Sat-Sun: 10am - 6pm",
          mapUrl: "https://maps.google.com/?q=Bandra+West+Mumbai",
        },
      ],
  
      awards: [],
  
      registrations: [
        {
          registrationNumber: "RCI-8821",
          council: "Rehabilitation Council of India",
          year: 2019,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/licenses/master/rc-psych.pdf",
        },
      ],
  
      memberships: ["Bombay Psychological Association"],
  
      workExperience: [
        {
          role: "Counseling Psychologist",
          hospital: "Urban Mind Clinic",
          startYear: 2020,
          endYear: null,
          documentUrl:
            "https://raw.githubusercontent.com/sample-docs/experience/master/urban-mind.pdf",
        },
      ],
  
      faqs: [
        {
          question: "Do you offer couple sessions?",
          answer: "At present I focus only on individual sessions.",
        },
      ],
  
      reviews: [
        {
          reviewerName: "Neha Kulkarni",
          rating: 5,
          tags: ["Empathy", "Support"],
          comment:
            "Very warm and non-judgmental. Helped me through a tough breakup.",
          date: new Date("2024-08-09T00:00:00Z"),
        },
      ],
    },

    {
        name: "Mr. Vikram Singh",
        username: "vikram_coach",
        email: "vikram.singh@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/Lzj7n8aOq1A",
        specialization: "Life Coach",
        bio: "Certified Life Coach helping professionals achieve work-life balance and unlock leadership potential.",
        experienceYears: 10,
        education: "MBA & Certified ICF Coach",
        location: "Gurgaon, India",
        languages: ["English", "Hindi", "Punjabi"],
        gender: "Male",
        rating: 4.9,
        reviewCount: 120,
        isVerified: true,
        treatmentTags: ["Leadership", "Work-Life Balance", "Motivation"],
        isOnline: true,
        lastSeen: new Date("2025-01-20T17:50:00Z"),
      
        documents: [
          {
            title: "ICF Coach Credential",
            url: "https://raw.githubusercontent.com/sample-docs/coaching/master/icf-credential.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Coaching Session", duration: 60, videoPrice: 3000, clinicPrice: null },
          { name: "Leadership Intensive", duration: 90, videoPrice: 4500, clinicPrice: null },
        ],
      
        availability: [
          { dayOfWeek: "Monday", startTime: "18:00", endTime: "21:00" },
          { dayOfWeek: "Wednesday", startTime: "18:00", endTime: "21:00" },
        ],
      
        leaves: [],
      
        clinics: [],
      
        awards: [
          {
            title: "Top Leadership Coach",
            year: 2023,
            documentUrl: "https://raw.githubusercontent.com/sample-docs/awards/master/coach-award.pdf",
          },
        ],
      
        registrations: [],
      
        memberships: ["ICF Global", "Asia Coaching Network"],
      
        workExperience: [
          {
            role: "Leadership Coach",
            hospital: "Independent Practice",
            startYear: 2016,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/independent-coach.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you work with founders?",
            answer: "Yes, a large part of my practice is with startup founders.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Rahul Mehta",
            rating: 5,
            tags: ["Motivation", "Clarity"],
            comment:
              "Sessions were clear, structured, and helped me become more confident as a manager.",
            date: new Date("2024-06-14T00:00:00Z"),
          },
        ],
      },
      
      // ==========================
      // EXPERT 5
      // ==========================
      {
        name: "Dr. Priya Desai",
        username: "priya_childpsych",
        email: "priya.desai@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/kS1cR_eFd6k",
        specialization: "Child Psychologist",
        bio: "Working with children and adolescents on developmental issues, learning disabilities, and behavioral challenges.",
        experienceYears: 15,
        education: "PhD Child Psychology",
        location: "Pune, India",
        languages: ["English", "Hindi", "Gujarati"],
        gender: "Female",
        rating: 5.0,
        reviewCount: 98,
        isVerified: true,
        treatmentTags: ["Child Development", "ADHD", "Autism Support"],
        isOnline: false,
        lastSeen: new Date("2025-01-18T13:05:00Z"),
      
        documents: [
          {
            title: "Child Psychology PhD Certificate",
            url: "https://raw.githubusercontent.com/sample-docs/psychology/master/child-phd.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Child Assessment", duration: 90, videoPrice: null, clinicPrice: 3500 },
          { name: "Parent Counseling", duration: 60, videoPrice: 1800, clinicPrice: 2200 },
        ],
      
        availability: [
          { dayOfWeek: "Monday", startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: "Friday", startTime: "14:00", endTime: "19:00" },
        ],
      
        leaves: [
          {
            startDate: new Date("2025-04-10T00:00:00Z"),
            endDate: new Date("2025-04-15T00:00:00Z"),
            reason: "Family",
          },
        ],
      
        clinics: [
          {
            name: "Bright Minds Pediatric Centre",
            address: "Kothrud, Pune",
            images: [
              "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=400&auto=format&fit=crop",
            ],
            timings: "Mon, Fri: 2pm - 7pm",
            mapUrl: "https://maps.google.com/?q=Kothrud+Pune",
          },
        ],
      
        awards: [
          {
            title: "Excellence in Child Therapy",
            year: 2020,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/awards/master/child-therapy-award.pdf",
          },
        ],
      
        registrations: [
          {
            registrationNumber: "RCI-7123",
            council: "Rehabilitation Council of India",
            year: 2011,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/rci-child.pdf",
          },
        ],
      
        memberships: [
          "Indian Association of Clinical Psychologists",
          "Child Development Network",
        ],
      
        workExperience: [
          {
            role: "Child Psychologist",
            hospital: "Bright Minds Pediatric Centre",
            startYear: 2012,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/bright-minds.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you work with children under 5?",
            answer: "Yes, I work with children starting at 3 years old.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Shruti Patel",
            rating: 5,
            tags: ["Child Friendly", "Clarity"],
            comment:
              "She helped us understand our son's learning challenges and guided us well.",
            date: new Date("2024-03-10T00:00:00Z"),
          },
        ],
      },
      
      // ==========================
      // EXPERT 6
      // ==========================
      {
        name: "Dr. Arjun Reddy",
        username: "arjun_therapy",
        email: "arjun.reddy@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/Odij5vXJzR0",
        specialization: "Clinical Psychologist",
        bio: "Experienced in trauma-informed care and PTSD recovery using EMDR and narrative therapy.",
        experienceYears: 9,
        education: "M.Phil Clinical Psychology",
        location: "Hyderabad, India",
        languages: ["English", "Telugu"],
        gender: "Male",
        rating: 4.6,
        reviewCount: 60,
        isVerified: true,
        treatmentTags: ["Trauma", "PTSD", "Grief"],
        isOnline: true,
        lastSeen: new Date("2025-01-21T09:40:00Z"),
      
        documents: [
          {
            title: "Clinical License",
            url: "https://raw.githubusercontent.com/sample-docs/licenses/master/clinical-license.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Trauma Therapy", duration: 60, videoPrice: 2000, clinicPrice: 2500 },
          { name: "Grief Counseling", duration: 50, videoPrice: 1700, clinicPrice: 2100 },
        ],
      
        availability: [
          { dayOfWeek: "Tuesday", startTime: "09:00", endTime: "14:00" },
          { dayOfWeek: "Thursday", startTime: "09:00", endTime: "14:00" },
        ],
      
        leaves: [],
      
        clinics: [
          {
            name: "Safe Space Therapy",
            address: "Banjara Hills, Hyderabad",
            images: [
              "https://images.unsplash.com/photo-1535916707207-35f97e715e1b?q=80&w=400&auto=format&fit=crop",
            ],
            timings: "Tue, Thu: 9am - 2pm",
            mapUrl: "https://maps.google.com/?q=Banjara+Hills+Hyderabad",
          },
        ],
      
        awards: [],
      
        registrations: [
          {
            registrationNumber: "RCI-6543",
            council: "Rehabilitation Council of India",
            year: 2016,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/rci-arjun.pdf",
          },
        ],
      
        memberships: ["Hyderabad Psychologists Association"],
      
        workExperience: [
          {
            role: "Clinical Psychologist",
            hospital: "Safe Space Therapy",
            startYear: 2017,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/safe-space.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you see clients online?",
            answer: "Yes, video sessions are available.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Manisha Rao",
            rating: 4,
            tags: ["Trauma Support"],
            comment: "Sessions helped me process loss. Grateful for the guidance.",
            date: new Date("2024-05-11T00:00:00Z"),
          },
        ],
      },
      
      // ==========================
      // EXPERT 7
      // ==========================
      {
        name: "Ms. Kavita Mehra",
        username: "kavita_m",
        email: "kavita.mehra@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/kLld5GqX_5I",
        specialization: "Marriage Counselor",
        bio: "Helping couples reconnect, resolve conflicts, and build stronger foundations in their relationship.",
        experienceYears: 14,
        education: "MA Counseling",
        location: "Chandigarh, India",
        languages: ["English", "Hindi", "Punjabi"],
        gender: "Female",
        rating: 4.8,
        reviewCount: 150,
        isVerified: true,
        treatmentTags: ["Couples Therapy", "Divorce", "Communication"],
        isOnline: true,
        lastSeen: new Date("2025-01-19T16:00:00Z"),
      
        documents: [
          {
            title: "Marriage Counseling Certification",
            url: "https://raw.githubusercontent.com/sample-docs/psychology/master/marriage-cert.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Couple Session", duration: 90, videoPrice: 3000, clinicPrice: 3500 },
          { name: "Pre-marital Counseling", duration: 75, videoPrice: 2600, clinicPrice: 3000 },
        ],
      
        availability: [
          { dayOfWeek: "Saturday", startTime: "10:00", endTime: "18:00" },
          { dayOfWeek: "Sunday", startTime: "10:00", endTime: "14:00" },
        ],
      
        leaves: [],
      
        clinics: [
          {
            name: "Harmony Relationship Centre",
            address: "Sector 17, Chandigarh",
            images: [
              "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=400&auto=format&fit=crop",
            ],
            timings: "Sat: 10am-6pm, Sun: 10am-2pm",
            mapUrl: "https://maps.google.com/?q=Sector+17+Chandigarh",
          },
        ],
      
        awards: [],
      
        registrations: [
          {
            registrationNumber: "RCI-9234",
            council: "Rehabilitation Council of India",
            year: 2012,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/rci-kavita.pdf",
          },
        ],
      
        memberships: ["Indian Association for Marriage & Family Therapy"],
      
        workExperience: [
          {
            role: "Marriage Counselor",
            hospital: "Harmony Relationship Centre",
            startYear: 2013,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/harmony.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you work with couples on the verge of divorce?",
            answer: "Yes, I often help high-conflict couples rebuild communication.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Simran & Raj",
            rating: 5,
            tags: ["Communication", "Clarity"],
            comment: "We were close to separating, her sessions helped us understand each other again.",
            date: new Date("2024-07-23T00:00:00Z"),
          },
        ],
      },

      {
        name: "Dr. Sameer Khan",
        username: "sameer_psych",
        email: "sameer.khan@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1537368910025-600021b56518?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/3my9n_8xYRY",
        specialization: "Psychiatrist",
        bio: "Specialist in geriatric psychiatry and dementia care, offering compassionate support for elderly patients and their families.",
        experienceYears: 22,
        education: "MD Psychiatry",
        location: "Lucknow, India",
        languages: ["English", "Hindi", "Urdu"],
        gender: "Male",
        rating: 4.9,
        reviewCount: 300,
        isVerified: true,
        treatmentTags: ["Dementia", "Alzheimer's", "Geriatric Care"],
        isOnline: false,
        lastSeen: new Date("2025-01-18T10:10:00Z"),
      
        documents: [
          {
            title: "Medical License",
            url: "https://raw.githubusercontent.com/sample-docs/licenses/master/sameer-license.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Consultation", duration: 45, videoPrice: 1500, clinicPrice: 1800 },
          { name: "Memory Assessment", duration: 60, videoPrice: 2100, clinicPrice: 2600 },
        ],
      
        availability: [
          { dayOfWeek: "Monday", startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: "Wednesday", startTime: "10:00", endTime: "14:00" },
          { dayOfWeek: "Friday", startTime: "10:00", endTime: "14:00" },
        ],
      
        leaves: [],
      
        clinics: [
          {
            name: "Senior Care Mental Health Centre",
            address: "Hazratganj, Lucknow",
            images: [
              "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=400&auto=format&fit=crop",
            ],
            timings: "Mon/Wed/Fri: 10am - 2pm",
            mapUrl: "https://maps.google.com/?q=Hazratganj+Lucknow",
          },
        ],
      
        awards: [
          {
            title: "Excellence in Geriatric Psychiatry",
            year: 2021,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/awards/master/geriatric-award.pdf",
          },
        ],
      
        registrations: [
          {
            registrationNumber: "RCI-7432",
            council: "Medical Council of India",
            year: 2003,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/mci-sameer.pdf",
          },
        ],
      
        memberships: ["Indian Psychiatric Society", "Geriatric Mental Health Forum"],
      
        workExperience: [
          {
            role: "Consultant Psychiatrist",
            hospital: "Senior Care Mental Health Centre",
            startYear: 2004,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/sameer-centre.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you offer caregiver guidance?",
            answer: "Yes, I help families support dementia patients effectively.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Mohan Gupta",
            rating: 5,
            tags: ["Elder Care"],
            comment:
              "He handled my father's memory decline very patiently and guided us throughout.",
            date: new Date("2024-06-02T00:00:00Z"),
          },
        ],
      },

      
      {
        name: "Ms. Leela Thomas",
        username: "leela_arttherapy",
        email: "leela.thomas@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/N5e5pSxbFZc",
        specialization: "Art Therapist",
        bio: "Using creative expression to foster emotional healing and mental well-being. Works with children, teens, and adults.",
        experienceYears: 7,
        education: "MA Art Therapy",
        location: "Kochi, India",
        languages: ["English", "Malayalam"],
        gender: "Female",
        rating: 4.7,
        reviewCount: 40,
        isVerified: true,
        treatmentTags: ["Art Therapy", "Expression", "Anxiety"],
        isOnline: true,
        lastSeen: new Date("2025-01-21T12:50:00Z"),
      
        documents: [
          {
            title: "Art Therapy Certification",
            url: "https://raw.githubusercontent.com/sample-docs/psychology/master/art-therapy-cert.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Art Therapy Session", duration: 75, videoPrice: 2000, clinicPrice: 2200 },
          { name: "Creative Expression Therapy", duration: 60, videoPrice: 1800, clinicPrice: 2100 },
        ],
      
        availability: [
          { dayOfWeek: "Tuesday", startTime: "14:00", endTime: "19:00" },
          { dayOfWeek: "Thursday", startTime: "14:00", endTime: "19:00" },
        ],
      
        leaves: [],
      
        clinics: [
          {
            name: "Colors Therapy Studio",
            address: "MG Road, Kochi",
            images: [
              "https://images.unsplash.com/photo-1498654206900-859e7bf1c78b?q=80&w=400&auto=format&fit=crop",
            ],
            timings: "Tue/Thu: 2pm-7pm",
            mapUrl: "https://maps.google.com/?q=MG+Road+Kochi",
          },
        ],
      
        awards: [],
      
        registrations: [
          {
            registrationNumber: "AT-2219",
            council: "Indian Association of Art Therapists",
            year: 2019,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/art-therapy-reg.pdf",
          },
        ],
      
        memberships: ["Indian Association of Art Therapists"],
      
        workExperience: [
          {
            role: "Art Therapist",
            hospital: "Colors Therapy Studio",
            startYear: 2019,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/colors-therapy.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do sessions require artistic skills?",
            answer: "No—anyone can participate and benefit.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Eliza Mathews",
            rating: 5,
            tags: ["Creativity", "Calm"],
            comment:
              "I never realized how healing art could be. Leela made the space welcoming.",
            date: new Date("2024-04-18T00:00:00Z"),
          },
        ],
      },

      
      {
        name: "Mx. Alex Jordan",
        username: "alex_j",
        email: "alex.jordan@example.com",
        profilePicture:
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&auto=format&fit=crop",
        videoUrl: "https://www.youtube.com/embed/Ww_l91dJjBo",
        specialization: "Psychotherapist",
        bio: "Queer-affirmative therapist specializing in sexuality, identity, and LGBTQIA+ mental health.",
        experienceYears: 5,
        education: "MSc Psychology",
        location: "Bangalore, India",
        languages: ["English", "Hindi"],
        gender: "Non-Binary",
        rating: 4.9,
        reviewCount: 75,
        isVerified: true,
        treatmentTags: ["LGBTQIA+", "Gender Identity", "Anxiety"],
        isOnline: true,
        lastSeen: new Date("2025-01-22T08:55:00Z"),
      
        documents: [
          {
            title: "Queer Affirmative Therapy Certification",
            url: "https://raw.githubusercontent.com/sample-docs/psychology/master/qaat-cert.pdf",
            type: "pdf",
          },
        ],
      
        services: [
          { name: "Online Therapy", duration: 50, videoPrice: 1800, clinicPrice: null },
          { name: "Identity Exploration", duration: 60, videoPrice: 2200, clinicPrice: null },
        ],
      
        availability: [
          { dayOfWeek: "Monday", startTime: "16:00", endTime: "20:00" },
          { dayOfWeek: "Wednesday", startTime: "16:00", endTime: "20:00" },
          { dayOfWeek: "Friday", startTime: "16:00", endTime: "20:00" },
        ],
      
        leaves: [],
      
        clinics: [],
      
        awards: [
          {
            title: "LGBTQIA+ Support Excellence Award",
            year: 2023,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/awards/master/lgbtq-award.pdf",
          },
        ],
      
        registrations: [
          {
            registrationNumber: "RCI-9988",
            council: "Rehabilitation Council of India",
            year: 2020,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/licenses/master/rci-alex.pdf",
          },
        ],
      
        memberships: ["Queer Affirmative Counselling Practitioners India"],
      
        workExperience: [
          {
            role: "Psychotherapist",
            hospital: "Safe Horizon Clinic",
            startYear: 2020,
            endYear: null,
            documentUrl:
              "https://raw.githubusercontent.com/sample-docs/experience/master/safe-horizon.pdf",
          },
        ],
      
        faqs: [
          {
            question: "Do you provide sliding scale fees?",
            answer: "Yes, based on individual needs.",
          },
        ],
      
        reviews: [
          {
            reviewerName: "Aisha Rahman",
            rating: 5,
            tags: ["Queer Affirming", "Safe Space"],
            comment:
              "Alex helped me navigate my identity in a safe, affirming way.",
            date: new Date("2024-09-12T00:00:00Z"),
          },
        ],
      },
      
  ];
  

export async function GET() {
  try {
    await connectToDatabase();

    // Find the emails that already exist
    const expertEmails = EXPERT_DATA.map(e => e.email);
    const existingExperts = await Expert.find({ email: { $in: expertEmails } }).select('email');
    const existingEmails = new Set(existingExperts.map(e => e.email));

    // Filter out existing experts
    const expertsToInsert = EXPERT_DATA.filter(e => !existingEmails.has(e.email));
    
    if (expertsToInsert.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: `All ${EXPERT_DATA.length} expert(s) already exist in the database. Seeding skipped.` 
      }, { status: 200 });
    }

    const result = await Expert.insertMany(expertsToInsert);

    return NextResponse.json({ 
      success: true, 
      message: `${result.length} new expert(s) seeded successfully!`,
      ids: result.map(doc => doc._id.toString())
    });
  } catch (error) {
    console.error("Expert Seeding Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Database seeding failed.", 
      error: error.message 
    }, { status: 500 });
  }
}