# Shimazu Medi-Framework

> **⚠️ IMPORTANT DISCLAIMER**: This is a personal medical framework for educational and informational purposes only. This system is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare professionals for any medical concerns. The creators of this framework assume no responsibility for any decisions made based on information provided by this system.

## Overview

The Shimazu Medi-Framework is an Advanced Medical Interface System designed as a personal medical information management and analysis tool. This framework provides a structured interface for organizing medical information, conducting clinical assessments, and generating documentation for personal use.

## ⚠️ Important Usage Warnings

- **FOR PERSONAL USE ONLY**: This framework is intended for personal education, training, and information management only
- **NOT FOR CLINICAL DIAGNOSIS**: This system must never be used as the sole basis for medical decisions
- **LOCAL DATA ONLY**: All patient data and medical information is stored locally on your device - no data is transmitted to external servers
- **NO MEDICAL LIABILITY**: The system provides information and tools but cannot replace professional medical judgment
- **EDUCATIONAL PURPOSE**: Designed for learning about medical workflows and information management

## Features

### Core Functionality
- **Patient Encounter Management**: Create and manage patient encounters with local data storage
- **Medical AI Assistant**: Integration with AI for medical information queries and analysis
- **Voice Interface**: Speech recognition for hands-free interaction
- **Body Systems Navigation**: Organized approach to medical assessment by body system
- **Clinical Documentation**: Structured note-taking and report generation

### Assessment Tools
- **Clinical Interface**: Medical assessment workflows and documentation
- **Psychometric Tools**: Mental health and cognitive assessment instruments
- **Report Generation**: Automated clinical report creation from assessment data
- **Medical Notes**: Extraction and categorization of clinical findings

### Data Management
- **Local Storage**: All data remains on your local device
- **Encounter History**: Track multiple patient encounters over time
- **File Upload Support**: Process medical documents (PDF, images, text files)
- **Export Capabilities**: Generate reports and documentation for external use

## Technology Stack

- **Frontend**: HTML5, CSS3, TypeScript
- **Build System**: Vite
- **AI Integration**: Google Gemini AI API
- **Voice Recognition**: Web Speech API
- **Data Storage**: Browser localStorage (local only)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser with JavaScript enabled
- Microphone access (for voice features)

### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone [your-repository-url]
   cd shimazu-medi-framework
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure AI API** (Optional)
   - Obtain a Google Gemini AI API key
   - Configure the API key in your environment
   - Note: AI features are optional and framework can operate without them

4. **Development Server**
   ```bash
   npm run dev
   ```

5. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

## Usage Guidelines

### Getting Started
1. Launch the application in your web browser
2. Create a new patient encounter using the "New" button
3. Navigate through body systems or use the AI assistant for queries
4. Document findings using the clinical interface
5. Generate reports as needed

### Data Privacy
- **No External Transmission**: Patient data never leaves your local device
- **Browser Storage**: Data is stored in your browser's localStorage
- **Manual Backup**: Export important data manually for backup purposes
- **Clear Data**: Use browser settings to clear all stored data when needed

### Professional Boundaries
- Use only for personal education and training
- Never rely solely on system outputs for medical decisions
- Always consult with qualified healthcare professionals
- Maintain appropriate professional standards if used in educational settings

## File Structure

```
shimazu-medi-framework/
├── index.html              # Main application interface
├── index.css              # Core styling
├── package.json           # Dependencies and scripts
├── config/
│   └── constants.ts       # System configuration and prompts
├── core/
│   └── appCore.ts        # Main application logic
├── psychometrics/
│   └── reportGenerator.ts # Assessment and reporting tools
└── README.md             # This file
```

## Security Considerations

- **Local Processing**: All medical data processing occurs locally
- **No Cloud Storage**: Framework does not use any cloud storage services
- **Browser Security**: Relies on browser security for data protection
- **User Responsibility**: Users are responsible for device security and data backup

## Limitations

- **Educational Tool**: Not validated for clinical use
- **AI Limitations**: AI responses may contain errors or incomplete information
- **No Real-time Updates**: Medical knowledge base is not continuously updated
- **Device Dependent**: Data is tied to specific browser/device
- **No Collaboration**: No multi-user or sharing capabilities

## Contributing

This is a personal framework project. If you wish to contribute:
- Fork the repository
- Create feature branches for improvements
- Ensure all changes maintain the local-only data approach
- Submit pull requests with detailed descriptions

## Legal Disclaimers

- **No Medical Advice**: This framework does not provide medical advice
- **No Warranty**: Software is provided "as-is" without warranty of any kind
- **User Responsibility**: Users assume all responsibility for how they use this framework
- **Professional Consultation**: Always consult healthcare professionals for medical matters
- **Educational Use**: Framework is intended for educational and informational purposes only

## License

This project is licensed under the Apache-2.0 License. See the license file for details.

## Support

This is a personal project with limited support. For issues or questions:
- Review the documentation thoroughly
- Check existing issues in the repository
- Understand that support is provided on a best-effort basis

---

**Remember**: This framework is a personal tool for learning and information management. It is not a medical device and should never be used as a substitute for professional medical care.

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
