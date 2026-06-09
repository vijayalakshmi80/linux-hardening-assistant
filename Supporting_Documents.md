# Supporting Documents

## 1. Software Requirements Specification (SRS)

Describes the functional and non-functional requirements of the system, including system objectives, user requirements, constraints, and expected functionalities.

## 2. System Architecture Diagram

Illustrates the interaction between the frontend, backend, SSH module, AI engine, Docker test environment, and report generation modules.

## 3. Use Case Diagram

Depicts how users interact with the system, including:

* Connect to Linux Host
* Run Security Audit
* View Audit Results
* Generate AI Recommendations
* Export Reports
* Download Fix Scripts

## 4. Activity Diagram

Shows the workflow of the application from establishing an SSH connection to generating recommendations and reports.

## 5. Sequence Diagram

Represents the sequence of communication between the user, frontend, backend, SSH service, AI module, and report generator.

## 6. Database and Storage Design

Documents the storage mechanisms used:

* JSON files for audit history
* File system for PDF reports and fix scripts
* In-memory storage for active sessions

## 7. API Documentation

Includes details of all REST API endpoints:

| Endpoint        | Method | Purpose                         |
| --------------- | ------ | ------------------------------- |
| /api/connect    | POST   | Establish SSH connection        |
| /api/audit      | POST   | Perform security audit          |
| /api/analyze    | POST   | Generate AI analysis            |
| /api/fix-script | POST   | Generate remediation script     |
| /api/demo       | POST   | Load demo audit data            |
| /api/reports    | GET    | Retrieve generated reports      |
| /api/health     | GET    | Application health status       |
| /api/version    | GET    | Application version information |

## 8. Test Cases and Test Results

Contains test scenarios, expected outcomes, and actual results validating the system functionality.

## 9. Screenshots

Include screenshots of:

* Home Page
* SSH Connection Screen
* Demo Mode
* Security Dashboard
* Audit Results
* AI Recommendations
* PDF Report Generation
* Fix Script Download
* Docker Test Environment

## 10. User Manual

Provides instructions for:

* Installing dependencies
* Running the frontend and backend
* Configuring Gemini API
* Setting up Docker Ubuntu containers
* Using Demo Mode
* Performing security audits

## 11. Installation Guide

Step-by-step setup instructions covering:

* Node.js installation
* Docker installation
* Environment variable configuration
* Application startup procedures

## 12. AI Usage Documentation

Explains how Gemini AI and local recommendation engines are used to generate security insights and remediation guidance.

## 13. Docker Configuration Files

Includes:

* Dockerfile
* docker-compose.yml
* Ubuntu test environment configuration

## 14. Sample Audit Reports

Attach generated PDF reports demonstrating the application's output.

## 15. Source Code Repository

Provide the GitHub repository link containing:

* Source code
* README documentation
* Environment configuration examples
* Setup instructions

## 16. References

List all resources and technologies used, including:

* React Documentation
* Node.js Documentation
* Express Documentation
* Docker Documentation
* Gemini API Documentation
* Ubuntu Security Guidelines
* Linux Hardening Best Practices
