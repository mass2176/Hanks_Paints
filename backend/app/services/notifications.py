import base64
import urllib.error
import urllib.parse
import urllib.request

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
    if not _twilio_ready():
        print(f"SMS skipped; Twilio is not fully configured. Intended SMS to {destination}: {message}")
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
    payload = {
        "To": destination,
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
            print(f"SMS sent to {destination}: {response.status}")
            return 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"SMS failed to {destination}: HTTP {exc.code} {body}")
    except urllib.error.URLError as exc:
        print(f"SMS failed to {destination}: {exc}")

    return False


def send_customer_notification(destination: str, message: str) -> None:
    """Record customer notification intent until customer SMS workflow is enabled intentionally."""
    print(f"CUSTOMER NOTIFICATION intent to {destination}: {message}")


def send_shop_new_quote_notification(*, quote_id: int, customer_name: str, service_type: str) -> bool:
    message = (
        f"Hanks Paints: New estimate request #{quote_id} from {customer_name} "
        f"for {service_type}. Open the admin dashboard to review: https://hanks-paints.com/admin"
    )
    return _send_sms(settings.shop_notification_phone, message)
