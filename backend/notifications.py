import os
import logging
from datetime import datetime
import db

logger = logging.getLogger("notifications")

class NotificationProvider:
    def send_sms(self, phone: str, message: str) -> dict:
        raise NotImplementedError("send_sms must be implemented by subclasses")

class MockNotificationProvider(NotificationProvider):
    def send_sms(self, phone: str, message: str) -> dict:
        print(f"\n========================================\n"
              f"SMS MOCK PROVIDER DISPATCH\n"
              f"TO: {phone}\n"
              f"MESSAGE:\n{message}\n"
              f"========================================\n")
        logger.info(f"Mock SMS sent to {phone}: {message}")
        return {"status": "SENT", "provider": "MOCK"}

class MSG91NotificationProvider(NotificationProvider):
    def send_sms(self, phone: str, message: str) -> dict:
        import requests
        auth_key = os.getenv("MSG91_AUTH_KEY", "")
        sender_id = os.getenv("MSG91_SENDER_ID", "MLAPTL")
        route = os.getenv("MSG91_ROUTE", "4") # 4 for transactional
        
        if not auth_key:
            logger.warning("MSG91_AUTH_KEY not configured. Falling back to Mock print.")
            print(f"\n[WARNING: MSG91 Config Missing] SMS TO {phone}: {message}")
            return {"status": "FAILED", "provider": "MSG91 (Config Missing)"}

        # MSG91 flow API call structure
        payload = {
            "template_id": os.getenv("MSG91_TEMPLATE_ID", ""),
            "sender": sender_id,
            "short_url": "1",
            "recipients": [
                {
                    "mobiles": phone,
                    "message": message
                }
            ]
        }
        headers = {
            "authkey": auth_key,
            "Content-Type": "application/json"
        }
        try:
            url = "https://api.msg91.com/api/v5/flow/"
            res = requests.post(url, json=payload, headers=headers, timeout=5)
            if res.status_code == 200:
                return {"status": "SENT", "provider": "MSG91"}
            else:
                logger.error(f"MSG91 API error: {res.text}")
                return {"status": "FAILED", "provider": f"MSG91 Error: {res.status_code}"}
        except Exception as e:
            logger.error(f"Failed to connect to MSG91: {e}")
            return {"status": "FAILED", "provider": "MSG91 Exception"}

def get_notification_provider() -> NotificationProvider:
    provider_type = os.getenv("SMS_PROVIDER", "mock").lower()
    if provider_type == "msg91":
        return MSG91NotificationProvider()
    return MockNotificationProvider()

def log_notification(phone: str, message: str, status: str, provider: str):
    """Inserts a notification record into the notification_logs table."""
    try:
        with db.get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO notification_logs (phone, message, status, provider, sent_at)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (phone, message, status, provider, datetime.utcnow() if status == "SENT" else None)
            )
    except Exception as e:
        logger.error(f"Failed to log notification in DB: {e}")

# Template functions

def send_appointment_confirmation(phone: str, token_number: str, appointment_date: str, appointment_time: str):
    message = (
        f"MLA Office Ambattur: Your appointment is booked successfully!\n"
        f"Token: {token_number}\n"
        f"Date: {appointment_date}\n"
        f"Time: {appointment_time}\n"
        f"Please report 10 minutes prior."
    )
    provider = get_notification_provider()
    result = provider.send_sms(phone, message)
    log_notification(phone, message, result["status"], result["provider"])

def send_grievance_confirmation(phone: str, grievance_id: str):
    message = (
        f"MLA Office Ambattur: Your grievance has been submitted successfully.\n"
        f"Grievance ID: {grievance_id}\n"
        f"Track your grievance status on our citizen portal."
    )
    provider = get_notification_provider()
    result = provider.send_sms(phone, message)
    log_notification(phone, message, result["status"], result["provider"])

def send_appointment_cancelled(phone: str, token_number: str):
    message = (
        f"MLA Office Ambattur: Your appointment with Token {token_number} has been cancelled."
    )
    provider = get_notification_provider()
    result = provider.send_sms(phone, message)
    log_notification(phone, message, result["status"], result["provider"])

def send_grievance_status_update(phone: str, grievance_id: str, status: str):
    message = (
        f"MLA Office Ambattur: The status of your grievance {grievance_id} has been updated to {status}."
    )
    provider = get_notification_provider()
    result = provider.send_sms(phone, message)
    log_notification(phone, message, result["status"], result["provider"])

def send_appointment_rescheduled(phone: str, token_number: str, new_date: str, new_time: str):
    message = (
        f"MLA Office Ambattur: Your appointment with Token {token_number} has been rescheduled.\n"
        f"New Date: {new_date}\n"
        f"New Time: {new_time}"
    )
    provider = get_notification_provider()
    result = provider.send_sms(phone, message)
    log_notification(phone, message, result["status"], result["provider"])
