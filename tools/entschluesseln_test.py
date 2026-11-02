#!/usr/bin/env python3
"""
Entschlüsselt einen Datensatz der Check-in-App: Beweis und Vorlage für die spätere API.

    pip install cryptography
    python tools/entschluesseln_test.py privat.pem < umschlag.json

umschlag.json enthält die Felder einer Zeile aus "checkins":
version, schluesselId, verschluesselterSchluessel, iv, daten.
Schlägt mit einer Ausnahme fehl, wenn Daten, Zusatzdaten oder Schlüssel nicht passen.
Die Ausgabe ist Klartext und nur zum Testen gedacht.
"""
import base64
import json
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def entschluesseln(umschlag: dict, privater_schluessel_pem: bytes) -> dict:
    if umschlag["version"] != 1:
        raise ValueError(f"Unbekannte Version: {umschlag['version']}")
    schluessel = serialization.load_pem_private_key(privater_schluessel_pem, password=None)
    aes_schluessel = schluessel.decrypt(
        base64.b64decode(umschlag["verschluesselterSchluessel"]),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    zusatzdaten = f"checkin:v1:{umschlag['schluesselId']}".encode()
    klartext = AESGCM(aes_schluessel).decrypt(
        base64.b64decode(umschlag["iv"]),
        base64.b64decode(umschlag["daten"]),
        zusatzdaten,
    )
    return json.loads(klartext)


if __name__ == "__main__":
    with open(sys.argv[1], "rb") as datei:
        pem = datei.read()
    print(json.dumps(entschluesseln(json.load(sys.stdin), pem), ensure_ascii=False, indent=2))
