# Generated by Django 2.2.13 on 2020-10-07 08:55

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('messenger', '0008_auto_20201007_1235'),
    ]

    operations = [
        migrations.AlterField(
            model_name='messenger',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 239702, tzinfo=utc)),
        ),
    ]
