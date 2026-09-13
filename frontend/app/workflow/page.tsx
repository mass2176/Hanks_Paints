import type { Metadata } from 'next'
import WorkflowMap from '../../components/WorkflowMap'

export const metadata: Metadata = {
  title: 'Website Workflow Map',
  description:
    'Visual workflow map for Hanks Paints estimate requests, inspections, estimates, approvals, repair jobs, invoices, payments, messaging, and notifications.',
  alternates: {
    canonical: '/workflow',
  },
}

export default function WorkflowPage() {
  return <WorkflowMap />
}
