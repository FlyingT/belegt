import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dateutil import parser
from sqlalchemy import text

app = Flask(__name__)
CORS(app)

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')

# Ensure instance directory exists
try:
    os.makedirs(instance_path)
except OSError:
    pass

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

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

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'color': self.color,
            'is_maintenance': self.is_maintenance,
            'icon': self.icon,
            'sortOrder': self.sort_order
        }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False, default="Buchung")
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
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
            'createdAt': self.created_at.isoformat()
        }

class AppConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    header_text = db.Column(db.String(100), default='Buchungssystem')
    category_icons_json = db.Column(db.String(500), default='{}')
    placeholder_title = db.Column(db.String(100), default='z.B. Team Meeting, Kundenbesuch')
    placeholder_name = db.Column(db.String(100), default='')
    placeholder_email = db.Column(db.String(100), default='')

    def to_dict(self):
        return {
            'headerText': self.header_text,
            'categoryIcons': json.loads(self.category_icons_json) if self.category_icons_json else {},
            'placeholderTitle': self.placeholder_title,
            'placeholderName': self.placeholder_name,
            'placeholderEmail': self.placeholder_email
        }

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

# Initialize DB
init_db()

# --- Routes ---

@app.route('/api/assets', methods=['GET'])
def get_assets():
    # Sort by sort_order ascending
    assets = Asset.query.order_by(Asset.sort_order.asc()).all()
    return jsonify([a.to_dict() for a in assets])

@app.route('/api/assets', methods=['POST'])
def create_asset():
    data = request.json
    # Assign new asset to the end of the list
    max_order = db.session.query(db.func.max(Asset.sort_order)).scalar() or 0
    
    new_asset = Asset(
        name=data.get('name'),
        type=data.get('type'),
        description=data.get('description'),
        color=data.get('color'),
        is_maintenance=data.get('is_maintenance', False),
        icon=data.get('icon'),
        sort_order=max_order + 1
    )
    db.session.add(new_asset)
    db.session.commit()
    return jsonify(new_asset.to_dict()), 201

@app.route('/api/assets/reorder', methods=['POST'])
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
    
    db.session.commit()
    return jsonify(asset.to_dict())

@app.route('/api/assets/<int:id>', methods=['DELETE'])
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
    asset_id = int(data.get('assetId'))
    start_time = parser.parse(data.get('startTime'))
    end_time = parser.parse(data.get('endTime'))
    
    # Overlap Check
    overlapping = Booking.query.filter(
        Booking.asset_id == asset_id,
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()

    if overlapping:
        return jsonify({'error': 'Dieser Zeitraum ist bereits belegt.'}), 409

    new_booking = Booking(
        asset_id=asset_id,
        title=data.get('title', 'Buchung'),
        start_time=start_time,
        end_time=end_time,
        user_name=data.get('userName'),
        user_email=data.get('userEmail')
    )
    db.session.add(new_booking)
    db.session.commit()
    
    return jsonify(new_booking.to_dict()), 201

@app.route('/api/bookings/<int:id>', methods=['DELETE'])
def delete_booking(id):
    booking = Booking.query.get_or_404(id)
    db.session.delete(booking)
    db.session.commit()
    return '', 204

@app.route('/api/config', methods=['GET'])
def get_config():
    config = AppConfig.query.first()
    return jsonify(config.to_dict() if config else {'headerText': 'Buchungssystem', 'categoryIcons': {}})

@app.route('/api/config', methods=['POST'])
def update_config():
    data = request.json
    config = AppConfig.query.first()
    if not config:
        config = AppConfig()
        db.session.add(config)
    
    config.header_text = data.get('headerText', config.header_text)
    
    if 'categoryIcons' in data:
        config.category_icons_json = json.dumps(data['categoryIcons'])

    if 'placeholderTitle' in data:
        config.placeholder_title = data['placeholderTitle']
    if 'placeholderName' in data:
        config.placeholder_name = data['placeholderName']
    if 'placeholderEmail' in data:
        config.placeholder_email = data['placeholderEmail']
        
    db.session.commit()
    return jsonify(config.to_dict())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)