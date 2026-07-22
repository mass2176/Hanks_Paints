export default function Page() {
  return (
    <main className="section">
      <h1>Terms and Conditions</h1>
      <p className="muted">Effective date: July 22, 2026</p>

      <div className="grid">
        <div className="card">
          <h3>Use of This Website</h3>
          <p className="muted">
            The Hanks Paints website, estimate form, customer portal, and product pages are provided
            to help customers request estimates, upload vehicle media, communicate with the shop,
            review estimates, approve work, and purchase Hanks Paints products.
          </p>
        </div>

        <div className="card">
          <h3>Estimate Requests</h3>
          <p className="muted">
            Photo-based estimates are preliminary only. Final pricing requires an in-person vehicle
            inspection before work is scheduled or started. Hidden damage found after disassembly may
            require a separate supplement or change order approval.
          </p>
        </div>

        <div className="card">
          <h3>Customer Portal</h3>
          <p className="muted">
            Customers may use the portal to view quote or job status, upload requested media, send
            messages, request inspection appointments, review estimates, approve final estimates or
            supplements, and view invoice/payment status.
          </p>
        </div>

        <div className="card">
          <h3>Electronic Approval</h3>
          <p className="muted">
            When a customer types their legal name, checks the required acknowledgment, and clicks
            Approve Final Estimate & Authorize Repairs, the customer authorizes Hanks Paints to
            begin the listed repairs for the approved final estimate amount shown in the portal.
          </p>
        </div>

        <div className="card">
          <h3>SMS/Text Message Terms</h3>
          <p className="muted">
            By providing your phone number and consenting to text messages through a Hanks Paints
            web form, customer portal, phone call, or in-person interaction, you agree that Hanks
            Paints may send service-related SMS messages about estimate requests, quote review,
            inspection scheduling, customer messages, approvals, repair status updates,
            supplements/change orders, invoices, pickup reminders, and payment reminders.
          </p>
          <p className="muted">
            Message frequency varies. Message and data rates may apply. Reply STOP to opt out.
            Reply HELP for help. Consent to receive SMS messages is not required to purchase goods
            or services from Hanks Paints.
          </p>
          <p className="muted">
            Carriers are not liable for delayed or undelivered messages. View the Hanks Paints{' '}
            <a href="/privacy">Privacy Policy</a> for information about how customer and SMS consent
            data is handled.
          </p>
        </div>

        <div className="card">
          <h3>SMS Data Sharing</h3>
          <p className="muted">
            Hanks Paints does not sell, rent, or share mobile phone numbers or SMS consent with
            third parties or affiliates for marketing or promotional purposes.
          </p>
        </div>

        <div className="card">
          <h3>Payments</h3>
          <p className="muted">
            Repair payments are manually tracked in the Hanks Paints workflow. Online product
            checkout, when available, may be processed through a third-party payment provider.
          </p>
        </div>

        <div className="card">
          <h3>Contact</h3>
          <p className="muted">
            Questions about these terms can be sent to Hanks Paints at{' '}
            <a href="mailto:henry@hanks-paints.com">henry@hanks-paints.com</a> or by phone/text at{' '}
            <a href="tel:17652527998">(765) 252-7998</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
