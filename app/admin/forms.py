from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, IntegerField, FloatField, SelectField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Optional, NumberRange


class RecipeForm(FlaskForm):
    """Form for creating and editing recipes"""
    name = StringField('Recipe Name', validators=[DataRequired()])
    name_es = StringField('Recipe Name (Spanish)', validators=[Optional()])
    category = SelectField('Category', choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
        ('dessert', 'Dessert')
    ])
    description = TextAreaField('Description', validators=[Optional()])
    prep_time_minutes = IntegerField('Prep Time (minutes)', validators=[Optional(), NumberRange(min=0)])
    cook_time_minutes = IntegerField('Cook Time (minutes)', validators=[Optional(), NumberRange(min=0)])
    servings = IntegerField('Servings', validators=[Optional(), NumberRange(min=1)], default=1)
    difficulty = SelectField('Difficulty', choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ])
    instructions = TextAreaField('Cooking Instructions', validators=[DataRequired()])
    tags = StringField('Tags (comma-separated)', validators=[Optional()])
    is_published = BooleanField('Publish Recipe')
    image = FileField('Recipe Image', validators=[
        FileAllowed(['jpg', 'jpeg', 'png'], 'Images only (JPG, PNG)')
    ])
    submit = SubmitField('Save Recipe')


class IngredientForm(FlaskForm):
    """Form for creating and editing ingredients"""
    name = StringField('Ingredient Name', validators=[DataRequired()])
    name_es = StringField('Name (Spanish)', validators=[Optional()])
    category = SelectField('Category', choices=[
        ('vegetable', 'Vegetable'),
        ('fruit', 'Fruit'),
        ('protein', 'Protein'),
        ('grain', 'Grain'),
        ('dairy', 'Dairy'),
        ('other', 'Other')
    ])

    # Nutritional information (per 100g)
    calories_per_100g = FloatField('Calories (per 100g)', validators=[Optional(), NumberRange(min=0)])
    protein_per_100g = FloatField('Protein (g per 100g)', validators=[Optional(), NumberRange(min=0)])
    carbs_per_100g = FloatField('Carbs (g per 100g)', validators=[Optional(), NumberRange(min=0)])
    fats_per_100g = FloatField('Fats (g per 100g)', validators=[Optional(), NumberRange(min=0)])
    fiber_per_100g = FloatField('Fiber (g per 100g)', validators=[Optional(), NumberRange(min=0)])

    yolo_detectable = BooleanField('YOLO Detectable')
    yolo_class_name = StringField('YOLO Class Name', validators=[Optional()])

    submit = SubmitField('Save Ingredient')


class USDASearchForm(FlaskForm):
    """Form for searching USDA database"""
    query = StringField('Search Term', validators=[DataRequired()])
    submit = SubmitField('Search')
