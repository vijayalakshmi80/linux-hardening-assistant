| Test Case ID | Scenario                     | Input                                                   | Expected Output                                                        | Result |
| ------------ | ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| TC01         | Load Application             | Open `http://localhost:3002`                            | Linux Hardening Assistant dashboard is displayed successfully          | Pass   |
| TC02         | Demo Mode Activation         | Click **Demo Mode**                                     | Predefined audit data and security score are displayed                 | Pass   |
| TC03         | Establish SSH Connection     | Valid Host/IP, Username, Password, and Port             | SSH connection is established successfully                             | Pass   |
| TC04         | Execute Security Audit       | Click **Run Audit** after successful connection         | Security checks are executed and audit results are generated           | Pass   |
| TC05         | Generate Security Score      | Completed audit findings                                | Security score (0–100) is calculated and displayed                     | Pass   |
| TC06         | Display Audit Findings       | Audit execution completed                               | Findings such as SSH status, firewall status, and open ports are shown | Pass   |
| TC07         | Generate AI Recommendations  | Submit audit findings for analysis                      | AI recommendations are displayed successfully                          | Pass   |
| TC08         | AI Fallback Mode             | Gemini API unavailable or quota exceeded                | Local rule-based recommendations are displayed                         | Pass   |
| TC09         | Download Fix Script          | Click **Download fix.sh**                               | Hardening script is generated and downloaded                           | Pass   |
| TC10         | Export PDF Report            | Click **Export PDF**                                    | PDF audit report is generated and downloaded                           | Pass   |
| TC11         | Display Security Trend Chart | Audit results available                                 | Security score chart is rendered correctly                             | Pass   |
| TC12         | Docker-Based Target Audit    | Connect to Docker Ubuntu test environment and run audit | Audit results are generated successfully for the Docker target         | Pass   |

## Automated Testing Mapping

Since the requirement states "Pytest, xUnit, Vitest or equivalent", you can mention the following in your report:

Module	Testing Tool Used
React Frontend Components	Vitest
Backend API Endpoints	Vitest / Jest
SSH Audit Workflow	Integration Testing
Demo Mode Functionality	Vitest
PDF Export	Integration Testing
AI Recommendation Flow	Integration Testing


## Test Coverage Statement

The above test cases cover the primary user workflow (happy path) of the Linux Hardening Assistant, including application access, SSH connectivity, audit execution, security scoring, AI-assisted recommendations, report generation, and remediation script creation.
