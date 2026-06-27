import os, shutil, uuid
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.domain import (
    Activity, Appointment, AppointmentStatus, Customer, Estimate, EstimateLineItem,
    Invoice, Job, JobStatus, MediaFile, Message, Payment, QuoteRequest, QuoteStatus,
    Supplement, Vehicle, Visibility
)
from app.schemas.quote import AppointmentRequestIn, EstimateCreate, MessageIn, PaymentIn, QuoteCreate, QuoteOut
from app.services.activity import log_activity
from app.services.notifications import send_customer_notification

router = APIRouter()

@router.post("/quotes", response_model=QuoteOut)
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    customer = Customer(**payload.customer.model_dump())
    db.add(customer); db.flush()
    vehicle = Vehicle(customer_id=customer.id, **payload.vehicle.model_dump())
    db.add(vehicle); db.flush()
    quote = QuoteRequest(
        customer_id=customer.id,
        vehicle_id=vehicle.id,
        service_type=payload.service_type,
        payment_type=payload.payment_type,
        insurance_company=payload.insurance_company,
        claim_number=payload.claim_number,
        damage_description=payload.damage_description,
        status=QuoteStatus.unverified,
    )
    db.add(quote); db.commit(); db.refresh(quote)
    log_activity(db, quote_id=quote.id, event="Quote request submitted", actor="customer")
    return quote

@router.post("/quotes/{quote_id}/verify")
def verify_quote(quote_id: int, method: str = "phone", db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    customer = db.get(Customer, quote.customer_id)
    if method == "email": customer.email_verified = True
    else: customer.phone_verified = True
    quote.status = QuoteStatus.received
    db.commit()
    log_activity(db, quote_id=quote.id, event="Customer verified contact method", actor="customer", detail=method)
    send_customer_notification(customer.phone if method != "email" else customer.email, "Hanks Paints received your quote request.")
    return {"ok": True, "status": quote.status.value}

@router.post("/quotes/{quote_id}/media")
def upload_media(quote_id: int, visibility: Visibility = Visibility.customer_visible, uploaded_by: str = "customer", file: UploadFile = File(...), db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    os.makedirs(settings.media_root, exist_ok=True)
    ext = os.path.splitext(file.filename or "upload")[1]
    safe_name = f"quote_{quote_id}_{uuid.uuid4().hex}{ext}"
    path = os.path.join(settings.media_root, safe_name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    media = MediaFile(quote_id=quote_id, file_path=path, original_name=file.filename or safe_name, content_type=file.content_type or "application/octet-stream", visibility=visibility, uploaded_by=uploaded_by)
    db.add(media); db.commit(); db.refresh(media)
    log_activity(db, quote_id=quote_id, event="Media uploaded", actor=uploaded_by, detail=visibility.value)
    return {"id": media.id, "file_path": media.file_path, "visibility": media.visibility.value}

@router.post("/quotes/{quote_id}/start-quotation")
def start_quotation(quote_id: int, db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    quote.status = QuoteStatus.under_review
    db.commit()
    log_activity(db, quote_id=quote.id, event="Start Quotation clicked", actor="employee")
    customer = db.get(Customer, quote.customer_id)
    send_customer_notification(customer.phone, "Hanks Paints: Your quote request is now under review.")
    return {"status": quote.status.value}

@router.post("/quotes/{quote_id}/appointments")
def request_appointment(quote_id: int, payload: AppointmentRequestIn, db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    quote.status = QuoteStatus.appointment_requested
    appt = Appointment(quote_id=quote_id, requested_start=payload.requested_start, notes=payload.notes, status=AppointmentStatus.requested)
    db.add(appt); db.commit(); db.refresh(appt)
    log_activity(db, quote_id=quote_id, event="Appointment requested", actor="customer", detail=str(payload.requested_start))
    return {"id": appt.id, "status": appt.status.value}

@router.post("/appointments/{appointment_id}/confirm")
def confirm_appointment(appointment_id: int, confirmed_start: datetime | None = None, db: Session = Depends(get_db)):
    appt = db.get(Appointment, appointment_id)
    if not appt: raise HTTPException(404, "Appointment not found")
    appt.confirmed_start = confirmed_start or appt.requested_start
    appt.status = AppointmentStatus.confirmed
    quote = db.get(QuoteRequest, appt.quote_id)
    quote.status = QuoteStatus.appointment_confirmed
    db.commit()
    log_activity(db, quote_id=quote.id, event="Appointment confirmed", actor="employee", detail=str(appt.confirmed_start))
    return {"status": appt.status.value}

@router.post("/quotes/{quote_id}/inspection-complete")
def mark_inspection_complete(quote_id: int, db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    quote.physical_inspection_completed = True
    quote.status = QuoteStatus.inspection_completed
    db.commit()
    log_activity(db, quote_id=quote_id, event="Physical inspection completed", actor="employee")
    return {"status": quote.status.value}

@router.post("/quotes/{quote_id}/estimates")
def create_estimate(quote_id: int, payload: EstimateCreate, db: Session = Depends(get_db)):
    quote = db.get(QuoteRequest, quote_id)
    if not quote: raise HTTPException(404, "Quote not found")
    if payload.estimate_type == "final" and not quote.physical_inspection_completed:
        raise HTTPException(400, "Final estimate requires physical inspection completed")
    est = Estimate(quote_id=quote_id, estimate_type=payload.estimate_type, customer_notes=payload.customer_notes, internal_notes=payload.internal_notes)
    db.add(est); db.flush()
    for item in payload.line_items:
        db.add(EstimateLineItem(estimate_id=est.id, **item.model_dump()))
    quote.status = QuoteStatus.final_ready if payload.estimate_type == "final" else QuoteStatus.preliminary_ready
    db.commit(); db.refresh(est)
    log_activity(db, quote_id=quote_id, event=f"{payload.estimate_type.title()} estimate created", actor="employee")
    return {"id": est.id, "status": quote.status.value}

@router.post("/estimates/{estimate_id}/approve")
def approve_estimate(estimate_id: int, typed_signature: str, db: Session = Depends(get_db)):
    est = db.get(Estimate, estimate_id)
    if not est: raise HTTPException(404, "Estimate not found")
    if est.estimate_type != "final": raise HTTPException(400, "Only final estimates can authorize repair start")
    est.status = "approved"
    quote = db.get(QuoteRequest, est.quote_id)
    quote.status = QuoteStatus.approved
    job = Job(quote_id=quote.id, status=JobStatus.active)
    db.add(job); db.commit(); db.refresh(job)
    log_activity(db, quote_id=quote.id, job_id=job.id, event="Final estimate approved and signed", actor="customer", detail=typed_signature)
    return {"job_id": job.id, "quote_status": quote.status.value}

@router.post("/jobs/{job_id}/supplements")
def create_supplement(job_id: int, reason: str, amount: float = 0, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job: raise HTTPException(404, "Job not found")
    job.status = JobStatus.waiting_customer
    sup = Supplement(job_id=job_id, reason=reason, amount=amount, status="approval_needed")
    db.add(sup); db.commit(); db.refresh(sup)
    log_activity(db, job_id=job_id, event="Supplement/change order created", actor="employee", detail=reason)
    return {"id": sup.id, "job_status": job.status.value}

@router.post("/supplements/{supplement_id}/approve")
def approve_supplement(supplement_id: int, typed_signature: str, db: Session = Depends(get_db)):
    sup = db.get(Supplement, supplement_id)
    if not sup: raise HTTPException(404, "Supplement not found")
    sup.status = "approved"
    job = db.get(Job, sup.job_id)
    job.status = JobStatus.in_repair
    db.commit()
    log_activity(db, job_id=job.id, event="Supplement approved and signed", actor="customer", detail=typed_signature)
    return {"status": sup.status}

@router.post("/quotes/{quote_id}/messages")
def add_quote_message(quote_id: int, payload: MessageIn, db: Session = Depends(get_db)):
    msg = Message(quote_id=quote_id, sender_type=payload.sender_type, body=payload.body)
    db.add(msg); db.commit(); db.refresh(msg)
    log_activity(db, quote_id=quote_id, event="Message sent", actor=payload.sender_type)
    return {"id": msg.id}

@router.post("/jobs/{job_id}/invoice")
def create_invoice(job_id: int, total_due: float, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job: raise HTTPException(404, "Job not found")
    inv = Invoice(job_id=job_id, total_due=total_due, status="draft")
    db.add(inv); db.commit(); db.refresh(inv)
    log_activity(db, job_id=job_id, event="Invoice created", actor="employee")
    return {"id": inv.id, "total_due": inv.total_due}

@router.post("/invoices/{invoice_id}/payments")
def record_payment(invoice_id: int, payload: PaymentIn, db: Session = Depends(get_db)):
    inv = db.get(Invoice, invoice_id)
    if not inv: raise HTTPException(404, "Invoice not found")
    p = Payment(invoice_id=invoice_id, **payload.model_dump())
    inv.amount_paid += payload.amount
    inv.status = "paid_in_full" if inv.amount_paid >= inv.total_due else "partial_payment"
    db.add(p); db.commit()
    log_activity(db, job_id=inv.job_id, event="Payment recorded", actor="employee", detail=f"{payload.method}: {payload.amount}")
    return {"invoice_status": inv.status, "amount_paid": inv.amount_paid, "balance_due": max(inv.total_due - inv.amount_paid, 0)}

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    quotes = db.query(QuoteRequest).order_by(QuoteRequest.created_at.desc()).limit(50).all()
    return [{"id": q.id, "service_type": q.service_type, "payment_type": q.payment_type, "status": q.status.value, "created_at": q.created_at} for q in quotes]

@router.get("/search")
def search(q: str, db: Session = Depends(get_db)):
    customers = db.query(Customer).filter(or_(Customer.full_name.ilike(f"%{q}%"), Customer.phone.ilike(f"%{q}%"), Customer.email.ilike(f"%{q}%"))).limit(20).all()
    vehicles = db.query(Vehicle).filter(or_(Vehicle.vin.ilike(f"%{q}%"), Vehicle.make.ilike(f"%{q}%"), Vehicle.model.ilike(f"%{q}%"), Vehicle.plate.ilike(f"%{q}%"))).limit(20).all()
    return {"customers": [{"id": c.id, "name": c.full_name, "phone": c.phone, "email": c.email} for c in customers], "vehicles": [{"id": v.id, "vehicle": f"{v.year} {v.make} {v.model}", "vin": v.vin, "plate": v.plate} for v in vehicles]}

@router.get("/quotes/{quote_id}/timeline")
def timeline(quote_id: int, db: Session = Depends(get_db)):
    rows = db.query(Activity).filter(Activity.quote_id == quote_id).order_by(Activity.created_at.asc()).all()
    return [{"event": r.event, "actor": r.actor, "detail": r.detail, "created_at": r.created_at} for r in rows]
