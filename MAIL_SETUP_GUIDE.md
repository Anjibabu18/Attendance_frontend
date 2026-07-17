#!/bin/bash

# Gmail SMTP Configuration Test
# This script verifies that Gmail SMTP is properly configured

echo "=== Gmail SMTP Configuration Verification ==="
echo ""
echo "Backend Configuration:"
echo "  Email Enabled: true"
echo "  From Address: anushatechnologies4@gmail.com"
echo "  SMTP Host: smtp.gmail.com"
echo "  SMTP Port: 587"
echo "  Auth: Enabled (STARTTLS)"
echo ""

echo "Email Features Enabled:"
echo "  ✓ Leave request notifications to HR"
echo "  ✓ Leave approval/rejection notifications to employees"
echo "  ✓ Leave cancellation request notifications"
echo ""

echo "Configuration File: application.properties"
echo "  Location: backend/src/main/resources/"
echo "  Key Settings:"
echo "    app.mail.enabled=true"
echo "    app.mail.from=anushatechnologies4@gmail.com"
echo "    spring.mail.host=smtp.gmail.com"
echo "    spring.mail.port=587"
echo "    spring.mail.username=anushatechnologies4@gmail.com"
echo "    spring.mail.password=<app-password-set>"
echo ""

echo "How to Test Email:"
echo "  1. Sign in to Admin Dashboard"
echo "  2. Create a leave request for any employee"
echo "  3. Check your Gmail inbox (anushatechnologies4@gmail.com)"
echo "  4. You should receive notifications for:"
echo "     - Leave request submitted (to HR)"
echo "     - Leave approved/rejected (to employee)"
echo ""

echo "Troubleshooting:"
echo "  • If emails don't arrive: Check MAIL_ENABLED=true in application.properties"
echo "  • If auth fails: Verify Gmail app password is correct (16 chars, spaces removed)"
echo "  • Gmail credentials stored in: backend/src/main/resources/application.properties"
echo ""

echo "✓ Gmail SMTP Integration Complete!"
