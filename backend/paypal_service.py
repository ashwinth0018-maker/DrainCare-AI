
import os
import requests

from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

# Load environment variables from the root .env file
load_dotenv()

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

PAYPAL_BASE_URL = os.getenv(
    "PAYPAL_BASE_URL",
    "https://api-m.sandbox.paypal.com"
)


def get_paypal_access_token():
    """Get an access token from PayPal Sandbox."""

    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise ValueError(
            "PayPal Sandbox credentials are missing. Check your .env file."
        )

    url = f"{PAYPAL_BASE_URL}/v1/oauth2/token"

    response = requests.post(
        url,
        auth=HTTPBasicAuth(
            PAYPAL_CLIENT_ID,
            PAYPAL_CLIENT_SECRET
        ),
        headers={
            "Accept": "application/json",
            "Accept-Language": "en_US"
        },
        data={
            "grant_type": "client_credentials"
        },
        timeout=30
    )

    response.raise_for_status()

    return response.json()["access_token"]


def create_paypal_order():
    """Create a PayPal Sandbox payment order."""

    access_token = get_paypal_access_token()

    url = f"{PAYPAL_BASE_URL}/v2/checkout/orders"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "description": "DrainCare AI Maintenance Service",
                "amount": {
                    "currency_code": "USD",
                    "value": "12.00"
                }
            }
        ],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "return_url": "http://127.0.0.1:8000/payment/success",
                    "cancel_url": "http://127.0.0.1:8000/payment/cancel"
}
            }
        }
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=30
    )

    response.raise_for_status()

    return response.json()

def capture_paypal_order(order_id: str):
    """Capture an approved PayPal Sandbox order."""

    access_token = get_paypal_access_token()

    url = f"{PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    response = requests.post(
        url,
        headers=headers,
        json={},
        timeout=30
    )

    response.raise_for_status()

    return response.json()

