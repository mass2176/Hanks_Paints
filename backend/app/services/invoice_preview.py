import os
import textwrap
import uuid

from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings


def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _money(value: float | int | None) -> str:
    return f"${float(value or 0):.2f}"


def _status(value: str | None) -> str:
    return (value or "draft").replace("_", " ").title()


def _phone(value: str | None) -> str:
    digits = "".join(character for character in (value or "") if character.isdigit())
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return value or ""


def _draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], font: ImageFont.ImageFont, fill: str, width: int, line_gap: int = 6) -> int:
    x, y = xy
    lines = []
    for paragraph in (text or "").splitlines() or [""]:
        lines.extend(textwrap.wrap(paragraph, width=width) or [""])

    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + line_gap if hasattr(font, "size") else 20
    return y


def _box_header(draw: ImageDraw.ImageDraw, xy: tuple[int, int], width: int, title: str, font: ImageFont.ImageFont) -> int:
    x, y = xy
    blue = "#344f87"
    draw.rectangle((x, y, x + width, y + 34), fill=blue)
    draw.text((x + 12, y + 7), title.upper(), font=font, fill="#ffffff")
    return y + 34


def render_invoice_preview(
    *,
    invoice,
    quote,
    customer,
    vehicle,
    payments,
) -> str:
    token = uuid.uuid4().hex
    preview_dir = os.path.join(settings.media_root, "invoices", token)
    os.makedirs(preview_dir, exist_ok=True)

    width = 1200
    height = 1650
    margin = 80
    image = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(image)

    font_small = _font(24)
    font_body = _font(30)
    font_bold = _font(30, bold=True)
    font_header = _font(42, bold=True)
    font_title = _font(62, bold=True)

    blue = "#344f87"
    light_blue = "#dbe4f6"
    black = "#111111"
    gray = "#555555"
    line = "#8c8c8c"

    y = margin
    draw.text((margin, y), "Hanks Paints", font=font_header, fill=black)
    y += 54
    for business_line in [
        "Auto Body, Paint, Rust Repair, Coatings, Spray PPF",
        "Phone: (765) 252-7998",
        "Website: hanks-paints.com",
    ]:
        draw.text((margin, y), business_line, font=font_small, fill=gray)
        y += 32

    draw.text((width - margin - 260, margin), "INVOICE", font=font_title, fill="#6e8bbd")
    info_x = width - margin - 340
    info_y = margin + 80
    for label, value in [("Invoice #", str(invoice.id)), ("Quote #", str(quote.id)), ("Status", _status(invoice.status))]:
        draw.rectangle((info_x, info_y, info_x + 150, info_y + 38), fill=blue)
        draw.rectangle((info_x + 150, info_y, info_x + 340, info_y + 38), outline=line)
        draw.text((info_x + 10, info_y + 7), label, font=font_small, fill="#ffffff")
        draw.text((info_x + 164, info_y + 7), value, font=font_small, fill=black)
        info_y += 38

    y = 280
    column_width = 500
    left_x = margin
    right_x = margin + column_width + 40

    bill_y = _box_header(draw, (left_x, y), column_width, "Bill To", font_small)
    draw.rectangle((left_x, bill_y, left_x + column_width, bill_y + 180), outline=line)
    address = [customer.full_name, customer.street_address, ", ".join(part for part in [customer.city, customer.state, customer.zip_code] if part), _phone(customer.phone), customer.email]
    text_y = bill_y + 12
    for item in [part for part in address if part]:
        draw.text((left_x + 12, text_y), str(item), font=font_small, fill=black)
        text_y += 32

    vehicle_y = _box_header(draw, (right_x, y), column_width, "Vehicle / Request", font_small)
    draw.rectangle((right_x, vehicle_y, right_x + column_width, vehicle_y + 180), outline=line)
    vehicle_name = " ".join(str(part) for part in [vehicle.year, vehicle.make, vehicle.model, vehicle.trim] if part)
    vehicle_lines = [
        vehicle_name or "Vehicle details not provided",
        f"Service: {quote.service_type}",
        f"Payment: {quote.payment_type}",
        f"VIN: {vehicle.vin}" if vehicle.vin else "",
        f"Plate: {vehicle.plate}" if vehicle.plate else "",
    ]
    text_y = vehicle_y + 12
    for item in [part for part in vehicle_lines if part]:
        draw.text((right_x + 12, text_y), str(item), font=font_small, fill=black)
        text_y += 32

    y = 540
    table_x = margin
    table_width = width - (margin * 2)
    columns = [80, 570, 210, 180]
    headers = ["Item", "Description", "Method", "Total"]
    x = table_x
    for index, header in enumerate(headers):
        draw.rectangle((x, y, x + columns[index], y + 44), fill=blue)
        draw.text((x + 10, y + 10), header.upper(), font=font_small, fill="#ffffff")
        x += columns[index]

    y += 44
    rows = [("1", f"Repair invoice for Quote #{quote.id}", "-", _money(invoice.total_due))]
    for index, payment in enumerate(payments, start=2):
        rows.append((str(index), "Payment received", payment.method or "-", f"-{_money(payment.amount)}"))

    for row in rows[:12]:
        row_height = 54
        x = table_x
        for index, value in enumerate(row):
            draw.rectangle((x, y, x + columns[index], y + row_height), outline=line)
            draw.text((x + 10, y + 12), value, font=font_small, fill=black)
            x += columns[index]
        y += row_height

    y += 28
    total_x = width - margin - 430
    totals = [
        ("Total Due", _money(invoice.total_due), light_blue),
        ("Amount Paid", _money(invoice.amount_paid), light_blue),
        ("Balance Due", _money(max(invoice.total_due - invoice.amount_paid, 0)), blue),
    ]
    for label, value, fill in totals:
        draw.rectangle((total_x, y, total_x + 250, y + 46), outline=line)
        draw.rectangle((total_x + 250, y, total_x + 430, y + 46), fill=fill, outline=line)
        draw.text((total_x + 12, y + 10), label.upper(), font=font_bold, fill=black)
        draw.text((total_x + 270, y + 10), value, font=font_bold, fill="#ffffff" if fill == blue else black)
        y += 46

    y += 70
    notes_y = _box_header(draw, (margin, y), table_width, "Payment Notes", font_small)
    draw.rectangle((margin, notes_y, margin + table_width, notes_y + 160), outline=line)
    _draw_wrapped(
        draw,
        "Payments are manually tracked by Hanks Paints. Please contact the shop with questions about this invoice.",
        (margin + 12, notes_y + 16),
        font_body,
        black,
        74,
    )

    y = height - 160
    draw.line((margin, y, width - margin, y), fill=line, width=2)
    y += 24
    _draw_wrapped(
        draw,
        "This image is a customer convenience copy. Use the secure Hanks Paints portal for private job details, messages, approvals, and payment status.",
        (margin, y),
        font_small,
        gray,
        90,
    )

    output_path = os.path.join(preview_dir, "invoice.jpg")
    image.save(output_path, "JPEG", quality=88, optimize=True)
    return token


def render_estimate_preview(
    *,
    estimate,
    quote,
    customer,
    vehicle,
    line_items,
    total: float,
) -> str:
    token = uuid.uuid4().hex
    preview_dir = os.path.join(settings.media_root, "estimates", token)
    os.makedirs(preview_dir, exist_ok=True)

    width = 1200
    height = 1650
    margin = 80
    image = Image.new("RGB", (width, height), "#ffffff")
    draw = ImageDraw.Draw(image)

    font_small = _font(24)
    font_body = _font(30)
    font_bold = _font(30, bold=True)
    font_header = _font(42, bold=True)
    font_title = _font(52, bold=True)

    blue = "#344f87"
    light_blue = "#dbe4f6"
    black = "#111111"
    gray = "#555555"
    line = "#8c8c8c"

    estimate_label = "Final Estimate" if estimate.estimate_type == "final" else "Photo Estimate"

    y = margin
    draw.text((margin, y), "Hanks Paints", font=font_header, fill=black)
    y += 54
    for business_line in [
        "Auto Body, Paint, Rust Repair, Coatings, Spray PPF",
        "Phone: (765) 252-7998",
        "Website: hanks-paints.com",
    ]:
        draw.text((margin, y), business_line, font=font_small, fill=gray)
        y += 32

    draw.text((width - margin - 420, margin), estimate_label.upper(), font=font_title, fill="#6e8bbd")
    info_x = width - margin - 340
    info_y = margin + 80
    for label, value in [("Estimate #", str(estimate.id)), ("Quote #", str(quote.id)), ("Status", _status(estimate.status))]:
        draw.rectangle((info_x, info_y, info_x + 150, info_y + 38), fill=blue)
        draw.rectangle((info_x + 150, info_y, info_x + 340, info_y + 38), outline=line)
        draw.text((info_x + 10, info_y + 7), label, font=font_small, fill="#ffffff")
        draw.text((info_x + 164, info_y + 7), value, font=font_small, fill=black)
        info_y += 38

    y = 280
    column_width = 500
    left_x = margin
    right_x = margin + column_width + 40

    bill_y = _box_header(draw, (left_x, y), column_width, "Customer", font_small)
    draw.rectangle((left_x, bill_y, left_x + column_width, bill_y + 180), outline=line)
    address = [customer.full_name, customer.street_address, ", ".join(part for part in [customer.city, customer.state, customer.zip_code] if part), _phone(customer.phone), customer.email]
    text_y = bill_y + 12
    for item in [part for part in address if part]:
        draw.text((left_x + 12, text_y), str(item), font=font_small, fill=black)
        text_y += 32

    vehicle_y = _box_header(draw, (right_x, y), column_width, "Vehicle / Request", font_small)
    draw.rectangle((right_x, vehicle_y, right_x + column_width, vehicle_y + 180), outline=line)
    vehicle_name = " ".join(str(part) for part in [vehicle.year, vehicle.make, vehicle.model, vehicle.trim] if part)
    vehicle_lines = [
        vehicle_name or "Vehicle details not provided",
        f"Service: {quote.service_type}",
        f"Payment: {quote.payment_type}",
        f"VIN: {vehicle.vin}" if vehicle.vin else "",
        f"Plate: {vehicle.plate}" if vehicle.plate else "",
    ]
    text_y = vehicle_y + 12
    for item in [part for part in vehicle_lines if part]:
        draw.text((right_x + 12, text_y), str(item), font=font_small, fill=black)
        text_y += 32

    y = 540
    table_x = margin
    table_width = width - (margin * 2)
    columns = [80, 640, 220, 100]
    headers = ["Item", "Description", "Category", "Total"]
    x = table_x
    for index, header in enumerate(headers):
        draw.rectangle((x, y, x + columns[index], y + 44), fill=blue)
        draw.text((x + 10, y + 10), header.upper(), font=font_small, fill="#ffffff")
        x += columns[index]

    y += 44
    rows = [
        (str(index + 1), item.description or "-", item.category or "Labor/Repair", _money(item.amount))
        for index, item in enumerate(line_items[:12])
    ] or [("1", "No line items entered.", "-", _money(total))]

    for row in rows:
        row_height = 54
        x = table_x
        for index, value in enumerate(row):
            draw.rectangle((x, y, x + columns[index], y + row_height), outline=line)
            draw.text((x + 10, y + 12), value, font=font_small, fill=black)
            x += columns[index]
        y += row_height

    y += 28
    total_x = width - margin - 520
    draw.rectangle((total_x, y, total_x + 330, y + 46), outline=line)
    draw.rectangle((total_x + 330, y, total_x + 520, y + 46), fill=light_blue, outline=line)
    draw.text((total_x + 12, y + 10), "ESTIMATED TOTAL", font=font_bold, fill=black)
    draw.text((total_x + 350, y + 10), _money(total), font=font_bold, fill=black)

    y += 110
    notes_y = _box_header(draw, (margin, y), table_width, "Notes and Terms", font_small)
    draw.rectangle((margin, notes_y, margin + table_width, notes_y + 210), outline=line)
    notes = estimate.customer_notes or quote.damage_description or "No customer notes provided."
    next_y = _draw_wrapped(draw, notes, (margin + 12, notes_y + 16), font_body, black, 74)
    _draw_wrapped(
        draw,
        "Photo-based estimates are preliminary only. Final pricing requires an in-person inspection. Hidden damage may require a separate supplement or change order approval.",
        (margin + 12, next_y + 18),
        font_small,
        gray,
        95,
    )

    y = height - 160
    draw.line((margin, y, width - margin, y), fill=line, width=2)
    y += 24
    _draw_wrapped(
        draw,
        "This image is a customer convenience copy. Use the secure Hanks Paints portal for private estimate details, messages, approvals, and status updates.",
        (margin, y),
        font_small,
        gray,
        90,
    )

    output_path = os.path.join(preview_dir, "estimate.jpg")
    image.save(output_path, "JPEG", quality=88, optimize=True)
    return token
