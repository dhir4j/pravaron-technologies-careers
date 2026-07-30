/* eslint-disable react/no-unescaped-entities */
import { Metadata } from "next";
import { CAREERS_CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms of Service | Pravaron Careers",
  description: "Terms of service for Pravaron Technologies careers platform",
};

export default function TermsOfService() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: July 22, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Pravaron Careers platform at careers.pravarontechnologies.com ("Platform"), you
            agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not
            use the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and Pravaron Technologies ("Pravaron," "we,"
            "our," or "us").
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>To use this Platform, you must:</p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into binding agreements</li>
            <li>Provide accurate and truthful information</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
          <p>
            By creating an account, you represent and warrant that you meet these eligibility requirements.
          </p>
        </section>

        <section>
          <h2>3. Account Registration</h2>
          <h3>3.1 Account Creation</h3>
          <p>To apply for positions, you must create an account by providing:</p>
          <ul>
            <li>A valid email address</li>
            <li>Your full legal name</li>
            <li>A secure password meeting our requirements</li>
          </ul>

          <h3>3.2 Account Security</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your password</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
            <li>Ensuring your account information remains accurate and current</li>
          </ul>

          <h3>3.3 Account Restrictions</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Create multiple accounts for the same person</li>
            <li>Share your account credentials with others</li>
            <li>Use another person's account without permission</li>
            <li>Create accounts using automated means or false information</li>
          </ul>
        </section>

        <section>
          <h2>4. Application Process</h2>
          <h3>4.1 Truthfulness and Accuracy</h3>
          <p>You agree that all information provided in your applications must be:</p>
          <ul>
            <li>True, accurate, and complete</li>
            <li>Not misleading or fraudulent</li>
            <li>Your own work and qualifications</li>
            <li>Updated promptly if circumstances change</li>
          </ul>

          <h3>4.2 Application Materials</h3>
          <p>When submitting applications, you:</p>
          <ul>
            <li>Grant us permission to review and process your materials for recruitment purposes</li>
            <li>Confirm you have the right to share all uploaded documents</li>
            <li>Agree that submitted materials may be reviewed by authorized team members and AI tools</li>
            <li>Understand that falsified information may result in application rejection or employment termination</li>
          </ul>

          <h3>4.3 No Guarantee of Employment</h3>
          <p>
            Submitting an application does not guarantee an interview, job offer, or employment. Pravaron reserves the
            right to reject any application at any stage of the recruitment process without providing reasons.
          </p>
        </section>

        <section>
          <h2>5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Submit false, fraudulent, or misleading information</li>
            <li>Impersonate another person or entity</li>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Platform</li>
            <li>Interfere with or disrupt the Platform's operation</li>
            <li>Use automated tools to scrape, data mine, or extract information</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            <li>Upload viruses, malware, or malicious code</li>
            <li>Harass, abuse, or harm other users or Pravaron personnel</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <h3>6.1 Platform Content</h3>
          <p>
            All content on the Platform, including text, graphics, logos, designs, software, and functionality, is the
            property of Pravaron Technologies and protected by copyright, trademark, and other intellectual property
            laws.
          </p>

          <h3>6.2 Your Content</h3>
          <p>
            You retain ownership of your application materials (resume, portfolio, etc.). By submitting materials, you
            grant Pravaron a non-exclusive, worldwide license to use, store, and process your content for recruitment
            purposes.
          </p>

          <h3>6.3 Restrictions</h3>
          <p>You may not:</p>
          <ul>
            <li>Copy, reproduce, or redistribute Platform content</li>
            <li>Create derivative works based on the Platform</li>
            <li>Use Pravaron's name, logos, or trademarks without permission</li>
          </ul>
        </section>

        <section>
          <h2>7. Privacy and Data Protection</h2>
          <p>
            Your use of the Platform is subject to our{" "}
            <a href="/privacy" className="legal-link">Privacy Policy</a>, which explains how we collect, use, and
            protect your personal information. By using the Platform, you consent to our data practices as described in
            the Privacy Policy.
          </p>
        </section>

        <section>
          <h2>8. Communications</h2>
          <p>By creating an account, you consent to receive:</p>
          <ul>
            <li>Transactional emails about your applications and account</li>
            <li>Application status updates and interview invitations</li>
            <li>Important Platform announcements and security notifications</li>
          </ul>
          <p>
            You cannot opt out of essential transactional communications. Marketing communications (if any) will
            include opt-out options.
          </p>
        </section>

        <section>
          <h2>9. Third-Party Services</h2>
          <p>
            The Platform may contain links to third-party websites or services (e.g., LinkedIn, GitHub). We are not
            responsible for the content, privacy practices, or terms of service of third-party sites. Your use of
            third-party services is at your own risk.
          </p>
        </section>

        <section>
          <h2>10. Disclaimers</h2>
          <h3>10.1 Platform Availability</h3>
          <p>
            The Platform is provided "as is" and "as available." We do not guarantee uninterrupted, error-free, or
            secure access. We may suspend or terminate the Platform for maintenance, updates, or other reasons without
            prior notice.
          </p>

          <h3>10.2 No Warranty</h3>
          <p>
            We make no warranties, express or implied, about the Platform's accuracy, reliability, or suitability for
            any purpose. We disclaim all warranties to the fullest extent permitted by law.
          </p>

          <h3>10.3 Technical Issues</h3>
          <p>
            We are not liable for technical issues, data loss, or errors that may affect your application or account.
            You are responsible for maintaining backup copies of your application materials.
          </p>
        </section>

        <section>
          <h2>11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Pravaron Technologies and its officers, directors, employees, and
            agents shall not be liable for:
          </p>
          <ul>
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or opportunities</li>
            <li>Damages arising from your use or inability to use the Platform</li>
            <li>Damages resulting from unauthorized access to your account</li>
            <li>Damages related to application outcomes or employment decisions</li>
          </ul>
          <p>
            Our total liability for any claims related to the Platform shall not exceed INR 1,000 or the amount you
            paid to use the Platform (if any), whichever is greater.
          </p>
        </section>

        <section>
          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Pravaron Technologies and its affiliates from any claims,
            liabilities, damages, losses, and expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your violation of these Terms</li>
            <li>Your violation of any laws or third-party rights</li>
            <li>Your use or misuse of the Platform</li>
            <li>False or misleading information in your applications</li>
          </ul>
        </section>

        <section>
          <h2>13. Account Termination</h2>
          <h3>13.1 Termination by You</h3>
          <p>
            You may close your account at any time by contacting {CAREERS_CONTACT_EMAIL}. Closing your account
            will withdraw all pending applications.
          </p>

          <h3>13.2 Termination by Us</h3>
          <p>We reserve the right to suspend or terminate your account if you:</p>
          <ul>
            <li>Violate these Terms</li>
            <li>Provide false or fraudulent information</li>
            <li>Engage in prohibited conduct</li>
            <li>Pose a security risk to the Platform</li>
          </ul>

          <h3>13.3 Effect of Termination</h3>
          <p>
            Upon termination, your right to access and use the Platform will cease immediately. We may retain your data
            as described in our Privacy Policy and as required by law.
          </p>
        </section>

        <section>
          <h2>14. Modifications to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify you of material changes by email or through the
            Platform. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
          </p>
          <p>
            If you do not agree to the modified Terms, you must stop using the Platform and may close your account.
          </p>
        </section>

        <section>
          <h2>15. Dispute Resolution</h2>
          <h3>15.1 Informal Resolution</h3>
          <p>
            If you have a dispute, please contact us first at {CAREERS_CONTACT_EMAIL}. We will attempt to
            resolve disputes informally.
          </p>

          <h3>15.2 Governing Law</h3>
          <p>
            These Terms are governed by the laws of India, without regard to conflict of law principles.
          </p>

          <h3>15.3 Jurisdiction</h3>
          <p>
            Any legal action or proceeding arising from these Terms shall be brought exclusively in the courts located
            in Noida, Uttar Pradesh, India. You consent to the jurisdiction of these courts.
          </p>
        </section>

        <section>
          <h2>16. Severability</h2>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
            continue in full force and effect.
          </p>
        </section>

        <section>
          <h2>17. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Pravaron
            regarding your use of the Platform and supersede all prior agreements and understandings.
          </p>
        </section>

        <section>
          <h2>18. Contact Information</h2>
          <p>For questions about these Terms, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> {CAREERS_CONTACT_EMAIL}</li>
            <li><strong>Subject:</strong> Terms of Service Inquiry</li>
            <li><strong>Address:</strong> Pravaron Technologies, Sector 140A, Noida, Uttar Pradesh, India</li>
          </ul>
        </section>

        <section>
          <h2>19. Acknowledgment</h2>
          <p>
            By creating an account and using the Platform, you acknowledge that you have read, understood, and agree to
            be bound by these Terms of Service.
          </p>
        </section>
      </div>
    </main>
  );
}
