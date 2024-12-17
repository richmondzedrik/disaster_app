const db = require('../db/connection');

async function generateDemoData() {
    try {
        // Generate demo hazard points
        const hazardPoints = [
            // New York City area
            { type: 'floods', lat: 40.7128, lng: -74.0060, description: 'Flood risk zone - Hudson River' },
            { type: 'earthquakes', lat: 40.7589, lng: -73.9851, description: 'Moderate seismic risk area' },
            { type: 'fires', lat: 40.7829, lng: -73.9654, description: 'High fire risk - Dense urban area' },
            { type: 'shelters', lat: 40.7527, lng: -73.9772, description: 'Grand Central Emergency Shelter' },
            { type: 'hospitals', lat: 40.7421, lng: -73.9739, description: 'Bellevue Hospital Center' },
            
            // Los Angeles area
            { type: 'floods', lat: 34.0522, lng: -118.2437, description: 'LA River flood zone' },
            { type: 'earthquakes', lat: 34.0522, lng: -118.2437, description: 'San Andreas Fault proximity' },
            { type: 'fires', lat: 34.0522, lng: -118.2437, description: 'Wildfire risk area' },
            { type: 'shelters', lat: 34.0522, lng: -118.2437, description: 'LA Convention Center Shelter' },
            { type: 'hospitals', lat: 34.0522, lng: -118.2437, description: 'Cedars-Sinai Medical Center' }
        ];

        // Store demo data in database
        const [result] = await db.execute(
            'CREATE TABLE IF NOT EXISTS hazard_points (id INT AUTO_INCREMENT PRIMARY KEY, type VARCHAR(50), lat DECIMAL(10,8), lng DECIMAL(11,8), description TEXT)'
        );

        for (const point of hazardPoints) {
            await db.execute(
                'INSERT INTO hazard_points (type, lat, lng, description) VALUES (?, ?, ?, ?)',
                [point.type, point.lat, point.lng, point.description]
            );
        }

        console.log('Demo data generated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error generating demo data:', error);
        process.exit(1);
    }
}

generateDemoData(); 