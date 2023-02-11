# Generated by Django 2.2.13 on 2020-10-07 12:12

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('mopic', '0012_auto_20201007_1741'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mopic',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 891915, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiccomment',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 893915, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiccommentreply',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 893915, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopiclike',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 892914, tzinfo=utc)),
        ),
        migrations.AlterField(
            model_name='mopicrate',
            name='datetime',
            field=models.DateTimeField(default=datetime.datetime(2020, 10, 7, 12, 12, 20, 893915, tzinfo=utc)),
        ),
    ]
