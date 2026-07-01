import enum
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class QuoteStatus(str, enum.Enum):
    unverified = "Unverified / Pending Verification"
    received = "Request Received"
    under_review = "Under Review"
    more_info_needed = "More Info Needed"
    inspection_needed = "In-Person Inspection Needed"
    appointment_requested = "Appointment Requested"
    appointment_confirmed = "Appointment Confirmed"
    inspection_completed = "Physical Inspection Completed"
    preliminary_ready = "Preliminary Estimate Ready"
    final_ready = "Final Estimate Ready"
    approved = "Final Estimate Approved"
    converted = "Converted to Job"

class JobStatus(str, enum.Enum):
    active = "Active Job"
    in_repair = "In Repair"
    in_paint = "In Paint"
    waiting_customer = "Waiting on Customer Approval"
    ready_pickup = "Ready for Pickup"
    completed = "Completed"

class AppointmentStatus(str, enum.Enum):
    requested = "Appointment Requested"
    confirmed = "Appointment Confirmed"
    reschedule_requested = "Reschedule Requested"
    completed = "Inspection Completed"
    no_show = "No-Show"
    canceled = "Canceled"

class Visibility(str, enum.Enum):
    customer_visible = "customer_visible"
    internal_only = "internal_only"

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(200))
    street_address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(50))
    zip_code: Mapped[str] = mapped_column(String(20))
    phone: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(255))
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_contact: Mapped[str] = mapped_column(String(20), default="text")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="customer")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    vin: Mapped[str | None] = mapped_column(String(17), nullable=True)
    year: Mapped[str] = mapped_column(String(10))
    make: Mapped[str] = mapped_column(String(100))
    model: Mapped[str] = mapped_column(String(100))
    trim: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(100), nullable=True)
    plate: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer: Mapped[Customer] = relationship(back_populates="vehicles")
    quotes: Mapped[list["QuoteRequest"]] = relationship(back_populates="vehicle")

class QuoteRequest(Base):
    __tablename__ = "quote_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"))
    service_type: Mapped[str] = mapped_column(String(100))
    payment_type: Mapped[str] = mapped_column(String(50))
    insurance_company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    claim_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    damage_description: Mapped[str] = mapped_column(Text)
    status: Mapped[QuoteStatus] = mapped_column(Enum(QuoteStatus), default=QuoteStatus.unverified)
    physical_inspection_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    vehicle: Mapped[Vehicle] = relationship(back_populates="quotes")

class MediaFile(Base):
    __tablename__ = "media_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int | None] = mapped_column(ForeignKey("quote_requests.id"), nullable=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    visibility: Mapped[Visibility] = mapped_column(Enum(Visibility), default=Visibility.customer_visible)
    uploaded_by: Mapped[str] = mapped_column(String(50), default="customer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"))
    requested_start: Mapped[datetime] = mapped_column(DateTime)
    confirmed_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[AppointmentStatus] = mapped_column(Enum(AppointmentStatus), default=AppointmentStatus.requested)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

class Estimate(Base):
    __tablename__ = "estimates"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"))
    estimate_type: Mapped[str] = mapped_column(String(50))  # preliminary or final
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class EstimateLineItem(Base):
    __tablename__ = "estimate_line_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    estimate_id: Mapped[int] = mapped_column(ForeignKey("estimates.id"))
    description: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(100), default="Labor/Repair")
    amount: Mapped[float] = mapped_column(Float)
    customer_visible: Mapped[bool] = mapped_column(Boolean, default=True)

class EstimateApproval(Base):
    __tablename__ = "estimate_approvals"
    id: Mapped[int] = mapped_column(primary_key=True)
    estimate_id: Mapped[int] = mapped_column(ForeignKey("estimates.id"))
    quote_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"))
    typed_legal_name: Mapped[str] = mapped_column(String(200))
    authorization_text: Mapped[str] = mapped_column(Text)
    approved_total: Mapped[float] = mapped_column(Float)
    estimate_version: Mapped[int] = mapped_column(Integer)
    customer_acknowledged: Mapped[bool] = mapped_column(Boolean, default=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quote_requests.id"))
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Supplement(Base):
    __tablename__ = "supplements"
    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    reason: Mapped[str] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(50), default="draft")
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=True)

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int | None] = mapped_column(ForeignKey("quote_requests.id"), nullable=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    sender_type: Mapped[str] = mapped_column(String(50))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id"))
    status: Mapped[str] = mapped_column(String(50), default="draft")
    total_due: Mapped[float] = mapped_column(Float, default=0)
    amount_paid: Mapped[float] = mapped_column(Float, default=0)

class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"))
    amount: Mapped[float] = mapped_column(Float)
    method: Mapped[str] = mapped_column(String(100))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Activity(Base):
    __tablename__ = "activities"
    id: Mapped[int] = mapped_column(primary_key=True)
    quote_id: Mapped[int | None] = mapped_column(ForeignKey("quote_requests.id"), nullable=True)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    actor: Mapped[str] = mapped_column(String(100), default="system")
    event: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
