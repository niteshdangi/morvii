# Generated by Django 2.2.13 on 2020-10-07 12:12

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0018_auto_20201007_1741'),
    ]

    operations = [
        migrations.AlterField(
            model_name='follow',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 895907, tzinfo=utc)),
        ),
    ]