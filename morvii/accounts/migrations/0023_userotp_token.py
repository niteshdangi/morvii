# Generated by Django 2.2.13 on 2020-11-04 06:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0022_otpanon'),
    ]

    operations = [
        migrations.AddField(
            model_name='userotp',
            name='token',
            field=models.TextField(default=None, null=True),
        ),
    ]