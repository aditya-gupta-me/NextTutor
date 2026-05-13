/** App-wide constants */

export const APP_NAME = "NextTutor";

export const SUBJECTS = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "Hindi",
    "Computer Science",
    "Economics",
    "Accountancy",
    "Business Studies",
    "History",
    "Geography",
    "Political Science",
    "Sanskrit",
    "French",
] as const;

export const BOARDS = [
    "CBSE",
    "ICSE",
    "State Board",
    "IB",
    "IGCSE",
] as const;

export const FAQ_TEMPLATES = [
    "What subjects and boards do you cover?",
    "What is your teaching approach?",
    "Do you give homework or assignments?",
    "What is your cancellation or rescheduling policy?",
    "What materials do students need to bring?",
    "How do you track a student's progress?",
    "Do you offer a trial class?",
] as const;

export const DISTANCE_OPTIONS = [
    { label: "Within 2 km", value: 2 },
    { label: "Within 5 km", value: 5 },
    { label: "Within 10 km", value: 10 },
    { label: "Within 20 km", value: 20 },
] as const;

export const PRICE_RANGES = [
    { label: "Under ₹2,000/mo", min: 0, max: 2000 },
    { label: "₹2,000 – ₹4,000/mo", min: 2000, max: 4000 },
    { label: "₹4,000 – ₹8,000/mo", min: 4000, max: 8000 },
    { label: "₹8,000+/mo", min: 8000, max: null },
] as const;

export const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;
