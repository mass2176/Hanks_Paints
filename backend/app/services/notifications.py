def send_customer_notification(destination: str, message: str) -> None:
    """Record outbound notification intent for the current manual-test deployment."""
    print(f"NOTIFICATION to {destination}: {message}")
