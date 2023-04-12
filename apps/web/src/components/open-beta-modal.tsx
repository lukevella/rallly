import { Logo } from "./logo";

const OpenBeta = () => {
  return (
    <div>
      <div className="bg-pattern border-b px-4 py-8 text-center text-2xl">
        <Logo />
      </div>
      <div className="max-w-3xl p-3 sm:p-6">
        <div>
          <p className="mb-4">
            The open beta allows you to test out new features before they are
            officially released to the general public. By participating you,
            will have the opportunity to provide feedback and help shape the
            future of Rallly!
          </p>
        </div>
        <div>
          <h2 className="mb-4">Feedback</h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <a
              href="https://github.com/lukevella/rallly/issues/new?assignees=&labels=bug&template=---bug-report.md&title="
              className="hover:text-primary-600 rounded border p-3"
            >
              🐞 Submit a bug report
            </a>
            <a
              href="https://github.com/lukevella/rallly/discussions/new/choose"
              className="hover:text-primary-600 rounded border p-3"
            >
              📢 Open a discussion with the community
            </a>
            <a
              href="https://discord.gg/uzg4ZcHbuM"
              className="hover:text-primary-600 rounded border p-3"
            >
              💬 Chat on Discord
            </a>
            <a
              href="mailto:feedback@rallly.co"
              className="hover:text-primary-600 rounded border p-3"
            >
              ✉️ Send an email
            </a>
          </ul>
          <div className="mt-4 rounded border bg-slate-50 p-4">
            <h2 className="mb-4 text-slate-800">Important</h2>
            <p className="mb-4">
              <strong>
                You should not rely on the beta for any important data or
                information.
              </strong>
            </p>
            <p className="mb-4">
              The beta should be used exclusively for testing purposes.
              Features, polls, accounts, or data may be removed at any time
              without prior notice.
            </p>
            <p className="m-0">
              Any data or information saved on the beta website cannot be
              accessed on the production website and vice versa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenBeta;
