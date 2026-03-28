import os

import requests


WHATSAPP_API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v23.0")


def is_whatsapp_send_enabled():
    return bool(os.getenv("WHATSAPP_ACCESS_TOKEN") and os.getenv("WHATSAPP_PHONE_NUMBER_ID"))


def send_whatsapp_text(to_number, message_text):
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not access_token or not phone_number_id:
        raise ValueError(
            "Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID para enviar mensagens."
        )

    url = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text,
        },
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()


def _normalize_button_id(label, index):
    normalized = "".join(char.lower() if char.isalnum() else "_" for char in label)
    normalized = "_".join(part for part in normalized.split("_") if part)
    normalized = normalized[:20] or f"action_{index + 1}"
    return f"action_{index + 1}_{normalized}"[:256]


def send_whatsapp_buttons(to_number, message_text, actions):
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not access_token or not phone_number_id:
        raise ValueError(
            "Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID para enviar mensagens."
        )

    normalized_actions = [action.strip() for action in (actions or []) if action and action.strip()]
    normalized_actions = normalized_actions[:3]

    if not normalized_actions:
        return send_whatsapp_text(to_number, message_text)

    url = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": message_text[:1024],
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": _normalize_button_id(action, index),
                            "title": action[:20],
                        },
                    }
                    for index, action in enumerate(normalized_actions)
                ]
            },
        },
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()
