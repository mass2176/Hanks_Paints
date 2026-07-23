import base64
import urllib.error
import urllib.parse
import urllib.request
import re

from app.core.config import settings


def _sms_enabled() -> bool:
    return settings.sms_notifications_enabled or settings.sms_enabled


def _twilio_ready() -> bool:
    sender_configured = bool(settings.twilio_from_phone or settings.twilio_messaging_service_sid)
    return bool(
        _sms_enabled()
        and settings.twilio_account_sid
        and settings.twilio_api_key
        and settings.twilio_api_secret
        and sender_configured
    )


def _send_sms(destination: str, message: str) -> bool:
    normalized_destination = _normalize_us_phone(destination)
    if not normalized_destination:
        print(f"SMS skipped; invalid destination phone number: {destination}")
        return False

    if not _twilio_ready():
        print(f"SMS skipped; Twilio is not fully configured. Intended SMS to {normalized_destination}: {message}")
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
    payload = {
        "To": normalized_destination,
        "Body": message,
    }

    if settings.twilio_messaging_service_sid:
        payload["MessagingServiceSid"] = settings.twilio_messaging_service_sid
    else:
        payload["From"] = settings.twilio_from_phone or ""

    data = urllib.parse.urlencode(payload).encode("utf-8")
    token = f"{settings.twilio_api_key}:{settings.twilio_api_secret}".encode("utf-8")
    request = urllib.request.Request(url, data=data, method="POST")
    request.add_header("Authorization", f"Basic {base64.b64encode(token).decode('ascii')}")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
            print(f"SMS sent to {normalized_destination}: {response.status}")
            return 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"SMS failed to {normalized_destination}: HTTP {exc.code} {body}")
    except urllib.error.URLError as exc:
        print(f"SMS failed to {normalized_destination}: {exc}")

    return False


def _normalize_us_phone(phone: str | None) -> str | None:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return None


def send_customer_notification(destination: str, message: str) -> None:
    """Record customer notification intent until customer SMS workflow is enabled intentionally."""
    print(f"CUSTOMER NOTIFICATION intent to {destination}: {message}")


def send_customer_quote_received_notification(*, phone: str, quote_id: int, service_type: str) -> bool:
    message = (
        f"Hanks Paints: We received your estimate request #{quote_id} for {service_type}. "
        "The shop will notify you when it is under review. Check status here: "
        "https://hanks-paints.com/status Reply STOP to opt out."
    )
    return _send_sms(phone, message)


def send_shop_new_quote_notification(*, quote_id: int, customer_name: str, service_type: str) -> bool:
    message = (
        f"Hanks Paints: New estimate request #{quote_id} from {customer_name} "
        f"for {service_type}. Open the admin dashboard to review: https://hanks-paints.com/admin"
    )
    return _send_sms(settings.shop_notification_phone, message)
