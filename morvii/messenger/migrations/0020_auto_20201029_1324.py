# Generated by Django 2.2.13 on 2020-10-29 07:54

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('messenger', '0019_themedata_datetime'),
    ]

    operations = [
        migrations.AlterField(
            model_name='themedata',
            name='theme',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='messenger.MessengerTheme'),
        ),
    ]
