import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurvey } from '../hooks/useSurvey';
import { createSession } from '../api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function ConsentPage() {
  const navigate = useNavigate();
  const {
    state,
    setConsentInitials,
    setPaymentOptOutInitials,
    setSession,
  } = useSurvey();
  const [declined, setDeclined] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAgree = state.consentInitials.trim().length > 0;

  function handleRefuse() {
    setDeclined(true);
    window.close();
  }

  async function handleAgree() {
    if (creating) return;
    // Back-navigation guard: an existing session is reused, never re-created.
    if (state.sessionId) {
      navigate('/welcome');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await createSession();
      setSession(
        res.sessionId,
        res.pairs.map((p) => ({
          id: p.pairId,
          imageA: { src: p.leftImageUrl, label: 'Left' },
          imageB: { src: p.rightImageUrl, label: 'Right' },
        })),
      );
      navigate('/welcome');
    } catch {
      setError(
        'Could not start the survey. Please check your internet connection and press "I agree" again.',
      );
    } finally {
      setCreating(false);
    }
  }

  if (declined) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You Have Declined to Participate
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Thank you for your time. No study data has been collected. You may
            now close this browser tab or window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4">
      <div className="max-w-3xl mx-auto my-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-xs text-gray-500 mb-1">
            Version: A, B &middot; Protocol #: 26-127
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Cognitive Mapping of Environmental Risk Perception in New England
            Using a Scalable Artificial Intelligence Framework
          </h1>
          <h2 className="text-base font-semibold text-gray-600 mb-4">
            Subject Information and Informed Consent Form (SBR)
          </h2>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-medium">Principal Investigator:</span>{' '}
              Dr. Hanlin Zhou
            </p>
            <p>
              <span className="font-medium">Student Investigator:</span> Zhang
              (Ludwig) Chen
            </p>
            <p>
              <span className="font-medium">Institution:</span> Department of
              Geography, Sustainability, Community, and Urban Studies,
              University of Connecticut
            </p>
            <p>
              <span className="font-medium">Address:</span> Philip E. Austin
              Building, 215 Glenbrook Rd., Storrs, CT 06269
            </p>
            <p>
              <span className="font-medium">Telephone:</span> 1 647-879-5378
            </p>
            <p>
              <span className="font-medium">Sponsor:</span> Institute for the
              Brain and Cognitive Sciences (IBACS), University of Connecticut
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            You may retain a copy of this consent form by using your
            browser&rsquo;s Print function or by downloading it here:{' '}
            <a
              href="/consent-form.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download consent form (PDF)
            </a>
            .
          </p>

          <Section title="Key Information">
            <p>
              The following is a concise and focused presentation of key
              information to assist you in understanding why you might or might
              not want to participate in this research.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You are being asked to take part in a research study because
                you are an adult ages 18 to 64, you can read English, and you
                have lived in New England for at least 6 months during the past
                12 months. You are seeing this study invitation through
                Prolific, an online research participant platform.
              </li>
              <li>
                Your participation is voluntary. You may refuse to participate
                or withdraw at any time without penalty or loss of benefits to
                which you are otherwise entitled. Your alternative is to not
                take part in the study.
              </li>
              <li>
                The purpose of the study is to measure environmental risk
                perception using an online image comparison task and
                questionnaires. The results will be used to identify patterns
                in risk perception and develop research-only analytic models at
                an aggregated geographic level.
              </li>
              <li>
                After the survey, your de-identified image-comparison responses
                will be converted into image-level aggregated scores and used
                to train and evaluate an AI-based research scoring model. Your
                Prolific ID will not be used for model training.
              </li>
              <li>
                Your participation in the study is expected to last about 10
                minutes and will include 1 online visit.
              </li>
              <li>
                The main study procedures include four steps. First, you will
                confirm your eligibility, review this consent form, and
                indicate your agreement before any study activities begin.
                Second, you will complete 20 rounds of image pair comparisons.
                In each comparison you will see two street images and select an
                image based on six environmental perception questions. Third,
                you will complete a short twelve-question questionnaire that
                includes demographic questions and brief measures related to
                stress, climate change awareness, and environmental
                experiences. Fourth, after you complete all study procedures,
                you will be shown a completion code and redirected back to
                Prolific for payment processing. You will not need to provide
                an email address.
              </li>
              <li>
                The risks of the study are low and may include potential but
                limited discomfort from viewing some street view images or
                answering questions about stress and environmental experiences,
                and fatigue from completing the online task. We use secure
                UConn systems and restricted access to reduce privacy risks.
              </li>
              <li>
                There is no direct benefit to you from taking part in this
                study. However, information we learn from the study results may
                help people in the future.
              </li>
            </ul>
            <p>
              This overview does not include all the information you need to
              know before deciding whether to take part. Additional information
              is given in the rest of this consent form. Be sure to review the
              rest of this consent form before deciding about participation.
            </p>
          </Section>

          <Section title="Who is the Study Team and How is the Study Funded?">
            <p>
              This study is being conducted by Dr. Hanlin Zhou and Zhang
              (Ludwig) Chen. The Institute for the Brain and Cognitive Sciences
              (IBACS), University of Connecticut, has provided funding for this
              study.
            </p>
          </Section>

          <Section title="How Many People Will Take Part in the Study?">
            <p>
              The online study will include approximately 1,550 study
              participants from New England.
            </p>
          </Section>

          <Section title="What is the Purpose of this Study?">
            <p>
              The purpose of this study is to measure environmental risk
              perception using an online image comparison task and
              questionnaires. The results will be used to identify patterns in
              risk perception and develop research-only analytic models at an
              aggregated geographic level.
            </p>
          </Section>

          <Section title="What is Involved in this Research Study?">
            <p>
              If you agree to be in this study, your participation will involve
              confirming your eligibility, reviewing the consent form,
              finishing 20 rounds of image comparison, and completing a short
              questionnaire. You will not interact with AI or AI-related
              contents. No chatbot, adaptive survey, automated feedback, or
              AI-mediated communication will be used. Your participation will
              last for about 10 minutes in a single online session. Below are
              the details:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Confirm eligibility, including age, English ability, and New
                England residency.
              </li>
              <li>
                Review this consent form and indicate your agreement before any
                study activities begin.
              </li>
              <li>
                Complete 20 rounds of image pair comparisons. In each
                comparison you will see two street images and select an image
                based on six environmental perception questions.
              </li>
              <li>
                Complete a short questionnaire that includes 12 questions. It
                contains demographic questions and brief measures related to
                stress, climate change awareness, and environmental
                experiences.
              </li>
              <li>
                After you complete all study procedures, you will be shown a
                completion code and redirected back to Prolific for payment
                processing. You will not need to provide an email address.
              </li>
            </ul>
          </Section>

          <Section title="Will Participating in this Study Benefit Me?">
            <p>
              There is no direct benefit to you by participating in this study.
            </p>
          </Section>

          <Section title="What Are the Risks Associated with This Research?">
            <p>
              The risks involved with participation in this study are low and
              may include potential but limited discomfort from viewing some
              street-level images or answering questions about stress and
              environmental experiences, and fatigue from completing the online
              task. We use secure UConn systems and restricted access to reduce
              privacy risks. AI-related privacy risk is also minimal because
              model development will use de-identified aggregated perception
              scores and street view image features, and your Prolific ID will
              not be included in model inputs or outputs.
            </p>
          </Section>

          <Section title="Do I Have to Participate?">
            <p>
              No, your participation is voluntary. You may decide not to
              participate at all or, if you start the study, you may withdraw
              at any time. Withdrawal or refusing to participate will not
              affect your relationship with the University of Connecticut in
              any way.
            </p>
            <p>
              If you would like to participate, click the &lsquo;I
              agree&rsquo; button and proceed to the online study. You may
              retain a copy of this consent form by using your browser&rsquo;s
              Print function to print this page before starting the survey.
            </p>
          </Section>

          <Section title="What Are the Costs of Taking Part in This Study?">
            <p>There are no costs to you for taking part in this study.</p>
          </Section>

          <Section title="Will I Be Paid for Participating?">
            <p>
              Yes, you will be paid through Prolific&rsquo;s built-in payment
              system upon verified completion of the entire online study,
              including all 20 image comparisons and the questionnaire.
              Compensation will follow Prolific&rsquo;s fair payment guidelines
              ($2 for 10 minutes). You will receive compensation within 5
              business days after you finish the study, provided that you
              submit complete and valid responses. The research team will not
              collect your email address or process payment directly. We will
              not collect your Social Security Number. Prolific&rsquo;s
              standard completion verification and payment policies will apply.
              There is no partial compensation for incomplete participation.
            </p>
            <p className="flex items-center gap-2 flex-wrap">
              <span>
                If you do not wish to be paid for your participation in this
                study, please initial here:
              </span>
              <input
                type="text"
                maxLength={5}
                value={state.paymentOptOutInitials}
                onChange={(e) => setPaymentOptOutInitials(e.target.value)}
                className="w-20 border-b-2 border-gray-400 focus:border-blue-600 outline-none px-2 py-0.5 text-center"
                aria-label="Initials to decline payment (optional)"
              />
            </p>
          </Section>

          <Section title="What About Confidentiality?">
            <p>
              We will make every effort to protect the confidentiality of study
              information that identifies you, but we cannot guarantee total
              confidentiality. Survey responses will be stored without direct
              identifiers and accessed only by the PI and the student
              investigator. No personal identifiable information will be
              collected by the research team. The only participant-level
              identifier recorded will be your Prolific ID, used solely to
              verify completion and process payment. Prolific IDs are stored
              separately from research responses, are not linked to survey
              data, are accessible only to the PI, and will be deleted after
              payment reconciliation is complete. All data will be stored on
              UConn-managed systems, including UConn OneDrive storage and the
              PI&rsquo;s institutional desktop computer. Results will be
              reported only in aggregate, and no identifying information will
              be used in publications or presentations.
            </p>
            <p>
              Data will be collected using the Internet; no guarantees can be
              made regarding the interception of data sent via the Internet by
              any third party. Confidentiality will be maintained to the degree
              permitted by the technology used.
            </p>
          </Section>

          <Section title="Who Do I Call If I Have Questions or Problems?">
            <p>
              If you have any questions about this study, please contact Dr.
              Hanlin Zhou (Phone: +1 647-879-5378; Email:{' '}
              <a
                href="mailto:hanlin.zhou@uconn.edu"
                className="text-blue-600 hover:underline"
              >
                hanlin.zhou@uconn.edu
              </a>
              ). If you have any questions or complaints, you may contact a
              person not on the research team at the Biomedical Research
              Alliance of New York Institutional Review Board at (516)
              318-6877 or at{' '}
              <a
                href="https://www.branyirb.com/concerns-about-research"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                www.branyirb.com/concerns-about-research
              </a>
              .
            </p>
          </Section>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Consent Agreement
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              If you click the &lsquo;I agree&rsquo; button below, it means
              that you read this consent form and agreed to participate in this
              study. You may retain a copy of this consent form by using your
              browser&rsquo;s Print function to print this page before starting
              the survey.
            </p>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Please enter your initials to confirm you have read this consent
              form:
            </label>
            <input
              type="text"
              maxLength={5}
              value={state.consentInitials}
              onChange={(e) => setConsentInitials(e.target.value)}
              placeholder="e.g. HZ"
              className="w-32 border-2 border-gray-300 rounded-lg px-3 py-2 text-center text-lg focus:border-blue-600 outline-none mb-6"
            />
            {error && (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
              >
                {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={!canAgree || creating}
                onClick={handleAgree}
                className={`flex-1 px-8 py-3 rounded-lg text-lg font-medium transition-colors ${
                  canAgree && !creating
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {creating ? 'Starting…' : 'I agree'}
              </button>
              <button
                onClick={handleRefuse}
                className="flex-1 px-8 py-3 rounded-lg text-lg font-medium border-2 border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                I refuse
              </button>
            </div>
            {!canAgree && (
              <p className="text-xs text-gray-500 mt-2">
                Enter your initials above to enable the &lsquo;I agree&rsquo;
                button.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
