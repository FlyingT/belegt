import os
import json
import logging
import re
import secrets
import threading
from datetime import datetime
from functools import wraps

# N3: Structured logging instead of print()
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dateutil import parser
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from sqlalchemy import text
from cryptography.fernet import Fernet, InvalidToken

app = Flask(__name__)

# H1 Fix: Restrict CORS to configured origins (default: same-origin only)
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '').strip()
if allowed_origins:
    CORS(app, supports_credentials=True, origins=allowed_origins.split(','))
else:
    CORS(app, supports_credentials=True, origins=[])

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

# Ensure instance directory exists
try:
    os.makedirs(instance_path)
except OSError:
    pass

# --- Key Management ---

def _load_or_create_key(filepath):
    """Load a key from file, or generate and persist a new one."""
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            return f.read().strip()
    key = secrets.token_hex(32) if 'secret' in filepath else Fernet.generate_key().decode()
    with open(filepath, 'w') as f:
        f.write(key)
    return key

# Flask Session Secret Key
secret_key_from_env = os.environ.get('SECRET_KEY')
if secret_key_from_env:
    app.config['SECRET_KEY'] = secret_key_from_env
else:
    app.config['SECRET_KEY'] = _load_or_create_key(os.path.join(instance_path, 'secret.key'))

# Fernet Encryption Key for SMTP password
_encryption_key = _load_or_create_key(os.path.join(instance_path, 'encryption.key'))
_fernet = Fernet(_encryption_key if isinstance(_encryption_key, bytes) else _encryption_key.encode())

# Session cookie config
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Admin Credentials from environment
ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'belegt')

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Encryption Helpers ---

def encrypt_value(plaintext):
    """Encrypt a plaintext string with Fernet."""
    if not plaintext:
        return ''
    return _fernet.encrypt(plaintext.encode()).decode()

def decrypt_value(ciphertext):
    """Decrypt a Fernet-encrypted string. Returns empty string on failure."""
    if not ciphertext:
        return ''
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except (InvalidToken, Exception):
        # Might be a legacy plaintext value — return as-is for migration
        return ciphertext

# --- Auth Decorator ---

def admin_required(f):
    """Decorator that protects admin-only endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            return jsonify({'error': 'Authentifizierung erforderlich.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Input Validation Helpers (H4) ---

_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

def validate_required(data, fields):
    """Check that all required fields are present and non-empty strings."""
    missing = [f for f in fields if not data.get(f) or not str(data[f]).strip()]
    if missing:
        return f"Pflichtfelder fehlen: {', '.join(missing)}"
    return None

def validate_email(value):
    """Validate email format. Returns error string or None."""
    if not value or not isinstance(value, str):
        return 'E-Mail-Adresse fehlt.'
    if len(value) > 254:
        return 'E-Mail-Adresse ist zu lang.'
    if not _EMAIL_RE.match(value):
        return 'Ungültiges E-Mail-Format.'
    if '\n' in value or '\r' in value:
        return 'Ungültiges E-Mail-Format.'
    return None

def validate_string_length(value, max_len, field_name):
    """Validate string does not exceed max length."""
    if value and isinstance(value, str) and len(value) > max_len:
        return f"{field_name} darf maximal {max_len} Zeichen lang sein."
    return None

def validate_color(value):
    """Validate hex color format."""
    if value and not re.match(r'^#[0-9a-fA-F]{3,8}$', str(value)):
        return 'Ungültiges Farbformat.'
    return None

# H2: Thread lock for atomic booking creation (1 gunicorn worker + SQLite)
_booking_lock = threading.Lock()

# --- Models ---

class Asset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    color = db.Column(db.String(20), default='#3b82f6')
    is_maintenance = db.Column(db.Boolean, default=False)
    icon = db.Column(db.String(50), nullable=True)
    sort_order = db.Column(db.Integer, default=0)
    show_kiosk = db.Column(db.Boolean, default=True)
    has_catering = db.Column(db.Boolean, default=False)
    cost_center_required = db.Column(db.Boolean, default=False)
    catering_options_json = db.Column(db.String(1000), default='[]')
    door_extension_offered = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'color': self.color,
            'is_maintenance': self.is_maintenance,
            'icon': self.icon,
            'sortOrder': self.sort_order,
            'showKiosk': self.show_kiosk,
            'hasCatering': self.has_catering,
            'costCenterRequired': self.cost_center_required,
            'cateringOptions': json.loads(self.catering_options_json) if self.catering_options_json else [],
            'doorExtensionOffered': self.door_extension_offered
        }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False, default="Buchung")
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False, default="")
    cost_center = db.Column(db.String(100), default='')
    catering_json = db.Column(db.String(500), default='{}')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'assetId': str(self.asset_id),
            'title': self.title,
            'startTime': self.start_time.isoformat(),
            'endTime': self.end_time.isoformat(),
            'userName': self.user_name,
            'userEmail': self.user_email,
            'department': self.department,
            'costCenter': self.cost_center,
            'catering': json.loads(self.catering_json) if self.catering_json else {},
            'createdAt': self.created_at.isoformat()
        }


class AppConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    header_text = db.Column(db.String(100), default='Buchungssystem')
    site_title = db.Column(db.String(100), default='Belegt')
    accent_color = db.Column(db.String(20), default='#3b82f6')
    category_icons_json = db.Column(db.String(500), default='{}')
    placeholder_title = db.Column(db.String(100), default='z.B. Team Meeting, Kundenbesuch')
    placeholder_name = db.Column(db.String(100), default='')
    placeholder_email = db.Column(db.String(100), default='')
    placeholder_department = db.Column(db.String(100), default='')
    mail_enabled = db.Column(db.Boolean, default=False)
    mail_host = db.Column(db.String(100), default='')
    mail_port = db.Column(db.Integer, default=587)
    mail_user = db.Column(db.String(100), default='')
    mail_pass = db.Column(db.String(500), default='')
    mail_from = db.Column(db.String(100), default='')
    mail_secure = db.Column(db.Boolean, default=True)
    door_extension_enabled = db.Column(db.Boolean, default=False)
    door_extension_mail = db.Column(db.String(100), default='')

    def to_dict(self):
        """Public config representation — SMTP password is always masked."""
        return {
            'headerText': self.header_text,
            'siteTitle': self.site_title,
            'accentColor': self.accent_color,
            'categoryIcons': json.loads(self.category_icons_json) if self.category_icons_json else {},
            'placeholderTitle': self.placeholder_title,
            'placeholderName': self.placeholder_name,
            'placeholderEmail': self.placeholder_email,
            'placeholderDepartment': self.placeholder_department,
            'mailEnabled': self.mail_enabled,
            'mailHost': self.mail_host,
            'mailPort': self.mail_port,
            'mailUser': self.mail_user,
            'mailPass': '********' if self.mail_pass else '',
            'mailFrom': self.mail_from,
            'mailSecure': self.mail_secure,
            'doorExtensionEnabled': self.door_extension_enabled,
            'doorExtensionMail': self.door_extension_mail
        }

    def get_decrypted_password(self):
        """Return the actual SMTP password (decrypted)."""
        return decrypt_value(self.mail_pass)

# --- Email Helper ---

def _sanitize_email_header(value):
    """M1: Strip newlines from email fields to prevent header injection."""
    if not value or not isinstance(value, str):
        return ''
    return value.replace('\n', '').replace('\r', '').strip()

def send_email(config, recipient, subject, body):
    if not config or not config.mail_enabled:
        return False
    
    # M1: Sanitize all header-relevant fields
    safe_from = _sanitize_email_header(config.mail_from)
    safe_to = _sanitize_email_header(recipient)
    safe_subject = subject.replace('\n', ' ').replace('\r', ' ') if subject else ''
    
    if not safe_from or not safe_to:
        logger.warning('send_email aborted: missing from/to address')
        return False
    
    try:
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = Header(safe_subject, 'utf-8')
        msg['From'] = safe_from
        msg['To'] = safe_to

        if config.mail_secure:
            server = smtplib.SMTP_SSL(config.mail_host, config.mail_port)
        else:
            server = smtplib.SMTP(config.mail_host, config.mail_port)
            server.starttls()
        
        actual_password = config.get_decrypted_password()
        if config.mail_user and actual_password:
            server.login(config.mail_user, actual_password)
        
        server.sendmail(safe_from, [safe_to], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.error('Failed to send email: %s', e)
        return False

# --- Helper ---
def init_db():
    with app.app_context():
        db.create_all()
        
        # Migrations for SQLite (since we don't have Alembic set up)
        with db.engine.connect() as conn:
            # Check for title in booking
            try:
                conn.execute(text("SELECT title FROM booking LIMIT 1"))
            except Exception:
                print("Migrating: Adding title to booking")
                conn.execute(text("ALTER TABLE booking ADD COLUMN title VARCHAR(100) DEFAULT 'Buchung' NOT NULL"))
                conn.commit()

            # Check for icon in asset
            try:
                conn.execute(text("SELECT icon FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding icon to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN icon VARCHAR(50)"))
                conn.commit()
            
            # Check for sort_order in asset
            try:
                conn.execute(text("SELECT sort_order FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding sort_order to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN sort_order INTEGER DEFAULT 0"))
                conn.commit()

            # Check for category_icons_json in app_config
            try:
                conn.execute(text("SELECT category_icons_json FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding category_icons_json to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN category_icons_json VARCHAR(500) DEFAULT '{}'"))
                conn.commit()

            # Check for placeholder fields in app_config
            try:
                conn.execute(text("SELECT placeholder_title FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding placeholder fields to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN placeholder_title VARCHAR(100) DEFAULT 'z.B. Team Meeting, Kundenbesuch'"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN placeholder_name VARCHAR(100) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN placeholder_email VARCHAR(100) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN placeholder_department VARCHAR(100) DEFAULT ''"))
                conn.commit()
                
            # Check for site_title in app_config
            try:
                conn.execute(text("SELECT site_title FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding site_title to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN site_title VARCHAR(100) DEFAULT 'Belegt'"))
                conn.commit()

            # Check for accent_color in app_config
            try:
                conn.execute(text("SELECT accent_color FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding accent_color to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN accent_color VARCHAR(20) DEFAULT '#3b82f6'"))
                conn.commit()

            # Check for show_kiosk in asset
            try:
                conn.execute(text("SELECT show_kiosk FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding show_kiosk to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN show_kiosk BOOLEAN DEFAULT 1"))
                conn.commit()

            # Check for department in booking
            try:
                conn.execute(text("SELECT department FROM booking LIMIT 1"))
            except Exception:
                print("Migrating: Adding department to booking")
                conn.execute(text("ALTER TABLE booking ADD COLUMN department VARCHAR(100) DEFAULT ''"))
                conn.commit()

            # Check for catering in asset
            try:
                conn.execute(text("SELECT has_catering FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding catering fields to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN has_catering BOOLEAN DEFAULT 0"))
                conn.execute(text("ALTER TABLE asset ADD COLUMN catering_options_json VARCHAR(1000) DEFAULT '[]'"))
                conn.commit()

            # Check for catering in booking
            try:
                conn.execute(text("SELECT catering_json FROM booking LIMIT 1"))
            except Exception:
                print("Migrating: Adding catering_json to booking")
                conn.execute(text("ALTER TABLE booking ADD COLUMN catering_json VARCHAR(500) DEFAULT '{}'"))
                conn.commit()

            # Check for mail fields in app_config
            try:
                conn.execute(text("SELECT mail_enabled FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding mail fields to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_enabled BOOLEAN DEFAULT 0"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_host VARCHAR(100) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_port INTEGER DEFAULT 587"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_user VARCHAR(100) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_pass VARCHAR(500) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_from VARCHAR(100) DEFAULT ''"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN mail_secure BOOLEAN DEFAULT 1"))
                conn.commit()

        # Migrations for Cost Center
        with db.engine.connect() as conn:
            # Check for cost_center in booking
            try:
                conn.execute(text("SELECT cost_center FROM booking LIMIT 1"))
            except Exception:
                print("Migrating: Adding cost_center to booking")
                conn.execute(text("ALTER TABLE booking ADD COLUMN cost_center VARCHAR(100) DEFAULT ''"))
                conn.commit()

            # Check for cost_center_required in asset
            try:
                conn.execute(text("SELECT cost_center_required FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding cost_center_required to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN cost_center_required BOOLEAN DEFAULT 0"))
                conn.commit()

        # Migrations for Door Extension
        with db.engine.connect() as conn:
            # Check for door_extension_enabled in app_config
            try:
                conn.execute(text("SELECT door_extension_enabled FROM app_config LIMIT 1"))
            except Exception:
                print("Migrating: Adding door extension fields to app_config")
                conn.execute(text("ALTER TABLE app_config ADD COLUMN door_extension_enabled BOOLEAN DEFAULT 0"))
                conn.execute(text("ALTER TABLE app_config ADD COLUMN door_extension_mail VARCHAR(100) DEFAULT ''"))
                conn.commit()

            # Check for door_extension_offered in asset
            try:
                conn.execute(text("SELECT door_extension_offered FROM asset LIMIT 1"))
            except Exception:
                print("Migrating: Adding door_extension_offered to asset")
                conn.execute(text("ALTER TABLE asset ADD COLUMN door_extension_offered BOOLEAN DEFAULT 0"))
                conn.commit()

        # Create default config if not exists
        if not AppConfig.query.first():
            default_cats = {
                'Room': 'Users',
                'Vehicle': 'Car',
                'Equipment': 'Box',
                'Other': 'Wrench'
            }
            db.session.add(AppConfig(
                header_text='Buchungssystem', 
                site_title='Belegt',
                accent_color='#3b82f6',
                category_icons_json=json.dumps(default_cats),
                placeholder_title='z.B. Team Meeting, Kundenbesuch'
            ))
            db.session.commit()
        
        # Create default assets if empty
        if not Asset.query.first():
            defaults = [
                Asset(name='Konferenzraum A (Galaxy)', type='Room', description='Großer Meetingraum, 12 Plätze.', color='#3b82f6', icon='Users', sort_order=0),
                Asset(name='Konferenzraum B (Nebula)', type='Room', description='Kleiner Raum, 4 Plätze.', color='#8b5cf6', icon='Coffee', sort_order=1),
                Asset(name='Firmenwagen', type='Vehicle', description='Tesla Model 3', color='#ef4444', is_maintenance=True, icon='Car', sort_order=2),
            ]
            db.session.add_all(defaults)
            db.session.commit()

        # Migrate: Encrypt any existing plaintext SMTP passwords
        config = AppConfig.query.first()
        if config and config.mail_pass:
            try:
                # Try to decrypt — if it works, it's already encrypted
                _fernet.decrypt(config.mail_pass.encode())
            except Exception:
                # It's plaintext — encrypt it now
                logger.info('Migrating: Encrypting existing SMTP password')
                config.mail_pass = encrypt_value(config.mail_pass)
                db.session.commit()

# Initialize DB
init_db()

# --- Auth Routes ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')

    if username == ADMIN_USER and password == ADMIN_PASSWORD:
        session['is_admin'] = True
        return jsonify({'message': 'Anmeldung erfolgreich.'}), 200
    
    return jsonify({'error': 'Falsche Zugangsdaten.'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Abmeldung erfolgreich.'}), 200

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if session.get('is_admin'):
        return jsonify({'authenticated': True}), 200
    return jsonify({'authenticated': False}), 200

# --- Routes ---

@app.route('/api/assets', methods=['GET'])
def get_assets():
    # Sort by sort_order ascending
    assets = Asset.query.order_by(Asset.sort_order.asc()).all()
    return jsonify([a.to_dict() for a in assets])

@app.route('/api/assets', methods=['POST'])
@admin_required
def create_asset():
    data = request.json
    if data is None:
        return jsonify({'error': 'Keine Daten empfangen.'}), 400
    
    # H4: Input validation
    err = validate_required(data, ['name', 'type'])
    if err:
        return jsonify({'error': err}), 400
    err = validate_string_length(data.get('name'), 100, 'Name')
    if err:
        return jsonify({'error': err}), 400
    err = validate_string_length(data.get('type'), 50, 'Typ')
    if err:
        return jsonify({'error': err}), 400
    err = validate_string_length(data.get('description'), 255, 'Beschreibung')
    if err:
        return jsonify({'error': err}), 400
    err = validate_color(data.get('color'))
    if err:
        return jsonify({'error': err}), 400

    # Assign new asset to the end of the list
    max_order = db.session.query(db.func.max(Asset.sort_order)).scalar() or 0
    
    new_asset = Asset(
        name=data.get('name')[:100],
        type=data.get('type')[:50],
        description=(data.get('description') or '')[:255],
        color=data.get('color', '#3b82f6'),
        is_maintenance=bool(data.get('is_maintenance', False)),
        icon=(data.get('icon') or '')[:50],
        sort_order=max_order + 1,
        show_kiosk=bool(data.get('showKiosk', True)),
        has_catering=bool(data.get('hasCatering', False)),
        cost_center_required=bool(data.get('costCenterRequired', False)),
        catering_options_json=json.dumps(data.get('cateringOptions', []))[:1000],
        door_extension_offered=bool(data.get('doorExtensionOffered', False))
    )
    db.session.add(new_asset)
    db.session.commit()
    return jsonify(new_asset.to_dict()), 201

@app.route('/api/assets/reorder', methods=['POST'])
@admin_required
def reorder_assets():
    # Expects list of objects: [{id: 1, sortOrder: 0}, {id: 2, sortOrder: 1}]
    data = request.json
    for item in data:
        asset_id = item.get('id')
        sort_order = item.get('sortOrder')
        if asset_id is not None and sort_order is not None:
             asset = Asset.query.get(asset_id)
             if asset:
                 asset.sort_order = sort_order
    db.session.commit()
    return '', 204

@app.route('/api/assets/<int:id>', methods=['PUT'])
@admin_required
def update_asset(id):
    asset = Asset.query.get_or_404(id)
    data = request.json
    asset.name = data.get('name', asset.name)
    asset.type = data.get('type', asset.type)
    asset.description = data.get('description', asset.description)
    asset.color = data.get('color', asset.color)
    asset.icon = data.get('icon', asset.icon)
    if 'is_maintenance' in data:
        asset.is_maintenance = data['is_maintenance']
    if 'showKiosk' in data:
        asset.show_kiosk = data['showKiosk']
    if 'hasCatering' in data:
        asset.has_catering = data['hasCatering']
    if 'costCenterRequired' in data:
        asset.cost_center_required = data['costCenterRequired']
    if 'cateringOptions' in data:
        asset.catering_options_json = json.dumps(data['cateringOptions'])
    if 'doorExtensionOffered' in data:
        asset.door_extension_offered = data['doorExtensionOffered']
    
    db.session.commit()
    return jsonify(asset.to_dict())

@app.route('/api/assets/<int:id>', methods=['DELETE'])
@admin_required
def delete_asset(id):
    asset = Asset.query.get_or_404(id)
    db.session.delete(asset)
    db.session.commit()
    return '', 204

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    bookings = Booking.query.order_by(Booking.start_time.asc()).all()
    return jsonify([b.to_dict() for b in bookings])

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.json
    if data is None:
        return jsonify({'error': 'Keine Daten empfangen.'}), 400

    # H4: Input validation
    err = validate_required(data, ['assetId', 'startTime', 'endTime', 'userName', 'userEmail'])
    if err:
        return jsonify({'error': err}), 400

    err = validate_email(data.get('userEmail'))
    if err:
        return jsonify({'error': err}), 400

    err = validate_string_length(data.get('userName'), 100, 'Name')
    if err:
        return jsonify({'error': err}), 400
    err = validate_string_length(data.get('title'), 100, 'Titel')
    if err:
        return jsonify({'error': err}), 400
    err = validate_string_length(data.get('department'), 100, 'Abteilung')
    if err:
        return jsonify({'error': err}), 400

    try:
        asset_id = int(data.get('assetId'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Ungültige Asset-ID.'}), 400

    try:
        start_time = parser.parse(data.get('startTime'))
        end_time = parser.parse(data.get('endTime'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Ungültiges Datumsformat.'}), 400

    if end_time <= start_time:
        return jsonify({'error': 'Endzeit muss nach Startzeit liegen.'}), 400

    # H2 Fix: Thread lock ensures atomic overlap-check + insert
    with _booking_lock:
        # Overlap Check
        overlapping = Booking.query.filter(
            Booking.asset_id == asset_id,
            Booking.start_time < end_time,
            Booking.end_time > start_time
        ).first()

        if overlapping:
            return jsonify({'error': 'Dieser Zeitraum ist bereits belegt.'}), 409

        catering_data = data.get('catering', {})
        cost_center = (data.get('costCenter') or '')[:100]

        asset = Asset.query.get(asset_id)
        if asset and asset.cost_center_required:
            has_catering = any(qty > 0 for qty in catering_data.values()) if isinstance(catering_data, dict) else False
            if has_catering and not cost_center.strip():
                return jsonify({'error': 'Bitte geben Sie eine Kostenstelle an.'}), 400

        new_booking = Booking(
            asset_id=asset_id,
            title=(data.get('title') or 'Buchung')[:100],
            start_time=start_time,
            end_time=end_time,
            user_name=data.get('userName', '')[:100],
            user_email=data.get('userEmail', '')[:100],
            department=(data.get('department') or '')[:100],
            cost_center=cost_center,
            catering_json=json.dumps(catering_data)[:500]
        )
        db.session.add(new_booking)
        db.session.commit()
    
    # Send Confirmation Email if enabled
    config = AppConfig.query.first()
    if config and config.mail_enabled and new_booking.user_email:
        asset = Asset.query.get(asset_id)
        asset_name = asset.name if asset else "Ressource"
        
        date_str = new_booking.start_time.strftime('%d.%m.%Y')
        time_range = f"{new_booking.start_time.strftime('%H:%M')} - {new_booking.end_time.strftime('%H:%M')}"
        
        subject = f"Buchungsbestätigung: {new_booking.title}, {asset_name}, {date_str} {time_range}"
        body = f"Hallo {new_booking.user_name},\n"
        body += f"Ihre nachfolgende Buchung war erfolgreich:\n\n"
        body += f"Ressource: {asset_name}\n"
        body += f"Titel: {new_booking.title}\n"
        body += f"Datum: {date_str}\n"
        body += f"Zeit: {time_range} Uhr\n"
        
        if new_booking.department:
            body += f"Abteilung: {new_booking.department}\n"
        
        if new_booking.cost_center:
            body += f"Kostenstelle: {new_booking.cost_center}\n"
            
        catering = json.loads(new_booking.catering_json)
        if catering:
            has_catering = any(qty > 0 for qty in catering.values())
            if has_catering:
                body += "\nZugebuchtes Catering / Arbeitsmittel:\n"
                for item, qty in catering.items():
                    if qty > 0:
                        body += f"- {item}: {qty}\n"
        
        send_email(config, new_booking.user_email, subject, body)
    
    # Door Opening Notification Email
    if config and config.door_extension_enabled and data.get('doorOpening'):
         asset = Asset.query.get(asset_id)
         if asset and asset.door_extension_offered and config.door_extension_mail:
             asset_name = asset.name if asset else "Ressource"
             date_str = new_booking.start_time.strftime('%d.%m.%Y')
             time_range = f"{new_booking.start_time.strftime('%H:%M')} - {new_booking.end_time.strftime('%H:%M')}"
             
             subject = f"Türöffnungs-Anfrage: {new_booking.title}, {asset_name}, {date_str} {time_range}"
             
             # Modify body for door opening request
             door_body = f"Für diesen Termin wurde eine erweiterte Türöffnung angefragt:\n\n"
             door_body += f"Ressource: {asset_name}\n"
             door_body += f"Titel: {new_booking.title}\n"
             door_body += f"Datum: {date_str}\n"
             door_body += f"Zeit: {time_range} Uhr\n"
             
             if new_booking.department:
                 door_body += f"Abteilung: {new_booking.department}\n"
             
             if new_booking.cost_center:
                 door_body += f"Kostenstelle: {new_booking.cost_center}\n"
             
             door_body += f"Nutzer: {new_booking.user_name} ({new_booking.user_email})\n"
             
             catering = json.loads(new_booking.catering_json)
             if catering:
                 has_catering = any(qty > 0 for qty in catering.values())
                 if has_catering:
                     door_body += "\nZugebuchtes Catering / Arbeitsmittel:\n"
                     for item, qty in catering.items():
                         if qty > 0:
                             door_body += f"- {item}: {qty}\n"

             send_email(config, config.door_extension_mail, subject, door_body)

    return jsonify(new_booking.to_dict()), 201

@app.route('/api/bookings/<int:id>', methods=['DELETE'])
@admin_required
def delete_booking(id):
    booking = Booking.query.get_or_404(id)
    db.session.delete(booking)
    db.session.commit()
    return '', 204

@app.route('/api/config', methods=['GET'])
def get_config():
    config = AppConfig.query.first()
    return jsonify(config.to_dict() if config else {'headerText': 'Buchungssystem', 'siteTitle': 'Belegt', 'accentColor': '#3b82f6', 'categoryIcons': {}})

@app.route('/api/config', methods=['POST'])
@admin_required
def update_config():
    data = request.json
    if data is None:
        return jsonify({'error': 'Keine Daten empfangen.'}), 400

    config = AppConfig.query.first()
    if not config:
        config = AppConfig()
        db.session.add(config)
    
    # H4: Validate string lengths
    for field, key, max_len in [
        ('headerText', 'header_text', 100), ('siteTitle', 'site_title', 100),
        ('placeholderTitle', 'placeholder_title', 100), ('placeholderName', 'placeholder_name', 100),
        ('placeholderEmail', 'placeholder_email', 100), ('placeholderDepartment', 'placeholder_department', 100),
    ]:
        if field in data:
            err = validate_string_length(data[field], max_len, field)
            if err:
                return jsonify({'error': err}), 400
    
    # H4: Validate color
    if 'accentColor' in data:
        err = validate_color(data['accentColor'])
        if err:
            return jsonify({'error': err}), 400
    
    # M1: Validate email fields (no newlines)
    for email_field in ['mailFrom', 'mailUser', 'doorExtensionMail']:
        if email_field in data and data[email_field]:
            val = data[email_field]
            if '\n' in str(val) or '\r' in str(val):
                return jsonify({'error': f'Ungültige Zeichen in {email_field}.'}), 400

    config.header_text = data.get('headerText', config.header_text)[:100]
    config.site_title = data.get('siteTitle', config.site_title)[:100]
    config.accent_color = data.get('accentColor', config.accent_color)
    
    if 'categoryIcons' in data:
        config.category_icons_json = json.dumps(data['categoryIcons'])[:500]

    if 'placeholderTitle' in data:
        config.placeholder_title = data['placeholderTitle'][:100]
    if 'placeholderName' in data:
        config.placeholder_name = data['placeholderName'][:100]
    if 'placeholderEmail' in data:
        config.placeholder_email = data['placeholderEmail'][:100]
    if 'placeholderDepartment' in data:
        config.placeholder_department = data['placeholderDepartment'][:100]
    
    if 'mailEnabled' in data:
        config.mail_enabled = bool(data['mailEnabled'])
    if 'mailHost' in data:
        config.mail_host = _sanitize_email_header(data['mailHost'])[:100]
    if 'mailPort' in data:
        try:
            config.mail_port = int(data['mailPort'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Ungültiger Mail-Port.'}), 400
    if 'mailUser' in data:
        config.mail_user = _sanitize_email_header(data['mailUser'])[:100]
    if 'mailPass' in data:
        new_pass = data['mailPass']
        # Only update if the user actually changed the password (not the masked placeholder)
        if new_pass and new_pass != '********':
            config.mail_pass = encrypt_value(new_pass)
    if 'mailFrom' in data:
        config.mail_from = _sanitize_email_header(data['mailFrom'])[:100]
    if 'mailSecure' in data:
        config.mail_secure = bool(data['mailSecure'])
    if 'doorExtensionEnabled' in data:
        config.door_extension_enabled = bool(data['doorExtensionEnabled'])
    if 'doorExtensionMail' in data:
        config.door_extension_mail = _sanitize_email_header(data['doorExtensionMail'])[:100]
        
    db.session.commit()
    return jsonify(config.to_dict())

@app.route('/api/config/test-mail', methods=['POST'])
@admin_required
def test_mail():
    data = request.json
    
    # For test-mail: if password is masked, use the stored one
    test_password = data.get('mailPass', '')
    if test_password == '********':
        stored_config = AppConfig.query.first()
        if stored_config:
            test_password = stored_config.get_decrypted_password()
    
    # Create a temporary config object from the provided data to test without saving
    temp_config = AppConfig(
        mail_enabled=True,
        mail_host=data.get('mailHost'),
        mail_port=data.get('mailPort'),
        mail_user=data.get('mailUser'),
        mail_pass=encrypt_value(test_password),
        mail_from=data.get('mailFrom'),
        mail_secure=data.get('mailSecure', True),
        site_title=data.get('siteTitle', 'Belegt Test')
    )
    
    recipient = data.get('testRecipient')
    if not recipient:
        return jsonify({'error': 'Empfänger-Email fehlt.'}), 400
        
    success = send_email(temp_config, recipient, "Test-Mail vom Buchungssystem", "Dies ist eine Test-Mail, um Ihre SMTP-Einstellungen zu verifizieren.")
    
    if success:
        return jsonify({'message': 'Test-Mail erfolgreich versendet.'})
    else:
        return jsonify({'error': 'Fehler beim Versenden der Test-Mail. Bitte prüfen Sie die SMTP-Einstellungen.'}), 500

if __name__ == '__main__':
    # H3: In production, use gunicorn (see Dockerfile CMD).
    # This block only runs during local development.
    app.run(host='0.0.0.0', port=5000)