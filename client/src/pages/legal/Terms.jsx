import LegalPageLayout from '../../components/layout/LegalPageLayout';

const SECTIONS = [
  { id: 1, title: 'Acceptance of Terms' },
  { id: 2, title: 'Definitions' },
  { id: 3, title: 'Eligibility' },
  { id: 4, title: 'Nature of the Platform' },
  { id: 5, title: 'Accounts' },
  { id: 6, title: 'Sessions and Grand Sessions' },
  { id: 7, title: 'Booking, Payment, and Escrow' },
  { id: 8, title: 'Fees and Payouts' },
  { id: 9, title: 'Cancellation, No-Show, and Rescheduling Policy' },
  { id: 10, title: 'Recordings, Publicity, and Marketing' },
  { id: 11, title: 'User Conduct' },
  { id: 12, title: 'No Professional Advice; Risk Allocation' },
  { id: 13, title: 'Intellectual Property' },
  { id: 14, title: 'Privacy' },
  { id: 15, title: 'Disclaimers' },
  { id: 16, title: 'Limitation of Liability' },
  { id: 17, title: 'Indemnification' },
  { id: 18, title: 'Dispute Resolution; Binding Arbitration; Class Action Waiver' },
  { id: 19, title: 'Governing Law' },
  { id: 20, title: 'Term and Termination' },
  { id: 21, title: 'Modifications to These Terms' },
  { id: 22, title: 'Miscellaneous' },
  { id: 23, title: 'Contact' },
];

const Terms = () => (
  <LegalPageLayout
    title="Mentorick Terms & Conditions"
    description="Last updated: 18 July 2026 — Mentorick LLC"
    canonical="/terms"
  >
    <div className="bg-primary-50/30 border border-primary-100/50 rounded-xl p-6 mb-8 not-prose">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        Table of Contents
      </h2>
      <nav aria-label="Table of contents">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#section-${section.id}`}
                className="text-gray-650 hover:text-primary-600 transition-colors flex items-start gap-2 py-0.5 group"
              >
                <span className="text-primary-500 font-semibold font-mono text-xs w-5 pt-0.5 shrink-0 group-hover:text-primary-600">
                  {section.id}.
                </span>
                <span className="group-hover:underline text-gray-700 font-medium">{section.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>

    <div className="space-y-8">
      <section id="section-1" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">1.</span>
          <span>Acceptance of Terms</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`These Terms & Conditions (the “Terms” or “Agreement”) form a binding legal agreement between you (“you,” “User”) and Mentorick LLC, a New Mexico limited liability company (“Mentorick,” “we,” “us,” “our”), governing your access to and use of the Mentorick website, mobile applications, and related services (collectively, the “Platform”).`}
          </p>
          <p>
            {`By creating an account, booking a Session, or otherwise using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and, if applicable, the Mentorick Mentor Agreement. If you do not agree, you must not access or use the Platform.`}
          </p>
          <div className="bg-primary-50/50 border-l-4 border-primary-500 text-gray-850 p-4 rounded-r-lg my-4 text-sm font-medium">
            {`PLEASE NOTE: Section 18 of these Terms requires most disputes between you and Mentorick to be resolved through binding, individual arbitration rather than in court, and includes a waiver of your right to participate in a class action. Please read Section 18 carefully.`}
          </div>
        </div>
      </section>

      <section id="section-2" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">2.</span>
          <span>Definitions</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            <strong className="text-gray-950">{`“Mentor”`}</strong>{` means an individual invited by Mentorick to offer paid one-on-one Sessions and/or Grand Sessions on the Platform.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Mentee”`}</strong>{` means a User who books and pays for a Session with a Mentor.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Session”`}</strong>{` means a one-on-one, live, video-based mentorship meeting booked by a Mentee with a Mentor for a fixed duration (20, 40, or 60 minutes) at an agreed time, conducted via a Third-Party Platform.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Grand Session”`}</strong>{` means a one-to-many, live webinar-style session hosted by a single Mentor or multiple Mentors at a time and attended by multiple Mentees.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Third-Party Platform”`}</strong>{` means external video-conferencing tools (currently Zoom and/or Google Meet) used to conduct Sessions and Grand Sessions. Mentorick does not host video calls natively at this moment.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Escrow Account”`}</strong>{` means the account used to hold Mentee payments after booking and prior to release to the Mentor in accordance with Section 9.`}
          </p>
          <p>
            <strong className="text-gray-950">{`“Content”`}</strong>{` means any information, message, attachment, video, audio, recording, or other material submitted, transmitted, or generated by a User on or through the Platform.`}
          </p>
        </div>
      </section>

      <section id="section-3" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">3.</span>
          <span>Eligibility</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">3.1 Mentees</h3>
            <p>
              {`To create a Mentee account and book paid Sessions, you must be at least eighteen (18) years old, or at least thirteen (13) years old with the express consent and supervision of a parent or legal guardian who accepts these Terms on your behalf. Mentorick may request verification of such consent at any time and may suspend accounts where consent cannot be confirmed.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">3.2 Mentors</h3>
            <p>
              {`Mentorick operates on an invitation-only basis for Mentors. Individuals do not self-register as Mentors; Mentorick identifies and invites Mentors at its sole discretion. Mentors accept a separate Mentor Agreement, which incorporates these Terms by reference and governs their specific obligations, fees, and payout terms.`}
            </p>
          </div>
        </div>
      </section>

      <section id="section-4" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">4.</span>
          <span>Nature of the Platform</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Mentorick is a venue and marketplace only. We connect Mentees with Mentors and facilitate scheduling, payment, and communication; we do not provide, and are not a party to, the mentorship, advice, or content delivered during any Session or Grand Session. Mentors are independent, accomplished individuals invited to the Platform based on their achievements and standing in their respective fields. Mentors are independent contractors and are not employees, agents, partners, or representatives of Mentorick.`}
          </p>
          <p>
            {`Mentorick does not supervise, script, or control the substance of any Session or Grand Session. While Mentors are selected for their accomplishments and expertise, Mentorick does not guarantee any specific outcome, result, or suitability of a Mentor's guidance for a Mentee's particular circumstances, and no professional-client relationship of any kind is formed on or through the Platform. Any reliance a Mentee places on a Mentor's guidance is at the Mentee's own discretion and risk.`}
          </p>
        </div>
      </section>

      <section id="section-5" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">5.</span>
          <span>Accounts</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`You agree to provide accurate, current, and complete information when registering and to keep it up to date. You are solely responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must notify Mentorick immediately at `}
            <a href="mailto:contact@mentorick.com" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">contact@mentorick.com</a>
            {` of any unauthorized use of your account. Mentorick is not liable for any loss arising from your failure to safeguard your credentials.`}
          </p>
        </div>
      </section>

      <section id="section-6" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">6.</span>
          <span>Sessions and Grand Sessions</span>
        </h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">6.1 One-on-One Sessions</h3>
            <p>
              {`Mentors list their own availability, pricing, and session lengths (20, 40, or 60 minutes). Mentees book a specific time slot and pay the listed price at the time of booking. Sessions are conducted via Zoom or Google Meet, at the Mentor's discretion, using connection details provided through the Platform.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">6.2 Grand Sessions</h3>
            <p>
              {`A Grand Session is a one-to-many webinar hosted by a single Mentor or multiple Mentors at a time, open to multiple Mentees who each purchase individual access. Grand Sessions are not private and are not one-on-one mentorship.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">6.3 Pre-Session Context</h3>
            <p>
              {`At booking, Mentees may submit a brief written message and/or attachment describing what they wish to discuss, within a platform-defined character limit, to help the Mentor prepare and make efficient use of the limited session time. This feature is provided for convenience only; Mentorick does not review, moderate, or guarantee delivery or use of this information by the Mentor beyond good-faith transmission.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">6.4 Video Requirement and Environment</h3>
            <p>
              {`Mentors are expected to keep their video on for the duration of the Session or Grand Session, and both Mentors and Mentees are expected to attend from a quiet, distraction-free environment and to give the other party their full and professional attention for the duration of the booked time. These are expectations of conduct, not a guarantee or warranty by Mentorick.`}
            </p>
            <div className="bg-primary-50/40 border-l-2 border-primary-500 text-gray-700 p-4 rounded-r-lg my-4 text-sm">
              {`Mentorick does not monitor Sessions in real time and is not responsible or liable for any User's failure to keep their video on, for microphone, camera, or connectivity problems, for inattentiveness, or for any other conduct during a Session or Grand Session. A User's recourse in respect of another User's conduct is limited to the reporting, refund, and account-suspension mechanisms set out in this Agreement; Mentorick shall have no further liability arising from any User's conduct or performance during a Session or Grand Session. Mentorick, at its discretion, may terminate a Session early and withhold any refund obligation where a User's conduct is abusive, disruptive, or in bad faith.`}
            </div>
          </div>
        </div>
      </section>

      <section id="section-7" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">7.</span>
          <span>Booking, Payment, and Escrow</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Mentees pay the full listed price for a Session or Grand Session at the time of booking. Payments are held in an Escrow Account until the applicable release conditions in Section 9 are met. Mentorick is not a bank and does not offer interest, guaranteed custody, or deposit insurance on any funds held in escrow. Escrow is used solely to facilitate secure, fair transactions between Mentees and Mentors pending completion of a Session.`}
          </p>
          <p>
            {`Mentorick does not currently support pay-per-call top-ups or subscription memberships. Pricing for each listing is set solely by the Mentor; Mentorick does not control, endorse, or guarantee the fairness of any Mentor's pricing.`}
          </p>
        </div>
      </section>

      <section id="section-8" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">8.</span>
          <span>Fees and Payouts</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`The price a Mentee pays for a Session or Grand Session is the full and final price shown at booking, and no additional fee is charged to Mentees. The revenue share, payout schedule, and related payment terms between Mentorick and its Mentors are governed exclusively by the separate Mentorick Mentor Agreement, accepted by each Mentor during private onboarding, and are not otherwise set out in these Terms.`}
          </p>
        </div>
      </section>

      <section id="section-9" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">9.</span>
          <span>Cancellation, No-Show, and Rescheduling Policy</span>
        </h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            {`This Section applies to One-on-One Sessions unless otherwise stated. This policy is designed to be fair to both Mentors and Mentees.`}
          </p>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.1 Mentor No-Show or Late Cancellation</h3>
            <p>
              {`If a Mentor fails to attend a booked Session, or cancels with less than twenty-four (24) hours' notice, the Mentee may choose, through the Platform's automated tools, either: (a) a full refund of the Session fee; or (b) priority rescheduling, meaning the Mentor must offer the Mentee first access to their next available slot(s) within thirty (30) days of the original booking, ahead of new bookings from other Mentees. If the Mentor has no availability within that 30-day window, or the Mentee declines to wait, the booking automatically converts to a full refund. The Mentor forfeits their payout for any Session refunded under this Section. Mentorick may determine eligibility under this Section using the automated attendance indicators described in Section 9.7, without manual review, and such a determination shall be treated as conclusive absent clear evidence of technical error.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.2 Mentee No-Show</h3>
            <p>
              {`If a Mentee fails to attend a booked Session, no refund or reschedule is owed. The Mentor is entitled to their full payout, as the Mentor made the agreed time available and attended. Attendance for purposes of this Section is determined using the automated indicators described in Section 9.7.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.3 Late Arrival Grace Period</h3>
            <p>
              {`A ten (10) minute grace period applies from the scheduled start time. If a party has not joined the call within 10 minutes, the other party may treat the Session as a no-show under Section 9.1 or 9.2, as applicable.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.4 Rescheduling by Mutual Agreement</h3>
            <p>
              {`Either party may request to reschedule a Session with at least twenty-four (24) hours' notice, at no penalty, using the reschedule-request function on the Platform. The receiving party must accept or decline the request within the time window shown in the Platform's interface; if no response is given in that window, the request is automatically deemed declined and the original booking remains in effect, including any cancellation consequence that may separately apply under this Section 9. Mentors and Mentees may not exchange personal contact details through the Platform for the purpose of coordinating bookings, cancellations, or reschedules outside of Mentorick's systems.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.5 Attended Sessions Are Non-Refundable</h3>
            <p>
              {`Once a Session has taken place and both parties were present for the agreed duration, no refund will be issued for any reason, including dissatisfaction with the Mentor's advice, content, or manner. Mentees acknowledge that they are paying for the Mentor's time, attention, and expertise, not for a guaranteed outcome or subjective satisfaction.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.6 Grand Sessions</h3>
            <p>
              {`Refund or cancellation requests must be submitted at least forty-eight (48) hours before the scheduled start time.`}
            </p>
            <p className="mt-2">
              {`No refunds are issued for no-shows, late arrival, or Mentee-side technical issues once a Grand Session has occurred.`}
            </p>
            <p className="mt-2">
              {`Recording access (where offered) is provided only to Mentees who purchased access to that specific Grand Session, and is not affected by attendance.`}
            </p>
            <p className="mt-2">
              {`A Grand Session may be rescheduled by the Mentor, with Mentorick's involvement, where genuinely necessary. Mentorick will make reasonable efforts to notify registered attendees of the new date. Attendees may choose to attend the rescheduled date or request a full refund; Mentorick is not obligated to provide any compensation, credit, or remedy beyond this choice, and shall not be liable for any loss or inconvenience arising from a Grand Session being rescheduled.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.7 Verification of Attendance</h3>
            <p>
              {`To resolve attendance questions fairly and without requiring manual review of every Session, Users must join all Sessions and Grand Sessions exclusively through the join link or in-app prompt provided by the Platform, which records the time each User accesses the call, together with any in-app confirmation of the call's start. Mentorick may rely on these records to determine attendance and timeliness for purposes of this Section 9. Mentorick is not obligated to investigate or resolve an attendance dispute where a User did not join using the Platform's provided link or tool.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">9.8 Payment Disputes and Chargebacks</h3>
            <p>
              {`If you have a concern about a charge, you agree to first contact Mentorick at `}
              <a href="mailto:contact@mentorick.com" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">contact@mentorick.com</a>
              {` before filing a dispute or chargeback with your bank, card issuer, or payment provider. Filing a chargeback without first attempting resolution through Mentorick may be treated as a breach of these Terms and may result in suspension of your account, without prejudice to Mentorick's other rights and remedies.`}
            </p>
          </div>
        </div>
      </section>

      <section id="section-10" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">10.</span>
          <span>Recordings, Publicity, and Marketing</span>
        </h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">10.1 One-on-One Sessions</h3>
            <p>
              {`Mentorick does not offer or deliver session recordings to Mentees for one-on-one Sessions. Any recording of a one-on-one Session made by a Mentor or Mentee using their own device or the native recording feature of the applicable Third-Party Platform is outside Mentorick's control and is not a service provided by Mentorick.`}
            </p>
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 p-4 rounded-lg">
              {`Mentors and Mentees acknowledge and agree that Mentorick may itself join, observe, and/or record a one-on-one Session, including without separately notifying the Mentee in advance of that specific Session, solely for Mentorick's own marketing, promotional, research, and development purposes as described in Section 10.3. This does not entitle any Mentee to receive a copy of that recording, and does not constitute grounds for a refund.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">10.2 Grand Sessions</h3>
            <p>
              {`Grand Sessions are recorded, and recording access is provided to all Mentees who purchased access to that specific Grand Session, regardless of whether they attended live, subject to Section 9.6. Recording access does not constitute grounds for a refund.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">10.3 Marketing Use</h3>
            <p>
              {`By participating in a Session or Grand Session, Mentors and Mentees acknowledge and agree that Mentorick may use excerpts, clips, or full recordings of Sessions and Grand Sessions, along with related content and Session metadata, for Mentorick's own marketing, promotional, research, and development purposes, including on social media and in advertising. Before any Session is booked, both Mentors and Mentees will be asked to affirmatively confirm this consent via a checkbox on the booking or onboarding flow, separate from acceptance of these Terms. Mentors additionally confirm this consent in the Mentor Agreement. Users may contact Mentorick at `}
              <a href="mailto:contact@mentorick.com" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">contact@mentorick.com</a>
              {` to discuss removal of specific previously-published marketing content, which Mentorick will consider in good faith but is not obligated to grant.`}
            </p>
          </div>
        </div>
      </section>

      <section id="section-11" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">11.</span>
          <span>User Conduct</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>{`You agree not to:`}</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 my-4">
            <li>{`Provide false, misleading, or deceptive information on your profile, in bookings, or in any communication on the Platform.`}</li>
            <li>{`Harass, threaten, defame, or abuse another User.`}</li>
            <li>{`Attempt to circumvent the Platform's booking or payment systems, including arranging off-platform payment for services first connected through Mentorick.`}</li>
            <li>{`Record, distribute, or publicly share a Session or Grand Session in a manner that violates another User's privacy or applicable law, beyond what is expressly permitted under Section 10.`}</li>
            <li>{`Upload or transmit any unlawful, obscene, infringing, or harmful content, including malware.`}</li>
            <li>{`Use bots, scrapers, or other automated means to access or extract data from the Platform.`}</li>
          </ul>
          <p>
            {`Mentorick reserves the right, but has no obligation, to suspend or terminate any account for violation of this Section, with or without notice, and may additionally pursue any other remedy available to it, including sending a formal legal notice or referring the matter for legal action, where Mentorick considers it warranted.`}
          </p>
        </div>
      </section>

      <section id="section-12" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">12.</span>
          <span>No Professional Advice; Risk Allocation</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Mentorick is a neutral venue connecting Mentors and Mentees. Mentorick does not select, review, endorse, verify, or take responsibility for the content, accuracy, or quality of any advice, opinion, coaching, or information given by a Mentor during any Session or Grand Session, regardless of subject matter. Any reliance you place on such advice is strictly at your own risk. Mentorick is not liable for any decision made, or action taken or not taken, by any User in reliance on anything said or shared during a Session or Grand Session.`}
          </p>
        </div>
      </section>

      <section id="section-13" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">13.</span>
          <span>Intellectual Property</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`The Platform, its design, software, trademarks, and all Mentorick-created content are owned by Mentorick and protected by applicable intellectual property laws. You may not copy, modify, reverse-engineer, or create derivative works from the Platform without our prior written consent.`}
          </p>
          <p>
            {`Users retain ownership of Content they submit (such as profile information or pre-session messages), but grant Mentorick a non-exclusive, worldwide, royalty-free, sublicensable license to use, store, reproduce, and display such Content as necessary to operate the Platform, and, together with the consent described in Section 10, to use Session and Grand Session recordings and related Content for marketing, promotional, and research and development purposes.`}
          </p>
        </div>
      </section>

      <section id="section-14" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">14.</span>
          <span>Privacy</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Our collection, use, and disclosure of personal information is described in the Mentorick Privacy Policy, which is incorporated into these Terms by reference.`}
          </p>
        </div>
      </section>

      <section id="section-15" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">15.</span>
          <span>Disclaimers</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="text-sm font-semibold tracking-wide text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded-lg leading-relaxed">
            {`THE PLATFORM AND ALL SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. MENTORICK DOES NOT WARRANT THE AVAILABILITY, CONDUCT, QUALIFICATIONS, OR RELIABILITY OF ANY MENTOR OR MENTEE, NOR THE OUTCOME OF ANY SESSION OR GRAND SESSION. MENTORICK IS NOT RESPONSIBLE FOR THE FUNCTIONALITY, AVAILABILITY, OR SECURITY OF ANY THIRD-PARTY PLATFORM (INCLUDING ZOOM AND GOOGLE MEET) USED TO CONDUCT SESSIONS.`}
          </p>
        </div>
      </section>

      <section id="section-16" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">16.</span>
          <span>Limitation of Liability</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="text-sm font-semibold tracking-wide text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded-lg leading-relaxed">
            {`TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MENTORICK, ITS OFFICERS, MEMBERS, EMPLOYEES, CONTRACTORS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR LOSS OF GOODWILL, ARISING OUT OF OR RELATING TO YOUR USE OF THE PLATFORM, ANY SESSION OR GRAND SESSION, OR THESE TERMS, REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF MENTORICK HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.`}
          </p>
          <p className="text-sm font-semibold tracking-wide text-gray-600 bg-gray-50 border border-gray-200 p-4 rounded-lg leading-relaxed">
            {`IN NO EVENT SHALL MENTORICK'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM EXCEED THE GREATER OF (A) THE TOTAL FEES YOU PAID TO MENTORICK IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US$100). SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO SOME OF THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.`}
          </p>
        </div>
      </section>

      <section id="section-17" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">17.</span>
          <span>Indemnification</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`You agree to indemnify, defend, and hold harmless Mentorick, its officers, members, employees, contractors, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with: (a) your access to or use of the Platform; (b) your participation in any Session or Grand Session; (c) any Content you submit or transmit; (d) your violation of these Terms or applicable law; or (e) your interactions or disputes with another User.`}
          </p>
        </div>
      </section>

      <section id="section-18" className="scroll-mt-12 border-l-4 border-primary-500 bg-primary-50/20 rounded-r-xl p-6 my-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">18.</span>
          <span>Dispute Resolution; Binding Arbitration; Class Action Waiver</span>
        </h2>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">18.1 Informal Resolution</h3>
            <p>
              {`Before initiating arbitration, the party with a grievance must send written notice to the other party describing the dispute and the relief sought (a “Dispute Notice”). Notices to Mentorick must be sent to `}
              <a href="mailto:contact@mentorick.com" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">contact@mentorick.com</a>
              {` or 2105 VISTA OESTE NW E STE 3584 ALBUQUERQUE, NM 87120. The receiving party has forty-five (45) days to respond.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">18.2 Binding Arbitration</h3>
            <p>
              {`If a dispute is not resolved informally within 90 days of the Dispute Notice, any dispute, claim, or controversy arising out of or relating to these Terms, the Platform, or any Session or Grand Session shall be resolved exclusively by final and binding arbitration administered by the American Arbitration Association (“AAA”) under its Consumer Arbitration Rules, conducted by a single arbitrator. The arbitration shall take place in New Mexico, USA, unless the parties agree otherwise, and may be conducted by video conference where permitted by AAA rules. Judgment on the arbitration award may be entered in any court of competent jurisdiction.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">18.3 Class Action Waiver</h3>
            <p className="text-sm font-semibold tracking-wide text-gray-800 bg-white/85 border border-primary-200/50 p-4 rounded-lg leading-relaxed">
              {`YOU AND MENTORICK AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE CLAIMS OF MORE THAN ONE USER AND MAY NOT PRESIDE OVER ANY FORM OF CLASS OR REPRESENTATIVE PROCEEDING. YOU AND MENTORICK EACH WAIVE THE RIGHT TO A TRIAL BY JURY.`}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">18.4 Exceptions</h3>
            <p>
              {`Notwithstanding the foregoing, either party may bring an individual action in small claims court, and either party may seek temporary injunctive relief in a court of competent jurisdiction to prevent irreparable harm pending arbitration.`}
            </p>
          </div>
        </div>
      </section>

      <section id="section-19" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">19.</span>
          <span>Governing Law</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`These Terms are governed by the laws of the State of New Mexico, USA, without regard to conflict-of-law principles, except where the Dispute Resolution Agreement in Section 18 requires application of the Federal Arbitration Act. Users located outside the United States remain subject to these Terms as a condition of using the Platform; nothing in this Section limits any mandatory consumer protections available to you under the law of your country of residence.`}
          </p>
        </div>
      </section>

      <section id="section-20" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">20.</span>
          <span>Term and Termination</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Mentorick may suspend or terminate your account at any time, with or without notice, for violation of these Terms or for any other reason at our discretion. Mentees can delete their accounts at any time, while Mentors can request deletion by contacting Mentorick. Sections 4, 9–20 survive any termination of your account.`}
          </p>
        </div>
      </section>

      <section id="section-21" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">21.</span>
          <span>Modifications to These Terms</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`Mentorick may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.`}
          </p>
        </div>
      </section>

      <section id="section-22" className="scroll-mt-12 border-b border-gray-300 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">22.</span>
          <span>Miscellaneous</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            {`These Terms, together with the Privacy Policy and, where applicable, the Mentor Agreement, constitute the entire agreement between you and Mentorick. If any provision is found unenforceable, the remaining provisions remain in full effect. Mentorick's failure to enforce any provision is not a waiver of that provision. You may not assign these Terms; Mentorick may assign these Terms to a successor entity without notice.`}
          </p>
        </div>
      </section>

      <section id="section-23" className="scroll-mt-12 pb-8">
        <h2 className="text-xl font-bold text-gray-950 mb-4 flex items-start gap-3">
          <span className="text-primary-600 font-mono">23.</span>
          <span>Contact</span>
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p className="font-semibold text-gray-950">Mentorick LLC</p>
          <p>Registered Address: 2105 VISTA OESTE NW E STE 3584 ALBUQUERQUE, NM 87120</p>
          <p>
            Support and Legal Notices:{' '}
            <a href="mailto:contact@mentorick.com" className="text-primary-600 hover:text-primary-700 hover:underline font-medium">contact@mentorick.com</a>
          </p>
        </div>
      </section>
    </div>
  </LegalPageLayout>
);

export default Terms;
