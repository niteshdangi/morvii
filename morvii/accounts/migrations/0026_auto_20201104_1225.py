# Generated by Django 2.2.13 on 2020-11-04 06:55

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0025_auto_20201104_1215'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userotp',
            old_name='attempt',
            new_name='attempts',
        ),
    ]
