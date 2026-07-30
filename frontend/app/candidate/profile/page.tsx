"use client";

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile-form";
import { EducationForm } from "@/components/education-form";
import { EmploymentForm } from "@/components/employment-form";
import { api } from "@/lib/api";
import { LoadingBlock } from "@/components/ui";

type Education = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  is_current?: boolean;
  grade?: string;
  description?: string;
};

type Employment = {
  id?: string;
  company: string;
  job_title: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  responsibilities?: string;
  achievements?: string;
  location?: string;
};

export default function CandidateProfilePage() {
  const [education, setEducation] = useState<Education[]>([]);
  const [employment, setEmployment] = useState<Employment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ education: Education[] }>("/candidate/education").catch(() => ({ education: [] })),
      api<{ employment: Employment[] }>("/candidate/employment").catch(() => ({ employment: [] })),
    ])
      .then(([eduResponse, empResponse]) => {
        setEducation(eduResponse.education);
        setEmployment(empResponse.employment);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading profile" />;

  return (
    <div className="candidate-profile-page">
      <ProfileForm />
      <EducationForm initialEducation={education} onUpdate={setEducation} />
      <EmploymentForm initialEmployment={employment} onUpdate={setEmployment} />
    </div>
  );
}
