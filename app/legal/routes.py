"""
Legal pages routes (Terms and Conditions, Privacy Policy, etc.)
These are public pages that don't require authentication
"""
from flask import Blueprint, render_template

bp = Blueprint('legal', __name__)


@bp.route('/terms')
def terms():
    """Terms and Conditions page"""
    return render_template('terms.html')


@bp.route('/privacy')
def privacy():
    """Privacy Policy page (to be implemented)"""
    return render_template('privacy.html')

# @bp.route('/icon-generator')
# def icon_generator():
#     """Icon generator page for creating app icons"""
#     return render_template('icon_generator.html')