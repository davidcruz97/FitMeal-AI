# app/utils/email.py
import random
import string
from flask import current_app
from flask_mail import Mail, Message
from threading import Thread

mail = Mail()

def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        try:
            mail.send(msg)
            current_app.logger.info(f"✅ Email sent successfully to {msg.recipients}")
        except Exception as e:
            current_app.logger.error(f"❌ Failed to send email: {e}")
            raise

def send_email(subject, recipient, text_body, html_body=None):
    """Send email"""
    msg = Message(
        subject=subject,
        sender=current_app.config['MAIL_DEFAULT_SENDER'],
        recipients=[recipient]
    )
    msg.body = text_body
    if html_body:
        msg.html = html_body
    
    # Send asynchronously
    Thread(
        target=send_async_email,
        args=(current_app._get_current_object(), msg)
    ).start()

def generate_temporary_password(length=6):
    """Generate a random temporary password"""
    # Use uppercase, lowercase, and digits for readability
    characters = string.ascii_uppercase + string.ascii_lowercase + string.digits
    # Avoid confusing characters like 0, O, l, 1
    characters = characters.replace('0', '').replace('O', '').replace('l', '').replace('1', '').replace('I', '')
    return ''.join(random.choice(characters) for _ in range(length))

def send_password_reset_email(user, temporary_password):
    """Send temporary password email"""
    subject = "FitMeal AI - Your Temporary Password"
    
    text_body = f"""Hello {user.full_name},

You requested to reset your password for FitMeal AI.

Your temporary password is: {temporary_password}

IMPORTANT: Please log in with this temporary password and change it immediately in your Profile settings.

To change your password after logging in:
1. Open the FitMeal AI app
2. Go to Profile (Me tab)
3. Expand "Account Settings"
4. Tap "Change Password"
5. Enter this temporary password and your new password

For security reasons, please change this password as soon as possible.

If you didn't request this, please contact us immediately.

Best regards,
FitMeal AI Team
"""
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4A90E2;">FitMeal AI - Password Reset</h2>
            
            <p>Hello {user.full_name},</p>
            
            <p>You requested to reset your password for FitMeal AI.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">Your temporary password:</p>
                <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #4A90E2; letter-spacing: 2px;">{temporary_password}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ IMPORTANT: Change this password immediately!</p>
            </div>
            
            <p><strong>To change your password after logging in:</strong></p>
            <ol>
                <li>Open the FitMeal AI app</li>
                <li>Go to Profile (Me tab)</li>
                <li>Expand "Account Settings"</li>
                <li>Tap "Change Password"</li>
                <li>Enter this temporary password and your new password</li>
            </ol>
            
            <p style="color: #999; font-size: 14px;">For security reasons, please change this password as soon as possible.</p>
            
            <p style="color: #d9534f; font-size: 14px; font-weight: bold;">If you didn't request this, please contact us immediately.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">Best regards,<br>FitMeal AI Team</p>
        </div>
    </body>
    </html>
    """
    
    send_email(subject, user.email, text_body, html_body)