# Generated by Django 2.2.13 on 2020-10-29 07:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('messenger', '0017_themedata'),
    ]

    operations = [
        migrations.AddField(
            model_name='messengertheme',
            name='datetime',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
