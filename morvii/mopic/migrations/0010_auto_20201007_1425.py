# Generated by Django 2.2.13 on 2020-10-07 08:55

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('mopic', '0009_auto_20201007_1235'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mopic',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 231691, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiccomment',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 233719, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiccommentreply',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 234717, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiclike',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 233719, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopicrate',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 8, 55, 51, 233719, tzinfo=utc)),
        ),
    ]
