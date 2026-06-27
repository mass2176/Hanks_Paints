# Hanks Paints - Project Context for Codex

## Naming convention

The application/project name in the codebase is `Hanks_Paints`.

Use `Hanks_Paints` when referring to:
- The repo/project
- Internal app name
- File/package references
- Technical documentation

Use `Hanks Paints` when referring to:
- The public business name
- Customer-facing website text
- Portal text
- Estimate/invoice/customer messages

Do not rename the app to `Hanks_Paints_MVP` or `Hanks Paints MVP`.

## Business intent

This application is for Hanks Paints, an auto body, paint, rust repair, coatings, Spray PPF, panel replacement, custom paint, full color change, collision, and body repair shop.

The app should support both:
- A public-facing Hanks Paints website
- A customer quote/status portal
- An employee/admin shop dashboard

The overall goal is to manage a customer from quote request through vehicle repair, supplements/change orders, progress photos, invoice, and manual payment tracking.

## Visual theme

Use a modern black/charcoal automotive shop theme inspired by the Hanks Paints building:
- Black/dark charcoal background
- White text
- Electric blue accents
- Bold automotive/performance-shop feel
- Mobile-first layout
- Clean, professional, high-contrast buttons and cards

## Core MVP workflow

1. Customer visits public website.
2. Customer clicks Start Free Estimate.
3. Customer submits quote intake form.
4. Customer provides full name, full street address, phone, email, vehicle info, service type, payment type, damage/request description, and at least one vehicle photo.
5. Customer verifies either phone or email. One verified contact method is enough.
6. Quote request becomes Request Received.
7. Employee dashboard shows new quote request.
8. Employee clicks Start Quotation.
9. Customer is notified that the request is Under Review.
10. Employee decides whether photos are enough for a preliminary photo estimate or an in-person inspection is needed.
11. Final estimates cannot be approved or converted to active repair jobs until a physical in-person inspection is completed.
12. Customer can request an inspection appointment from owner-controlled available time slots.
13. Estimator/shop must confirm requested appointment time before it is final.
14. After physical inspection, shop creates final line-item estimate.
15. Customer approves final estimate with electronic signature.
16. Approved quote can become an active repair job.
17. Customer can message through portal.
18. Employees can upload photos as either Customer Visible or Internal Only.
19. Hidden damage after work starts creates a separate supplement/change order requiring separate customer approval before extra work continues.
20. Job can be invoiced.
21. Payments are manually tracked, not processed online in MVP.

## Customer portal rules

Customers use passwordless access:
- Text/email verification code
- One verified contact method is enough
- Text is preferred/default; email is backup
- No permanent public direct access to private job details without verification

Customer can:
- View quote/job status
- View customer-visible photos
- Send messages
- Upload requested photos later
- Schedule/request inspection appointment
- View preliminary estimate if sent
- View final estimate
- Electronically approve final estimate
- Approve supplements/change orders
- View invoice/payment status

Customer should not see:
- Internal notes
- Internal-only photos
- Cost/profit/margin details
- Parts/vendor cost details
- Employee-only activity details

## Employee/admin portal rules

Use one shared shop dashboard, not individual job assignments.

Roles:
- Admin/Owner: full access, settings, users, appointment availability, estimates, invoices
- Employee/Estimator: quotes, jobs, photos, estimates, supplements, job status
- Receptionist: customer records, appointments, messages, limited estimate visibility

Dashboard queues should include:
- New Quote Requests
- Under Review
- Appointment Requests
- Confirmed Inspections
- Waiting on Customer Approval
- Active Jobs
- Ready for Pickup
- Balance Due
- New Customer Messages

Include global search by:
- Customer name
- Phone
- Email
- Vehicle
- VIN
- License plate
- Quote number
- Job number
- Invoice number
- Service type

## Quote intake form

Required:
- Full name
- Street address
- City
- State
- ZIP
- Phone
- Email
- Preferred contact method
- Vehicle year/make/model or VIN
- Main service type
- Payment type
- Damage/request description
- At least one vehicle photo

Main service type options:
- Rust Repair
- Panel Replacement
- Collision / Body Repair
- Paint Repair
- Custom Paint
- Full Color Change
- Coatings
- Spray PPF
- Other / Not Sure

Payment type options:
- Customer Pay
- Insurance Claim
- Not Sure Yet

If Insurance Claim:
- Insurance company optional
- Claim number optional
- Adjuster info optional later
- Insurance docs upload optional later

VIN should be optional but useful. If VIN is provided, allow auto-fill of year/make/model when implemented. Manual override should always be allowed.

Reference photos are not needed in MVP. Vehicle photos only.

## Estimates

Use simple flat dollar line items for MVP.

Estimate types:
- Preliminary Photo Estimate
- Final Estimate After Physical Inspection

Important rule:
- Preliminary photo estimate is not final and cannot authorize job start.
- Final estimate requires physical inspection completed.
- Job cannot start until final estimate is approved/signed by customer.

Use automatic disclaimers:
- Photo-based estimates are preliminary only.
- Final pricing requires in-person inspection.
- Hidden damage found after disassembly may require supplement/change order approval.

## Electronic signature

Customer should approve final estimate inside portal.

Approval should capture:
- Customer typed legal name
- Checkbox acknowledgments
- Date/time
- Estimate version
- IP/device/browser if available
- Signed authorization text
- Approved total
- Saved approval record

Button should say:
Approve Final Estimate & Authorize Repairs

## Supplements / change orders

When hidden damage is found:
- Create separate supplement/change order
- Add explanation
- Add line items
- Add supporting photos
- Customer must approve/sign before extra work continues
- Do not overwrite original estimate
- Show original estimate + supplement totals separately

Job status can become:
Waiting on Customer Approval

## Appointments

Owner/admin controls available inspection days/times.

Customer can request appointment from available slots, but appointment is not final until estimator/shop confirms it.

Appointment statuses:
- Inspection Needed
- Appointment Requested
- Appointment Confirmed
- Reschedule Requested
- Inspection Completed
- No-Show
- Canceled

Final estimate stays locked until physical inspection is completed.

## Photos/videos

Customer:
- Minimum one vehicle photo required
- Optional short videos later
- No reference/inspiration photos needed for MVP

Employee:
- Upload photos from phone/mobile web
- Choose simple visibility:
  - Customer Visible
  - Internal Only
- Customer-visible photos appear in portal
- Internal-only photos never appear in customer portal
- Employee can choose whether to notify customer about uploaded photos

## Messaging

Use portal messaging as the official communication record.

For MVP:
- Customer replies inside portal
- Shop messages inside app
- SMS/email should notify customer that a portal message exists
- Do not implement full two-way SMS reply ingestion yet

## Invoicing and payment tracking

Include basic invoicing and manual payment tracking.

Invoice should derive from:
- Approved final estimate
- Approved supplements
- Manual adjustments
- Payments recorded

Payment methods:
- Cash
- Check
- Card processed elsewhere
- Zelle
- Venmo
- Cash App
- Bank transfer
- Financing
- Other

Do not process payments online in MVP.

## Parts/material tracking

Include optional internal-only parts/material checklist.

This is not full inventory. It is a simple internal notes/checklist tool:
- Needed
- Need to Verify
- Ordered
- Received
- Backordered
- In Stock
- Installed / Used
- Canceled

Customers should not see item details.

## History and timeline

Include basic customer/vehicle history:
- Customers can have multiple vehicles
- Vehicles can have multiple quotes/jobs
- Jobs have photos, estimates, supplements, messages, invoices, payments

Include internal activity timeline per quote/job:
- Quote submitted
- Customer verified
- Photos uploaded
- Start quotation
- Appointment requested/confirmed
- Inspection complete
- Estimate sent/approved
- Supplement created/approved
- Payment recorded
- Status changes

Full activity timeline is internal-only.

## Public website

Public website should include:
- Homepage
- Services
- Gallery
- Start Estimate
- Check Status
- Contact

Homepage service language should emphasize:
Paint, Rust Repair, Coatings, Spray PPF, Panel Replacement, Custom Paint, Full Color Changes, Collision, Body Repair, etc.

No testimonials/reviews in MVP.

## Technical stack

Current intended stack:
- Frontend: Next.js / React
- Backend: Python FastAPI
- Database: PostgreSQL
- Deployment: Render for testing
- File/media storage: not production-ready yet
- Docker-ready structure

For now, keep implementation simple and testable.

## Current deployment context

Frontend:
https://hanks-paints-frontend.onrender.com

Backend:
https://hanks-paints-backend.onrender.com

Backend API base:
https://hanks-paints-backend.onrender.com/api

Avoid localhost fallbacks in deployed frontend. If environment variables are not injected correctly during Next.js build, use the deployed backend URL as the fallback for testing.

## Development priorities

Before production use, add:
- Real employee login/auth
- Real customer verification
- Hardened file uploads
- Object storage for photos/videos
- Rate limiting / CAPTCHA
- Better CORS config
- Backups
- Legal review of estimate/signature wording

Use fake/test data only until security is improved.