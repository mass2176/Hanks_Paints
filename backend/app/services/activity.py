from sqlalchemy.orm import Session
from app.models.domain import Activity

def log_activity(db: Session, *, event: str, quote_id: int | None = None, job_id: int | None = None, actor: str = "system", detail: str | None = None):
    row = Activity(quote_id=quote_id, job_id=job_id, actor=actor, event=event, detail=detail)
    db.add(row)
    db.commit()
    return row
