/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import { CAREERS_CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy | Pravaron Careers",
  description: "Privacy policy for Pravaron Technologies careers platform",
};

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: July 22, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Pravaron Technologies ("we," "our," or "us") respects your privacy and is committed to protecting your
            personal data. This privacy policy explains how we collect, use, and protect your information when you
            apply for positions through our careers platform at careers.pravarontechnologies.com.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <p>When you register and apply for positions, we collect:</p>
          <ul>
            <li>Personal information: Full name, email address, phone number, location</li>
            <li>Professional information: Current role, experience, skills, education, employment history</li>
            <li>Application materials: Resume/CV, portfolio links, cover letters, responses to application questions</li>
            <li>Account credentials: Email and encrypted password</li>
            <li>Preferences: Work location preferences, compensation expectations, notice period</li>
          </ul>

          <h3>2.2 Information We Collect Automatically</h3>
          <ul>
            <li>Technical data: IP address, browser type, device information, operating system</li>
            <li>Usage data: Pages visited, application source, UTM parameters, session information</li>
            <li>Cookies and tracking technologies for authentication and security</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your information for:</p>
          <ul>
            <li>Processing and evaluating your job applications</li>
            <li>Communicating with you about your application status</li>
            <li>Scheduling and conducting interviews</li>
            <li>Verifying your identity and credentials</li>
            <li>Maintaining recruitment records and audit trails</li>
            <li>Improving our recruitment process and candidate experience</li>
            <li>Complying with legal obligations and company policies</li>
            <li>With your consent, considering you for future opportunities</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis for Processing</h2>
          <p>We process your personal data based on:</p>
          <ul>
            <li><strong>Consent:</strong> You consent to processing when you submit your application</li>
            <li><strong>Legitimate interests:</strong> Our legitimate interest in recruiting qualified candidates</li>
            <li><strong>Legal obligations:</strong> Compliance with employment laws and regulations</li>
            <li><strong>Contract:</strong> Processing necessary to enter into an employment contract</li>
          </ul>
        </section>

        <section>
          <h2>5. Who Has Access to Your Information</h2>
          <p>Your information may be accessed by:</p>
          <ul>
            <li>Authorized recruitment team members and hiring managers</li>
            <li>Technical reviewers assigned to evaluate your application</li>
            <li>Super administrators for system management purposes</li>
            <li>Third-party service providers (hosting, email, analytics) under strict confidentiality agreements</li>
          </ul>
          <p>
            We do not sell, rent, or share your personal information with third parties for marketing purposes.
            Internal notes and reviewer comments are never visible to candidates.
          </p>
        </section>

        <section>
          <h2>6. AI and Automated Processing</h2>
          <p>
            We may use AI-assisted tools to help analyze resumes, match candidates to positions, and generate
            interview questions. However:
          </p>
          <ul>
            <li>AI tools are used only to assist human reviewers, not replace them</li>
            <li>Final hiring decisions are always made by human recruiters and hiring managers</li>
            <li>You have the right to request human review of any AI-generated recommendations</li>
            <li>We will inform you if significant automated decision-making is used in your application</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your data:</p>
          <ul>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure password hashing (PBKDF2-SHA256)</li>
            <li>Access controls and role-based permissions</li>
            <li>Regular security audits and monitoring</li>
            <li>Secure file storage with time-limited access URLs</li>
            <li>Comprehensive audit logging</li>
          </ul>
        </section>

        <section>
          <h2>8. Data Retention</h2>
          <p>We retain your information as follows:</p>
          <ul>
            <li><strong>Active applications:</strong> Duration of recruitment process</li>
            <li><strong>Rejected applications:</strong> Up to 12 months for future opportunities (if consented)</li>
            <li><strong>Withdrawn applications:</strong> 6 months for administrative purposes</li>
            <li><strong>Hired candidates:</strong> Transferred to employee records system</li>
            <li><strong>Audit logs:</strong> As required by legal and security policies</li>
          </ul>
          <p>You can request earlier deletion subject to our legal obligations.</p>
        </section>

        <section>
          <h2>9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
            <li><strong>Withdrawal:</strong> Withdraw your application at any time</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Human review:</strong> Request human review of automated decisions</li>
          </ul>
          <p>
            To exercise these rights, please contact us at {CAREERS_CONTACT_EMAIL} with your request.
          </p>
        </section>

        <section>
          <h2>10. Cookies and Tracking</h2>
          <p>We use essential cookies for:</p>
          <ul>
            <li>Authentication and session management</li>
            <li>Security and fraud prevention</li>
            <li>Maintaining your application progress</li>
          </ul>
          <p>
            We do not use advertising or third-party tracking cookies. Essential cookies are required for the
            platform to function properly.
          </p>
        </section>

        <section>
          <h2>11. International Data Transfers</h2>
          <p>
            Your data is primarily processed and stored in India. If we transfer data internationally, we ensure
            appropriate safeguards are in place to protect your information in accordance with applicable data
            protection laws.
          </p>
        </section>

        <section>
          <h2>12. Children's Privacy</h2>
          <p>
            Our careers platform is not intended for individuals under 18 years of age. We do not knowingly collect
            personal information from children.
          </p>
        </section>

        <section>
          <h2>13. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. We will notify you of material changes by email or through
            the platform. The "Last updated" date at the top indicates when this policy was last revised.
          </p>
        </section>

        <section>
          <h2>14. Contact Us</h2>
          <p>For privacy-related questions, concerns, or to exercise your rights, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> {CAREERS_CONTACT_EMAIL}</li>
            <li><strong>Subject:</strong> Privacy Request - [Your Name]</li>
            <li><strong>Address:</strong> Pravaron Technologies, Sector 140A, Noida, Uttar Pradesh, India</li>
          </ul>
          <p>We will respond to your request within 30 days.</p>
        </section>

        <section>
          <h2>15. Governing Law</h2>
          <p>
            This privacy policy is governed by the laws of India. Any disputes will be subject to the exclusive
            jurisdiction of courts in Noida, Uttar Pradesh.
          </p>
        </section>
      </div>
    </main>
  );
}
