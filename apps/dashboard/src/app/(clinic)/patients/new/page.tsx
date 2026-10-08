import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/ui";

import { createPatient } from "../../actions";

export default function NewPatientPage() {
  return (
    <>
      <PageHeader eyebrow="Front desk" title="Register a patient" />
      <div className="card max-w-2xl p-6">
        <ActionForm action={createPatient} submitLabel="Register patient">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="full_name">
                Full name
              </label>
              <input id="full_name" name="full_name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Mobile (10 digits)
              </label>
              <input id="phone" name="phone" inputMode="tel" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="dob">
                Date of birth
              </label>
              <input id="dob" name="dob" type="date" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="sex">
                Sex
              </label>
              <select id="sex" name="sex" className="field" defaultValue="">
                <option value="">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="presenting_concern">
                Presenting concern
              </label>
              <input id="presenting_concern" name="presenting_concern" className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="allergies">
                Allergies
              </label>
              <input id="allergies" name="allergies" className="field" placeholder="None known" />
            </div>
          </div>
          <p className="text-xs text-muted">
            When this patient signs in to the app with the same mobile number, their app account links to this record automatically.
          </p>
        </ActionForm>
      </div>
    </>
  );
}
