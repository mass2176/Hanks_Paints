from datetime import datetime
from pydantic import BaseModel, EmailStr

class CustomerIn(BaseModel):
    full_name: str
    street_address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: EmailStr
    preferred_contact: str = "text"

class VehicleIn(BaseModel):
    vin: str | None = None
    year: str
    make: str
    model: str
    trim: str | None = None
    color: str | None = None
    plate: str | None = None

class QuoteCreate(BaseModel):
    customer: CustomerIn
    vehicle: VehicleIn
    service_type: str
    payment_type: str
    insurance_company: str | None = None
    claim_number: str | None = None
    damage_description: str

class QuoteOut(BaseModel):
    id: int
    customer_id: int
    vehicle_id: int
    service_type: str
    payment_type: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class EstimateLineIn(BaseModel):
    description: str
    category: str = "Labor/Repair"
    amount: float
    customer_visible: bool = True

class EstimateCreate(BaseModel):
    estimate_type: str
    customer_notes: str | None = None
    internal_notes: str | None = None
    line_items: list[EstimateLineIn] = []

class AppointmentRequestIn(BaseModel):
    requested_start: datetime
    notes: str | None = None

class InspectionCompleteIn(BaseModel):
    notes: str

class EstimateApprovalIn(BaseModel):
    typed_legal_name: str
    customer_acknowledged: bool

class MessageIn(BaseModel):
    body: str
    sender_type: str = "customer"

class PaymentIn(BaseModel):
    amount: float
    method: str
    note: str | None = None

class ProductCheckoutIn(BaseModel):
    product_slug: str
    quantity: int = 1
