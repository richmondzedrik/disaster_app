# Disaster Preparedness App

A Vue.js application for disaster preparedness and emergency response.

## Features

- Real-time alerts and notifications
- Interactive hazard mapping
- Evacuation routes and assembly points
- Emergency resources and contacts
- First aid guides
- Preparedness checklists

## Prerequisites

- Node.js 16+
- npm or yarn
- Google Maps API key

## Installation

1. Clone the repository:
bash
git clone https://github.com/yourusername/disaster-preparedness-app.git
cd disaster-preparedness-app

2. Install dependencies:
bash
npm install

3. Configure environment variables:
- Create a `.env` file in the root directory
- Add required environment variables:
VITE_API_URL=your_api_url
VITE_GOOGLE_MAPS_API_KEY=your_api_key

4. Start the development server:
bash
npm run dev

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure
disaster-preparedness-app/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── stores/
│ │ ├── services/
│ │ └── assets/
│ ├── public/
│ └── index.html
└── backend/
├── routes/
├── models/
├── controllers/
└── services/

## Key Features Documentation

### Real-time Alerts
- Instant notifications for emergency situations
- Customizable alert preferences
- Geographic-based targeting

### Interactive Maps
- Real-time hazard mapping
- Evacuation route planning
- Emergency facility locations

### Emergency Contacts
- Add up to 3 emergency contacts
- Quick access to emergency services
- Contact verification system

### First Aid Guides
- Step-by-step emergency procedures
- Visual guides and instructions
- Offline access capability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@disasterapp.com or join our Slack channel.

## Acknowledgments

- Emergency response best practices from WHO
- Map data providers
- Open source community