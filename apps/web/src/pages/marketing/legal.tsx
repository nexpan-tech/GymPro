import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { APP_CONFIG } from "@/config/app.config";

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-(--surface) text-(--text-primary)">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 font-black">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-(image:--gradient-primary) text-white"><Dumbbell className="h-4 w-4" /></span>
            {APP_CONFIG.appName}
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-(--text-secondary) hover:text-(--text-primary)"><ArrowLeft className="h-4 w-4" />Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-(--text-muted)">Last updated {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        <div className="prose-legal mt-8 space-y-6 text-sm leading-7 text-(--text-secondary)">{children}</div>
        <p className="mt-10 rounded-xl border border-dashed border-border p-4 text-xs text-(--text-muted)">
          This is a template provided for launch readiness and must be reviewed and finalized by your legal counsel before production use.
        </p>
      </main>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-(--text-primary)">{children}</h2>;
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>{APP_CONFIG.appName} ("we", "us") provides gym management software to gym businesses ("Gyms"). This policy explains what we collect and how we use it.</p>
      <div><H>Information we collect</H><p>Account and gym profile data, member records your gym chooses to store, attendance and activity data, and standard technical logs needed to operate the service.</p></div>
      <div><H>How we use it</H><p>To provide and secure the service, process SaaS billing to the gym, send operational notifications, and improve reliability. We do not sell personal data.</p></div>
      <div><H>Multi-tenancy & isolation</H><p>Each gym's data is logically isolated. Access is controlled by role-based permissions and audit-logged.</p></div>
      <div><H>Member payments</H><p>Members pay their gym directly. {APP_CONFIG.appName} only charges the gym a SaaS license fee and records membership/payment metadata on the gym's behalf.</p></div>
      <div><H>Data retention & your rights</H><p>Gyms control their members' records. You may request export or deletion of your data subject to legal and accounting obligations.</p></div>
      <div><H>Contact</H><p>Questions? Email privacy@gympro.app.</p></div>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>By using {APP_CONFIG.appName} you agree to these terms.</p>
      <div><H>The service</H><p>{APP_CONFIG.appName} is a multi-tenant SaaS platform for gym management. We grant the gym a non-exclusive license to use it for the duration of an active subscription or trial.</p></div>
      <div><H>Subscriptions & billing</H><p>Gyms pay a flat monthly license fee based on member capacity. Trials are billing-free; billing begins after the trial ends. Fees are non-refundable except where required by law.</p></div>
      <div><H>Acceptable use</H><p>You agree not to misuse the service, attempt to breach tenant isolation, or upload unlawful content. We may suspend accounts that violate these terms.</p></div>
      <div><H>Member data responsibility</H><p>The gym is the controller of its member data and is responsible for obtaining any required consents. {APP_CONFIG.appName} acts as a processor.</p></div>
      <div><H>Availability & liability</H><p>We aim for high availability but provide the service "as is". Our liability is limited to the fees paid in the preceding month.</p></div>
      <div><H>Contact</H><p>Questions? Email support@gympro.app.</p></div>
    </LegalShell>
  );
}
