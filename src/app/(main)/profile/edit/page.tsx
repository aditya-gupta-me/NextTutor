"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, FAQ_TEMPLATES } from "@/lib/constants";
import InlineAlert from "@/components/ui/InlineAlert";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { useToast } from "@/components/ui/ToastContext";
import ServiceRadiusMap from "@/components/ui/ServiceRadiusMap";

export default function ProfileEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isOnboarding = searchParams.get("onboarding") === "true";
    const supabase = createClient();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [role, setRole] = useState<"student" | "tutor">("student");
    const [userId, setUserId] = useState("");

    // Common fields
    const [fullName, setFullName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [gender, setGender] = useState<string>("");

    // Tutor fields
    const [subjects, setSubjects] = useState<string[]>([]);
    const [qualification, setQualification] = useState("");
    const [bio, setBio] = useState("");
    const [tutorAge, setTutorAge] = useState("");
    const [feePerMonth, setFeePerMonth] = useState("");
    const [feePerSession, setFeePerSession] = useState("");
    const [address, setAddress] = useState("");
    const [locality, setLocality] = useState("");
    const [city, setCity] = useState("");
    const [pincode, setPincode] = useState("");
    const [serviceRadius, setServiceRadius] = useState("4");
    const [availableSeats, setAvailableSeats] = useState("10");
    const [tutorLat, setTutorLat] = useState<number | null>(null);
    const [tutorLng, setTutorLng] = useState<number | null>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    // FAQ answers
    const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});

    // Student fields
    const [school, setSchool] = useState("");
    const [age, setAge] = useState("");
    const [subjectsInterested, setSubjectsInterested] = useState<string[]>([]);
    const [studentAddress, setStudentAddress] = useState("");
    const [studentLocality, setStudentLocality] = useState("");
    const [studentCity, setStudentCity] = useState("");
    const [studentPincode, setStudentPincode] = useState("");
    const [studentLat, setStudentLat] = useState<number | null>(null);
    const [studentLng, setStudentLng] = useState<number | null>(null);
    const studentAddressRef = useRef<HTMLInputElement>(null);
    const [useMyLocationLoading, setUseMyLocationLoading] = useState(false);
    const [locationCooldown, setLocationCooldown] = useState(false);

    // Parent info
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentRelationship, setParentRelationship] = useState("guardian");

    // Email change flow
    const [showEmailChange, setShowEmailChange] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [emailChangeSending, setEmailChangeSending] = useState(false);
    const [emailChangeSent, setEmailChangeSent] = useState(false);

    // Snapshot of original tutor profile for change detection (analytics events)
    const originalTutorProfile = useRef<Record<string, unknown> | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    // Initialize Google Places Autocomplete on address inputs (both roles)
    useEffect(() => {
        if (loading) return;

        const autocompletes: google.maps.places.Autocomplete[] = [];

        const initAutocomplete = async () => {
            try {
                const { loadGoogleMaps, extractAddressComponents } = await import("@/lib/google-maps");
                await loadGoogleMaps();

                // Tutor address autocomplete
                if (role === "tutor" && addressInputRef.current) {
                    const tutorAc = new google.maps.places.Autocomplete(addressInputRef.current, {
                        componentRestrictions: { country: "in" },
                        fields: ["formatted_address", "address_components", "geometry"],
                        types: ["address"],
                    });
                    tutorAc.addListener("place_changed", () => {
                        const place = tutorAc.getPlace();
                        if (!place.geometry) return;
                        const c = extractAddressComponents(place);
                        setAddress(c.address);
                        if (c.locality) setLocality(c.locality);
                        if (c.city) setCity(c.city);
                        if (c.pincode) setPincode(c.pincode);
                        if (c.lat !== null) setTutorLat(c.lat);
                        if (c.lng !== null) setTutorLng(c.lng);
                    });
                    autocompletes.push(tutorAc);
                }

                // Student address autocomplete
                if (role === "student" && studentAddressRef.current) {
                    const studentAc = new google.maps.places.Autocomplete(studentAddressRef.current, {
                        componentRestrictions: { country: "in" },
                        fields: ["formatted_address", "address_components", "geometry"],
                        types: ["address"],
                    });
                    studentAc.addListener("place_changed", () => {
                        const place = studentAc.getPlace();
                        if (!place.geometry) return;
                        const c = extractAddressComponents(place);
                        setStudentAddress(c.address);
                        if (c.locality) setStudentLocality(c.locality);
                        if (c.city) setStudentCity(c.city);
                        if (c.pincode) setStudentPincode(c.pincode);
                        if (c.lat !== null) setStudentLat(c.lat);
                        if (c.lng !== null) setStudentLng(c.lng);
                    });
                    autocompletes.push(studentAc);
                }
            } catch {
                // Google Maps not available — fall back to manual input
            }
        };

        initAutocomplete();

        return () => {
            autocompletes.forEach((ac) => {
                google.maps.event.clearInstanceListeners(ac);
            });
        };
    }, [role, loading]);

    // "Use My Location" handler — reverse geocodes GPS position to fill address fields
    const handleUseMyLocation = async (forRole: "tutor" | "student") => {
        if (locationCooldown || useMyLocationLoading) return;
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }
        setUseMyLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                try {
                    const { reverseGeocode } = await import("@/lib/google-maps");
                    const result = await reverseGeocode(lat, lng);
                    if (result) {
                        if (forRole === "tutor") {
                            setAddress(result.address);
                            if (result.locality) setLocality(result.locality);
                            if (result.city) setCity(result.city);
                            if (result.pincode) setPincode(result.pincode);
                            setTutorLat(lat);
                            setTutorLng(lng);
                        } else {
                            setStudentAddress(result.address);
                            if (result.locality) setStudentLocality(result.locality);
                            if (result.city) setStudentCity(result.city);
                            if (result.pincode) setStudentPincode(result.pincode);
                            setStudentLat(lat);
                            setStudentLng(lng);
                        }
                        toast.success("Location detected! Fields have been auto-filled.");
                    } else {
                        toast.error("Could not determine your address. Try typing it manually.");
                    }
                } catch {
                    toast.error("Failed to detect location. Please type your address.");
                }
                setUseMyLocationLoading(false);
                // Cooldown: prevent rapid re-clicks for 30 seconds
                setLocationCooldown(true);
                setTimeout(() => setLocationCooldown(false), 30000);
            },
            (err) => {
                toast.error(
                    err.code === 1
                        ? "Location access denied. Please enable it in browser settings."
                        : "Unable to get your location. Try again."
                );
                setUseMyLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            // Pre-fill contact info from auth
            setUserEmail(user.email || "");
            setUserPhone(user.phone || "");

            const { data: profile } = await supabase
                .from("users")
                .select("full_name, role, phone, email, avatar_url")
                .eq("id", user.id)
                .maybeSingle();

            if (profile) {
                setFullName(profile.full_name || "");
                setRole(profile.role as "student" | "tutor");
                setAvatarUrl(profile.avatar_url);
                // Use DB values if available, otherwise auth values
                if (profile.phone) setUserPhone(profile.phone);
                if (profile.email) setUserEmail(profile.email);
            } else {
                // No DB row yet — use metadata from signup
                const meta = user.user_metadata || {};
                setFullName(meta.full_name || "");
                setRole((meta.role as "student" | "tutor") || "student");
            }

            const effectiveRole = profile?.role || user.user_metadata?.role || "student";

            if (effectiveRole === "tutor") {
                const { data: tutorProfile } = await supabase
                    .from("tutor_profiles")
                    .select("*, tutor_faqs(*)")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (tutorProfile) {
                    setSubjects(tutorProfile.subjects || []);
                    setQualification(tutorProfile.qualification || "");
                    setBio(tutorProfile.bio || "");
                    setGender(tutorProfile.gender || "");
                    setTutorAge(tutorProfile.age?.toString() || "");
                    setFeePerMonth(tutorProfile.fee_per_month?.toString() || "");
                    setFeePerSession(tutorProfile.fee_per_session?.toString() || "");
                    setAddress(tutorProfile.address || "");
                    setLocality(tutorProfile.locality || "");
                    setCity(tutorProfile.city || "");
                    setPincode(tutorProfile.pincode || "");
                    setServiceRadius(tutorProfile.service_radius_km?.toString() || "4");
                    setAvailableSeats(tutorProfile.available_seats?.toString() || "10");

                    // Load saved coordinates from PostGIS via RPC
                    try {
                        const { data: locData } = await supabase
                            .rpc("get_tutor_coords", { tutor_id: tutorProfile.id })
                            .single();
                        const coords = locData as { lat: number; lng: number } | null;
                        if (coords) {
                            setTutorLat(coords.lat);
                            setTutorLng(coords.lng);
                        }
                    } catch {
                        // location not set yet
                    }

                    // Load FAQs
                    const faqs = (tutorProfile as unknown as { tutor_faqs: { question: string; answer: string }[] }).tutor_faqs || [];
                    const answers: Record<string, string> = {};
                    faqs.forEach((faq) => {
                        answers[faq.question] = faq.answer;
                    });
                    setFaqAnswers(answers);

                    // Capture snapshot for change detection (analytics events)
                    originalTutorProfile.current = {
                        subjects: tutorProfile.subjects || [],
                        qualification: tutorProfile.qualification || "",
                        bio: tutorProfile.bio || "",
                        fee_per_month: tutorProfile.fee_per_month?.toString() || "",
                        fee_per_session: tutorProfile.fee_per_session?.toString() || "",
                        address: tutorProfile.address || "",
                        city: tutorProfile.city || "",
                    };
                }
            } else if (effectiveRole === "student") {
                const { data: studentProfile } = await supabase
                    .from("student_profiles")
                    .select("*, parent_info(*)")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (studentProfile) {
                    setSchool(studentProfile.school || "");
                    setGender(studentProfile.gender || "");
                    setAge(studentProfile.age?.toString() || "");
                    setSubjectsInterested(studentProfile.subjects_interested || []);
                    setStudentAddress(studentProfile.address || "");
                    setStudentLocality(studentProfile.locality || "");
                    setStudentCity(studentProfile.city || "");
                    setStudentPincode(studentProfile.pincode || "");

                    const parentInfo = (studentProfile as unknown as { parent_info: { parent_name: string; parent_phone: string; parent_email: string; relationship: string } | null }).parent_info;
                    if (parentInfo) {
                        setParentName(parentInfo.parent_name || "");
                        setParentPhone(parentInfo.parent_phone || "");
                        setParentEmail(parentInfo.parent_email || "");
                        setParentRelationship(parentInfo.relationship || "guardian");
                    }
                }
            }
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): string | null => {
        if (!fullName.trim()) return "Full name is required.";
        if (fullName.trim().length < 2) return "Full name must be at least 2 characters.";
        // Email and phone are read-only (sourced from Supabase Auth), no validation needed

        if (role === "student") {
            if (age && (parseInt(age) < 3 || parseInt(age) > 100)) return "Age must be between 3 and 100.";
            if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) return "Please enter a valid parent email.";
            if (parentPhone && !/^[0-9]{10,13}$/.test(parentPhone.replace(/\s/g, ""))) return "Please enter a valid parent phone number (10-13 digits).";
        }

        if (role === "tutor") {
            if (pincode && !/^[0-9]{6}$/.test(pincode)) return "Pincode must be exactly 6 digits.";
            if (tutorAge && (parseInt(tutorAge) < 18 || parseInt(tutorAge) > 100)) return "Tutor age must be between 18 and 100.";

            // Onboarding mode: enforce essential fields for listing
            if (isOnboarding) {
                if (subjects.length === 0) return "Please select at least one subject you teach.";
                if (!city) return "Please enter your city or use the location detector.";
                if (!feePerMonth && !feePerSession) return "Please set at least one fee (monthly or per session).";
                if (!address) return "Please enter your address so students can find you nearby.";
            }
        }

        return null;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setSaving(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated. Please log in again.");

            // Upsert user row (may not exist if trigger didn't fire)
            const { error: userError } = await supabase
                .from("users")
                .upsert({
                    id: user.id,
                    email: user.email || null,
                    phone: user.phone || null,
                    full_name: fullName.trim(),
                    role,
                    avatar_url: avatarUrl,
                }, { onConflict: "id" });

            if (userError) {
                console.error("User upsert error:", userError);
                throw new Error(`Failed to save user: ${userError.message}`);
            }

            if (role === "tutor") {
                // Generate slug
                const slug = `${fullName}-${subjects[0] || "tutor"}-${city}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

                // Check for existing tutor profile
                const { data: existing } = await supabase
                    .from("tutor_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();

                const profileData: Record<string, unknown> = {
                    user_id: user.id,
                    subjects,
                    qualification,
                    bio,
                    gender: gender || null,
                    age: tutorAge ? parseInt(tutorAge) : null,
                    fee_per_month: feePerMonth ? parseInt(feePerMonth) : null,
                    fee_per_session: feePerSession ? parseInt(feePerSession) : null,
                    address,
                    locality,
                    city,
                    pincode,
                    service_radius_km: Math.max(1, Math.min(15, parseInt(serviceRadius) || 4)),
                    available_seats: parseInt(availableSeats) || 10,
                    slug,
                };

                // Geocode address → PostGIS point
                if (tutorLat && tutorLng) {
                    // Set via autocomplete selection (already geocoded)
                    profileData.location = `SRID=4326;POINT(${tutorLng} ${tutorLat})`;
                } else if (address && city) {
                    // Fallback: geocode from text
                    try {
                        const { geocodeAddress } = await import("@/lib/google-maps");
                        const coords = await geocodeAddress(`${address}, ${locality}, ${city}, ${pincode}, India`);
                        if (coords) {
                            profileData.location = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
                        }
                    } catch {
                        // geocoding failed — skip, address fields still saved
                    }
                }

                let tutorProfileId: string;

                if (existing) {
                    const { error: updateErr } = await supabase
                        .from("tutor_profiles")
                        .update(profileData)
                        .eq("id", existing.id);
                    if (updateErr) throw new Error(`Failed to update profile: ${updateErr.message}`);
                    tutorProfileId = existing.id;
                } else {
                    const { data: newProfile, error: insertErr } = await supabase
                        .from("tutor_profiles")
                        .insert(profileData)
                        .select("id")
                        .single();
                    if (insertErr || !newProfile) {
                        console.error("Insert error:", insertErr);
                        throw new Error(`Failed to create profile: ${insertErr?.message || "No data returned"}`);
                    }
                    tutorProfileId = newProfile.id;
                }

                // Save FAQs
                await supabase
                    .from("tutor_faqs")
                    .delete()
                    .eq("tutor_profile_id", tutorProfileId);

                const faqRows = FAQ_TEMPLATES
                    .map((q, i) => ({
                        tutor_profile_id: tutorProfileId,
                        question: q,
                        answer: faqAnswers[q] || "",
                        display_order: i,
                    }))
                    .filter((f) => f.answer.trim());

                if (faqRows.length > 0) {
                    await supabase.from("tutor_faqs").insert(faqRows);
                }

                // ─── Track profile changes for analytics ───
                if (originalTutorProfile.current) {
                    const prev = originalTutorProfile.current;
                    const changes: { event_type: string; description: string }[] = [];

                    // Subjects changed
                    const prevSubjects = (prev.subjects as string[]).sort().join(",");
                    const currSubjects = [...subjects].sort().join(",");
                    if (prevSubjects !== currSubjects) {
                        const added = subjects.filter(s => !(prev.subjects as string[]).includes(s));
                        const removed = (prev.subjects as string[]).filter(s => !subjects.includes(s));
                        const parts: string[] = [];
                        if (added.length) parts.push(`Added ${added.join(", ")}`);
                        if (removed.length) parts.push(`Removed ${removed.join(", ")}`);
                        changes.push({ event_type: "subjects_changed", description: parts.join("; ") });
                    }

                    // Bio updated
                    if (prev.bio !== bio) {
                        changes.push({ event_type: "bio_updated", description: "Updated bio" });
                    }

                    // Qualification updated
                    if (prev.qualification !== qualification) {
                        changes.push({ event_type: "qualification_updated", description: "Updated qualification" });
                    }

                    // Fee changed
                    if (prev.fee_per_month !== feePerMonth || prev.fee_per_session !== feePerSession) {
                        changes.push({ event_type: "fee_updated", description: "Updated pricing" });
                    }

                    // Location changed
                    if (prev.address !== address || prev.city !== city) {
                        changes.push({ event_type: "location_updated", description: "Updated location" });
                    }

                    // Insert all detected changes
                    if (changes.length > 0) {
                        await supabase.from("profile_update_events").insert(
                            changes.map(c => ({
                                tutor_profile_id: tutorProfileId,
                                event_type: c.event_type,
                                description: c.description,
                            }))
                        );
                    }
                }
            } else {
                // Check for existing student profile
                const { data: existing } = await supabase
                    .from("student_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .maybeSingle();

                const profileData: Record<string, unknown> = {
                    user_id: user.id,
                    school,
                    gender: gender || null,
                    age: age ? parseInt(age) : null,
                    subjects_interested: subjectsInterested,
                    address: studentAddress,
                    locality: studentLocality,
                    city: studentCity,
                    pincode: studentPincode,
                };

                // Geocode student address → PostGIS point
                if (studentLat && studentLng) {
                    profileData.location = `SRID=4326;POINT(${studentLng} ${studentLat})`;
                } else if (studentAddress && studentCity) {
                    try {
                        const { geocodeAddress } = await import("@/lib/google-maps");
                        const coords = await geocodeAddress(`${studentAddress}, ${studentLocality}, ${studentCity}, ${studentPincode}, India`);
                        if (coords) {
                            profileData.location = `SRID=4326;POINT(${coords.lng} ${coords.lat})`;
                        }
                    } catch {
                        // geocoding failed
                    }
                }

                let studentProfileId: string;

                if (existing) {
                    const { error: updateErr } = await supabase
                        .from("student_profiles")
                        .update(profileData)
                        .eq("id", existing.id);
                    if (updateErr) throw new Error(`Failed to update profile: ${updateErr.message}`);
                    studentProfileId = existing.id;
                } else {
                    const { data: newProfile, error: insertErr } = await supabase
                        .from("student_profiles")
                        .insert(profileData)
                        .select("id")
                        .single();
                    if (insertErr || !newProfile) {
                        console.error("Insert error:", insertErr);
                        throw new Error(`Failed to create profile: ${insertErr?.message || "No data returned"}`);
                    }
                    studentProfileId = newProfile.id;
                }

                // Save parent info
                if (parentName || parentPhone) {
                    const parentData = {
                        student_profile_id: studentProfileId,
                        parent_name: parentName,
                        parent_phone: parentPhone,
                        parent_email: parentEmail || null,
                        relationship: parentRelationship,
                    };

                    await supabase
                        .from("parent_info")
                        .upsert(parentData, { onConflict: "student_profile_id" });
                }
            }

            toast.success("Profile saved successfully!");
            setError("");

            // Redirect after save
            setTimeout(() => {
                router.push(isOnboarding ? "/dashboard" : "/profile");
            }, 1500);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save";
            console.error("Save error:", err);
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSubject = (subject: string, list: string[], setter: (s: string[]) => void) => {
        setter(
            list.includes(subject)
                ? list.filter((s) => s !== subject)
                : [...list, subject]
        );
    };

    if (loading) {
        return (
            <div className="px-6 py-8 md:px-10">
                <div className="h-8 w-48 skeleton mb-4" />
                <div className="h-4 w-64 skeleton mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 skeleton rounded-[var(--radius-md)]" />
                    ))}
                </div>
            </div>
        );
    }

    const initials = (fullName || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[760px]">
            <form onSubmit={handleSave}>

                {/* ─── Hero Header Card ─── */}
                <div className="relative rounded-[var(--radius-xl)] border border-border bg-bg-white overflow-hidden mb-6">
                    {/* Gradient Banner */}
                    <div
                        className="h-28 md:h-32"
                        style={{
                            background: role === "tutor"
                                ? "linear-gradient(135deg, #C3B1E1 0%, #E8D5F5 50%, #F5E6FF 100%)"
                                : "linear-gradient(135deg, #A7D8F0 0%, #C9E8FA 50%, #E3F4FF 100%)",
                        }}
                    />

                    {/* Profile Content */}
                    <div className="px-6 md:px-8 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                            {/* Avatar — click to upload (both roles) */}
                            {userId ? (
                                <AvatarUpload
                                    userId={userId}
                                    currentUrl={avatarUrl}
                                    fullName={fullName}
                                    onUpload={async (url) => {
                                        setAvatarUrl(url);
                                        // Track avatar change for tutor analytics
                                        if (role === "tutor") {
                                            const { data: tp } = await supabase
                                                .from("tutor_profiles")
                                                .select("id")
                                                .eq("user_id", userId)
                                                .maybeSingle();
                                            if (tp) {
                                                await supabase.from("profile_update_events").insert({
                                                    tutor_profile_id: tp.id,
                                                    event_type: "avatar_updated",
                                                    description: "Profile photo updated",
                                                });
                                            }
                                        }
                                    }}
                                    onRemove={() => setAvatarUrl(null)}
                                    accentGradient={
                                        role === "tutor"
                                            ? "linear-gradient(135deg, #9B7FD4, #C3B1E1)"
                                            : "linear-gradient(135deg, #5BA3D9, #A7D8F0)"
                                    }
                                />
                            ) : (
                                <div className="shrink-0 rounded-full p-[3px]" style={{
                                    background: role === "tutor"
                                        ? "linear-gradient(135deg, #9B7FD4, #C3B1E1)"
                                        : "linear-gradient(135deg, #5BA3D9, #A7D8F0)",
                                }}>
                                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bg-white text-2xl font-bold text-accent border-[3px] border-bg-white">
                                        <span className="text-2xl">{initials}</span>
                                    </div>
                                </div>
                            )}

                            {/* Title & Submit */}
                            <div className="flex-1 min-w-0 pb-1 flex justify-between items-end">
                                <div>
                                    <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl leading-tight">
                                        {isOnboarding ? "Set Up Your Profile" : "Edit Profile"}
                                    </h1>
                                    <p className="mt-1 text-sm text-text-secondary">
                                        {isOnboarding
                                            ? "Complete these details to get listed and start receiving students"
                                            : "Update your details to be discovered"}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="shrink-0 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-medium text-white transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-sm)] disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? (
                                        <>
                                            <i className="bx bx-loader-alt animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bx bx-save" /> {isOnboarding ? "Save & Continue" : "Save Changes"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Onboarding Progress Tracker ─── */}
                {isOnboarding && role === "tutor" && (
                    <OnboardingProgress
                        hasSubjects={subjects.length > 0}
                        hasLocation={!!city && !!address}
                        hasFee={!!(feePerMonth || feePerSession)}
                    />
                )}

                {/* Feedback */}
                {error && (
                    <div className="mb-6">
                        <InlineAlert variant="error" message={error} dismissible />
                    </div>
                )}

                {/* ─── Basic Info ─── */}
                <ProfileSection icon="bx-user-circle" title="Basic Information">
                    <div className="space-y-4">
                        <FormField label="Full Name" required icon="bx-user">
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="e.g. Priya Sharma"
                                className="form-input !pl-10"
                            />
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-text-primary mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        Email
                                    </span>
                                    {!showEmailChange && !emailChangeSent && (
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailChange(true)}
                                            className="text-[11px] font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
                                        >
                                            Change
                                        </button>
                                    )}
                                </label>
                                <div className="relative">
                                    <i className="bx bx-envelope absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-tertiary pointer-events-none" />
                                    <input
                                        type="email"
                                        value={userEmail}
                                        readOnly
                                        className="form-input !pl-10 opacity-60 cursor-not-allowed bg-bg-secondary"
                                    />
                                </div>
                            </div>
                            <FormField label="Phone" icon="bx-phone">
                                <input
                                    type="tel"
                                    value={userPhone || "Not set"}
                                    readOnly
                                    className="form-input !pl-10 opacity-60 cursor-not-allowed bg-bg-secondary"
                                />
                            </FormField>
                        </div>

                        {/* Email Change Panel */}
                        {showEmailChange && !emailChangeSent && (
                            <div className="rounded-xl border border-accent/20 bg-accent-light/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-2">
                                    <i className="bx bx-envelope text-accent" />
                                    <span className="text-sm font-semibold text-text-primary">Change Email Address</span>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    A confirmation link will be sent to both your current and new email. You must confirm from <strong>both</strong> to complete the change.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="Enter new email address"
                                        className="form-input flex-1 !text-sm"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        disabled={emailChangeSending || !newEmail.trim()}
                                        onClick={async () => {
                                            const trimmed = newEmail.trim().toLowerCase();
                                            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                                                toast.error("Please enter a valid email address.");
                                                return;
                                            }
                                            if (trimmed === userEmail.toLowerCase()) {
                                                toast.error("New email is the same as your current email.");
                                                return;
                                            }
                                            setEmailChangeSending(true);
                                            try {
                                                const { error: updateError } = await supabase.auth.updateUser({ email: trimmed });
                                                if (updateError) throw updateError;
                                                setEmailChangeSent(true);
                                                toast.success("Confirmation links sent! Check both inboxes.");
                                            } catch (err: unknown) {
                                                const message = err instanceof Error ? err.message : "Failed to initiate email change.";
                                                toast.error(message);
                                            } finally {
                                                setEmailChangeSending(false);
                                            }
                                        }}
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-white transition-base hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                                    >
                                        {emailChangeSending ? (
                                            <><i className="bx bx-loader-alt animate-spin" /> Sending...</>
                                        ) : (
                                            <><i className="bx bx-send" /> Send</>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowEmailChange(false); setNewEmail(""); }}
                                        className="shrink-0 rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary transition-base cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Email Change Confirmation State */}
                        {emailChangeSent && (
                            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <i className="bx bx-check-circle text-green-600 text-lg" />
                                    <span className="text-sm font-semibold text-green-800">Confirmation links sent</span>
                                </div>
                                <p className="text-xs text-green-700 leading-relaxed">
                                    We&apos;ve sent confirmation links to <strong>{userEmail}</strong> (current) and <strong>{newEmail}</strong> (new).
                                    Please confirm from both inboxes to complete the email change.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setEmailChangeSent(false); setShowEmailChange(false); setNewEmail(""); }}
                                    className="text-xs text-green-700 font-medium hover:text-green-900 underline underline-offset-2 cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        <p className="text-[11px] text-text-tertiary flex items-center gap-1 -mt-1">
                            <i className="bx bx-lock-alt" /> Phone is linked to your login method. Email can be changed via verification.
                        </p>
                        <FormField label="Gender" icon="bx-universal-access">
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="form-input !pl-10"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </FormField>
                    </div>
                </ProfileSection>

                {role === "tutor" ? (
                    <>
                        {/* ─── Tutor Details ─── */}
                        <ProfileSection icon="bx-briefcase-alt" title="Teaching Details">
                            <div className="space-y-5">
                                <FormField label="Subjects" required>
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map((s, i) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => toggleSubject(s, subjects, setSubjects)}
                                                className={`rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-medium transition-base border cursor-pointer ${subjects.includes(s)
                                                    ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                                                    : "border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                                                    }`}
                                            >
                                                {subjects.includes(s) && <i className="bx bx-check mr-1" />}
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Qualification" icon="bx-education">
                                        <input
                                            type="text"
                                            value={qualification}
                                            onChange={(e) => setQualification(e.target.value)}
                                            placeholder="e.g. M.Sc Mathematics"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="Age" icon="bx-body">
                                        <input
                                            type="number"
                                            value={tutorAge}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 100)) {
                                                    setTutorAge(val);
                                                }
                                            }}
                                            min={18}
                                            max={100}
                                            placeholder="28"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="About You" icon="bx-user-square">
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={4}
                                        placeholder="Tell students about your teaching experience and style..."
                                        className="form-input !pl-10 resize-none pt-2.5"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Fee per Month (₹)">
                                        <input
                                            type="number"
                                            value={feePerMonth}
                                            onChange={(e) => setFeePerMonth(e.target.value)}
                                            placeholder="3000"
                                            className="form-input"
                                        />
                                    </FormField>
                                    <FormField label="Fee per Session (₹)">
                                        <input
                                            type="number"
                                            value={feePerSession}
                                            onChange={(e) => setFeePerSession(e.target.value)}
                                            placeholder="500"
                                            className="form-input"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </ProfileSection>

                        {/* ─── Location ─── */}
                        <ProfileSection icon="bx-map" title="Location">
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => handleUseMyLocation("tutor")}
                                    disabled={useMyLocationLoading || locationCooldown}
                                    className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-medium text-accent transition-all hover:bg-accent/10 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                >
                                    <i className={`bx ${useMyLocationLoading ? 'bx-loader-alt animate-spin' : 'bx-current-location'} text-lg`} />
                                    {useMyLocationLoading ? 'Detecting location...' : 'Use My Location'}
                                </button>
                                <FormField label="Address" icon="bx-home">
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Start typing to search..."
                                        className="form-input !pl-10"
                                        id="address-autocomplete"
                                    />
                                    <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1">
                                        <i className="bx bx-search-alt" /> Powered by Google Places
                                    </p>
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Locality" icon="bx-buildings">
                                        <input
                                            type="text"
                                            value={locality}
                                            onChange={(e) => {
                                                setLocality(e.target.value);
                                                setTutorLat(null);
                                                setTutorLng(null);
                                            }}
                                            placeholder="e.g. Sector 62"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="City" icon="bx-city">
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => {
                                                setCity(e.target.value);
                                                setTutorLat(null);
                                                setTutorLng(null);
                                            }}
                                            placeholder="e.g. Noida"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Pincode" icon="bx-location-pin">
                                        <input
                                            type="text"
                                            value={pincode}
                                            onChange={(e) => {
                                                setPincode(e.target.value);
                                                setTutorLat(null);
                                                setTutorLng(null);
                                            }}
                                            placeholder="201301"
                                            maxLength={6}
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="Seats" icon="bx-chair">
                                        <input
                                            type="number"
                                            value={availableSeats}
                                            onChange={(e) => setAvailableSeats(e.target.value)}
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                </div>

                                {/* Service radius map + slider */}
                                <ServiceRadiusMap
                                    lat={tutorLat}
                                    lng={tutorLng}
                                    radiusKm={parseInt(serviceRadius) || 4}
                                    editable
                                    onRadiusChange={(km) => setServiceRadius(km.toString())}
                                    minRadius={1}
                                    maxRadius={15}
                                />
                            </div>
                        </ProfileSection>

                        {/* ─── FAQs ─── */}
                        <ProfileSection icon="bx-help-circle" title="FAQ Answers">
                            <p className="text-sm text-text-secondary mb-4">
                                Help students know what to expect. Fill in the ones that apply.
                            </p>
                            <div className="space-y-4">
                                {FAQ_TEMPLATES.map((question, i) => (
                                    <FormField key={question} label={question}>
                                        <div className="relative">
                                            <div className="absolute left-3 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                                                {i + 1}
                                            </div>
                                            <textarea
                                                value={faqAnswers[question] || ""}
                                                onChange={(e) =>
                                                    setFaqAnswers((prev) => ({
                                                        ...prev,
                                                        [question]: e.target.value,
                                                    }))
                                                }
                                                rows={2}
                                                className="form-input resize-none !pl-10 pt-2"
                                                placeholder="Your answer..."
                                                style={{ paddingLeft: "2.5rem" }}
                                            />
                                        </div>
                                    </FormField>
                                ))}
                            </div>
                        </ProfileSection>
                    </>
                ) : (
                    <>
                        {/* ─── Student Details ─── */}
                        <ProfileSection icon="bx-head" title="My Details">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="School" icon="bx-building-house">
                                        <input
                                            type="text"
                                            value={school}
                                            onChange={(e) => setSchool(e.target.value)}
                                            placeholder="e.g. DPS Noida"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="Age" icon="bx-body">
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= 100)) {
                                                    setAge(val);
                                                }
                                            }}
                                            min={3}
                                            max={100}
                                            placeholder="15"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                </div>

                                <FormField label="Subjects Interested In">
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() =>
                                                    toggleSubject(s, subjectsInterested, setSubjectsInterested)
                                                }
                                                className={`rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-medium transition-base border cursor-pointer ${subjectsInterested.includes(s)
                                                    ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                                                    : "border-border bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                                                    }`}
                                            >
                                                {subjectsInterested.includes(s) && <i className="bx bx-check mr-1" />}
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </FormField>

                                {/* ─── Student Location ─── */}
                                <div className="border-t border-border pt-4 mt-2">
                                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-3">Location</p>
                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={() => handleUseMyLocation("student")}
                                            disabled={useMyLocationLoading || locationCooldown}
                                            className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-medium text-accent transition-all hover:bg-accent/10 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                                        >
                                            <i className={`bx ${useMyLocationLoading ? 'bx-loader-alt animate-spin' : 'bx-current-location'} text-lg`} />
                                            {useMyLocationLoading ? 'Detecting location...' : 'Use My Location'}
                                        </button>
                                        <FormField label="Address" icon="bx-home">
                                            <input
                                                ref={studentAddressRef}
                                                type="text"
                                                value={studentAddress}
                                                onChange={(e) => setStudentAddress(e.target.value)}
                                                placeholder="Start typing to search..."
                                                className="form-input !pl-10"
                                                id="student-address-autocomplete"
                                            />
                                            <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1">
                                                <i className="bx bx-search-alt" /> Powered by Google Places
                                            </p>
                                        </FormField>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField label="Locality" icon="bx-buildings">
                                                <input
                                                    type="text"
                                                    value={studentLocality}
                                                    onChange={(e) => setStudentLocality(e.target.value)}
                                                    placeholder="Sector 62"
                                                    className="form-input !pl-10"
                                                />
                                            </FormField>
                                            <FormField label="City" icon="bx-city">
                                                <input
                                                    type="text"
                                                    value={studentCity}
                                                    onChange={(e) => setStudentCity(e.target.value)}
                                                    placeholder="Noida"
                                                    className="form-input !pl-10"
                                                />
                                            </FormField>
                                            <FormField label="Pincode" icon="bx-location-pin">
                                                <input
                                                    type="text"
                                                    value={studentPincode}
                                                    onChange={(e) => setStudentPincode(e.target.value)}
                                                    placeholder="201301"
                                                    maxLength={6}
                                                    className="form-input !pl-10"
                                                />
                                            </FormField>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ProfileSection>

                        {/* ─── Parent Info ─── */}
                        <ProfileSection icon="bx-group" title="Parent / Guardian Info">
                            <p className="text-sm text-text-secondary mb-4">
                                Parents will receive session and payment updates.
                            </p>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Parent Name" icon="bx-user">
                                        <input
                                            type="text"
                                            value={parentName}
                                            onChange={(e) => setParentName(e.target.value)}
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="Relationship" icon="bx-heart">
                                        <select
                                            value={parentRelationship}
                                            onChange={(e) => setParentRelationship(e.target.value)}
                                            className="form-input !pl-10"
                                        >
                                            <option value="father">Father</option>
                                            <option value="mother">Mother</option>
                                            <option value="guardian">Guardian</option>
                                        </select>
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Parent Phone" icon="bx-phone">
                                        <input
                                            type="tel"
                                            value={parentPhone}
                                            onChange={(e) => setParentPhone(e.target.value)}
                                            placeholder="9876543210"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                    <FormField label="Parent Email" icon="bx-envelope">
                                        <input
                                            type="email"
                                            value={parentEmail}
                                            onChange={(e) => setParentEmail(e.target.value)}
                                            placeholder="parent@email.com"
                                            className="form-input !pl-10"
                                        />
                                    </FormField>
                                </div>
                            </div>
                        </ProfileSection>
                    </>
                )}
            </form>
        </div>
    );
}

/* ── Components ── */

function ProfileSection({
    icon,
    title,
    children,
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 mb-5 transition-base hover:shadow-[var(--shadow-sm)]">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-text-primary mb-6 pb-3 border-b border-border">
                <i className={`bx ${icon} text-lg text-accent`} />
                {title}
            </h2>
            {children}
        </section>
    );
}

function FormField({
    label,
    required,
    icon,
    children,
}: {
    label: string;
    required?: boolean;
    icon?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
                {label}
                {required && <span className="text-error ml-0.5">*</span>}
            </label>
            <div className="relative">
                {icon && (
                    <i className={`bx ${icon} absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-tertiary pointer-events-none`} />
                )}
                {children}
            </div>
        </div>
    );
}

function OnboardingProgress({
    hasSubjects,
    hasLocation,
    hasFee,
}: {
    hasSubjects: boolean;
    hasLocation: boolean;
    hasFee: boolean;
}) {
    const steps = [
        { label: "Subjects", done: hasSubjects, icon: "bx-book-open" },
        { label: "Location", done: hasLocation, icon: "bx-map" },
        { label: "Fee", done: hasFee, icon: "bx-rupee" },
    ];
    const completed = steps.filter((s) => s.done).length;

    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <i className="bx bx-rocket text-lg text-accent" />
                    <span className="text-sm font-semibold text-text-primary">
                        Getting Started
                    </span>
                </div>
                <span className="text-xs font-medium text-text-tertiary">
                    {completed}/{steps.length} complete
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-bg-secondary mb-4 overflow-hidden">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                    style={{ width: `${(completed / steps.length) * 100}%` }}
                />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-3">
                {steps.map((step) => (
                    <div
                        key={step.label}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-300 ${
                            step.done
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-bg-secondary text-text-tertiary border border-transparent"
                        }`}
                    >
                        <i className={`bx ${step.done ? "bx-check-circle text-green-500" : step.icon + " text-text-tertiary"} text-base`} />
                        {step.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
