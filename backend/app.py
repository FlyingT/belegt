import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dateutil import parser

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

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'color': self.color,
            'is_maintenance': self.is_maintenance
        }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('asset.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'assetId': str(self.asset_id),
            'startTime': self.start_time.isoformat(),
            'endTime': self.end_time.isoformat(),
            'userName': self.user_name,
            'userEmail': self.user_email,
            'createdAt': self.created_at.isoformat()
        }

class AppConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    header_text = db.Column(db.String(100), default='Buchungssystem')

# --- Helper ---
def init_db():
    with app.app_context():
        db.create_all()
        # Create default config if not exists
        if not AppConfig.query.first():
            db.session.add(AppConfig(header_text='Buchungssystem'))
            db.session.commit()
        
        # Create default assets if empty
        if not Asset.query.first():
            defaults = [
                Asset(name='Konferenzraum A (Galaxy)', type='Room', description='Großer Meetingraum, 12 Plätze.', color='#3b82f6'),
                Asset(name='Konferenzraum B (Nebula)', type='Room', description='Kleiner Raum, 4 Plätze.', color='#8b5cf6'),
                Asset(name='Firmenwagen', type='Vehicle', description='Tesla Model 3', color='#ef4444', is_maintenance=True),
            ]
            db.session.add_all(defaults)
            db.session.commit()

# Initialize DB immediately to ensure it exists for Docker volumes
init_db()

# --- Routes ---

@app.route('/api/assets', methods=['GET'])
def get_assets():
    assets = Asset.query.all()
    return jsonify([a.to_dict() for a in assets])

@app.route('/api/assets', methods=['POST'])
def create_asset():
    data = request.json
    new_asset = Asset(
        name=data.get('name'),
        type=data.get('type'),
        description=data.get('description'),
        color=data.get('color'),
        is_maintenance=data.get('is_maintenance', False)
    )
    db.session.add(new_asset)
    db.session.commit()
    return jsonify(new_asset.to_dict()), 201

@app.route('/api/assets/<int:id>', methods=['PUT'])
def update_asset(id):
    asset = Asset.query.get_or_404(id)
    data = request.json
    asset.name = data.get('name', asset.name)
    asset.type = data.get('type', asset.type)
    asset.description = data.get('description', asset.description)
    asset.color = data.get('color', asset.color)
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
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
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
        start_time=start_time,
        end_time=end_time,
        user_name=data.get('userName'),
        user_email=data.get('userEmail')
    )
    db.session.add(new_booking)
    db.session.commit()
    
    # Mock Email sending log
    print(f"Sending email to {new_booking.user_email} for booking {new_booking.id}")
    
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
    return jsonify({'headerText': config.header_text if config else 'Buchungssystem'})

@app.route('/api/config', methods=['POST'])
def update_config():
    data = request.json
    config = AppConfig.query.first()
    if not config:
        config = AppConfig()
        db.session.add(config)
    
    config.header_text = data.get('headerText')
    db.session.commit()
    return jsonify({'headerText': config.header_text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
