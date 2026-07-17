import { PageIntro } from "@/components/ui";

export default function CandidateSettingsPage() {
  return (
    <>
      <PageIntro title="Settings" body="Manage support and account preferences for Pravaron Technologies Careers." />
      <section className="panel settings-panel">
        <h2>Account support</h2>
        <p>Password recovery and account access are handled through the secure sign-in flow.</p>
        <a className="button button-secondary" href="mailto:careers@pravarontechnologies.com">
          Contact careers support
        </a>
      </section>
    </>
  );
}
